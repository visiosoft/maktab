import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hotelsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { Building2, Plus, Edit2, Trash2, Search, Home, Users, LogOut } from 'lucide-react';
import './Hotels.css';

const Hotels = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingHotel, setEditingHotel] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        phone: ''
    });

    useEffect(() => {
        fetchHotels();
    }, []);

    const fetchHotels = async () => {
        try {
            setLoading(true);
            const response = await hotelsAPI.getAll();
            setHotels(response.data);
        } catch (error) {
            console.error('Error fetching hotels:', error);
            alert('Failed to fetch hotels');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingHotel(null);
        setFormData({ name: '', address: '', city: '', phone: '' });
        setShowModal(true);
    };

    const handleEdit = (hotel) => {
        setEditingHotel(hotel);
        setFormData({
            name: hotel.name,
            address: hotel.address || '',
            city: hotel.city || '',
            phone: hotel.phone || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingHotel) {
                await hotelsAPI.update(editingHotel._id, formData);
            } else {
                await hotelsAPI.create(formData);
            }
            setShowModal(false);
            fetchHotels();
        } catch (error) {
            console.error('Error saving hotel:', error);
            alert(error.response?.data?.message || 'Failed to save hotel');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this hotel?')) {
            try {
                await hotelsAPI.delete(id);
                fetchHotels();
            } catch (error) {
                console.error('Error deleting hotel:', error);
                alert('Failed to delete hotel');
            }
        }
    };

    const filteredHotels = hotels.filter(hotel =>
        hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotel.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="hotels-page">
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-logo">
                        <div className="dashboard-logo-icon">
                            <Building2 size={28} />
                        </div>
                        <div className="dashboard-logo-text">
                            <h1>Maktab</h1>
                            <p>Super Admin - Hotels Management</p>
                        </div>
                    </div>
                    <Button variant="danger" size="small" onClick={logout}>
                        <LogOut size={18} />
                        Logout
                    </Button>
                </div>
            </div>

            <div className="dashboard-nav">
                <button className="nav-item" onClick={() => navigate('/super-admin/dashboard')}>
                    <Home size={20} />
                    <span>Dashboard</span>
                </button>
                <button className="nav-item active" onClick={() => navigate('/hotels')}>
                    <Building2 size={20} />
                    <span>Hotels</span>
                </button>
            </div>

            <div className="page-content">
                <div className="page-header">
                    <h1>
                        <Building2 size={32} />
                        Hotels Management
                    </h1>
                    <Button onClick={handleCreate}>
                        <Plus size={18} />
                        Add Hotel
                    </Button>
                </div>

                <Card className="search-card">
                    <div className="search-box">
                        <Search size={20} />
                        <Input
                            placeholder="Search hotels by name or city..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </Card>

                <Card>
                    {loading ? (
                        <p>Loading hotels...</p>
                    ) : filteredHotels.length === 0 ? (
                        <div className="empty-state">
                            <Building2 size={48} />
                            <p>No hotels found</p>
                            <Button onClick={handleCreate}>
                                <Plus size={18} />
                                Add Your First Hotel
                            </Button>
                        </div>
                    ) : (
                        <div className="hotels-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Hotel Name</th>
                                        <th>City</th>
                                        <th>Address</th>
                                        <th>Phone</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHotels.map((hotel) => (
                                        <tr key={hotel._id}>
                                            <td><strong>{hotel.name}</strong></td>
                                            <td>{hotel.city || '-'}</td>
                                            <td>{hotel.address || '-'}</td>
                                            <td>{hotel.phone || '-'}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-icon edit"
                                                        onClick={() => handleEdit(hotel)}
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        className="btn-icon delete"
                                                        onClick={() => handleDelete(hotel._id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title={editingHotel ? 'Edit Hotel' : 'Add New Hotel'}
                >
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Hotel Name *</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Enter hotel name"
                            />
                        </div>
                        <div className="form-group">
                            <label>City</label>
                            <select
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="">Select City</option>
                                <option value="Makkah">Makkah</option>
                                <option value="Madinah">Madinah</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Address</label>
                            <Input
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Enter address"
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Enter phone number"
                            />
                        </div>
                        <div className="form-actions">
                            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingHotel ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
};

export default Hotels;
