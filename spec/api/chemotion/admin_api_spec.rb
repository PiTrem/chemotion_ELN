# frozen_string_literal: true

RSpec.describe Chemotion::AdminAPI do
  let!(:admin1) { create(:admin) }

  before do
    allow_any_instance_of(WardenAuthentication).to receive(:current_user).and_return(admin1)
  end

  describe 'GET /api/v1/admin/jobs' do
    before do
      Delayed::Job.create(handler: 'Do something')
      get '/api/v1/admin/jobs'
    end

    it 'returns the right http status' do
      expect(response).to have_http_status :ok
    end

    it 'returns a response with jobs' do
      expect(parsed_json_response['jobs'].size).to eq 1
    end
  end

  describe 'PUT /api/v1/admin/jobs/restart' do
    it 'returns the right http status' do
      failed_job = Delayed::Job.create(failed_at: DateTime.now, handler: 'Do something')
      put '/api/v1/admin/jobs/restart', params: { id: failed_job.id }
      expect(response).to have_http_status :ok
    end
  end

  describe 'GET /api/v1/admin/listLocalCollector/all' do
    before do
      get '/api/v1/admin/listLocalCollector/all'
    end

    it 'returns the right http status' do
      expect(response).to have_http_status(:ok)
    end

    it 'returns a response with an array of collectors' do
      expect(parsed_json_response['listLocalCollector']).to be_a Array
    end
  end
end
