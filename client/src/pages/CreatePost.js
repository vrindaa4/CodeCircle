import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const CreatePost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'discussion',
    tags: '',
    projectUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { title, content, category, tags, projectUrl } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setLoading(true);

    try {
      const postData = {
        title: title.trim(),
        content: content.trim(),
        category,
        projectUrl: projectUrl.trim() || undefined,
        tags: tags.trim() ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
      };

      const response = await axios.post('/api/posts', postData);
      
      if (response.data.success) {
        navigate(`/posts/${response.data.data.post._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="auth-required">
        <h2>Authentication Required</h2>
        <p>Please login to create a post.</p>
      </div>
    );
  }

  return (
    <div className="create-post-container">
      <div className="create-post-card">
        <h2>Create New Post</h2>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={onSubmit} className="create-post-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={onChange}
              placeholder="What's your post about?"
              maxLength="200"
              required
            />
            <small className="form-help">
              {title.length}/200 characters
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={category}
              onChange={onChange}
              required
            >
              <option value="discussion">Discussion</option>
              <option value="question">Question</option>
              <option value="project_idea">Project Idea</option>
              <option value="project_showcase">Project Showcase</option>
              <option value="resource">Resource</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              name="content"
              value={content}
              onChange={onChange}
              placeholder="Share your thoughts, code, or questions..."
              rows="12"
              required
            />
            <small className="form-help">
              Minimum 10 characters. You can use markdown formatting.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="projectUrl">Project URL (optional)</label>
            <input
              type="url"
              id="projectUrl"
              name="projectUrl"
              value={projectUrl}
              onChange={onChange}
              placeholder="https://github.com/username/project"
            />
            <small className="form-help">
              Link to your GitHub repo, demo, or relevant resource
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (optional)</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={tags}
              onChange={onChange}
              placeholder="javascript, react, node.js"
            />
            <small className="form-help">
              Separate tags with commas. Maximum 5 tags.
            </small>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>

        <div className="posting-tips">
          <h4>💡 Tips for a great post:</h4>
          <ul>
            <li>Use a clear, descriptive title</li>
            <li>Provide context and background information</li>
            <li>Include code snippets when relevant</li>
            <li>Add relevant tags to help others find your post</li>
            <li>Be respectful and constructive</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
