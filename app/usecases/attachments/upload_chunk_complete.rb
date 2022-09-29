# frozen_string_literal: true

module Usecases
  module Attachments
    class UploadChunkComplete
      attr_reader :user, :params

      def initialize(user, params)
        @user = user
        @params = params
      end

      def self.execute!(user, params)
        new(user, params).execute!
      end

      def execute!
        file_name = ActiveStorage::Filename.new(params[:filename]).sanitized
        FileUtils.mkdir_p(Rails.root.join('tmp/uploads', 'full'))
        entries = Dir["#{Rails.root.join('tmp/uploads', 'chunks', params[:key])}*"].sort_by { |s| s.scan(/\d+/).last.to_i }
        file_path = Rails.root.join('tmp/uploads', 'full', params[:key])
        file_path = "#{file_path}#{File.extname(file_name)}"
        file_checksum = Digest::MD5.new
        File.open(file_path, 'wb') do |outfile|
          entries.each do |file|
            buff = File.open(file, 'rb').read
            file_checksum.update(buff)
            outfile.write(buff)
          end
        end

        return create_attachment(file_name, file_path) if file_checksum == params[:checksum]

        { ok: false, error_messages: ['File upload has error. Please try again!'] }
      ensure
        entries.each do |file|
          File.delete(file) if File.exist?(file)
        end
        File.delete(file_path) if File.exist?(file_path)
      end

      def create_attachment(file_name, file_path)
        attachment = Attachment.new(
          bucket: nil,
          filename: file_name,
          key: params[:key],
          file_path: file_path,
          created_by: user.id,
          created_for: user.id,
          content_type: MIME::Types.type_for(file_name)[0].to_s
        )
        error_messages = []
        ActiveRecord::Base.transaction do
          attachment.save!

          attachment.attachment_attacher.attach(File.open(file_path, binmode: true))

          if attachment.valid?
            attachment.attachment_attacher.create_derivatives
            attachment.save!
          else
            error_messages.push(attachment.errors.to_h[:attachment])

            raise ActiveRecord::Rollback
          end
        end

        { ok: true, error_messages: error_messages }
      end
    end
  end
end