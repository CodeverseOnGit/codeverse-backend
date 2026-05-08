import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        🎓 Tutorial Platform
      </Link>
      <div className="navbar-menu">
        {user ? (
          <>
            <span style={{ color: 'var(--text-secondary)', marginRight: '1rem' }}>
              {user.email}
              {user.isAdmin && (
                <span style={{ 
                  marginLeft: '0.5rem', 
                  padding: '0.25rem 0.5rem',
                  background: 'var(--primary-color)',
                  color: 'white',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  ADMIN
                </span>
              )}
            </span>
            {user.isAdmin && (
              <Link to="/admin" className="btn btn-secondary" style={{ marginRight: '0.5rem' }}>
                Admin Panel
              </Link>
            )}
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary" style={{ marginRight: '0.5rem' }}>
              Login
            </Link>
            <Link to="/register" className="btn btn-primary">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
