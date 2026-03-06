import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { groupsAPI, hotelsAPI, companiesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { Save, X, Plus, Building2, Users, Home, LogOut, FileText, UserCheck } from 'lucide-react';
import { SAUDI_AIRPORTS } from '../constants/airports';
import './GroupForm.css';

const GroupForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { logout } = useAuth();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [hotels, setHotels] = useState([]);
    const [company, setCompany] = useState(null);
    const [showHotelModal, setShowHotelModal] = useState(false);
    const [newHotel, setNewHotel] = useState({ name: '', city: '', address: '', phone: '' });

    const [formData, setFormData] = useState({
        groupName: '',
        arrivalDate: '',
        arrivalAirport: '',
        arrivalFlightNo: '',
        arrivalCity: '',
        departureDate: '',
        departureAirport: '',
        departureFlightNo: '',
        departureCity: '',
        arrivalHotel: '',
        departureHotel: '',
        maktab: ''
    });

    useEffect(() => {
        fetchHotels();
        fetchCompany();
        if (isEdit) {
            fetchGroup();
        }
    }, [id]);

    const fetchCompany = async () => {
        try {
            const response = await companiesAPI.getAll();
            setCompany(response.data);
        } catch (error) {
            console.error('Error fetching company:', error);
        }
    };

    const fetchHotels = async () => {
        try {
            const response = await hotelsAPI.getAll();
            setHotels(response.data);
        } catch (error) {
            console.error('Error fetching hotels:', error);
        }
    };

    const fetchGroup = async () => {
        try {
            setLoading(true);
            const response = await groupsAPI.getById(id);
            const group = response.data;
            setFormData({
                groupName: group.groupName,
                arrivalDate: group.arrivalDate ? group.arrivalDate.split('T')[0] : '',
                arrivalAirport: group.arrivalAirport || '',
                arrivalFlightNo: group.arrivalFlightNo || '',
                arrivalCity: group.arrivalCity || '',
                departureDate: group.departureDate ? group.departureDate.split('T')[0] : '',
                departureAirport: group.departureAirport || '',
                departureFlightNo: group.departureFlightNo || '',
                departureCity: group.departureCity || '',
                arrivalHotel: group.arrivalHotel?._id || group.hotel?._id || '',
                departureHotel: group.departureHotel?._id || group.hotel?._id || '',
                maktab: group.maktab || ''
            });
        } catch (error) {
            console.error('Error fetching group:', error);
            alert('Failed to fetch group details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Filter hotels by arrival city
    const getFilteredArrivalHotels = () => {
        if (!formData.arrivalCity) return [];
        return hotels.filter(hotel => hotel.city === formData.arrivalCity);
    };

    // Filter hotels by departure city
    const getFilteredDepartureHotels = () => {
        if (!formData.departureCity) return [];
        return hotels.filter(hotel => hotel.city === formData.departureCity);
    };

    const handleQuickAddHotel = async (e) => {
        e.preventDefault();
        try {
            const response = await hotelsAPI.create(newHotel);
            setHotels([...hotels, response.data.hotel]);
            setFormData({ ...formData, arrivalHotel: response.data.hotel._id });
            setNewHotel({ name: '', city: '', address: '', phone: '' });
            setShowHotelModal(false);
        } catch (error) {
            console.error('Error creating hotel:', error);
            alert(error.response?.data?.message || 'Failed to create hotel');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const dataToSend = {
                ...formData,
                arrivalHotel: formData.arrivalHotel || undefined,
                departureHotel: formData.departureHotel || undefined
            };

            if (isEdit) {
                await groupsAPI.update(id, dataToSend);
            } else {
                await groupsAPI.create(dataToSend);
            }

            navigate('/groups');
        } catch (error) {
            console.error('Error saving group:', error);
            alert(error.response?.data?.message || 'Failed to save group');
            setLoading(false);
        }
    };

    if (loading && isEdit) {
        return (
            <div className="group-form-page">
                <div className="dashboard-header">
                    <div className="dashboard-header-content">
                        <div className="dashboard-logo">
                            <div className="dashboard-logo-icon">
                                <Users size={28} />
                            </div>
                            <div className="dashboard-logo-text">
                                <h1>{company?.name || 'Maktab'}</h1>
                                <p>Loading...</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="page-content">
                    <Card>
                        <p>Loading...</p>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="group-form-page">
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-logo">
                        <div className="dashboard-logo-icon">
                            <Users size={28} />
                        </div>
                        <div className="dashboard-logo-text">
                            <h1>Maktab</h1>
                            <p>{isEdit ? 'Edit Group' : 'Create New Group'}</p>
                        </div>
                    </div>
                    <Button variant="danger" size="small" onClick={logout}>
                        <LogOut size={18} />
                        Logout
                    </Button>
                </div>
            </div>

            <div className="dashboard-nav">
                <button className="nav-item" onClick={() => navigate('/company-admin/dashboard')}>
                    <Home size={20} />
                    <span>Dashboard</span>
                </button>
                <button className="nav-item" onClick={() => navigate('/passengers')}>
                    <UserCheck size={20} />
                    <span>Passengers</span>
                </button>
                <button className="nav-item active" onClick={() => navigate('/groups')}>
                    <Users size={20} />
                    <span>Groups</span>
                </button>
                <button className="nav-item" onClick={() => navigate('/reports')}>
                    <FileText size={20} />
                    <span>Reports</span>
                </button>
            </div>

            <div className="page-content">
                <div className="page-header">
                    <h1>{isEdit ? 'Edit Group' : 'Create New Group'}</h1>
                </div>

                <Card>
                    <form onSubmit={handleSubmit}>
                        <div className="form-section">
                            <h3>Basic Information</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Group Name *</label>
                                    <Input
                                        name="groupName"
                                        value={formData.groupName}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter group name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Maktab *</label>
                                    <select
                                        name="maktab"
                                        value={formData.maktab}
                                        onChange={handleChange}
                                        className="select-input"
                                        required
                                    >
                                        <option value="">-- Select Maktab --</option>
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                        <option value="D">D</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Arrival Details</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Arrival Date</label>
                                    <Input
                                        type="date"
                                        name="arrivalDate"
                                        value={formData.arrivalDate}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Arrival Airport</label>
                                    <select
                                        name="arrivalAirport"
                                        value={formData.arrivalAirport}
                                        onChange={handleChange}
                                        className="form-select"
                                        required
                                    >
                                        <option value="">Select Airport</option>
                                        {SAUDI_AIRPORTS.map(airport => (
                                            <option key={airport.code} value={airport.code}>
                                                {airport.code} - {airport.city} ({airport.name})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Arrival Flight No</label>
                                    <Input
                                        name="arrivalFlightNo"
                                        value={formData.arrivalFlightNo}
                                        onChange={handleChange}
                                        placeholder="e.g., EK001"
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Arrival City *</label>
                                    <select
                                        name="arrivalCity"
                                        value={formData.arrivalCity}
                                        onChange={handleChange}
                                        className="select-input"
                                        required
                                    >
                                        <option value="">-- Select City --</option>
                                        <option value="Makkah">Makkah</option>
                                        <option value="Madinah">Madinah</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Arrival Hotel *</label>
                                    <select
                                        name="arrivalHotel"
                                        value={formData.arrivalHotel}
                                        onChange={handleChange}
                                        className="select-input"
                                        required
                                        disabled={!formData.arrivalCity}
                                    >
                                        <option value="">{formData.arrivalCity ? '-- Select Hotel --' : '-- Select City First --'}</option>
                                        {getFilteredArrivalHotels().map((hotel) => (
                                            <option key={hotel._id} value={hotel._id}>
                                                {hotel.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Departure Details</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Departure Date</label>
                                    <Input
                                        type="date"
                                        name="departureDate"
                                        value={formData.departureDate}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Departure Airport</label>
                                    <select
                                        name="departureAirport"
                                        value={formData.departureAirport}
                                        onChange={handleChange}
                                        className="form-select"
                                        required
                                    >
                                        <option value="">Select Airport</option>
                                        {SAUDI_AIRPORTS.map(airport => (
                                            <option key={airport.code} value={airport.code}>
                                                {airport.code} - {airport.city} ({airport.name})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Departure Flight No</label>
                                    <Input
                                        name="departureFlightNo"
                                        value={formData.departureFlightNo}
                                        onChange={handleChange}
                                        placeholder="e.g., EK002"
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Departure City *</label>
                                    <select
                                        name="departureCity"
                                        value={formData.departureCity}
                                        onChange={handleChange}
                                        className="select-input"
                                        required
                                    >
                                        <option value="">-- Select City --</option>
                                        <option value="Makkah">Makkah</option>
                                        <option value="Madinah">Madinah</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Departure Hotel *</label>
                                    <select
                                        name="departureHotel"
                                        value={formData.departureHotel}
                                        onChange={handleChange}
                                        className="select-input"
                                        required
                                        disabled={!formData.departureCity}
                                    >
                                        <option value="">{formData.departureCity ? '-- Select Hotel --' : '-- Select City First --'}</option>
                                        {getFilteredDepartureHotels().map((hotel) => (
                                            <option key={hotel._id} value={hotel._id}>
                                                {hotel.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <Button type="button" variant="secondary" onClick={() => navigate('/groups')}>
                                <X size={18} />
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                <Save size={18} />
                                {loading ? 'Saving...' : (isEdit ? 'Update Group' : 'Create Group')}
                            </Button>
                        </div>
                    </form>
                </Card>

                <Modal
                    isOpen={showHotelModal}
                    onClose={() => setShowHotelModal(false)}
                    title="Quick Add Hotel"
                >
                    <form onSubmit={handleQuickAddHotel}>
                        <div className="form-group">
                            <label>Hotel Name *</label>
                            <Input
                                value={newHotel.name}
                                onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
                                required
                                placeholder="Enter hotel name"
                            />
                        </div>
                        <div className="form-group">
                            <label>City</label>
                            <Input
                                value={newHotel.city}
                                onChange={(e) => setNewHotel({ ...newHotel, city: e.target.value })}
                                placeholder="Enter city"
                            />
                        </div>
                        <div className="form-group">
                            <label>Address</label>
                            <Input
                                value={newHotel.address}
                                onChange={(e) => setNewHotel({ ...newHotel, address: e.target.value })}
                                placeholder="Enter address"
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <Input
                                value={newHotel.phone}
                                onChange={(e) => setNewHotel({ ...newHotel, phone: e.target.value })}
                                placeholder="Enter phone number"
                            />
                        </div>
                        <div className="form-actions">
                            <Button type="button" variant="secondary" onClick={() => setShowHotelModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                <Building2 size={18} />
                                Add Hotel
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
};

export default GroupForm;
