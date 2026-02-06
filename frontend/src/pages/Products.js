import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { productsAPI, suppliersAPI, producedTransactAPI } from '../services/api';
import ProductModal from '../components/ProductModal';
import TransactionModal from '../components/TransactionModal';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [productsRes, suppliersRes] = await Promise.all([
        productsAPI.getAll(),
        suppliersAPI.getAll(),
      ]);
      setProducts(productsRes.data);
      setSuppliers(suppliersRes.data);
    } catch (error) {
      showMessage('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const txRes = await producedTransactAPI.getAll(startDate, endDate);
      setTransactions(txRes.data);
    } catch (error) {
      showMessage('error', 'Failed to load product transactions');
    } finally {
      setTxLoading(false);
    }
  }, [startDate, endDate, showMessage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleAdd = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await productsAPI.delete(id);
      showMessage('success', 'Product deleted successfully');
      loadData();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleModalSave = () => {
    loadData();
    handleModalClose();
  };

  const handleTransactionModalClose = () => {
    setShowTransactionModal(false);
  };

  const handleTransactionModalSave = () => {
    loadTransactions();
    loadData(); // Refresh products to update stock
    handleTransactionModalClose();
    showMessage('success', 'Transaction created successfully');
  };

  const stockBadge = (stock) => {
    if (stock < 5) return 'badge-danger';
    if (stock < 10) return 'badge-warning';
    return 'badge-success';
  };

  const summary = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const lowStock = products.filter(p => (p.stock || 0) < 5).length;
    const lastRestocked = products
      .map(p => p.lastRestocked ? new Date(p.lastRestocked) : null)
      .filter(Boolean)
      .sort((a, b) => b - a)[0];

    return {
      totalProducts,
      totalStock,
      lowStock,
      lastRestocked: lastRestocked ? lastRestocked.toLocaleDateString() : 'N/A'
    };
  }, [products]);

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>Products</h1>
          <p className="subtitle">Track stock levels and recent transactions</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary">
          + Add Product
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      <div className="summary-grid">
        <div className="summary-card">
          <p className="label">Total Products</p>
          <h3>{summary.totalProducts}</h3>
        </div>
        <div className="summary-card">
          <p className="label">Total Stock Units</p>
          <h3>{summary.totalStock}</h3>
        </div>
        <div className="summary-card">
          <p className="label">Low Stock (&lt; 5)</p>
          <h3 className="danger">{summary.lowStock}</h3>
        </div>
        <div className="summary-card">
          <p className="label">Last Restocked</p>
          <h3>{summary.lastRestocked}</h3>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Product Catalog</h2>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h3>No products found</h3>
            <p>Add your first product to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Type</th>
                  <th>Last Restocked</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td className="product-name">
                      <div className="name-stack">
                        <span className="title">{product.name}</span>
                        <span className="muted">{product.category || 'No category'}</span>
                      </div>
                    </td>
                    <td>{product.category || 'N/A'}</td>
                    <td>${product.price?.toFixed(2) || '0.00'}</td>
                    <td>
                      <span className={`badge ${stockBadge(product.stock)}`}>
                        {product.stock || 0}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${product.type === 'raw' ? 'badge-info' : 'badge-primary'}`}>
                        {product.type === 'raw' ? 'Raw' : 'Produced'}
                      </span>
                    </td>
                    <td>
                      {product.lastRestocked
                        ? new Date(product.lastRestocked).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEdit(product)}
                          className="btn btn-small btn-secondary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="btn btn-small btn-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card transactions-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Product Transactions</h2>
            <p className="subtitle">All purchase/production entries with supplier</p>
          </div>
          <button 
            onClick={() => setShowTransactionModal(true)} 
            className="btn btn-primary"
          >
            + Add Transaction
          </button>
        </div>
        <div className="filters" style={{ padding: '1rem', borderTop: '1px solid #f0f0f0' }}>
          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" onClick={loadTransactions} disabled={txLoading}>
            {txLoading ? 'Filtering...' : 'Filter'}
          </button>
        </div>

        {txLoading ? (
          <div className="loading">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="empty-state small">
            <div className="empty-state-icon">🧾</div>
            <h3>No transactions found</h3>
            <p>Add transactions to see them here.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table compact">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Price</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Supplier</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td>{tx.name}</td>
                    <td>{tx.date ? new Date(tx.date).toLocaleDateString() : 'N/A'}</td>
                    <td>${tx.price?.toFixed(2) || '0.00'}</td>
                    <td>
                      <span className="pill">{tx.type}</span>
                    </td>
                    <td>{tx.quantity}</td>
                    <td>{tx.supplier?.name || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ProductModal
          product={editingProduct}
          suppliers={suppliers}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}

      {showTransactionModal && (
        <TransactionModal
          products={products}
          suppliers={suppliers}
          onClose={handleTransactionModalClose}
          onSave={handleTransactionModalSave}
        />
      )}
    </div>
  );
};

export default Products;



