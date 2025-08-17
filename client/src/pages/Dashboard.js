import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    bio: user?.bio || '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onChange = (e) => {
    setMessage('');
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const result = await updateProfile(formData);
    if (result.success) {
      setMessage('Profile updated successfully');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="profile-card">
        <h2>Welcome, {user?.username}!</h2>
        
        <div className="user-info">
          <h3>Your Profile</h3>
          <p><strong>Username:</strong> {user?.username}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Joined:</strong> {new Date(user?.createdAt).toLocaleDateString()}</p>
          <p><strong>Last Login:</strong> {user?.lastLogin ? new Date(user?.lastLogin).toLocaleString() : 'Never'}</p>
        </div>

        <div className="update-profile">
          <h3>Update Your Bio</h3>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={onChange}
                placeholder="Tell us about yourself"
                maxLength="500"
                rows="4"
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary">Update Profile</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
