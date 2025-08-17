import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="app-header">
      <div className="container">
        <div className="header-content">
          <h1 className="app-title">
            <Link to="/">CodeCircle</Link>
          </h1>
          <nav className="nav-menu">
            {isAuthenticated ? (
              <>
                <span className="welcome-message">Welcome, {user?.username}</span>
                <Link to="/dashboard">Dashboard</Link>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
