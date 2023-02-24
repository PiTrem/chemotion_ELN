# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Filecollector, type: :model do
  let(:user) { create(:person, name_abbreviation: 'CU1') }
  let(:device1) { create(:device, :file_local, users: [user]) }
  let(:device2) { create(:device, :file_local, users: [user]) }
  let(:device_sftp1) { create(:device, :file_sftp, users: [user]) }
  let(:device_sftp2) { create(:device, :file_sftp_faulty, users: [user]) }
  let(:device_sftp3) { create(:device, :file_sftp, users: [user]) }

  describe '.execute' do
    context 'when files are collected without error over local connection' do
      it 'executes and writes the correct number of files in database' do
        device1
        device2
        expect { described_class.new.execute(false) }.to change(Attachment, :count).by(Device.count)
      end
    end

    context 'when files are collected without error over sftp connection' do
      it 'executes and writes the correct number of files in database' do
        device_sftp1
        device_sftp2
        expect { described_class.new.execute(true) }.to change(Attachment, :count).by(Device.count)
      end

      it 'connects with a keyfile'
    end

    context 'when there is authentication error' do
      it 'bypasses faulty device and move to next one' do
        device_sftp1
        device_sftp2
        device_sftp3
        expect { described_class.new.execute(true) }.to change(Attachment, :count).by(2)
      end
    end
  end
end
