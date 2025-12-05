import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/dashboard" className="navbar-brand">
          📦 Inventory Tracker
        </Link>
        <div className="navbar-links">
          <Link to="/dashboard" className="navbar-link">
            Dashboard
          </Link>
          <Link to="/products" className="navbar-link">
            Products
          </Link>
          <Link to="/suppliers" className="navbar-link">
            Suppliers
          </Link>
          <Link to="/sellers" className="navbar-link">
            Sellers
          </Link>
          {user.role === 'admin' && (
            <Link to="/sales" className="navbar-link">
              Sales
            </Link>
          )}
          <div className="navbar-user">
            <span>👤 {user.name}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;



