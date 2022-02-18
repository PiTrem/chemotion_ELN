# frozen_string_literal: true

require 'rails_helper'

describe Chemotion::CommentAPI do
  let!(:unauthorized_user) { create(:person) }
  let!(:author_user) { create(:person) }
  let!(:c) { create(:collection, user: unauthorized_user, is_shared: false) }
  let!(:c2) { create(:collection, user: author_user, is_shared: false) }
  let!(:c3) { create(:collection, user: author_user, is_shared: true) }
  let!(:r) { create(:reaction, collections: [c]) }
  let!(:s) { create(:sample, collections: [c]) }
  let!(:reaction1) { create(:reaction, collections: [c3]) }

  context 'when the user is unauthorized' do
    before do
      allow_any_instance_of(WardenAuthentication).to receive(:current_user).and_return(unauthorized_user)
    end

    describe 'GET /api/v1/comments/:id' do
      let(:comment_1) do
        create(:comment, commentable: reaction1, section: Comment.reaction_sections[:scheme], created_by: author_user.id)
      end

      before do
        get "/api/v1/comments/#{comment_1.id}"
      end

      it 'returns 401 status code' do
        expect(response.status).to eq 401
      end
    end

    describe 'PUT /api/v1/comments/:id' do
      context 'when comment is updated with only content' do
        let(:comment_1) do
          create(:comment, commentable: r, section: Comment.reaction_sections[:scheme], created_by: author_user.id)
        end
        let(:params) do
          {
            content: 'test comment'
          }
        end

        before do
          put "/api/v1/comments/#{comment_1.id}", params: params
        end

        it 'returns 401 status code' do
          expect(response.status).to eq 401
        end
      end

      context 'with sample' do
        let(:comment_1) do
          create(:comment, commentable: r, section: Comment.reaction_sections[:scheme], created_by: author_user.id)
        end
        let(:params) do
          {
            content: 'test comment',
            commentable_id: s.id,
            commentable_type: 'Sample',
            section: Comment.sample_sections[:properties]
          }
        end

        before do
          put "/api/v1/comments/#{comment_1.id}", params: params
        end

        it 'returns 401 status code' do
          expect(response.status).to eq 401
        end
      end

      context 'with reaction' do
        let(:comment_1) do
          create(:comment, commentable: s, section: Comment.sample_sections[:properties], created_by: author_user.id)
        end
        let(:params) do
          {
            content: 'test comment for reaction',
            commentable_id: r.id,
            commentable_type: 'Reaction',
            section: Comment.reaction_sections[:scheme]
          }
        end

        before do
          put "/api/v1/comments/#{comment_1.id}", params: params
        end

        it 'returns 401 status code' do
          expect(response.status).to eq 401
        end
      end
    end

    describe 'DELETE /api/v1/comments/:id' do
      let(:comment_1) do
        create(:comment, content: 'test',
                         commentable: r,
                         section: Comment.reaction_sections[:scheme],
                         created_by: author_user.id)
      end

      before do
        delete "/api/v1/comments/#{comment_1.id}"
      end

      it 'returns 401 status code' do
        expect(response.status).to eq 401
      end
    end
  end

  context 'when user is authorized' do
    let!(:user2) { create(:person) }

    let!(:root_u2) { create(:collection, user: author_user, shared_by_id: user2.id, is_shared: true, is_locked: true) }
    let!(:root_u) { create(:collection, user: user2, shared_by_id: author_user.id, is_shared: true, is_locked: true) }

    let!(:col1)   { create(:collection, user: user2, shared_by_id: author_user.id, is_shared: true, permission_level: 2, ancestry: root_u.id.to_s) }
    let!(:col2)   { create(:collection, user: author_user, is_shared: false) }
    let!(:col3)   { create(:collection, user: author_user, is_shared: true) }
    let!(:col4)   { create(:collection, user: author_user, shared_by_id: user2.id, is_shared: true, ancestry: root_u2.id.to_s) }
    let!(:col5)   { create(:collection, shared_by_id: user2.id, is_shared: true) }
    let!(:reaction) { create(:reaction, collections: [col1]) }
    let!(:sample) { create(:sample, collections: [col1]) }

    before do
      allow_any_instance_of(WardenAuthentication).to receive(:current_user).and_return(author_user)
    end

    describe 'GET /api/v1/comments/:id' do

      let(:comment_1) do
        create(:comment,
               content: 'test',
               commentable_id: reaction.id,
               commentable_type: 'Reaction',
               section: Comment.reaction_sections[:scheme])
      end

      before do
        get "/api/v1/comments/#{comment_1.id}"
      end

      it 'api run success' do
        expect(response.body).not_to be_nil
      end

      it 'returned data' do
        c = JSON.parse(response.body)['comment']&.symbolize_keys
        expect(c[:id]).to eq(comment_1.id)
      end
    end

    describe 'POST /api/v1/comments/create' do
      context 'with content' do
        let(:params) do
          {
            content: 'test comment',
            commentable_id: reaction.id,
            commentable_type: 'Reaction',
            section: Comment.reaction_sections[:scheme]
          }
        end

        before do
          post '/api/v1/comments/create', params: params
        end

        it 'is able to create a new comment (on unaccessible element)' do
          comment = Comment.find_by(content: 'test comment')
          expect(comment).not_to be_nil
        end
      end

      context 'with sample' do
        let(:params) do
          {
            content: 'test comment sample',
            commentable_id: sample.id,
            commentable_type: 'Sample',
            section: Comment.sample_sections[:properties]
          }
        end

        before do
          post '/api/v1/comments/create', params: params
        end

        it 'is able to create a new comment' do
          comment = Comment.find_by(content: 'test comment sample')
          expect(comment).not_to be_nil
        end

        it 'is valid in sample' do
          comment = Comment.find_by(content: 'test comment sample')
          s1 = Sample.find_by(id: comment.commentable_id)
          expect(s1.id).to eq(sample.id)
        end
      end

      context 'with reaction' do
        let(:params) do
          {
            content: 'test comment reaction',
            commentable_id: reaction.id,
            commentable_type: 'Reaction',
            section: Comment.reaction_sections[:scheme]
          }
        end

        before do
          post '/api/v1/comments/create', params: params
        end

        it 'is able to create a new comment' do
          comment = Comment.find_by(content: 'test comment reaction')
          expect(comment).not_to be_nil
        end

        it 'is valid in reaction' do
          comment = Comment.find_by(content: 'test comment reaction')
          r1 = Reaction.find(comment.commentable_id)
          expect(r1.id).to eq(reaction.id)
        end
      end
    end

    describe 'PUT /api/v1/comments/:id' do
      context 'with only content' do
        let(:comment_1) do
          create(:comment, commentable: r, section: Comment.reaction_sections[:scheme], created_by: author_user.id)
        end
        let(:params) do
          {
            content: 'update test comment'
          }
        end

        before do
          put "/api/v1/comments/#{comment_1.id}", params: params
        end

        it "is able to update comment's content" do
          comment = Comment.find(comment_1.id)
          expect(comment.content).to eq('update test comment')
        end
      end

      context 'with sample' do
        let(:comment_1) do
          create(:comment, commentable: r, section: Comment.reaction_sections[:scheme], created_by: author_user.id)
        end
        let(:params) do
          {
            content: 'update test comment sample',
            commentable_id: sample.id,
            commentable_type: 'Sample'
          }
        end

        before do
          put "/api/v1/comments/#{comment_1.id}", params: params
        end

        it "is able to update comment's content" do
          comment = Comment.find(comment_1.id)
          expect([comment.content, comment.commentable_id, comment.commentable_type]).to eq(['update test comment sample', sample.id, 'Sample'])
        end
      end

      context 'with reaction' do
        let(:comment_1) do
          create(:comment, commentable: s, section: Comment.sample_sections[:properties], created_by: author_user.id)
        end
        let(:params) do
          {
            content: 'update test comment reaction',
            commentable_id: reaction.id,
            commentable_type: 'Reaction',
            section: Comment.reaction_sections[:scheme]
          }
        end

        before do
          put "/api/v1/comments/#{comment_1.id}", params: params
        end

        it "is able to update comment's content" do
          comment = Comment.find(comment_1.id)
          puts "comment:: #{comment}"
          expect([comment.content, comment.commentable_id, comment.commentable_type]).to eq(['update test comment reaction', reaction.id, 'Reaction'])
        end
      end
    end

    describe 'DELETE /api/v1/comments/:id' do
      let(:comment_1) do
        create(:comment, content: 'test',
                         commentable: r,
                         section: Comment.reaction_sections[:scheme],
                         created_by: author_user.id)
      end

      before do
        delete "/api/v1/comments/#{comment_1.id}"
      end

      it 'is able to delete comment' do
        comment = Comment.find_by(content: 'test')
        expect(comment).to be_nil
      end
    end
  end
end