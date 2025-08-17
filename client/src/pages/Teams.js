import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';

const Teams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    search: '',
    isOpen: '',
    page: 1
  });

  useEffect(() => {
    fetchTeams();
  }, [filter]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.search) params.append('search', filter.search);
      if (filter.isOpen) params.append('isOpen', filter.isOpen);
      params.append('page', filter.page);
      params.append('limit', '12');

      const response = await axios.get(`/api/teams?${params}`);
      
      if (filter.page === 1) {
        setTeams(response.data.data.teams);
      } else {
        setTeams(prev => [...prev, ...response.data.data.teams]);
      }
      setError('');
    } catch (err) {
      setError('Failed to load teams');
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (teamId) => {
    if (!user) {
      setError('Please login to join a team');
      return;
    }

    try {
      await axios.post(`/api/teams/${teamId}/join`);
      // Refresh teams to update join status
      fetchTeams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join team');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilter(prev => ({ ...prev, page: 1 }));
  };

  if (loading && teams.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="teams-page">
      <div className="teams-header">
        <h1>Developer Teams</h1>
        <p>Join teams, collaborate on projects, and build amazing things together!</p>
        
        {user && (
          <Link to="/create-team" className="btn btn-primary">
            Create Team
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="teams-filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search teams..."
            value={filter.search}
            onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            className="search-input"
          />
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>

        <select 
          value={filter.isOpen} 
          onChange={(e) => setFilter(prev => ({ ...prev, isOpen: e.target.value, page: 1 }))}
          className="filter-select"
        >
          <option value="">All Teams</option>
          <option value="true">Open for Joining</option>
          <option value="false">Invite Only</option>
        </select>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="teams-grid">
        {teams.map(team => (
          <div key={team._id} className="team-card">
            <div className="team-header">
              <div className="team-avatar">
                <img 
                  src={team.avatar || '/default-team-avatar.png'} 
                  alt={team.name}
                />
              </div>
              <div className="team-status">
                <span className={`status-badge ${team.isOpen ? 'open' : 'closed'}`}>
                  {team.isOpen ? 'Open' : 'Invite Only'}
                </span>
              </div>
            </div>

            <div className="team-content">
              <h3 className="team-name">
                <Link to={`/teams/${team._id}`}>{team.name}</Link>
              </h3>
              
              <p className="team-description">
                {team.description.substring(0, 120)}
                {team.description.length > 120 && '...'}
              </p>

              {team.tags && team.tags.length > 0 && (
                <div className="team-tags">
                  {team.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="tag">#{tag}</span>
                  ))}
                  {team.tags.length > 3 && (
                    <span className="tag-more">+{team.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>

            <div className="team-footer">
              <div className="team-stats">
                <span className="member-count">
                  👥 {team.memberCount}/{team.maxMembers} members
                </span>
                <span className="creator">
                  Created by {team.creator.username}
                </span>
              </div>

              <div className="team-actions">
                {user && !team.isJoined && team.isOpen && (
                  <button 
                    onClick={() => handleJoinTeam(team._id)}
                    className="btn btn-primary btn-sm"
                  >
                    Join Team
                  </button>
                )}
                
                {team.isJoined && (
                  <span className="joined-badge">✓ Joined</span>
                )}
                
                <Link to={`/teams/${team._id}`} className="btn btn-secondary btn-sm">
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {teams.length === 0 && !loading && (
        <div className="empty-state">
          <h3>No teams found</h3>
          <p>Be the first to create a team and start collaborating!</p>
          {user && (
            <Link to="/create-team" className="btn btn-primary">
              Create First Team
            </Link>
          )}
        </div>
      )}

      {loading && <LoadingSpinner />}
    </div>
  );
};

export default Teams;
