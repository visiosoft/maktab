import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FileText, Home, LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PassengersTable from '../components/PassengersTable';
import Button from '../components/Button';
import { superAdminAPI } from '../services/api';
import './Passengers.css';

const SuperAdminPassengers = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [passengers, setPassengers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [passengersResponse, groupsResponse] = await Promise.all([
                superAdminAPI.getPassengers(),
                superAdminAPI.getGroups()
            ]);

            setPassengers(passengersResponse.data);
            setGroups(groupsResponse.data);
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

    const filteredPassengers = selectedCompanyId === 'all'
        ? passengers
        : passengers.filter((passenger) => passenger.company?._id === selectedCompanyId);

    const filteredGroups = selectedCompanyId === 'all'
        ? groups
        : groups.filter((group) => group.company?._id === selectedCompanyId);

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
                <div className="dashboard-header-content">
                    <div className="dashboard-logo">
                        <div className="dashboard-logo-icon">
                            <UserCheck size={28} />
                        </div>
                        <div className="dashboard-logo-text">
                            <h1>Maktab</h1>
                            <p>All Company Passengers</p>
                        </div>
                    </div>
                    <div className="dashboard-user">
                        <div className="dashboard-user-info">
                            <p>Logged in as</p>
                            <h3>{user?.email}</h3>
                        </div>
                        <Button variant="danger" size="small" onClick={logout}>
                            <LogOut size={18} />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>

            <div className="dashboard-nav">
                <button className="nav-item" onClick={() => navigate('/super-admin/dashboard')}>
                    <Home size={20} />
                    <span>Dashboard</span>
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
                            ? `Review passenger records for ${selectedCompany.name}. ${filteredPassengers.length} passengers, ${unassignedCount} without a group.`
                            : `Review all passenger records created under your companies in one place. ${passengers.length} passengers across ${companyCount} compan${companyCount === 1 ? 'y' : 'ies'}, ${unassignedCount} without a group.`}
                    </p>
                    <div style={{ marginTop: '1rem', maxWidth: '320px' }}>
                        <select
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
                    title="All Passengers"
                    emptyTitle="No Passengers Found"
                    emptyDescription="Passenger records from all companies will appear here."
                />
            </div>
        </div>
    );
};

export default SuperAdminPassengers;