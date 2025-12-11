import React, { useState, useEffect, useContext } from 'react';
import { productionsAPI, productsAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Production.css';

const Production = () => {
  const [productions, setProductions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'daily'
  const [message, setMessage] = useState({ type: '', text: '' });
  const { user } = useContext(AuthContext);

  const [productionForm, setProductionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    rawMaterials: [{ productId: '', quantity: '' }],
    producedProducts: [{ productId: '', quantity: '' }],
    notes: ''
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (viewMode === 'daily') {
      loadDailyProductions();
    } else {
      loadAllProductions();
    }
  }, [viewMode, selectedDate]);

  const loadData = async () => {
    try {
      const productsRes = await productsAPI.getAll();
      setProducts(productsRes.data);
    } catch (error) {
      showMessage('error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadAllProductions = async () => {
    try {
      const res = await productionsAPI.getAll();
      setProductions(res.data);
    } catch (error) {
      showMessage('error', 'Failed to load productions');
    }
  };

  const loadDailyProductions = async () => {
    try {
      const res = await productionsAPI.getByDate(selectedDate);
      setProductions(res.data);
    } catch (error) {
      showMessage('error', 'Failed to load daily productions');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleAddRawMaterial = () => {
    setProductionForm({
      ...productionForm,
      rawMaterials: [...productionForm.rawMaterials, { productId: '', quantity: '' }]
    });
  };

  const handleRemoveRawMaterial = (index) => {
    const newRawMaterials = productionForm.rawMaterials.filter((_, i) => i !== index);
    setProductionForm({ ...productionForm, rawMaterials: newRawMaterials });
  };

  const handleRawMaterialChange = (index, field, value) => {
    const newRawMaterials = [...productionForm.rawMaterials];
    newRawMaterials[index][field] = value;
    setProductionForm({ ...productionForm, rawMaterials: newRawMaterials });
  };

  const handleAddProducedProduct = () => {
    setProductionForm({
      ...productionForm,
      producedProducts: [...productionForm.producedProducts, { productId: '', quantity: '' }]
    });
  };

  const handleRemoveProducedProduct = (index) => {
    const newProducedProducts = productionForm.producedProducts.filter((_, i) => i !== index);
    setProductionForm({ ...productionForm, producedProducts: newProducedProducts });
  };

  const handleProducedProductChange = (index, field, value) => {
    const newProducedProducts = [...productionForm.producedProducts];
    newProducedProducts[index][field] = value;
    setProductionForm({ ...productionForm, producedProducts: newProducedProducts });
  };

  const handleProductionSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validate form
    const validRawMaterials = productionForm.rawMaterials.filter(
      rm => rm.productId && rm.quantity && parseFloat(rm.quantity) > 0
    );
    const validProducedProducts = productionForm.producedProducts.filter(
      pp => pp.productId && pp.quantity && parseFloat(pp.quantity) > 0
    );

    if (validRawMaterials.length === 0) {
      showMessage('error', 'Please add at least one raw material');
      return;
    }

    if (validProducedProducts.length === 0) {
      showMessage('error', 'Please add at least one produced product');
      return;
    }

    try {
      await productionsAPI.create({
        date: productionForm.date,
        rawMaterials: validRawMaterials.map(rm => ({
          productId: rm.productId,
          quantity: parseFloat(rm.quantity)
        })),
        producedProducts: validProducedProducts.map(pp => ({
          productId: pp.productId,
          quantity: parseFloat(pp.quantity)
        })),
        notes: productionForm.notes
      });

      showMessage('success', 'Production recorded successfully');
      setProductionForm({
        date: new Date().toISOString().split('T')[0],
        rawMaterials: [{ productId: '', quantity: '' }],
        producedProducts: [{ productId: '', quantity: '' }],
        notes: ''
      });
      setShowProductionModal(false);
      
      if (viewMode === 'daily') {
        loadDailyProductions();
      } else {
        loadAllProductions();
      }
      loadData(); // Reload products to get updated stock
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to record production');
    }
  };

  const rawProducts = products.filter(p => p.type === 'raw');
  const sellingProducts = products.filter(p => p.type === 'selling');

  if (loading) {
    return <div className="loading">Loading production data...</div>;
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
          <h1 className="card-title">🏭 Production Dashboard</h1>
          <button onClick={() => setShowProductionModal(true)} className="btn btn-primary">
            + New Production
          </button>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
            {message.text}
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="production-controls">
          <div className="view-mode-toggle">
            <button
              className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('all')}
            >
              All Productions
            </button>
            <button
              className={`btn ${viewMode === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('daily')}
            >
              Daily View
            </button>
          </div>
          {viewMode === 'daily' && (
            <div className="date-selector">
              <label>Select Date: </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-input"
              />
            </div>
          )}
        </div>

        {productions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏭</div>
            <h3>No productions recorded</h3>
            <p>Record your first production to get started.</p>
          </div>
        ) : (
          <div className="productions-list">
            {productions.map((production) => (
              <div key={production._id} className="production-card">
                <div className="production-header">
                  <div className="production-date">
                    <strong>Date:</strong> {new Date(production.date).toLocaleDateString()}
                  </div>
                  {production.notes && (
                    <div className="production-notes">
                      <strong>Notes:</strong> {production.notes}
                    </div>
                  )}
                </div>

                <div className="production-details">
                  <div className="production-section">
                    <h3>📥 Raw Materials Used</h3>
                    <div className="materials-list">
                      {production.rawMaterials.map((rm, idx) => (
                        <div key={idx} className="material-item">
                          <span className="material-name">{rm.productName || rm.productId?.name}</span>
                          <span className="material-quantity">- {rm.quantity} units</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="production-arrow">→</div>

                  <div className="production-section">
                    <h3>📤 Products Produced</h3>
                    <div className="materials-list">
                      {production.producedProducts.map((pp, idx) => (
                        <div key={idx} className="material-item">
                          <span className="material-name">{pp.productName || pp.productId?.name}</span>
                          <span className="material-quantity">+ {pp.quantity} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {production.ratios && production.ratios.length > 0 && (
                  <div className="production-ratios">
                    <h3>📊 Production Ratios</h3>
                    <div className="ratios-grid">
                      {production.ratios.map((ratio, idx) => (
                        <div key={idx} className="ratio-item">
                          <span className="ratio-label">
                            {ratio.rawMaterialName || 'Raw Material'} → {ratio.productName || 'Product'}
                          </span>
                          <span className="ratio-value">
                            {ratio.ratio.toFixed(3)} units per unit
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showProductionModal && (
        <div className="modal-overlay" onClick={() => setShowProductionModal(false)}>
          <div className="modal production-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Production</h2>
              <button className="modal-close" onClick={() => setShowProductionModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleProductionSubmit}>
              <div className="form-group">
                <label className="form-label">Production Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={productionForm.date}
                  onChange={(e) => setProductionForm({ ...productionForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <div className="form-group-header">
                  <label className="form-label">Raw Materials Used *</label>
                  <button
                    type="button"
                    className="btn btn-small btn-secondary"
                    onClick={handleAddRawMaterial}
                  >
                    + Add Raw Material
                  </button>
                </div>
                {productionForm.rawMaterials.map((rm, index) => (
                  <div key={index} className="form-row">
                    <select
                      className="form-select"
                      value={rm.productId}
                      onChange={(e) => handleRawMaterialChange(index, 'productId', e.target.value)}
                      required
                    >
                      <option value="">Select raw material</option>
                      {rawProducts.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} (Stock: {product.stock})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Quantity"
                      value={rm.quantity}
                      onChange={(e) => handleRawMaterialChange(index, 'quantity', e.target.value)}
                      min="0.01"
                      step="0.01"
                      required
                    />
                    {productionForm.rawMaterials.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-small btn-danger"
                        onClick={() => handleRemoveRawMaterial(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="form-group">
                <div className="form-group-header">
                  <label className="form-label">Products Produced *</label>
                  <button
                    type="button"
                    className="btn btn-small btn-secondary"
                    onClick={handleAddProducedProduct}
                  >
                    + Add Product
                  </button>
                </div>
                {productionForm.producedProducts.map((pp, index) => (
                  <div key={index} className="form-row">
                    <select
                      className="form-select"
                      value={pp.productId}
                      onChange={(e) => handleProducedProductChange(index, 'productId', e.target.value)}
                      required
                    >
                      <option value="">Select product</option>
                      {sellingProducts.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} (Stock: {product.stock})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Quantity"
                      value={pp.quantity}
                      onChange={(e) => handleProducedProductChange(index, 'quantity', e.target.value)}
                      min="0.01"
                      step="0.01"
                      required
                    />
                    {productionForm.producedProducts.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-small btn-danger"
                        onClick={() => handleRemoveProducedProduct(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  className="form-input"
                  value={productionForm.notes}
                  onChange={(e) => setProductionForm({ ...productionForm, notes: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowProductionModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Record Production
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production;


