import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { groupsAPI, hotelsAPI, companiesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { setFormDataForErrorLog, clearFormDataForErrorLog } from '../services/errorHandler';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { Save, X, Plus, Building2, Users, Home, LogOut, FileText, UserCheck, Bell, Search } from 'lucide-react';
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
        arrivalTime: '',
        arrivalCity: '',
        originAirport: '',
        originCity: '',
        departureDate: '',
        departureAirport: '',
        departureFlightNo: '',
        departureTime: '',
        returnAirport: '',
        returnCity: '',
        departureCity: '',
        arrivalHotel: '',
        departureHotel: '',
        maktab: '',
        remarks: ''
    });

    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        const requiredFields = {
            groupName: 'Group Name',
            maktab: 'Maktab',
            arrivalDate: 'Arrival Date',
            arrivalTime: 'Arrival Time',
            arrivalAirport: 'Arrival Airport',
            arrivalFlightNo: 'Arrival Flight No',
            arrivalCity: 'Arrival City',
            arrivalHotel: 'Arrival Hotel',
            originAirport: 'Origin Airport',
            originCity: 'Origin City',
            departureDate: 'Departure Date',
            departureTime: 'Departure Time',
            departureAirport: 'Departure Airport',
            departureFlightNo: 'Departure Flight No',
            departureCity: 'Departure City',
            departureHotel: 'Departure Hotel'
        };
        Object.entries(requiredFields).forEach(([field, label]) => {
            if (!formData[field] || formData[field].trim() === '') {
                newErrors[field] = `${label} is required`;
            }
        });
        const alphanumericFields = { arrivalFlightNo: 'Arrival Flight No', departureFlightNo: 'Departure Flight No' };
        Object.entries(alphanumericFields).forEach(([field, label]) => {
            if (formData[field] && !/^[a-zA-Z0-9]+$/.test(formData[field])) {
                newErrors[field] = `${label} must contain only letters and numbers`;
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        fetchHotels();
        fetchCompany();
        if (isEdit) {
            fetchGroup();
        }
    }, [id]);

    // Keep error handler aware of current form data
    useEffect(() => {
        setFormDataForErrorLog(formData);
        return () => clearFormDataForErrorLog();
    }, [formData]);

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
                arrivalTime: group.arrivalTime || '',
                arrivalCity: group.arrivalCity || '',
                originAirport: group.originAirport || '',
                originCity: group.originCity || '',
                departureDate: group.departureDate ? group.departureDate.split('T')[0] : '',
                departureAirport: group.departureAirport || '',
                departureFlightNo: group.departureFlightNo || '',
                departureTime: group.departureTime || '',
                returnAirport: group.returnAirport || '',
                returnCity: group.returnCity || '',
                departureCity: group.departureCity || '',
                arrivalHotel: group.arrivalHotel?._id || group.hotel?._id || '',
                departureHotel: group.departureHotel?._id || group.hotel?._id || '',
                maktab: group.maktab || '',
                remarks: group.remarks || ''
            });
        } catch (error) {
            console.error('Error fetching group:', error);
            alert('Failed to fetch group details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const flightFields = ['arrivalFlightNo', 'departureFlightNo'];
        const sanitizedValue = flightFields.includes(name)
            ? value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
            : value;
        setFormData({
            ...formData,
            [name]: sanitizedValue
        });
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
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
        if (!validate()) {
            alert('Please fill in all required fields before saving.');
            return;
        }
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
                    <div className="dashboard-header-content flex-between">
                        <div className="dashboard-logo">
                            <div className="dashboard-logo-icon">
                                <Users size={24} />
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
                <div className="dashboard-header-content flex-between">
                    <div className="dashboard-logo">
                        <div className="dashboard-logo-icon">
                            <Users size={24} />
                        </div>
                        <div className="dashboard-logo-text">
                            <h1>Maktab</h1>
                            <p>{isEdit ? 'Edit Group' : 'Create New Group'}</p>
                        </div>
                    </div>
                    <div className="dashboard-header-tools">
                        <div className="dashboard-search">
                            <Search size={16} />
                            <input type="text" placeholder="Quick search…" />
                        </div>
                        <button className="dashboard-notification" title="Notifications">
                            <Bell size={20} />
                        </button>
                        <div className="dashboard-user">
                            <Button variant="secondary" size="small" icon={<LogOut size={16} />} onClick={logout}>
                                Logout
                            </Button>
                        </div>
                    </div>
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
                                    {errors.groupName && <span className="field-error">{errors.groupName}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Maktab *</label>
                                    <select
                                        name="maktab"
                                        value={formData.maktab}
                                        onChange={handleChange}
                                        className={`select-input ${errors.maktab ? 'input-error' : ''}`}
                                        required
                                    >
                                        <option value="">-- Select Maktab --</option>
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                        <option value="D">D</option>
                                    </select>
                                    {errors.maktab && <span className="field-error">{errors.maktab}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Arrival Details</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Arrival Date *</label>
                                    <Input
                                        type="date"
                                        name="arrivalDate"
                                        value={formData.arrivalDate}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.arrivalDate && <span className="field-error">{errors.arrivalDate}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Arrival Time *</label>
                                    <Input
                                        type="time"
                                        name="arrivalTime"
                                        value={formData.arrivalTime}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.arrivalTime && <span className="field-error">{errors.arrivalTime}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Arrival Airport *</label>
                                    <select
                                        name="arrivalAirport"
                                        value={formData.arrivalAirport}
                                        onChange={handleChange}
                                        className={`form-select ${errors.arrivalAirport ? 'input-error' : ''}`}
                                        required
                                    >
                                        <option value="">Select Airport</option>
                                        {SAUDI_AIRPORTS.map(airport => (
                                            <option key={airport.code} value={airport.code}>
                                                {airport.code} - {airport.city} ({airport.name})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.arrivalAirport && <span className="field-error">{errors.arrivalAirport}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Arrival Flight No *</label>
                                    <Input
                                        name="arrivalFlightNo"
                                        value={formData.arrivalFlightNo}
                                        onChange={handleChange}
                                        placeholder="e.g., EK001"
                                        required
                                    />
                                    {errors.arrivalFlightNo && <span className="field-error">{errors.arrivalFlightNo}</span>}
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Arrival City *</label>
                                    <select
                                        name="arrivalCity"
                                        value={formData.arrivalCity}
                                        onChange={handleChange}
                                        className={`select-input ${errors.arrivalCity ? 'input-error' : ''}`}
                                        required
                                    >
                                        <option value="">-- Select City --</option>
                                        <option value="Makkah">Makkah</option>
                                        <option value="Madinah">Madinah</option>
                                    </select>
                                    {errors.arrivalCity && <span className="field-error">{errors.arrivalCity}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Arrival Hotel *</label>
                                    <select
                                        name="arrivalHotel"
                                        value={formData.arrivalHotel}
                                        onChange={handleChange}
                                        className={`select-input ${errors.arrivalHotel ? 'input-error' : ''}`}
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
                                    {errors.arrivalHotel && <span className="field-error">{errors.arrivalHotel}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Travel Route Details</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Origin Airport *</label>
                                    <Input
                                        name="originAirport"
                                        value={formData.originAirport}
                                        onChange={handleChange}
                                        placeholder="e.g., DAC, LHE, ISB"
                                        required
                                    />
                                    {errors.originAirport && <span className="field-error">{errors.originAirport}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Origin City *</label>
                                    <Input
                                        name="originCity"
                                        value={formData.originCity}
                                        onChange={handleChange}
                                        placeholder="e.g., Dhaka, Lahore, Islamabad"
                                        required
                                    />
                                    {errors.originCity && <span className="field-error">{errors.originCity}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Departure Details</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Departure Date *</label>
                                    <Input
                                        type="date"
                                        name="departureDate"
                                        value={formData.departureDate}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.departureDate && <span className="field-error">{errors.departureDate}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Departure Time *</label>
                                    <Input
                                        type="time"
                                        name="departureTime"
                                        value={formData.departureTime}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.departureTime && <span className="field-error">{errors.departureTime}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Departure Airport *</label>
                                    <select
                                        name="departureAirport"
                                        value={formData.departureAirport}
                                        onChange={handleChange}
                                        className={`form-select ${errors.departureAirport ? 'input-error' : ''}`}
                                        required
                                    >
                                        <option value="">Select Airport</option>
                                        {SAUDI_AIRPORTS.map(airport => (
                                            <option key={airport.code} value={airport.code}>
                                                {airport.code} - {airport.city} ({airport.name})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.departureAirport && <span className="field-error">{errors.departureAirport}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Departure Flight No *</label>
                                    <Input
                                        name="departureFlightNo"
                                        value={formData.departureFlightNo}
                                        onChange={handleChange}
                                        placeholder="e.g., EK002"
                                        required
                                    />
                                    {errors.departureFlightNo && <span className="field-error">{errors.departureFlightNo}</span>}
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Departure City *</label>
                                    <select
                                        name="departureCity"
                                        value={formData.departureCity}
                                        onChange={handleChange}
                                        className={`select-input ${errors.departureCity ? 'input-error' : ''}`}
                                        required
                                    >
                                        <option value="">-- Select City --</option>
                                        <option value="Makkah">Makkah</option>
                                        <option value="Madinah">Madinah</option>
                                    </select>
                                    {errors.departureCity && <span className="field-error">{errors.departureCity}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Departure Hotel *</label>
                                    <select
                                        name="departureHotel"
                                        value={formData.departureHotel}
                                        onChange={handleChange}
                                        className={`select-input ${errors.departureHotel ? 'input-error' : ''}`}
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
                                    {errors.departureHotel && <span className="field-error">{errors.departureHotel}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Remarks</h3>
                            <div className="form-group">
                                <label>Remarks / Notes</label>
                                <textarea
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleChange}
                                    className="select-input"
                                    rows={3}
                                    placeholder="Any additional notes about this group..."
                                    style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem' }}
                                />
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
