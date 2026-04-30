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
    TrendingDown,
    AlertCircle,
    Plane,
    Clock,
    FileText,
    UserCheck,
    ArrowRight,
    Calendar,
    Bell,
    Search,
    Download,
    AlertTriangle
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
    const [tomorrowArrivals, setTomorrowArrivals] = useState([]);
    const [todayDepartures, setTodayDepartures] = useState([]);
    const [upcomingArrivals, setUpcomingArrivals] = useState([]);
    const [upcomingDepartures, setUpcomingDepartures] = useState([]);
    const [scheduleCompanyFilter, setScheduleCompanyFilter] = useState('all');
    const [dashboardTab, setDashboardTab] = useState('overview');
    const [totalPassengers, setTotalPassengers] = useState(0);
    const [totalQuota, setTotalQuota] = useState(0);
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
        passengerQuota: 100,
        isActive: true,
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
        }
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

    const getEmptyCompanyForm = () => ({
        name: '',
        email: '',
        phone: '',
        industry: '',
        website: '',
        passengerQuota: 100,
        isActive: true,
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
        }
    });

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

            // Calculate total quota from all companies
            const quota = companiesRes.data.reduce((sum, company) => sum + (company.passengerQuota || 0), 0);
            setTotalQuota(quota);
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
            console.log('[Super Admin] Fetched groups:', groupsData.length);
            setGroups(groupsData);

            // Calculate today's arrivals and departures
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

            const arrivalsToday = groupsData.filter(group => {
                const arrivalDate = new Date(group.arrivalDate);
                arrivalDate.setHours(0, 0, 0, 0);
                return arrivalDate.getTime() === today.getTime();
            });

            const arrivalsTomorrow = groupsData.filter(group => {
                const arrivalDate = new Date(group.arrivalDate);
                arrivalDate.setHours(0, 0, 0, 0);
                return arrivalDate.getTime() === tomorrow.getTime();
            });

            const departuresToday = groupsData.filter(group => {
                const departureDate = new Date(group.departureDate);
                departureDate.setHours(0, 0, 0, 0);
                return departureDate.getTime() === today.getTime();
            });

            // Calculate upcoming arrivals and departures (next 7 days)
            const upcomingArr = groupsData.filter(group => {
                const arrivalDate = new Date(group.arrivalDate);
                return arrivalDate >= today && arrivalDate <= sevenDaysFromNow;
            }).sort((a, b) => new Date(a.arrivalDate) - new Date(b.arrivalDate));

            const upcomingDep = groupsData.filter(group => {
                const departureDate = new Date(group.departureDate);
                return departureDate >= today && departureDate <= sevenDaysFromNow;
            }).sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));

            console.log('[Super Admin] Today\'s arrivals:', arrivalsToday.length, arrivalsToday);
            console.log('[Super Admin] Today\'s departures:', departuresToday.length, departuresToday);

            setTodayArrivals(arrivalsToday);
            setTomorrowArrivals(arrivalsTomorrow);
            setTodayDepartures(departuresToday);
            setUpcomingArrivals(upcomingArr);
            setUpcomingDepartures(upcomingDep);

            // Calculate total passengers
            const totalPax = groupsData.reduce((sum, group) => sum + (group.passengerCount || 0), 0);
            setTotalPassengers(totalPax);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const groupArrivals = (list) => {
        const map = {};
        list.forEach((group) => {
            const key = [
                group.arrivalFlightNo || '',
                group.arrivalTime || '',
                group.arrivalAirport || '',
                group.maktab || '',
                group.company?._id || '',
                group.arrivalHotel?._id || ''
            ].join('|');
            if (!map[key]) {
                map[key] = {
                    ...group,
                    passengerCount: group.passengerCount || 0
                };
            } else {
                map[key].passengerCount += group.passengerCount || 0;
            }
        });
        return Object.values(map).sort((a, b) => (a.arrivalTime || '').localeCompare(b.arrivalTime || ''));
    };

    const handleSaveCompany = async (e) => {
        e.preventDefault();
        try {
            if (selectedCompany) {
                await companiesAPI.update(selectedCompany._id, formData);
            } else {
                await companiesAPI.create(formData);
            }
            setShowCompanyModal(false);
            setSelectedCompany(null);
            setFormData(getEmptyCompanyForm());
            fetchDashboardData();
        } catch (error) {
            console.error('Error saving company:', error);
            alert(error.response?.data?.message || 'Failed to save company');
        }
    };

    const openCreateCompanyModal = () => {
        setSelectedCompany(null);
        setFormData(getEmptyCompanyForm());
        setShowCompanyModal(true);
    };

    const openEditCompanyModal = (company) => {
        setSelectedCompany(company);
        setFormData({
            name: company.name || '',
            email: company.email || '',
            phone: company.phone || '',
            industry: company.industry || '',
            website: company.website || '',
            passengerQuota: company.passengerQuota || 0,
            isActive: company.isActive !== false,
            address: {
                street: company.address?.street || '',
                city: company.address?.city || '',
                state: company.address?.state || '',
                zipCode: company.address?.zipCode || '',
                country: company.address?.country || ''
            }
        });
        setShowCompanyModal(true);
    };

    const handleCompanyFieldChange = (field, value) => {
        setFormData((previous) => ({
            ...previous,
            [field]: value
        }));
    };

    const handleCompanyAddressChange = (field, value) => {
        setFormData((previous) => ({
            ...previous,
            address: {
                ...previous.address,
                [field]: value
            }
        }));
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
                <div className="dashboard-header-content flex-between">
                    <div className="dashboard-logo">
                        <div className="dashboard-logo-icon">
                            <Building2 size={24} />
                        </div>
                        <div className="dashboard-logo-text">
                            <h1>AL NAFI MUNAZZAM</h1>
                            <p>Super Admin Portal</p>
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
                            <div className="dashboard-avatar">
                                {user?.email?.[0]?.toUpperCase() || 'A'}
                            </div>
                            <div className="dashboard-user-info">
                                <p>Logged in as</p>
                                <h3>{user?.email}</h3>
                            </div>
                            <Button variant="secondary" size="small" icon={<LogOut size={16} />} onClick={logout}>
                                Logout
                            </Button>
                        </div>
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
                    onClick={() => navigate('/super-admin/companies')}
                >
                    <Building2 size={20} />
                    <span>Companies</span>
                </button>
                <button
                    className="nav-item"
                    onClick={() => navigate('/super-admin/passengers')}
                >
                    <UserCheck size={20} />
                    <span>Passengers</span>
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
                    onClick={() => navigate('/reports')}
                >
                    <FileText size={20} />
                    <span>Reports</span>
                </button>
                <button
                    className="nav-item"
                    onClick={() => navigate('/super-admin/error-logs')}
                >
                    <AlertTriangle size={20} />
                    <span>Error Logs</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="dashboard-container">
                <div className="dashboard-welcome fade-in">
                    <h2>Welcome back, Super Admin!</h2>
                    <p>Manage your companies and admins from this dashboard.</p>
                </div>

                {/* Dashboard Tabs */}
                <div className="dashboard-tabs fade-in" style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb' }}>
                    <button
                        onClick={() => setDashboardTab('overview')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: dashboardTab === 'overview' ? '700' : '500',
                            color: dashboardTab === 'overview' ? '#667eea' : '#666',
                            borderBottom: dashboardTab === 'overview' ? '3px solid #667eea' : '3px solid transparent',
                            marginBottom: '-2px',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Home size={18} />
                        Overview
                    </button>
                    <button
                        onClick={() => setDashboardTab('flightboard')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: dashboardTab === 'flightboard' ? '700' : '500',
                            color: dashboardTab === 'flightboard' ? '#667eea' : '#666',
                            borderBottom: dashboardTab === 'flightboard' ? '3px solid #667eea' : '3px solid transparent',
                            marginBottom: '-2px',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Plane size={18} />
                        Flight Board
                        {todayArrivals.length > 0 && (
                            <span style={{
                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                color: '#fff',
                                padding: '0.1rem 0.5rem',
                                borderRadius: '10px',
                                fontSize: '0.75rem',
                                fontWeight: '700'
                            }}>{todayArrivals.length}</span>
                        )}
                    </button>
                </div>

                {dashboardTab === 'overview' && (<>
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

                    {/* Quota Overview */}
                    <div className="fade-in" style={{ marginTop: '2rem' }}>
                        <h3 className="section-title">Company Quota Overview</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            {companies.map((company) => {
                                const companyPassengers = passengerCounts[company._id] || 0;
                                const companyQuota = company.passengerQuota || 0;
                                const remaining = companyQuota - companyPassengers;
                                const percentage = companyQuota > 0 ? Math.round((companyPassengers / companyQuota) * 100) : 0;
                                const unassigned = unassignedCounts[company._id] || 0;

                                return (
                                    <div
                                        key={company._id}
                                        style={{
                                            background: 'white',
                                            borderRadius: '12px',
                                            padding: '1.5rem',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                            border: '2px solid #f0f0f0',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.2)';
                                            e.currentTarget.style.borderColor = '#667eea';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                            e.currentTarget.style.borderColor = '#f0f0f0';
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#333', fontWeight: '600' }}>{company.name}</h4>
                                            <div style={{
                                                background: percentage >= 90 ? 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' : percentage >= 70 ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                color: 'white',
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}>
                                                {percentage}%
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.875rem', color: '#666' }}>Quota</span>
                                                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333' }}>{companyQuota}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.875rem', color: '#666' }}>Used</span>
                                                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#667eea' }}>{companyPassengers}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.875rem', color: '#666' }}>Remaining</span>
                                                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: remaining > 0 ? '#4caf50' : '#f44336' }}>{remaining}</span>
                                            </div>
                                            {unassigned > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #f0f0f0' }}>
                                                    <span style={{ fontSize: '0.875rem', color: '#ff9800' }}>Unassigned</span>
                                                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#ff9800' }}>{unassigned}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{
                                            width: '100%',
                                            height: '8px',
                                            background: '#f0f0f0',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${Math.min(percentage, 100)}%`,
                                                height: '100%',
                                                background: percentage >= 90 ? 'linear-gradient(90deg, #fa709a 0%, #fee140 100%)' : percentage >= 70 ? 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)' : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                                transition: 'width 0.3s ease',
                                                borderRadius: '4px'
                                            }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="fade-in" style={{ marginTop: '2rem' }}>
                        <h3 className="section-title">Quick Actions</h3>
                        <div className="quick-actions-grid">
                            <button className="action-card" onClick={() => navigate('/super-admin/companies')}>
                                <div className="action-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                    <Building2 size={24} />
                                </div>
                                <div className="action-content">
                                    <div className="action-title">Manage Companies</div>
                                    <div className="action-subtitle">Open company management</div>
                                </div>
                                <ArrowRight size={20} />
                            </button>

                            <button className="action-card" onClick={() => navigate('/hotels')}>
                                <div className="action-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                                    <Building2 size={24} />
                                </div>
                                <div className="action-content">
                                    <div className="action-title">Manage Hotels</div>
                                    <div className="action-subtitle">Add & configure hotels</div>
                                </div>
                                <ArrowRight size={20} />
                            </button>

                            <button className="action-card" onClick={() => navigate('/reports')}>
                                <div className="action-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                                    <FileText size={24} />
                                </div>
                                <div className="action-content">
                                    <div className="action-title">View Reports</div>
                                    <div className="action-subtitle">Generate company reports</div>
                                </div>
                                <ArrowRight size={20} />
                            </button>

                            <button className="action-card" onClick={() => navigate('/super-admin/passengers')}>
                                <div className="action-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                                    <UserCheck size={24} />
                                </div>
                                <div className="action-content">
                                    <div className="action-title">View Passengers</div>
                                    <div className="action-subtitle">Inspect passenger records</div>
                                </div>
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Quick Insights */}
                    <div className="fade-in" style={{ marginTop: '2rem' }}>
                        <h3 className="section-title">Quick Insights</h3>
                        <div className="quick-stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                    <Users size={24} />
                                </div>
                                <div className="stat-content">
                                    <div className="stat-value">{groups.length}</div>
                                    <div className="stat-label">Total Groups</div>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                                    <Building2 size={24} />
                                </div>
                                <div className="stat-content">
                                    <div className="stat-value">{stats?.activeCompanies || 0}</div>
                                    <div className="stat-label">Active Companies</div>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                                    <Plane size={24} />
                                </div>
                                <div className="stat-content">
                                    <div className="stat-value">{upcomingArrivals.length}</div>
                                    <div className="stat-label">Upcoming Arrivals</div>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                                    <Calendar size={24} />
                                </div>
                                <div className="stat-content">
                                    <div className="stat-value">{upcomingDepartures.length}</div>
                                    <div className="stat-label">Upcoming Departures</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Today's Schedule */}
                    <div className="fade-in" style={{ marginTop: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 className="section-title" style={{ margin: 0 }}>
                                <Clock size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                                Schedule Overview
                            </h3>
                            <div style={{ minWidth: '250px' }}>
                                <select
                                    value={scheduleCompanyFilter}
                                    onChange={(e) => setScheduleCompanyFilter(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '2px solid #e0e0e0',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        background: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="all">All Companies</option>
                                    {companies.map((company) => (
                                        <option key={company._id} value={company._id}>
                                            {company.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Today's Arrivals & Departures */}
                        <h4 style={{ fontSize: '1rem', color: '#666', marginBottom: '1rem', marginTop: '1.5rem' }}>Today's Schedule</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="schedule-card">
                                <div className="schedule-header" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                                    <Plane size={20} />
                                    <span>Arrivals Today</span>
                                    <span className="schedule-count">{todayArrivals.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter).length}</span>
                                </div>
                                <div className="schedule-body">
                                    {todayArrivals.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter).length > 0 ? (
                                        todayArrivals.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter).map(group => (
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
                                    <span className="schedule-count">{todayDepartures.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter).length}</span>
                                </div>
                                <div className="schedule-body">
                                    {todayDepartures.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter).length > 0 ? (
                                        todayDepartures.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter).map(group => (
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

                        {/* Upcoming Schedule (Next 7 Days) */}
                        <h4 style={{ fontSize: '1rem', color: '#666', marginBottom: '1rem', marginTop: '2rem' }}>Upcoming Schedule (Next 7 Days)</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div>
                                <h3 className="section-title">
                                    <Plane size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                                    Upcoming Arrivals
                                </h3>
                                <div className="report-card">
                                    {upcomingArrivals.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter).length > 0 ? (
                                        upcomingArrivals.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter).slice(0, 7).map(group => (
                                            <div key={group._id} className="report-item">
                                                <div className="report-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                                                    <Plane size={20} />
                                                </div>
                                                <div className="report-details">
                                                    <h4>{group.company?.name}</h4>
                                                    <p>Flight {group.arrivalFlightNo} • Maktab {group.maktab}</p>
                                                    <div className="report-meta">
                                                        {new Date(group.arrivalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(group.arrivalDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {group.passengerCount || 0} pax
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-state">
                                            <Plane size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                            <p>No upcoming arrivals in the next 7 days</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="section-title">
                                    <Plane size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem', transform: 'rotate(45deg)' }} />
                                    Upcoming Departures
                                </h3>
                                <div className="report-card">
                                    {upcomingDepartures.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter).length > 0 ? (
                                        upcomingDepartures.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter).slice(0, 7).map(group => (
                                            <div key={group._id} className="report-item">
                                                <div className="report-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                                                    <Plane size={20} style={{ transform: 'rotate(45deg)' }} />
                                                </div>
                                                <div className="report-details">
                                                    <h4>{group.company?.name}</h4>
                                                    <p>Flight {group.departureFlightNo} • Maktab {group.maktab}</p>
                                                    <div className="report-meta">
                                                        {new Date(group.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(group.departureDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {group.passengerCount || 0} pax
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-state">
                                            <Plane size={48} style={{ opacity: 0.3, marginBottom: '1rem', transform: 'rotate(45deg)' }} />
                                            <p>No upcoming departures in the next 7 days</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="fade-in" style={{ marginTop: '2rem' }}>
                        <div className="report-card">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                <div>
                                    <h3 className="section-title" style={{ marginBottom: '0.5rem' }}>Company Management</h3>
                                    <p style={{ margin: 0, color: '#666' }}>
                                        Company setup, quota changes, and company admins are now managed from the dedicated Companies page.
                                    </p>
                                </div>
                                <Button variant="primary" onClick={() => navigate('/super-admin/companies')}>
                                    Open Companies
                                </Button>
                            </div>
                        </div>
                    </div>
                </>)}

                {dashboardTab === 'flightboard' && (
                    <div className="fade-in">
                        {/* Company Filter */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                            <div style={{ minWidth: '250px' }}>
                                <select
                                    value={scheduleCompanyFilter}
                                    onChange={(e) => setScheduleCompanyFilter(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '2px solid #e0e0e0',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        background: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="all">All Companies</option>
                                    {companies.map((company) => (
                                        <option key={company._id} value={company._id}>
                                            {company.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Arrivals Board */}
                        <div style={{
                            background: '#1a1a2e',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                            marginBottom: '2rem'
                        }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #0f3460 0%, #16213e 100%)',
                                padding: '1rem 1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Plane size={22} style={{ color: '#4facfe' }} />
                                    <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                        Today's Arrivals
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4caf50', animation: 'pulse 2s infinite' }}></div>
                                    <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                    <thead>
                                        <tr style={{ background: '#16213e' }}>
                                            {['Flight No', 'Time', 'Airport', 'No of Pax', 'Maktab', 'Company', 'Hotel'].map((header) => (
                                                <th key={header} style={{
                                                    padding: '0.75rem 1rem',
                                                    color: '#4facfe',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                    textAlign: 'left',
                                                    borderBottom: '1px solid #2a2a4a'
                                                }}>
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupArrivals(todayArrivals.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter)).length > 0 ? (
                                            groupArrivals(todayArrivals.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter))
                                                .map((group, index) => (
                                                    <tr key={group._id} style={{
                                                        background: index % 2 === 0 ? '#1a1a2e' : '#1e1e3a',
                                                        transition: 'background 0.2s'
                                                    }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a4a'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? '#1a1a2e' : '#1e1e3a'}
                                                    >
                                                        <td style={{ padding: '0.75rem 1rem', color: '#ffd700', fontWeight: '700', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                                                            {group.arrivalFlightNo || '—'}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', color: '#e0e0e0', fontWeight: '600', fontSize: '0.95rem' }}>
                                                            {group.arrivalTime || '—'}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', color: '#e0e0e0', fontSize: '0.9rem' }}>
                                                            {group.arrivalAirport || '—'}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem' }}>
                                                            <span style={{
                                                                background: '#2a2a4a',
                                                                color: '#4facfe',
                                                                padding: '0.2rem 0.6rem',
                                                                borderRadius: '6px',
                                                                fontWeight: '700',
                                                                fontSize: '0.85rem',
                                                                border: '1px solid #4facfe',
                                                                minWidth: '2rem',
                                                                display: 'inline-block',
                                                                textAlign: 'center'
                                                            }}>
                                                                {group.passengerCount || 0}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem' }}>
                                                            <span style={{
                                                                background: '#2a2a4a',
                                                                color: '#4facfe',
                                                                padding: '0.2rem 0.6rem',
                                                                borderRadius: '6px',
                                                                fontWeight: '600',
                                                                fontSize: '0.85rem',
                                                                border: '1px solid #4facfe'
                                                            }}>
                                                                {group.maktab || '—'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', color: '#e0e0e0', fontSize: '0.9rem' }}>
                                                            {group.company?.name || '—'}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', color: '#e0e0e0', fontSize: '0.9rem' }}>
                                                            {group.arrivalHotel?.name || '—'}
                                                        </td>
                                                    </tr>
                                                ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                                                    <Plane size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                                    <p style={{ margin: 0 }}>No arrivals scheduled for today</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {groupArrivals(todayArrivals.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter)).length > 0 && (
                                <div style={{
                                    padding: '0.75rem 1.5rem',
                                    background: '#16213e',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderTop: '1px solid #2a2a4a'
                                }}>
                                    <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                                        Total Flights: {groupArrivals(todayArrivals.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter)).length}
                                    </span>
                                    <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                                        Total Passengers: {groupArrivals(todayArrivals.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter)).reduce((sum, g) => sum + (g.passengerCount || 0), 0)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Tomorrow's Arrivals Board */}
                        <div style={{
                            background: '#1a1a2e',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                            marginBottom: '2rem'
                        }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #0f3460 0%, #1a3a5c 100%)',
                                padding: '1rem 1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Plane size={22} style={{ color: '#a78bfa' }} />
                                    <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                        Tomorrow's Arrivals
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a78bfa', animation: 'pulse 2s infinite' }}></div>
                                    <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                                        {new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                    <thead>
                                        <tr style={{ background: '#16213e' }}>
                                            {['Flight No', 'Time', 'Airport', 'No of Pax', 'Maktab', 'Company', 'Hotel'].map((header) => (
                                                <th key={header} style={{
                                                    padding: '0.75rem 1rem',
                                                    color: '#a78bfa',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                    textAlign: 'left',
                                                    borderBottom: '1px solid #2a2a4a'
                                                }}>
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupArrivals(tomorrowArrivals.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter)).length > 0 ? (
                                            groupArrivals(tomorrowArrivals.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter))
                                                .map((group, index) => (
                                                    <tr key={group._id} style={{
                                                        background: index % 2 === 0 ? '#1a1a2e' : '#1e1e3a',
                                                        transition: 'background 0.2s'
                                                    }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a4a'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? '#1a1a2e' : '#1e1e3a'}
                                                    >
                                                        <td style={{ padding: '0.75rem 1rem', color: '#ffd700', fontWeight: '700', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                                                            {group.arrivalFlightNo || '—'}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', color: '#e0e0e0', fontWeight: '600', fontSize: '0.95rem' }}>
                                                            {group.arrivalTime || '—'}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', color: '#e0e0e0', fontSize: '0.9rem' }}>
                                                            {group.arrivalAirport || '—'}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem' }}>
                                                            <span style={{
                                                                background: '#2a2a4a',
                                                                color: '#a78bfa',
                                                                padding: '0.2rem 0.6rem',
                                                                borderRadius: '6px',
                                                                fontWeight: '700',
                                                                fontSize: '0.85rem',
                                                                border: '1px solid #a78bfa',
                                                                minWidth: '2rem',
                                                                display: 'inline-block',
                                                                textAlign: 'center'
                                                            }}>
                                                                {group.passengerCount || 0}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem' }}>
                                                            <span style={{
                                                                background: '#2a2a4a',
                                                                color: '#a78bfa',
                                                                padding: '0.2rem 0.6rem',
                                                                borderRadius: '6px',
                                                                fontWeight: '600',
                                                                fontSize: '0.85rem',
                                                                border: '1px solid #a78bfa'
                                                            }}>
                                                                {group.maktab || '—'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', color: '#e0e0e0', fontSize: '0.9rem' }}>
                                                            {group.company?.name || '—'}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', color: '#e0e0e0', fontSize: '0.9rem' }}>
                                                            {group.arrivalHotel?.name || '—'}
                                                        </td>
                                                    </tr>
                                                ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                                                    <Plane size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                                    <p style={{ margin: 0 }}>No arrivals scheduled for tomorrow</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {tomorrowArrivals.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter).length > 0 && (
                                <div style={{
                                    padding: '0.75rem 1.5rem',
                                    background: '#16213e',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderTop: '1px solid #2a2a4a'
                                }}>
                                    <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                                        Total Flights: {groupArrivals(tomorrowArrivals.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter)).length}
                                    </span>
                                    <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                                        Total Passengers: {groupArrivals(tomorrowArrivals.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter)).reduce((sum, g) => sum + (g.passengerCount || 0), 0)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Departures Board */}
                        <div style={{
                            background: '#1a1a2e',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                        }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #4a1942 0%, #16213e 100%)',
                                padding: '1rem 1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Plane size={22} style={{ color: '#fa709a', transform: 'rotate(45deg)' }} />
                                    <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                        Today's Departures
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fa709a', animation: 'pulse 2s infinite' }}></div>
                                    <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                    <thead>
                                        <tr style={{ background: '#16213e' }}>
                                            {['Flight No', 'Time', 'Airport', 'No of Pax', 'Maktab', 'Company', 'Hotel'].map((header) => (
                                                <th key={header} style={{
                                                    padding: '0.75rem 1rem',
                                                    color: '#fa709a',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                    textAlign: 'left',
                                                    borderBottom: '1px solid #2a2a4a'
                                                }}>
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {todayDepartures.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter).length > 0 ? (
                                            todayDepartures
                                                .filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter)
                                                .sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''))
                                                .map((group, index) => (
                                                    <tr key={group._id} style={{
                                                        background: index % 2 === 0 ? '#1a1a2e' : '#1e1e3a',
                                                        transition: 'background 0.2s'
                                                    }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a4a'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? '#1a1a2e' : '#1e1e3a'}
                                                    >
                                                        <td style={{ padding: '0.75rem 1rem', color: '#ffd700', fontWeight: '700', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                                                            {group.departureFlightNo || '—'}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', color: '#e0e0e0', fontWeight: '600', fontSize: '0.95rem' }}>
                                                            {group.departureTime || '—'}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', color: '#e0e0e0', fontSize: '0.9rem' }}>
                                                            {group.departureAirport || '—'}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem' }}>
                                                            <span style={{
                                                                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                                                color: '#fff',
                                                                padding: '0.2rem 0.6rem',
                                                                borderRadius: '10px',
                                                                fontWeight: '700',
                                                                fontSize: '0.85rem'
                                                            }}>
                                                                {group.passengerCount || 0}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem' }}>
                                                            <span style={{
                                                                background: '#2a2a4a',
                                                                color: '#fa709a',
                                                                padding: '0.2rem 0.6rem',
                                                                borderRadius: '6px',
                                                                fontWeight: '600',
                                                                fontSize: '0.85rem',
                                                                border: '1px solid #fa709a'
                                                            }}>
                                                                {group.maktab || '—'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', color: '#e0e0e0', fontSize: '0.9rem' }}>
                                                            {group.company?.name || '—'}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', color: '#e0e0e0', fontSize: '0.9rem' }}>
                                                            {group.departureHotel?.name || '—'}
                                                        </td>
                                                    </tr>
                                                ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                                                    <Plane size={32} style={{ opacity: 0.3, marginBottom: '0.5rem', transform: 'rotate(45deg)' }} />
                                                    <p style={{ margin: 0 }}>No departures scheduled for today</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {todayDepartures.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter).length > 0 && (
                                <div style={{
                                    padding: '0.75rem 1.5rem',
                                    background: '#16213e',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderTop: '1px solid #2a2a4a'
                                }}>
                                    <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                                        Total Flights: {todayDepartures.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter).length}
                                    </span>
                                    <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                                        Total Passengers: {todayDepartures.filter(group => scheduleCompanyFilter === 'all' || group.company?._id === scheduleCompanyFilter).reduce((sum, g) => sum + (g.passengerCount || 0), 0)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
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
                onClose={() => {
                    setShowCompanyModal(false);
                    setSelectedCompany(null);
                    setFormData(getEmptyCompanyForm());
                }}
                title={selectedCompany ? `Edit ${selectedCompany.name}` : 'Create New Company'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => {
                            setShowCompanyModal(false);
                            setSelectedCompany(null);
                            setFormData(getEmptyCompanyForm());
                        }}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSaveCompany}>
                            {selectedCompany ? 'Save Changes' : 'Create Company'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSaveCompany}>
                    <Input
                        label="Company Name"
                        name="name"
                        value={formData.name}
                        onChange={(e) => handleCompanyFieldChange('name', e.target.value)}
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={(e) => handleCompanyFieldChange('email', e.target.value)}
                        required
                    />
                    <Input
                        label="Phone"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => handleCompanyFieldChange('phone', e.target.value)}
                    />
                    <Input
                        label="Industry"
                        name="industry"
                        value={formData.industry}
                        onChange={(e) => handleCompanyFieldChange('industry', e.target.value)}
                    />
                    <Input
                        label="Website"
                        name="website"
                        value={formData.website}
                        onChange={(e) => handleCompanyFieldChange('website', e.target.value)}
                    />
                    <Input
                        label="Passenger Quota"
                        type="number"
                        name="passengerQuota"
                        value={formData.passengerQuota}
                        onChange={(e) => handleCompanyFieldChange('passengerQuota', parseInt(e.target.value, 10) || 0)}
                        min="0"
                        required
                    />
                    <Input
                        label="Street Address"
                        name="street"
                        value={formData.address.street}
                        onChange={(e) => handleCompanyAddressChange('street', e.target.value)}
                    />
                    <Input
                        label="City"
                        name="city"
                        value={formData.address.city}
                        onChange={(e) => handleCompanyAddressChange('city', e.target.value)}
                    />
                    <Input
                        label="State / Province"
                        name="state"
                        value={formData.address.state}
                        onChange={(e) => handleCompanyAddressChange('state', e.target.value)}
                    />
                    <Input
                        label="Zip / Postal Code"
                        name="zipCode"
                        value={formData.address.zipCode}
                        onChange={(e) => handleCompanyAddressChange('zipCode', e.target.value)}
                    />
                    <Input
                        label="Country"
                        name="country"
                        value={formData.address.country}
                        onChange={(e) => handleCompanyAddressChange('country', e.target.value)}
                    />
                    <div className="input-group">
                        <label className="input-label" htmlFor="isActive">Status</label>
                        <select
                            id="isActive"
                            name="isActive"
                            value={formData.isActive ? 'active' : 'inactive'}
                            onChange={(e) => handleCompanyFieldChange('isActive', e.target.value === 'active')}
                            className="input-field"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
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
