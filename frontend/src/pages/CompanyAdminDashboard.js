import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { companiesAPI, passengersAPI } from '../services/api';
import {
    Building2,
    LogOut,
    Mail,
    Phone,
    Globe,
    Users,
    Home,
    UserCheck,
    FileText,
    TrendingUp,
    TrendingDown,
    CheckCircle2
} from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import './Dashboard.css';

const CompanyAdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [stats, setStats] = useState({
        totalPassengers: 0,
        quota: 100,
        remaining: 0,
        maktabCounts: {
            A: 0,
            B: 0,
            C: 0,
            D: 0,
            unassigned: 0
        }
    });
    const [loading, setLoading] = useState(true);
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [showMaktabModal, setShowMaktabModal] = useState(false);
    const [selectedMaktab, setSelectedMaktab] = useState(null);
    const [maktabPassengers, setMaktabPassengers] = useState([]);
    const [loadingPassengers, setLoadingPassengers] = useState(false);

    useEffect(() => {
        fetchCompanyData();
        fetchStats();
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

    const fetchStats = async () => {
        try {
            const response = await passengersAPI.getStats();
            setStats({
                totalPassengers: response.data.totalPassengers ?? 0,
                quota: response.data.quota ?? 100,
                remaining: response.data.remaining ?? 0,
                maktabCounts: response.data.maktabCounts ?? {
                    A: 0,
                    B: 0,
                    C: 0,
                    D: 0,
                    unassigned: 0
                }
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            // Keep the default state on error
        }
    };

    const fetchMaktabPassengers = async (maktab) => {
        setLoadingPassengers(true);
        try {
            const response = await passengersAPI.getAll();
            console.log('All passengers:', response.data);
            console.log('Looking for maktab:', maktab);
            console.log('Sample passenger group structure:', response.data[0]?.group);

            const filtered = response.data.filter(passenger => {
                console.log(`Passenger ${passenger.firstName}: group =`, passenger.group, 'maktab =', passenger.group?.maktab);
                return maktab === 'unassigned'
                    ? (!passenger.group || !passenger.group.maktab)
                    : passenger.group?.maktab === maktab;
            });

            console.log('Filtered passengers:', filtered);
            setMaktabPassengers(filtered);
        } catch (error) {
            console.error('Error fetching maktab passengers:', error);
            setMaktabPassengers([]);
        } finally {
            setLoadingPassengers(false);
        }
    };

    const handleMaktabClick = (maktab) => {
        setSelectedMaktab(maktab);
        setShowMaktabModal(true);
        fetchMaktabPassengers(maktab);
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
                    onClick={() => navigate('/passengers')}
                >
                    <UserCheck size={20} />
                    <span>Passengers</span>
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
                    <p>Monitor your passenger quota and allocations.</p>
                </div>

                {/* Quota Overview Cards */}
                <div className="fade-in">
                    <h3 className="section-title">Quota Overview</h3>
                    <div className="quota-cards">
                        <div className="quota-card primary-card">
                            <div className="quota-card-header">
                                <div className="quota-icon">
                                    <CheckCircle2 size={32} />
                                </div>
                                <div className="quota-trend">
                                    <TrendingUp size={20} />
                                </div>
                            </div>
                            <div className="quota-card-body">
                                <h2>{stats.quota}</h2>
                                <p>Total Quota</p>
                                <div className="quota-subtitle">Maximum passengers allowed</div>
                            </div>
                        </div>

                        <div className="quota-card success-card">
                            <div className="quota-card-header">
                                <div className="quota-icon">
                                    <Users size={32} />
                                </div>
                                <div className="quota-trend">
                                    {stats.totalPassengers > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                </div>
                            </div>
                            <div className="quota-card-body">
                                <h2>{stats.totalPassengers}</h2>
                                <p>Passengers Added</p>
                                <div className="quota-subtitle">
                                    {Math.round((stats.totalPassengers / stats.quota) * 100)}% of quota used
                                </div>
                            </div>
                        </div>

                        <div className="quota-card warning-card">
                            <div className="quota-card-header">
                                <div className="quota-icon">
                                    <UserCheck size={32} />
                                </div>
                                <div className="quota-trend">
                                    {stats.remaining > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                </div>
                            </div>
                            <div className="quota-card-body">
                                <h2>{stats.remaining}</h2>
                                <p>Remaining Slots</p>
                                <div className="quota-subtitle">Available for new passengers</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Maktab Distribution */}
                <div className="fade-in" style={{ marginTop: '2rem' }}>
                    <h3 className="section-title">Maktab Distribution</h3>
                    <div className="maktab-cards">
                        <div className="maktab-card maktab-a" onClick={() => handleMaktabClick('A')} style={{ cursor: 'pointer' }}>
                            <div className="maktab-label">Maktab A</div>
                            <div className="maktab-count">{stats.maktabCounts?.A ?? 0}</div>
                            <div className="maktab-progress">
                                <div
                                    className="maktab-progress-bar"
                                    style={{ width: `${((stats.maktabCounts?.A ?? 0) / Math.max(stats.totalPassengers, 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="maktab-card maktab-b" onClick={() => handleMaktabClick('B')} style={{ cursor: 'pointer' }}>
                            <div className="maktab-label">Maktab B</div>
                            <div className="maktab-count">{stats.maktabCounts?.B ?? 0}</div>
                            <div className="maktab-progress">
                                <div
                                    className="maktab-progress-bar"
                                    style={{ width: `${((stats.maktabCounts?.B ?? 0) / Math.max(stats.totalPassengers, 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="maktab-card maktab-c" onClick={() => handleMaktabClick('C')} style={{ cursor: 'pointer' }}>
                            <div className="maktab-label">Maktab C</div>
                            <div className="maktab-count">{stats.maktabCounts?.C ?? 0}</div>
                            <div className="maktab-progress">
                                <div
                                    className="maktab-progress-bar"
                                    style={{ width: `${((stats.maktabCounts?.C ?? 0) / Math.max(stats.totalPassengers, 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="maktab-card maktab-d" onClick={() => handleMaktabClick('D')} style={{ cursor: 'pointer' }}>
                            <div className="maktab-label">Maktab D</div>
                            <div className="maktab-count">{stats.maktabCounts?.D ?? 0}</div>
                            <div className="maktab-progress">
                                <div
                                    className="maktab-progress-bar"
                                    style={{ width: `${((stats.maktabCounts?.D ?? 0) / Math.max(stats.totalPassengers, 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="maktab-card maktab-unassigned" onClick={() => handleMaktabClick('unassigned')} style={{ cursor: 'pointer' }}>
                            <div className="maktab-label">Unassigned</div>
                            <div className="maktab-count">{stats.maktabCounts?.unassigned ?? 0}</div>
                            <div className="maktab-progress">
                                <div
                                    className="maktab-progress-bar"
                                    style={{ width: `${((stats.maktabCounts?.unassigned ?? 0) / Math.max(stats.totalPassengers, 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
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
                            <strong style={{ color: '#667eea', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users size={16} /> Passenger Quota:
                            </strong>
                            <p style={{ margin: '0.5rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                                {company.passengerQuota || 100} passengers
                            </p>
                        </div>
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

            {/* Maktab Passengers Modal */}
            <Modal
                isOpen={showMaktabModal}
                onClose={() => setShowMaktabModal(false)}
                title={`Maktab ${selectedMaktab === 'unassigned' ? 'Unassigned' : selectedMaktab} - Passengers`}
            >
                {loadingPassengers ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Loading passengers...</div>
                ) : maktabPassengers.length > 0 ? (
                    <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        <table className="data-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Passport Number</th>
                                    <th>Phone</th>
                                    <th>Hotel</th>
                                </tr>
                            </thead>
                            <tbody>
                                {maktabPassengers.map((passenger) => (
                                    <tr key={passenger._id}>
                                        <td>{passenger.firstName} {passenger.lastName}</td>
                                        <td>{passenger.passportNo}</td>
                                        <td>{passenger.phone || '-'}</td>
                                        <td>{passenger.group?.hotel?.name || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ marginTop: '1rem', textAlign: 'center', color: '#667eea', fontWeight: '600' }}>
                            Total: {maktabPassengers.length} passenger{maktabPassengers.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                        No passengers found in this maktab.
                    </p>
                )}
            </Modal>
        </div>
    );
};

export default CompanyAdminDashboard;
