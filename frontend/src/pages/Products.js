import React, { useState, useEffect } from 'react';
import { productsAPI, suppliersAPI } from '../services/api';
import ProductModal from '../components/ProductModal';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

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

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Products</h1>
          <button onClick={handleAdd} className="btn btn-primary">
            + Add Product
          </button>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
            {message.text}
          </div>
        )}

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
                  <th>Supplier</th>
                  <th>Last Restocked</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>{product.name}</td>
                    <td>{product.category || 'N/A'}</td>
                    <td>${product.price?.toFixed(2) || '0.00'}</td>
                    <td>
                      <span
                        className={`badge ${
                          product.stock < 5
                            ? 'badge-danger'
                            : product.stock < 10
                            ? 'badge-warning'
                            : 'badge-success'
                        }`}
                      >
                        {product.stock || 0}
                      </span>
                    </td>
                    <td>{product.supplier?.name || 'N/A'}</td>
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

      {showModal && (
        <ProductModal
          product={editingProduct}
          suppliers={suppliers}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

export default Products;


