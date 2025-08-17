import React from 'react';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} CodeCircle. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
