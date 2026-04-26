import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Building2,
    ChevronDown,
    ChevronRight,
    Edit,
    FileText,
    Home,
    Key,
    LogOut,
    Plus,
    Trash2,
    UserCheck,
    UserPlus,
    Bell,
    Search,
    Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { companiesAPI, superAdminAPI } from '../services/api';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import './Dashboard.css';

const SuperAdminCompanies = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [companies, setCompanies] = useState([]);
    const [companyAdmins, setCompanyAdmins] = useState({});
    const [expandedRows, setExpandedRows] = useState({});
    const [passengerCounts, setPassengerCounts] = useState({});
    const [unassignedCounts, setUnassignedCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [statusMessage, setStatusMessage] = useState(null);
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
        fetchData();
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

    const showStatusMessage = (type, text) => {
        setStatusMessage({ type, text });
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [companiesRes, countsRes, unassignedRes] = await Promise.all([
                companiesAPI.getAll(),
                superAdminAPI.getPassengerCounts(),
                superAdminAPI.getUnassignedCounts()
            ]);

            setCompanies(companiesRes.data);
            setPassengerCounts(countsRes.data);
            setUnassignedCounts(unassignedRes.data);
        } catch (error) {
            console.error('Error fetching companies:', error);
            showStatusMessage('error', 'Failed to load companies.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCompany = async (e) => {
        e.preventDefault();
        try {
            if (selectedCompany) {
                await companiesAPI.update(selectedCompany._id, formData);
                showStatusMessage('success', 'Company updated successfully.');
            } else {
                await companiesAPI.create(formData);
                showStatusMessage('success', 'Company created successfully.');
            }
            setShowCompanyModal(false);
            setSelectedCompany(null);
            setFormData(getEmptyCompanyForm());
            fetchData();
        } catch (error) {
            console.error('Error saving company:', error);
            showStatusMessage('error', error.response?.data?.message || 'Failed to save company.');
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
                showStatusMessage('success', 'Company deleted successfully.');
                fetchData();
            } catch (error) {
                console.error('Error deleting company:', error);
                showStatusMessage('error', error.response?.data?.message || 'Failed to delete company.');
            }
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        try {
            await companiesAPI.createAdmin(selectedCompany._id, adminFormData);
            setShowAdminModal(false);
            setAdminFormData({ username: '', email: '', password: '', firstName: '', lastName: '', phone: '' });

            if (expandedRows[selectedCompany._id]) {
                const response = await companiesAPI.getAdmins(selectedCompany._id);
                setCompanyAdmins((previous) => ({
                    ...previous,
                    [selectedCompany._id]: response.data
                }));
            }

            setSelectedCompany(null);
            showStatusMessage('success', 'Company admin created successfully.');
        } catch (error) {
            console.error('Error creating admin:', error);
            showStatusMessage('error', error.response?.data?.message || 'Failed to create admin.');
        }
    };

    const openAdminModal = (company) => {
        setSelectedCompany(company);
        setShowAdminModal(true);
    };

    const toggleRowExpansion = async (companyId) => {
        setExpandedRows((previous) => ({
            ...previous,
            [companyId]: !previous[companyId]
        }));

        if (!companyAdmins[companyId] && !expandedRows[companyId]) {
            try {
                const response = await companiesAPI.getAdmins(companyId);
                setCompanyAdmins((previous) => ({
                    ...previous,
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
            showStatusMessage('error', 'Password must be at least 6 characters.');
            return;
        }

        try {
            await companiesAPI.resetAdminPassword(selectedCompany._id, selectedAdmin._id, newPassword);
            setShowResetPasswordModal(false);
            setSelectedAdmin(null);
            setSelectedCompany(null);
            setNewPassword('');
            showStatusMessage('success', 'Password reset successfully.');
        } catch (error) {
            console.error('Error resetting password:', error);
            showStatusMessage('error', error.response?.data?.message || 'Failed to reset password.');
        }
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedCompanies = [...companies].sort((a, b) => {
        let aVal, bVal;
        if (sortField === 'name') {
            aVal = (a.name || '').toLowerCase();
            bVal = (b.name || '').toLowerCase();
        } else if (sortField === 'email') {
            aVal = (a.email || '').toLowerCase();
            bVal = (b.email || '').toLowerCase();
        } else if (sortField === 'industry') {
            aVal = (a.industry || '').toLowerCase();
            bVal = (b.industry || '').toLowerCase();
        } else if (sortField === 'quota') {
            const aUsed = passengerCounts[a._id] || 0;
            const bUsed = passengerCounts[b._id] || 0;
            aVal = a.passengerQuota > 0 ? aUsed / a.passengerQuota : 0;
            bVal = b.passengerQuota > 0 ? bUsed / b.passengerQuota : 0;
        } else if (sortField === 'unassigned') {
            aVal = unassignedCounts[a._id] || 0;
            bVal = unassignedCounts[b._id] || 0;
        } else if (sortField === 'status') {
            aVal = a.isActive ? 0 : 1;
            bVal = b.isActive ? 0 : 1;
        } else {
            return 0;
        }
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <ArrowUpDown size={14} style={{ opacity: 0.4, marginLeft: '0.3rem', flexShrink: 0 }} />;
        return sortDirection === 'asc'
            ? <ArrowUp size={14} style={{ color: '#667eea', marginLeft: '0.3rem', flexShrink: 0 }} />
            : <ArrowDown size={14} style={{ color: '#667eea', marginLeft: '0.3rem', flexShrink: 0 }} />;
    };

    const thStyle = { cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };
    const thInner = { display: 'flex', alignItems: 'center', gap: '0.1rem' };

    const openResetPasswordModal = (company, admin) => {
        setSelectedCompany(company);
        setSelectedAdmin(admin);
        setShowResetPasswordModal(true);
    };

    const handleDeleteAdmin = async (companyId, adminId) => {
        if (window.confirm('Are you sure you want to delete this admin?')) {
            try {
                await companiesAPI.deleteAdmin(companyId, adminId);
                const response = await companiesAPI.getAdmins(companyId);
                setCompanyAdmins((previous) => ({
                    ...previous,
                    [companyId]: response.data
                }));
                showStatusMessage('success', 'Admin deleted successfully.');
            } catch (error) {
                console.error('Error deleting admin:', error);
                showStatusMessage('error', error.response?.data?.message || 'Failed to delete admin.');
            }
        }
    };

    if (loading) {
        return <div className="flex-center" style={{ minHeight: '100vh' }}>Loading...</div>;
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div className="dashboard-header-content flex-between">
                    <div className="dashboard-logo">
                        <div className="dashboard-logo-icon">
                            <Building2 size={24} />
                        </div>
                        <div className="dashboard-logo-text">
                            <h1>Maktab</h1>
                            <p>Company Management</p>
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

            <div className="dashboard-nav">
                <button className="nav-item" onClick={() => navigate('/super-admin/dashboard')}>
                    <Home size={20} />
                    <span>Dashboard</span>
                </button>
                <button className="nav-item active" onClick={() => navigate('/super-admin/companies')}>
                    <Building2 size={20} />
                    <span>Companies</span>
                </button>
                <button className="nav-item" onClick={() => navigate('/super-admin/passengers')}>
                    <UserCheck size={20} />
                    <span>Passengers</span>
                </button>
                <button className="nav-item" onClick={() => navigate('/hotels')}>
                    <Building2 size={20} />
                    <span>Hotels</span>
                </button>
                <button className="nav-item" onClick={() => navigate('/reports')}>
                    <FileText size={20} />
                    <span>Reports</span>
                </button>

            </div>

            <div className="dashboard-container">
                <div className="dashboard-welcome fade-in">
                    <h2>Manage Companies</h2>
                    <p>Create, edit, and monitor all companies from one place.</p>
                </div>

                {statusMessage && (
                    <div
                        className="fade-in"
                        style={{
                            marginBottom: '1.5rem',
                            padding: '1rem 1.25rem',
                            borderRadius: '12px',
                            background: statusMessage.type === 'success' ? '#e8f7ee' : '#fdecec',
                            color: statusMessage.type === 'success' ? '#1f6b3b' : '#b42318',
                            border: `1px solid ${statusMessage.type === 'success' ? '#b7e4c7' : '#f5c2c7'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem'
                        }}
                    >
                        <span>{statusMessage.text}</span>
                        <button
                            type="button"
                            onClick={() => setStatusMessage(null)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'inherit',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.95rem'
                            }}
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                <div className="companies-section fade-in">
                    <div className="section-header">
                        <h3>All Companies</h3>
                        <Button variant="primary" icon={<Plus size={20} />} onClick={openCreateCompanyModal}>
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
                                        <th style={thStyle} onClick={() => handleSort('name')}><div style={thInner}>Company Name <SortIcon field="name" /></div></th>
                                        <th style={thStyle} onClick={() => handleSort('email')}><div style={thInner}>Email <SortIcon field="email" /></div></th>
                                        <th style={thStyle} onClick={() => handleSort('industry')}><div style={thInner}>Industry <SortIcon field="industry" /></div></th>
                                        <th style={thStyle} onClick={() => handleSort('quota')}><div style={thInner}>Quota <SortIcon field="quota" /></div></th>
                                        <th style={thStyle} onClick={() => handleSort('unassigned')}><div style={thInner}>Arrival Incomplete <SortIcon field="unassigned" /></div></th>
                                        <th style={thStyle} onClick={() => handleSort('status')}><div style={thInner}>Status <SortIcon field="status" /></div></th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedCompanies.map((company) => (
                                        <React.Fragment key={company._id}>
                                            <tr className="company-row">
                                                <td>
                                                    <button className="expand-btn" onClick={() => toggleRowExpansion(company._id)}>
                                                        {expandedRows[company._id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
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
                                                                    <div className="quota-progress-bar-mini-fill" style={{ width: `${Math.min(percentage, 100)}%`, background: barColor }} />
                                                                </div>
                                                                <div className="quota-percentage-label">{percentage}%</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#666', whiteSpace: 'nowrap' }}>{used}/{total}</div>
                                                                {isOverLimit && <AlertCircle size={16} style={{ color: '#f5576c', flexShrink: 0 }} />}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '1rem', color: (unassignedCounts[company._id] || 0) > 0 ? '#f5576c' : '#666' }}>
                                                            {unassignedCounts[company._id] || 0}
                                                        </span>
                                                        {(unassignedCounts[company._id] || 0) > 0 && <AlertCircle size={16} style={{ color: '#f5576c' }} />}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${company.isActive ? 'active' : 'inactive'}`}>
                                                        {company.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button className="btn-icon primary" title="Edit Company" onClick={() => openEditCompanyModal(company)}>
                                                            <Edit size={18} />
                                                        </button>
                                                        <button className="btn-icon success" title="Add Admin" onClick={() => openAdminModal(company)}>
                                                            <UserPlus size={18} />
                                                        </button>
                                                        <button className="btn-icon danger" title="Delete" onClick={() => handleDeleteCompany(company._id)}>
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedRows[company._id] && (
                                                <tr className="nested-row">
                                                    <td colSpan="8">
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
                                                                                <td>{admin.firstName || admin.lastName ? `${admin.firstName || ''} ${admin.lastName || ''}`.trim() : '-'}</td>
                                                                                <td>{admin.phone || '-'}</td>
                                                                                <td>
                                                                                    <span className={`status-badge ${admin.isActive ? 'active' : 'inactive'}`}>
                                                                                        {admin.isActive ? 'Active' : 'Inactive'}
                                                                                    </span>
                                                                                </td>
                                                                                <td>
                                                                                    <div className="action-buttons">
                                                                                        <button className="btn-icon primary" title="Reset Password" onClick={() => openResetPasswordModal(company, admin)}>
                                                                                            <Key size={16} />
                                                                                        </button>
                                                                                        <button className="btn-icon danger" title="Delete Admin" onClick={() => handleDeleteAdmin(company._id, admin._id)}>
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
                    <Input label="Company Name" name="name" value={formData.name} onChange={(e) => handleCompanyFieldChange('name', e.target.value)} required />
                    <Input label="Email" type="email" name="email" value={formData.email} onChange={(e) => handleCompanyFieldChange('email', e.target.value)} required />
                    <Input label="Phone" name="phone" value={formData.phone} onChange={(e) => handleCompanyFieldChange('phone', e.target.value)} />
                    <Input label="Industry" name="industry" value={formData.industry} onChange={(e) => handleCompanyFieldChange('industry', e.target.value)} />
                    <Input label="Website" name="website" value={formData.website} onChange={(e) => handleCompanyFieldChange('website', e.target.value)} />
                    <Input label="Passenger Quota" type="number" name="passengerQuota" value={formData.passengerQuota} onChange={(e) => handleCompanyFieldChange('passengerQuota', parseInt(e.target.value, 10) || 0)} min="0" required />
                    <Input label="Street Address" name="street" value={formData.address.street} onChange={(e) => handleCompanyAddressChange('street', e.target.value)} />
                    <Input label="City" name="city" value={formData.address.city} onChange={(e) => handleCompanyAddressChange('city', e.target.value)} />
                    <Input label="State / Province" name="state" value={formData.address.state} onChange={(e) => handleCompanyAddressChange('state', e.target.value)} />
                    <Input label="Zip / Postal Code" name="zipCode" value={formData.address.zipCode} onChange={(e) => handleCompanyAddressChange('zipCode', e.target.value)} />
                    <Input label="Country" name="country" value={formData.address.country} onChange={(e) => handleCompanyAddressChange('country', e.target.value)} />
                    <div className="input-group">
                        <label className="input-label" htmlFor="isActive">Status</label>
                        <select id="isActive" name="isActive" value={formData.isActive ? 'active' : 'inactive'} onChange={(e) => handleCompanyFieldChange('isActive', e.target.value === 'active')} className="input-field">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </form>
            </Modal>

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
                        <Button variant="primary" onClick={handleCreateAdmin}>Create Admin</Button>
                    </>
                }
            >
                <form onSubmit={handleCreateAdmin}>
                    <Input label="Username" name="username" value={adminFormData.username} onChange={(e) => setAdminFormData({ ...adminFormData, username: e.target.value })} required />
                    <Input label="Email" type="email" name="email" value={adminFormData.email} onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })} required />
                    <Input label="Password" type="password" name="password" value={adminFormData.password} onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })} required />
                    <Input label="First Name" name="firstName" value={adminFormData.firstName} onChange={(e) => setAdminFormData({ ...adminFormData, firstName: e.target.value })} />
                    <Input label="Last Name" name="lastName" value={adminFormData.lastName} onChange={(e) => setAdminFormData({ ...adminFormData, lastName: e.target.value })} />
                    <Input label="Phone" name="phone" value={adminFormData.phone} onChange={(e) => setAdminFormData({ ...adminFormData, phone: e.target.value })} />
                </form>
            </Modal>

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
                    <Input label="New Password" type="password" name="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength="6" placeholder="Enter new password (min 6 characters)" />
                    <div className="form-actions">
                        <Button type="button" variant="secondary" onClick={() => {
                            setShowResetPasswordModal(false);
                            setSelectedAdmin(null);
                            setSelectedCompany(null);
                            setNewPassword('');
                        }}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">Reset Password</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SuperAdminCompanies;