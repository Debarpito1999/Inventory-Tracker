import React, { useState, useEffect, useContext } from 'react';
import { sellersAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import SellerModal from '../components/SellerModal';
import './Sellers.css';

const Sellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { user } = useContext(AuthContext);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    try {
      const response = await sellersAPI.getAll();
      setSellers(response.data);
    } catch (error) {
      showMessage('error', 'Failed to load sellers');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleAdd = () => {
    setEditingSeller(null);
    setShowModal(true);
  };

  const handleEdit = (seller) => {
    setEditingSeller(seller);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this seller?')) return;

    try {
      await sellersAPI.delete(id);
      showMessage('success', 'Seller deleted successfully');
      loadSellers();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to delete seller');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingSeller(null);
  };

  const handleModalSave = () => {
    loadSellers();
    handleModalClose();
  };

  if (loading) {
    return <div className="loading">Loading sellers...</div>;
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Sellers</h1>
          {isAdmin && (
            <button onClick={handleAdd} className="btn btn-primary">
              + Add Seller
            </button>
          )}
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
            {message.text}
          </div>
        )}

        {sellers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏪</div>
            <h3>No sellers found</h3>
            <p>{isAdmin ? 'Add your first seller to get started.' : 'No sellers available.'}</p>
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
                {sellers.map((seller) => (
                  <tr key={seller._id}>
                    <td>{seller.name}</td>
                    <td>{seller.contactEmail || 'N/A'}</td>
                    <td>{seller.phone || 'N/A'}</td>
                    <td>{seller.address || 'N/A'}</td>
                    {isAdmin && (
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEdit(seller)}
                            className="btn btn-small btn-secondary"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(seller._id)}
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
        <SellerModal
          seller={editingSeller}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

export default Sellers;

