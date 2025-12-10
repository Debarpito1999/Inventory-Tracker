import React, { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    totalStock: 0,
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [products, lowStock] = await Promise.all([
        productsAPI.getAll(),
        productsAPI.getLowStock(10),
      ]);

      const totalStock = products.data.reduce((sum, p) => sum + (p.stock || 0), 0);

      setStats({
        totalProducts: products.data.length,
        lowStockCount: lowStock.data.length,
        totalStock,
      });

      setLowStockItems(lowStock.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="container">
      <h1 className="page-title">Dashboard</h1>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-card-title">Total Products</div>
          <div className="stats-card-value">{stats.totalProducts}</div>
        </div>
        <div className="stats-card stats-card-warning">
          <div className="stats-card-title">Low Stock Items</div>
          <div className="stats-card-value">{stats.lowStockCount}</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-title">Total Stock Units</div>
          <div className="stats-card-value">{stats.totalStock}</div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">⚠️ Low Stock Alert</h2>
            <span className="badge badge-warning">{lowStockItems.length} items</span>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Price</th>
                  <th>Supplier</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.category || 'N/A'}</td>
                    <td>
                      <span className={`badge ${item.stock < 5 ? 'badge-danger' : 'badge-warning'}`}>
                        {item.stock}
                      </span>
                    </td>
                    <td>${item.price?.toFixed(2) || '0.00'}</td>
                    <td>{item.supplier?.name || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lowStockItems.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <h3>All products are well stocked!</h3>
            <p>No low stock items at the moment.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;





