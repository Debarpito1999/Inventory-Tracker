import React, { useEffect, useState, useContext } from 'react';
import { productsAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Notification.css';

const Notification = () => {
  const { user } = useContext(AuthContext);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    checkLowStock();
    // Check every 30 seconds
    const interval = setInterval(checkLowStock, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const checkLowStock = async () => {
    try {
      const response = await productsAPI.getLowStock(10);
      if (response.data.length > 0) {
        setLowStockItems(response.data);
        setShowNotification(true);
      } else {
        setShowNotification(false);
      }
    } catch (error) {
      console.error('Error checking low stock:', error);
    }
  };

  if (!showNotification || lowStockItems.length === 0) {
    return null;
  }

  return (
    <div className="notification-banner">
      <div className="notification-content">
        <span className="notification-icon">⚠️</span>
        <span className="notification-text">
          {lowStockItems.length} product{lowStockItems.length > 1 ? 's' : ''} running low on stock!
        </span>
        <button
          className="notification-close"
          onClick={() => setShowNotification(false)}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Notification;

