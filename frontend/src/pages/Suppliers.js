import React, { useState, useEffect, useContext } from 'react';
import { suppliersAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import SupplierModal from '../components/SupplierModal';
import './Suppliers.css';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { user } = useContext(AuthContext);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await suppliersAPI.getAll();
      setSuppliers(response.data);
    } catch (error) {
      showMessage('error', 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleAdd = () => {
    setEditingSupplier(null);
    setShowModal(true);
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;

    try {
      await suppliersAPI.delete(id);
      showMessage('success', 'Supplier deleted successfully');
      loadSuppliers();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to delete supplier');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingSupplier(null);
  };

  const handleModalSave = () => {
    loadSuppliers();
    handleModalClose();
  };

  if (loading) {
    return <div className="loading">Loading suppliers...</div>;
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Suppliers</h1>
          {isAdmin && (
            <button onClick={handleAdd} className="btn btn-primary">
              + Add Supplier
            </button>
          )}
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
            {message.text}
          </div>
        )}

        {suppliers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <h3>No suppliers found</h3>
            <p>{isAdmin ? 'Add your first supplier to get started.' : 'No suppliers available.'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier._id}>
                    <td>{supplier.name}</td>
                    <td>{supplier.contactEmail || 'N/A'}</td>
                    <td>{supplier.phone || 'N/A'}</td>
                    <td>{supplier.address || 'N/A'}</td>
                    {isAdmin && (
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="btn btn-small btn-secondary"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(supplier._id)}
                            className="btn btn-small btn-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && isAdmin && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

export default Suppliers;


