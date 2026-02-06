import React, { useState, useEffect, useContext, useCallback } from 'react';
import { salesAPI, productsAPI, sellersAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Sales.css';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleForm, setSaleForm] = useState({ product: '', seller: '', quantity: '', unitPrice: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const { user } = useContext(AuthContext);

  const isAdmin = user?.role === 'admin';

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [salesRes, productsRes, sellersRes] = await Promise.all([
        salesAPI.getAll(),
        productsAPI.getAll(),
        sellersAPI.getAll(),
      ]);
      setSales(salesRes.data);
      setProducts(productsRes.data);
      setSellers(sellersRes.data);
    } catch (error) {
      showMessage('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      await salesAPI.create({
        product: saleForm.product,
        seller: saleForm.seller,
        quantity: parseInt(saleForm.quantity),
        unitPrice: parseFloat(saleForm.unitPrice),
      });
      showMessage('success', 'Sale recorded successfully');
      setSaleForm({ product: '', seller: '', quantity: '', unitPrice: '' });
      setShowSaleModal(false);
      loadData();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to record sale');
    }
  };

  if (loading) {
    return <div className="loading">Loading sales...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="container">
        <div className="card">
          <div className="alert alert-error">Access denied. Admin only.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Sales</h1>
          <button onClick={() => setShowSaleModal(true)} className="btn btn-primary">
            + Record Sale
          </button>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
            {message.text}
          </div>
        )}

        {sales.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <h3>No sales recorded</h3>
            <p>Record your first sale to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Seller</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total Price</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale._id}>
                    <td>
                      {sale.saleDate
                        ? new Date(sale.saleDate).toLocaleString()
                        : 'N/A'}
                    </td>
                    <td>{sale.product?.name || 'N/A'}</td>
                    <td>{sale.seller?.name || 'N/A'}</td>
                    <td>{sale.quantity}</td>
                    <td>
                      {sale.unitPrice
                        ? `$${sale.unitPrice.toFixed(2)}`
                        : sale.product?.price
                        ? `$${sale.product.price.toFixed(2)}`
                        : 'N/A'}
                    </td>
                    <td>${sale.totalPrice?.toFixed(2) || '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showSaleModal && (
        <div className="modal-overlay" onClick={() => setShowSaleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Sale</h2>
              <button className="modal-close" onClick={() => setShowSaleModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSaleSubmit}>
              <div className="form-group">
                <label className="form-label">Product *</label>
                <select
                  name="product"
                  className="form-select"
                  value={saleForm.product}
                  onChange={(e) => setSaleForm({ ...saleForm, product: e.target.value })}
                  required
                >
                  <option value="">Select a product</option>
                  {products
                    .filter((p) => p.stock > 0)
                    .map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name} (Stock: {product.stock})
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Seller *</label>
                <select
                  name="seller"
                  className="form-select"
                  value={saleForm.seller}
                  onChange={(e) => setSaleForm({ ...saleForm, seller: e.target.value })}
                  required
                >
                  <option value="">Select a seller</option>
                  {sellers.map((seller) => (
                    <option key={seller._id} value={seller._id}>
                      {seller.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  className="form-input"
                  value={saleForm.quantity}
                  onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit Price *</label>
                <input
                  type="number"
                  name="unitPrice"
                  className="form-input"
                  value={saleForm.unitPrice}
                  onChange={(e) => setSaleForm({ ...saleForm, unitPrice: e.target.value })}
                  step="0.01"
                  min="0.01"
                  placeholder={saleForm.product ? products.find(p => p._id === saleForm.product)?.price?.toFixed(2) || '' : ''}
                  required
                />
                {saleForm.product && products.find(p => p._id === saleForm.product)?.price && (
                  <small className="form-hint">
                    Product default price: ${products.find(p => p._id === saleForm.product).price.toFixed(2)}
                  </small>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSaleModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Record Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;



