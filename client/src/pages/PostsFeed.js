import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';

const PostsFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    category: '',
    sort: '-createdAt',
    page: 1
  });

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.category) params.append('category', filter.category);
      params.append('sort', filter.sort);
      params.append('page', filter.page);
      params.append('limit', '10');

      const response = await axios.get(`/api/posts?${params}`);
      
      if (filter.page === 1) {
        setPosts(response.data.data.posts);
      } else {
        setPosts(prev => [...prev, ...response.data.data.posts]);
      }
      setError('');
    } catch (err) {
      setError('Failed to load posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (postId, voteType) => {
    if (!user) {
      setError('Please login to vote');
      return;
    }

    try {
      await axios.post(`/api/posts/${postId}/${voteType}`);
      // Refresh posts to get updated vote counts
      fetchPosts();
    } catch (err) {
      setError('Failed to vote');
      console.error('Vote error:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'project_idea': 'bg-blue-100 text-blue-800',
      'project_showcase': 'bg-green-100 text-green-800',
      'question': 'bg-yellow-100 text-yellow-800',
      'discussion': 'bg-purple-100 text-purple-800',
      'resource': 'bg-orange-100 text-orange-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  if (loading && posts.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="posts-feed">
      <div className="feed-header">
        <h1>Latest Posts</h1>
        
        {/* Filters */}
        <div className="filters">
          <select 
            value={filter.category} 
            onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value, page: 1 }))}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="project_idea">Project Ideas</option>
            <option value="project_showcase">Project Showcase</option>
            <option value="question">Questions</option>
            <option value="discussion">Discussions</option>
            <option value="resource">Resources</option>
            <option value="other">Other</option>
          </select>

          <select 
            value={filter.sort} 
            onChange={(e) => setFilter(prev => ({ ...prev, sort: e.target.value, page: 1 }))}
            className="filter-select"
          >
            <option value="-createdAt">Newest First</option>
            <option value="createdAt">Oldest First</option>
            <option value="-views">Most Viewed</option>
            <option value="-score">Highest Rated</option>
          </select>
        </div>

        {user && (
          <Link to="/create-post" className="btn btn-primary">
            Create Post
          </Link>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="posts-list">
        {posts.map(post => (
          <div key={post._id} className="post-card">
            <div className="post-votes">
              <button 
                className={`vote-btn upvote ${post.hasUpvoted ? 'active' : ''}`}
                onClick={() => handleVote(post._id, 'upvote')}
                disabled={!user}
              >
                ↑
              </button>
              <span className="vote-count">
                {(post.upvotes?.length || 0) - (post.downvotes?.length || 0)}
              </span>
              <button 
                className={`vote-btn downvote ${post.hasDownvoted ? 'active' : ''}`}
                onClick={() => handleVote(post._id, 'downvote')}
                disabled={!user}
              >
                ↓
              </button>
            </div>

            <div className="post-content">
              <div className="post-meta">
                <span className={`category-tag ${getCategoryColor(post.category)}`}>
                  {post.category.replace('_', ' ')}
                </span>
                <span className="post-views">{post.views || 0} views</span>
              </div>

              <h3 className="post-title">
                <Link to={`/posts/${post._id}`}>{post.title}</Link>
              </h3>

              <p className="post-excerpt">
                {post.content.substring(0, 200)}
                {post.content.length > 200 && '...'}
              </p>

              {post.tags && post.tags.length > 0 && (
                <div className="post-tags">
                  {post.tags.map(tag => (
                    <span key={tag} className="tag">#{tag}</span>
                  ))}
                </div>
              )}

              <div className="post-footer">
                <div className="author-info">
                  <img 
                    src={post.author.avatar || '/default-avatar.png'} 
                    alt={post.author.username}
                    className="author-avatar"
                  />
                  <div>
                    <span className="author-name">{post.author.username}</span>
                    <span className="post-date">{formatDate(post.createdAt)}</span>
                  </div>
                </div>

                <div className="post-stats">
                  <span className="comments-count">
                    💬 {post.commentsCount || 0} comments
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading && <LoadingSpinner />}
    </div>
  );
};

export default PostsFeed;
