import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    UserPlus,
    Home,
    ChevronDown,
    ChevronRight,
    Key,
    TrendingUp,
    AlertCircle,
    Plane,
    Clock
} from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import './Dashboard.css';

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [stats, setStats] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [companyAdmins, setCompanyAdmins] = useState({});
    const [expandedRows, setExpandedRows] = useState({});
    const [passengerCounts, setPassengerCounts] = useState({});
    const [unassignedCounts, setUnassignedCounts] = useState({});
    const [groups, setGroups] = useState([]);
    const [todayArrivals, setTodayArrivals] = useState([]);
    const [todayDepartures, setTodayDepartures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [newPassword, setNewPassword] = useState('');
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
        fetchGroups();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [dashboardRes, companiesRes, countsRes, unassignedRes] = await Promise.all([
                superAdminAPI.getDashboard(),
                companiesAPI.getAll(),
                superAdminAPI.getPassengerCounts(),
                superAdminAPI.getUnassignedCounts()
            ]);
            setStats(dashboardRes.data.stats);
            setCompanies(companiesRes.data);
            setPassengerCounts(countsRes.data);
            setUnassignedCounts(unassignedRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const response = await superAdminAPI.getGroups();
            const groupsData = response.data;
            setGroups(groupsData);

            // Calculate today's arrivals and departures
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const arrivalsToday = groupsData.filter(group => {
                const arrivalDate = new Date(group.arrivalDate);
                arrivalDate.setHours(0, 0, 0, 0);
                return arrivalDate.getTime() === today.getTime();
            });

            const departuresToday = groupsData.filter(group => {
                const departureDate = new Date(group.departureDate);
                departureDate.setHours(0, 0, 0, 0);
                return departureDate.getTime() === today.getTime();
            });

            setTodayArrivals(arrivalsToday);
            setTodayDepartures(departuresToday);
        } catch (error) {
            console.error('Error fetching groups:', error);
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

            // Refresh admins list if the row is expanded
            if (expandedRows[selectedCompany._id]) {
                const response = await companiesAPI.getAdmins(selectedCompany._id);
                setCompanyAdmins(prev => ({
                    ...prev,
                    [selectedCompany._id]: response.data
                }));
            }

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

    const toggleRowExpansion = async (companyId) => {
        setExpandedRows(prev => ({
            ...prev,
            [companyId]: !prev[companyId]
        }));

        // Fetch admins if not already loaded
        if (!companyAdmins[companyId] && !expandedRows[companyId]) {
            try {
                const response = await companiesAPI.getAdmins(companyId);
                setCompanyAdmins(prev => ({
                    ...prev,
                    [companyId]: response.data
                }));
            } catch (error) {
                console.error('Error fetching admins:', error);
            }
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        try {
            await companiesAPI.resetAdminPassword(selectedCompany._id, selectedAdmin._id, newPassword);
            setShowResetPasswordModal(false);
            setSelectedAdmin(null);
            setSelectedCompany(null);
            setNewPassword('');
            alert('Password reset successfully!');
        } catch (error) {
            console.error('Error resetting password:', error);
            alert(error.response?.data?.message || 'Failed to reset password');
        }
    };

    const openResetPasswordModal = (company, admin) => {
        setSelectedCompany(company);
        setSelectedAdmin(admin);
        setShowResetPasswordModal(true);
    };

    const handleDeleteAdmin = async (companyId, adminId) => {
        if (window.confirm('Are you sure you want to delete this admin?')) {
            try {
                await companiesAPI.deleteAdmin(companyId, adminId);
                // Refresh admins for this company
                const response = await companiesAPI.getAdmins(companyId);
                setCompanyAdmins(prev => ({
                    ...prev,
                    [companyId]: response.data
                }));
                alert('Admin deleted successfully!');
            } catch (error) {
                console.error('Error deleting admin:', error);
                alert('Failed to delete admin');
            }
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

            {/* Navigation Menu */}
            <div className="dashboard-nav">
                <button
                    className="nav-item active"
                    onClick={() => navigate('/super-admin/dashboard')}
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

                {/* Today's Schedule */}
                <div className="fade-in" style={{ marginTop: '2rem' }}>
                    <h3 className="section-title">
                        <Clock size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                        Today's Schedule - All Companies
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="schedule-card">
                            <div className="schedule-header" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                                <Plane size={20} />
                                <span>Arrivals Today</span>
                                <span className="schedule-count">{todayArrivals.length}</span>
                            </div>
                            <div className="schedule-body">
                                {todayArrivals.length > 0 ? (
                                    todayArrivals.map(group => (
                                        <div key={group._id} className="schedule-item">
                                            <div className="schedule-time">{new Date(group.arrivalDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            <div className="schedule-details">
                                                <div className="schedule-flight">Flight {group.arrivalFlightNo}</div>
                                                <div className="schedule-meta">{group.company?.name} • Maktab {group.maktab} • {group.passengerCount || 0} pax</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="schedule-empty">No arrivals scheduled for today</div>
                                )}
                            </div>
                        </div>

                        <div className="schedule-card">
                            <div className="schedule-header" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                                <Plane size={20} style={{ transform: 'rotate(45deg)' }} />
                                <span>Departures Today</span>
                                <span className="schedule-count">{todayDepartures.length}</span>
                            </div>
                            <div className="schedule-body">
                                {todayDepartures.length > 0 ? (
                                    todayDepartures.map(group => (
                                        <div key={group._id} className="schedule-item">
                                            <div className="schedule-time">{new Date(group.departureDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            <div className="schedule-details">
                                                <div className="schedule-flight">Flight {group.departureFlightNo}</div>
                                                <div className="schedule-meta">{group.company?.name} • Maktab {group.maktab} • {group.passengerCount || 0} pax</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="schedule-empty">No departures scheduled for today</div>
                                )}
                            </div>
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
                        <div className="companies-table-container">
                            <table className="companies-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}></th>
                                        <th>Company Name</th>
                                        <th>Email</th>
                                        <th>Industry</th>
                                        <th>Quota</th>
                                        <th>Arrival Incomplete</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {companies.map((company) => (
                                        <React.Fragment key={company._id}>
                                            <tr className="company-row">
                                                <td>
                                                    <button
                                                        className="expand-btn"
                                                        onClick={() => toggleRowExpansion(company._id)}
                                                    >
                                                        {expandedRows[company._id] ? (
                                                            <ChevronDown size={18} />
                                                        ) : (
                                                            <ChevronRight size={18} />
                                                        )}
                                                    </button>
                                                </td>
                                                <td><strong>{company.name}</strong></td>
                                                <td>{company.email}</td>
                                                <td>{company.industry || '-'}</td>
                                                <td>
                                                    {(() => {
                                                        const used = passengerCounts[company._id] || 0;
                                                        const total = company.passengerQuota;
                                                        const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
                                                        const isNearLimit = percentage >= 70 && percentage < 90;
                                                        const isOverLimit = percentage >= 90;

                                                        let barColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                                                        if (isOverLimit) {
                                                            barColor = 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)';
                                                        } else if (isNearLimit) {
                                                            barColor = 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)';
                                                        }

                                                        return (
                                                            <div className="quota-progress-mini">
                                                                <div className="quota-progress-bar-mini-wrapper">
                                                                    <div
                                                                        className="quota-progress-bar-mini-fill"
                                                                        style={{
                                                                            width: `${Math.min(percentage, 100)}%`,
                                                                            background: barColor
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="quota-percentage-label">
                                                                    {percentage}%
                                                                </div>
                                                                <div style={{ fontSize: '0.75rem', color: '#666', whiteSpace: 'nowrap' }}>
                                                                    {used}/{total}
                                                                </div>
                                                                {isOverLimit && (
                                                                    <AlertCircle size={16} style={{ color: '#f5576c', flexShrink: 0 }} />
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{
                                                            fontWeight: 700,
                                                            fontSize: '1rem',
                                                            color: (unassignedCounts[company._id] || 0) > 0 ? '#f5576c' : '#666'
                                                        }}>
                                                            {unassignedCounts[company._id] || 0}
                                                        </span>
                                                        {(unassignedCounts[company._id] || 0) > 0 && (
                                                            <AlertCircle size={16} style={{ color: '#f5576c' }} />
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${company.isActive ? 'active' : 'inactive'}`}>
                                                        {company.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn-icon success"
                                                            title="Add Admin"
                                                            onClick={() => openAdminModal(company)}
                                                        >
                                                            <UserPlus size={18} />
                                                        </button>
                                                        <button
                                                            className="btn-icon danger"
                                                            title="Delete"
                                                            onClick={() => handleDeleteCompany(company._id)}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedRows[company._id] && (
                                                <tr className="nested-row">
                                                    <td colSpan="7">
                                                        <div className="nested-table-container">
                                                            <h4>Company Admins</h4>
                                                            {companyAdmins[company._id]?.length === 0 ? (
                                                                <p className="no-admins">No admins for this company</p>
                                                            ) : (
                                                                <table className="nested-table">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Username</th>
                                                                            <th>Email</th>
                                                                            <th>Full Name</th>
                                                                            <th>Phone</th>
                                                                            <th>Status</th>
                                                                            <th>Actions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {companyAdmins[company._id]?.map((admin) => (
                                                                            <tr key={admin._id}>
                                                                                <td>{admin.username}</td>
                                                                                <td>{admin.email}</td>
                                                                                <td>
                                                                                    {admin.firstName || admin.lastName
                                                                                        ? `${admin.firstName || ''} ${admin.lastName || ''}`.trim()
                                                                                        : '-'}
                                                                                </td>
                                                                                <td>{admin.phone || '-'}</td>
                                                                                <td>
                                                                                    <span className={`status-badge ${admin.isActive ? 'active' : 'inactive'}`}>
                                                                                        {admin.isActive ? 'Active' : 'Inactive'}
                                                                                    </span>
                                                                                </td>
                                                                                <td>
                                                                                    <div className="action-buttons">
                                                                                        <button
                                                                                            className="btn-icon primary"
                                                                                            title="Reset Password"
                                                                                            onClick={() => openResetPasswordModal(company, admin)}
                                                                                        >
                                                                                            <Key size={16} />
                                                                                        </button>
                                                                                        <button
                                                                                            className="btn-icon danger"
                                                                                            title="Delete Admin"
                                                                                            onClick={() => handleDeleteAdmin(company._id, admin._id)}
                                                                                        >
                                                                                            <Trash2 size={16} />
                                                                                        </button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="reports-footer">
                <div className="company-name">Innovative Layer</div>
                <div className="contact-info">
                    Phone: +92 333 3775889 | Website: <a href="https://www.innovativelayer.com" target="_blank" rel="noopener noreferrer">www.innovativelayer.com</a>
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

            {/* Reset Password Modal */}
            <Modal
                isOpen={showResetPasswordModal}
                onClose={() => {
                    setShowResetPasswordModal(false);
                    setSelectedAdmin(null);
                    setSelectedCompany(null);
                    setNewPassword('');
                }}
                title={`Reset Password for ${selectedAdmin?.username}`}
            >
                <form onSubmit={handleResetPassword}>
                    <Input
                        label="New Password"
                        type="password"
                        name="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength="6"
                        placeholder="Enter new password (min 6 characters)"
                    />
                    <div className="form-actions">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setShowResetPasswordModal(false);
                                setSelectedAdmin(null);
                                setSelectedCompany(null);
                                setNewPassword('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            Reset Password
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SuperAdminDashboard;
