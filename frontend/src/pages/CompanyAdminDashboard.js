import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { companiesAPI, passengersAPI, groupsAPI } from '../services/api';
import {
    Building2,
    LogOut,
    Mail,
    Phone,
    Globe,
    Users,
    Home,
    UserCheck,
    FileText
} from 'lucide-react';
import Button from '../components/Button';
import Card, { CardHeader, CardBody } from '../components/Card';
import PassengersTable from '../components/PassengersTable';
import Modal from '../components/Modal';
import './Dashboard.css';

const CompanyAdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [passengers, setPassengers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [passengersLoading, setPassengersLoading] = useState(false);
    const [showCompanyModal, setShowCompanyModal] = useState(false);

    useEffect(() => {
        fetchCompanyData();
        fetchPassengers();
        fetchGroups();
    }, []);

    const fetchCompanyData = async () => {
        try {
            const response = await companiesAPI.getAll();
            setCompany(response.data);
        } catch (error) {
            console.error('Error fetching company data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPassengers = async () => {
        setPassengersLoading(true);
        try {
            const response = await passengersAPI.getAll();
            setPassengers(response.data);
        } catch (error) {
            console.error('Error fetching passengers:', error);
        } finally {
            setPassengersLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const response = await groupsAPI.getAll();
            setGroups(response.data);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const handleAddPassenger = async (passengerData) => {
        try {
            await passengersAPI.create(passengerData);
            fetchPassengers();
        } catch (error) {
            console.error('Error adding passenger:', error);
            const errorMessage = error.response?.data?.message || 'Failed to add passenger';
            alert(errorMessage);
            throw error;
        }
    };

    const handleUpdatePassenger = async (id, passengerData) => {
        try {
            await passengersAPI.update(id, passengerData);
            fetchPassengers();
        } catch (error) {
            console.error('Error updating passenger:', error);
            alert(error.response?.data?.message || 'Failed to update passenger');
            throw error;
        }
    };

    const handleDeletePassenger = async (id) => {
        try {
            await passengersAPI.delete(id);
            fetchPassengers();
        } catch (error) {
            console.error('Error deleting passenger:', error);
            alert('Failed to delete passenger');
            throw error;
        }
    };

    if (loading) {
        return <div className="flex-center" style={{ minHeight: '100vh' }}>Loading...</div>;
    }

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-logo">
                        <div className="dashboard-logo-icon">
                            <Building2 size={28} />
                        </div>
                        <div className="dashboard-logo-text" onClick={() => setShowCompanyModal(true)} style={{ cursor: 'pointer' }}>
                            <h1>{company?.name || 'Loading...'}</h1>
                            <p>Company Admin Portal</p>
                        </div>
                    </div>
                    <div className="dashboard-user">
                        <div className="dashboard-user-info">
                            <p>Logged in as</p>
                            <h3>{user?.email}</h3>
                        </div>
                        <Button variant="danger" size="small" icon={<LogOut size={18} />} onClick={logout}>
                            Logout
                        </Button>
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <div className="dashboard-nav">
                <button
                    className="nav-item active"
                    onClick={() => navigate('/company-admin/dashboard')}
                >
                    <Home size={20} />
                    <span>Dashboard</span>
                </button>
                <button
                    className="nav-item"
                    onClick={() => navigate('/hotels')}
                >
                    <Building2 size={20} />
                    <span>Hotels</span>
                </button>
                <button
                    className="nav-item"
                    onClick={() => navigate('/groups')}
                >
                    <Users size={20} />
                    <span>Groups</span>
                </button>
                <button
                    className="nav-item"
                    onClick={() => navigate('/reports')}
                >
                    <FileText size={20} />
                    <span>Reports</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="dashboard-container">
                <div className="dashboard-welcome fade-in">
                    <h2>Welcome, {user?.username}!</h2>
                    <p>Manage your company from this dashboard.</p>
                </div>

                {/* Quick Stats */}
                <div className="fade-in">
                    <Card>
                        <CardHeader title="Quick Stats" />
                        <CardBody>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon primary">
                                        <Building2 />
                                    </div>
                                    <div className="stat-content">
                                        <h3>1</h3>
                                        <p>Company</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon success">
                                        <Users />
                                    </div>
                                    <div className="stat-content">
                                        <h3>{passengers.length}</h3>
                                        <p>Total Passengers</p>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Passenger List */}
                <div style={{ marginTop: '2rem' }} className="fade-in">
                    <PassengersTable
                        passengers={passengers}
                        groups={groups}
                        onAdd={handleAddPassenger}
                        onUpdate={handleUpdatePassenger}
                        onDelete={handleDeletePassenger}
                        loading={passengersLoading}
                    />
                </div>
            </div>

            {/* Company Information Modal */}
            <Modal
                isOpen={showCompanyModal}
                onClose={() => setShowCompanyModal(false)}
                title="Company Information"
            >
                {company ? (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <strong style={{ color: '#667eea' }}>Company Name:</strong>
                            <p style={{ margin: '0.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
                                {company.name}
                            </p>
                        </div>
                        <div>
                            <strong style={{ color: '#667eea', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Mail size={16} /> Email:
                            </strong>
                            <p style={{ margin: '0.5rem 0' }}>{company.email}</p>
                        </div>
                        {company.phone && (
                            <div>
                                <strong style={{ color: '#667eea', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Phone size={16} /> Phone:
                                </strong>
                                <p style={{ margin: '0.5rem 0' }}>{company.phone}</p>
                            </div>
                        )}
                        {company.industry && (
                            <div>
                                <strong style={{ color: '#667eea' }}>Industry:</strong>
                                <p style={{ margin: '0.5rem 0' }}>{company.industry}</p>
                            </div>
                        )}
                        {company.website && (
                            <div>
                                <strong style={{ color: '#667eea', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Globe size={16} /> Website:
                                </strong>
                                <p style={{ margin: '0.5rem 0' }}>
                                    <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
                                        {company.website}
                                    </a>
                                </p>
                            </div>
                        )}
                        <div>
                            <strong style={{ color: '#667eea' }}>Status:</strong>
                            <p style={{ margin: '0.5rem 0' }}>
                                <span className={`company-status ${company.isActive ? 'active' : 'inactive'}`}>
                                    {company.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </p>
                        </div>
                    </div>
                ) : (
                    <p>No company data available.</p>
                )}
            </Modal>
        </div>
    );
};

export default CompanyAdminDashboard;
