import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FileText, Home, LogOut, UserCheck, Bell, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PassengersTable from '../components/PassengersTable';
import Button from '../components/Button';
import { superAdminAPI } from '../services/api';
import './Passengers.css';

const SuperAdminPassengers = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [passengers, setPassengers] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const passengersResponse = await superAdminAPI.getPassengers();

            setPassengers(passengersResponse.data);
        } catch (error) {
            console.error('Error fetching super admin passengers:', error);
        } finally {
            setLoading(false);
        }
    };

    const companies = Array.from(
        passengers.reduce((companyMap, passenger) => {
            if (passenger.company?._id) {
                companyMap.set(passenger.company._id, passenger.company);
            }

            return companyMap;
        }, new Map())
    )
        .map(([, company]) => company)
        .sort((left, right) => left.name.localeCompare(right.name));

    useEffect(() => {
        if (selectedCompanyId !== 'all' && !companies.some((company) => company._id === selectedCompanyId)) {
            setSelectedCompanyId('all');
        }
    }, [companies, selectedCompanyId]);

    const filteredPassengers = selectedCompanyId === 'all'
        ? passengers
        : passengers.filter((passenger) => passenger.company?._id === selectedCompanyId);

    const filteredGroups = Array.from(
        filteredPassengers.reduce((groupMap, passenger) => {
            if (passenger.group?._id) {
                groupMap.set(passenger.group._id, passenger.group);
            }

            return groupMap;
        }, new Map()).values()
    ).sort((left, right) => (left.groupName || '').localeCompare(right.groupName || ''));

    const companyCount = companies.length;
    const unassignedCount = filteredPassengers.filter((passenger) => !passenger.group).length;
    const selectedCompany = selectedCompanyId === 'all'
        ? null
        : companies.find((company) => company._id === selectedCompanyId);

    if (loading) {
        return (
            <div className="passengers-page">
                <div className="loading">Loading passengers...</div>
            </div>
        );
    }

    return (
        <div className="passengers-page">
            <div className="dashboard-header">
                <div className="dashboard-header-content flex-between">
                    <div className="dashboard-logo">
                        <div className="dashboard-logo-icon">
                            <UserCheck size={24} />
                        </div>
                        <div className="dashboard-logo-text">
                            <h1>Maktab</h1>
                            <p>All Company Passengers</p>
                        </div>
                    </div>
                    <div className="dashboard-header-tools">
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
                <button className="nav-item" onClick={() => navigate('/super-admin/companies')}>
                    <Building2 size={20} />
                    <span>Companies</span>
                </button>
                <button className="nav-item active" onClick={() => navigate('/super-admin/passengers')}>
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

            <div className="page-content">
                <div className="passengers-header">
                    <h1>Passengers Across Companies</h1>
                    <p>
                        {selectedCompany
                            ? `Showing ${filteredPassengers.length} passengers from ${selectedCompany.name}. ${unassignedCount} without a group.`
                            : `Showing ${passengers.length} passengers across ${companyCount} compan${companyCount === 1 ? 'y' : 'ies'}. ${unassignedCount} without a group.`}
                    </p>
                    <div style={{ marginTop: '1rem', maxWidth: '320px' }}>
                        <label htmlFor="super-admin-company-filter" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Company</label>
                        <select
                            id="super-admin-company-filter"
                            className="table-cell-input"
                            value={selectedCompanyId}
                            onChange={(event) => setSelectedCompanyId(event.target.value)}
                            aria-label="Filter passengers by company"
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

                <PassengersTable
                    passengers={filteredPassengers}
                    groups={filteredGroups}
                    loading={loading}
                    readOnly
                    showCompanyColumn
                    showSearch
                    showGroupFilter={false}
                    title="All Passengers"
                    emptyTitle="No Passengers Found"
                    emptyDescription="Passenger records from all companies will appear here."
                />
            </div>
        </div>
    );
};

export default SuperAdminPassengers;