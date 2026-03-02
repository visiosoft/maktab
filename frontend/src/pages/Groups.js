import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsAPI, companiesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import { Users, Plus, Edit2, Trash2, Search, Calendar, Plane, Home, Building2, LogOut, FileText, Grid, List, UserCheck } from 'lucide-react';
import { SAUDI_AIRPORTS } from '../constants/airports';
import './Groups.css';

const Groups = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [groups, setGroups] = useState([]);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table'); // 'grid' or 'table'

    useEffect(() => {
        fetchGroups();
        fetchCompany();
    }, []);

    const fetchCompany = async () => {
        try {
            const response = await companiesAPI.getAll();
            setCompany(response.data);
        } catch (error) {
            console.error('Error fetching company:', error);
        }
    };

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const response = await groupsAPI.getAll();
            setGroups(response.data);
        } catch (error) {
            console.error('Error fetching groups:', error);
            alert('Failed to fetch groups');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        navigate('/groups/new');
    };

    const handleEdit = (groupId) => {
        navigate(`/groups/${groupId}/edit`);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this group? Passengers will be unassigned.')) {
            try {
                await groupsAPI.delete(id);
                fetchGroups();
            } catch (error) {
                console.error('Error deleting group:', error);
                alert('Failed to delete group');
            }
        }
    };

    const handleViewPassengers = (groupId) => {
        navigate(`/groups/${groupId}/passengers`);
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getAirportCity = (code) => {
        const airport = SAUDI_AIRPORTS.find(a => a.code === code);
        return airport ? airport.city : code;
    };

    const filteredGroups = groups.filter(group =>
        group.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.hotel?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.maktab?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.arrivalFlightNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.departureFlightNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.arrivalAirport?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.departureAirport?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getAirportCity(group.arrivalAirport || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getAirportCity(group.departureAirport || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="groups-page">
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-logo">
                        <div className="dashboard-logo-icon">
                            <Users size={28} />
                        </div>
                        <div className="dashboard-logo-text">
                            <h1>{company?.name || 'Maktab'}</h1>
                            <p>Groups Management</p>
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
                    <h1>
                        <Users size={32} />
                        Groups Management
                    </h1>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div className="view-toggle">
                            <button
                                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="Grid View"
                            >
                                <Grid size={18} />
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                                onClick={() => setViewMode('table')}
                                title="Table View"
                            >
                                <List size={18} />
                            </button>
                        </div>
                        <Button onClick={handleCreate}>
                            <Plus size={18} />
                            Create Group
                        </Button>
                    </div>
                </div>

                <Card className="search-card">
                    <div className="search-box">
                        <Search size={20} />
                        <Input
                            placeholder="Search groups by name or hotel..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </Card>

                <Card>
                    {loading ? (
                        <p>Loading groups...</p>
                    ) : filteredGroups.length === 0 ? (
                        <div className="empty-state">
                            <Users size={48} />
                            <p>No groups found</p>
                            <Button onClick={handleCreate}>
                                <Plus size={18} />
                                Create Your First Group
                            </Button>
                        </div>
                    ) : viewMode === 'table' ? (
                        <div className="groups-table-wrapper">
                            <table className="groups-table">
                                <thead>
                                    <tr>
                                        <th>Group Name</th>
                                        <th>Maktab</th>
                                        <th>Hotel</th>
                                        <th>PAX</th>
                                        <th>Arrival Date</th>
                                        <th>Arrival Flight</th>
                                        <th>Departure Date</th>
                                        <th>Departure Flight</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredGroups.map((group) => (
                                        <tr key={group._id}>
                                            <td><strong>{group.groupName}</strong></td>
                                            <td>
                                                {group.maktab && (
                                                    <span className="maktab-badge">Maktab {group.maktab}</span>
                                                )}
                                            </td>
                                            <td>
                                                {group.hotel ? (
                                                    <div>
                                                        <div><strong>{group.hotel.name}</strong></div>
                                                        {group.hotel.city && <div style={{ fontSize: '0.85rem', color: '#666' }}>{group.hotel.city}</div>}
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td>{group.passengerCount || 0} / {group.numberOfPax || 0}</td>
                                            <td>{formatDate(group.arrivalDate)}</td>
                                            <td>
                                                {group.arrivalFlightNo ? (
                                                    <div>
                                                        <div>{group.arrivalFlightNo}</div>
                                                        {group.arrivalAirport && <div style={{ fontSize: '0.85rem', color: '#666' }}>({getAirportCity(group.arrivalAirport)})</div>}
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td>{formatDate(group.departureDate)}</td>
                                            <td>
                                                {group.departureFlightNo ? (
                                                    <div>
                                                        <div>{group.departureFlightNo}</div>
                                                        {group.departureAirport && <div style={{ fontSize: '0.85rem', color: '#666' }}>({getAirportCity(group.departureAirport)})</div>}
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        className="btn-icon edit"
                                                        onClick={() => handleViewPassengers(group._id)}
                                                        title="Add/View Passengers"
                                                    >
                                                        <Users size={16} />
                                                    </button>
                                                    <button
                                                        className="btn-icon edit"
                                                        onClick={() => handleEdit(group._id)}
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        className="btn-icon delete"
                                                        onClick={() => handleDelete(group._id)}
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
                    ) : (
                        <div className="groups-grid">
                            {filteredGroups.map((group) => (
                                <div key={group._id} className="group-card">
                                    <div className="group-header">
                                        <h3>{group.groupName}</h3>
                                        <div className="group-actions">
                                            <button
                                                className="btn-icon edit"
                                                onClick={() => handleEdit(group._id)}
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="btn-icon delete"
                                                onClick={() => handleDelete(group._id)}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="group-stats">
                                        <div className="stat">
                                            <Users size={18} />
                                            <span>{group.passengerCount || 0} / {group.numberOfPax || 0} PAX</span>
                                        </div>
                                        {group.maktab && (
                                            <div className="stat">
                                                <span className="maktab-badge">Maktab {group.maktab}</span>
                                            </div>
                                        )}
                                        {group.hotel && (
                                            <div className="stat">
                                                <span className="hotel-badge">{group.hotel.name}</span>
                                                {group.hotel.city && <span className="city-text">{group.hotel.city}</span>}
                                            </div>
                                        )}
                                    </div>

                                    <div className="group-details">
                                        {group.arrivalDate && (
                                            <div className="detail-row">
                                                <Calendar size={16} />
                                                <span><strong>Arrival:</strong> {formatDate(group.arrivalDate)}</span>
                                            </div>
                                        )}
                                        {group.arrivalFlightNo && (
                                            <div className="detail-row">
                                                <Plane size={16} />
                                                <span>{group.arrivalFlightNo} {group.arrivalAirport && `(${getAirportCity(group.arrivalAirport)})`}</span>
                                            </div>
                                        )}
                                        {group.departureDate && (
                                            <div className="detail-row">
                                                <Calendar size={16} />
                                                <span><strong>Departure:</strong> {formatDate(group.departureDate)}</span>
                                            </div>
                                        )}
                                        {group.departureFlightNo && (
                                            <div className="detail-row">
                                                <Plane size={16} style={{ transform: 'rotate(45deg)' }} />
                                                <span>{group.departureFlightNo} {group.departureAirport && `(${getAirportCity(group.departureAirport)})`}</span>
                                            </div>
                                        )}
                                    </div>

                                    <Button

                                        onClick={() => handleViewPassengers(group._id)}
                                    >
                                        <Plus size={18} />
                                        Add / View Passengers
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Groups;
