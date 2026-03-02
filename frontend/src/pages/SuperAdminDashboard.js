import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { superAdminAPI, companiesAPI } from '../services/api';
import {
    Building2,
    Users,
    CheckCircle,
    LogOut,
    Plus,
    Edit,
    Trash2,
    Mail,
    UserPlus
} from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import './Dashboard.css';

const SuperAdminDashboard = () => {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        industry: '',
        website: '',
        passengerQuota: 100
    });
    const [adminFormData, setAdminFormData] = useState({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: ''
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [dashboardRes, companiesRes] = await Promise.all([
                superAdminAPI.getDashboard(),
                companiesAPI.getAll()
            ]);
            setStats(dashboardRes.data.stats);
            setCompanies(companiesRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        try {
            await companiesAPI.create(formData);
            setShowCompanyModal(false);
            setFormData({ name: '', email: '', phone: '', industry: '', website: '', passengerQuota: 100 });
            fetchDashboardData();
        } catch (error) {
            console.error('Error creating company:', error);
            alert(error.response?.data?.message || 'Failed to create company');
        }
    };

    const handleDeleteCompany = async (id) => {
        if (window.confirm('Are you sure you want to delete this company? This will also delete all associated admins.')) {
            try {
                await companiesAPI.delete(id);
                fetchDashboardData();
            } catch (error) {
                console.error('Error deleting company:', error);
                alert('Failed to delete company');
            }
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        try {
            await companiesAPI.createAdmin(selectedCompany._id, adminFormData);
            setShowAdminModal(false);
            setAdminFormData({ username: '', email: '', password: '', firstName: '', lastName: '', phone: '' });
            setSelectedCompany(null);
            alert('Company admin created successfully!');
        } catch (error) {
            console.error('Error creating admin:', error);
            alert(error.response?.data?.message || 'Failed to create admin');
        }
    };

    const openAdminModal = (company) => {
        setSelectedCompany(company);
        setShowAdminModal(true);
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
                        <div className="dashboard-logo-text">
                            <h1>Maktab</h1>
                            <p>Super Admin Portal</p>
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

            {/* Main Content */}
            <div className="dashboard-container">
                <div className="dashboard-welcome fade-in">
                    <h2>Welcome back, Super Admin!</h2>
                    <p>Manage your companies and admins from this dashboard.</p>
                </div>

                {/* Stats */}
                <div className="stats-grid fade-in">
                    <div className="stat-card">
                        <div className="stat-icon primary">
                            <Building2 />
                        </div>
                        <div className="stat-content">
                            <h3>{stats?.totalCompanies || 0}</h3>
                            <p>Total Companies</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon success">
                            <CheckCircle />
                        </div>
                        <div className="stat-content">
                            <h3>{stats?.activeCompanies || 0}</h3>
                            <p>Active Companies</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon info">
                            <Users />
                        </div>
                        <div className="stat-content">
                            <h3>{stats?.totalCompanyAdmins || 0}</h3>
                            <p>Total Admins</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon warning">
                            <CheckCircle />
                        </div>
                        <div className="stat-content">
                            <h3>{stats?.activeCompanyAdmins || 0}</h3>
                            <p>Active Admins</p>
                        </div>
                    </div>
                </div>

                {/* Companies Section */}
                <div className="companies-section fade-in">
                    <div className="section-header">
                        <h3>All Companies</h3>
                        <Button
                            variant="primary"
                            icon={<Plus size={20} />}
                            onClick={() => setShowCompanyModal(true)}
                        >
                            Add Company
                        </Button>
                    </div>

                    {companies.length === 0 ? (
                        <div className="empty-state">
                            <Building2 size={48} />
                            <p>No companies yet. Create your first company!</p>
                        </div>
                    ) : (
                        <div className="companies-grid">
                            {companies.map((company) => (
                                <div key={company._id} className="company-card">
                                    <div className="company-header">
                                        <div className="company-info">
                                            <h4>{company.name}</h4>
                                            <p><Mail size={14} /> {company.email}</p>
                                            {company.industry && <p>Industry: {company.industry}</p>}
                                        </div>
                                        <span className={`company-status ${company.isActive ? 'active' : 'inactive'}`}>
                                            {company.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="company-actions">
                                        <button
                                            className="icon-button success"
                                            title="Add Admin"
                                            onClick={() => openAdminModal(company)}
                                        >
                                            <UserPlus size={20} />
                                        </button>
                                        <button className="icon-button primary" title="Edit">
                                            <Edit size={20} />
                                        </button>
                                        <button
                                            className="icon-button danger"
                                            title="Delete"
                                            onClick={() => handleDeleteCompany(company._id)}
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Company Modal */}
            <Modal
                isOpen={showCompanyModal}
                onClose={() => setShowCompanyModal(false)}
                title="Create New Company"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowCompanyModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleCreateCompany}>
                            Create Company
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleCreateCompany}>
                    <Input
                        label="Company Name"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <Input
                        label="Phone"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <Input
                        label="Industry"
                        name="industry"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    />
                    <Input
                        label="Website"
                        name="website"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                    <Input
                        label="Passenger Quota"
                        type="number"
                        name="passengerQuota"
                        value={formData.passengerQuota}
                        onChange={(e) => setFormData({ ...formData, passengerQuota: parseInt(e.target.value) || 0 })}
                        min="0"
                        required
                    />
                </form>
            </Modal>

            {/* Create Admin Modal */}
            <Modal
                isOpen={showAdminModal}
                onClose={() => {
                    setShowAdminModal(false);
                    setSelectedCompany(null);
                }}
                title={`Create Admin for ${selectedCompany?.name}`}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => {
                            setShowAdminModal(false);
                            setSelectedCompany(null);
                        }}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleCreateAdmin}>
                            Create Admin
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleCreateAdmin}>
                    <Input
                        label="Username"
                        name="username"
                        value={adminFormData.username}
                        onChange={(e) => setAdminFormData({ ...adminFormData, username: e.target.value })}
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={adminFormData.email}
                        onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        name="password"
                        value={adminFormData.password}
                        onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                        required
                    />
                    <Input
                        label="First Name"
                        name="firstName"
                        value={adminFormData.firstName}
                        onChange={(e) => setAdminFormData({ ...adminFormData, firstName: e.target.value })}
                    />
                    <Input
                        label="Last Name"
                        name="lastName"
                        value={adminFormData.lastName}
                        onChange={(e) => setAdminFormData({ ...adminFormData, lastName: e.target.value })}
                    />
                    <Input
                        label="Phone"
                        name="phone"
                        value={adminFormData.phone}
                        onChange={(e) => setAdminFormData({ ...adminFormData, phone: e.target.value })}
                    />
                </form>
            </Modal>
        </div>
    );
};

export default SuperAdminDashboard;
