import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupsAPI, passengersAPI, companiesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import PassengersTable from '../components/PassengersTable';
import { ArrowLeft, Users, Home, Building2, LogOut, FileText, UserCheck, Bell, Search, X } from 'lucide-react';
import { SAUDI_AIRPORTS } from '../constants/airports';
import './GroupPassengers.css';

const GroupPassengers = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [group, setGroup] = useState(null);
    const [passengers, setPassengers] = useState([]);
    const [unassignedPassengers, setUnassignedPassengers] = useState([]);
    const [selectedPassengers, setSelectedPassengers] = useState([]);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [unassignedSearch, setUnassignedSearch] = useState('');
    const [unassignedSearchField, setUnassignedSearchField] = useState('all');

    const getAirportCity = (code) => {
        const airport = SAUDI_AIRPORTS.find(a => a.code === code);
        return airport ? airport.city : code;
    };

    useEffect(() => {
        fetchGroupData();
        fetchCompany();
        fetchUnassignedPassengers();
    }, [id]);

    const fetchCompany = async () => {
        try {
            const response = await companiesAPI.getAll();
            setCompany(response.data);
        } catch (error) {
            console.error('Error fetching company:', error);
        }
    };

    const fetchGroupData = async () => {
        try {
            setLoading(true);
            const [groupRes, passengersRes] = await Promise.all([
                groupsAPI.getById(id),
                groupsAPI.getPassengers(id)
            ]);
            setGroup(groupRes.data);
            setPassengers(passengersRes.data);
        } catch (error) {
            console.error('Error fetching group data:', error);
            alert('Failed to fetch group data');
        } finally {
            setLoading(false);
        }
    };

    const fetchUnassignedPassengers = async () => {
        try {
            const response = await passengersAPI.getUnassigned();
            setUnassignedPassengers(response.data);
        } catch (error) {
            console.error('Error fetching unassigned passengers:', error);
        }
    };

    const handleAddPassenger = async (passengerData) => {
        try {
            const response = await passengersAPI.create({
                ...passengerData,
                group: id
            });
            setPassengers([...passengers, response.data.passenger]);
        } catch (error) {
            console.error('Error adding passenger:', error);
            const errorMessage = error.response?.data?.message || 'Failed to add passenger';
            alert(errorMessage);
            throw error;
        }
    };

    const handleUpdatePassenger = async (passengerId, passengerData) => {
        try {
            const response = await passengersAPI.update(passengerId, passengerData);
            setPassengers(passengers.map(p =>
                p._id === passengerId ? response.data.passenger : p
            ));
        } catch (error) {
            console.error('Error updating passenger:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update passenger';
            alert(errorMessage);
            throw error;
        }
    };

    const handleDeletePassenger = async (passengerId) => {
        try {
            // Instead of deleting, unassign the passenger from the group
            await passengersAPI.update(passengerId, { group: null });
            setPassengers(passengers.filter(p => p._id !== passengerId));
            // Refresh unassigned passengers to show the newly unassigned passenger
            await fetchUnassignedPassengers();
        } catch (error) {
            console.error('Error unassigning passenger:', error);
            throw error;
        }
    };

    const handleSelectPassenger = (passengerId) => {
        setSelectedPassengers(prev =>
            prev.includes(passengerId)
                ? prev.filter(id => id !== passengerId)
                : [...prev, passengerId]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedPassengers(unassignedPassengers.map(p => p._id));
        } else {
            setSelectedPassengers([]);
        }
    };

    const handleAssignPassengers = async () => {
        if (selectedPassengers.length === 0) {
            alert('Please select at least one passenger');
            return;
        }

        try {
            setAssigning(true);
            await groupsAPI.assignPassengers({
                passengerIds: selectedPassengers,
                groupId: id
            });

            // Refresh data
            await Promise.all([
                fetchGroupData(),
                fetchUnassignedPassengers()
            ]);

            setSelectedPassengers([]);
            alert(`${selectedPassengers.length} passenger(s) assigned to group successfully!`);
        } catch (error) {
            console.error('Error assigning passengers:', error);
            alert(error.response?.data?.message || 'Failed to assign passengers');
        } finally {
            setAssigning(false);
        }
    };

    if (loading) {
        return (
            <div className="group-passengers-page">
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
        <div className="group-passengers-page">
            <div className="dashboard-header">
                <div className="dashboard-header-content flex-between">
                    <div className="dashboard-logo">
                        <div className="dashboard-logo-icon">
                            <Users size={24} />
                        </div>
                        <div className="dashboard-logo-text">
                            <h1>Maktab</h1>
                            <p>Group Passengers</p>
                        </div>
                    </div>
                    <div className="dashboard-header-tools">
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
                    <Button variant="secondary" onClick={() => navigate('/groups')}>
                        <ArrowLeft size={18} />
                        Back to Groups
                    </Button>
                </div>

                <Card className="group-info-card">
                    <div className="group-info-header">
                        <Users size={28} />
                        <div>
                            <h2>{group?.groupName}</h2>
                            <p className="group-meta">
                                {passengers.length} / {group?.numberOfPax || 0} passengers
                                {group?.maktab && ` • Maktab ${group.maktab}`}
                                {(group?.arrivalHotel || group?.hotel) && ` • Arrival: ${(group?.arrivalHotel || group?.hotel).name}`}
                                {(group?.departureHotel || group?.hotel) && ` • Departure: ${(group?.departureHotel || group?.hotel).name}`}
                            </p>
                        </div>
                    </div>
                    {group?.arrivalDate && (
                        <div className="travel-info">
                            <div className="travel-detail">
                                <strong>Arrival:</strong> {new Date(group.arrivalDate).toLocaleDateString()}
                                {group.arrivalFlightNo && ` - ${group.arrivalFlightNo}`}
                                {group.arrivalAirport && ` (${getAirportCity(group.arrivalAirport)})`}
                            </div>
                            {group.departureDate && (
                                <div className="travel-detail">
                                    <strong>Departure:</strong> {new Date(group.departureDate).toLocaleDateString()}
                                    {group.departureFlightNo && ` - ${group.departureFlightNo}`}
                                    {group.departureAirport && ` (${getAirportCity(group.departureAirport)})`}
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                <Card>
                    <h3>Passengers in This Group</h3>
                    <PassengersTable
                        passengers={passengers}
                        onAdd={handleAddPassenger}
                        onUpdate={handleUpdatePassenger}
                        onDelete={handleDeletePassenger}
                        deleteLabel="remove from group"
                    />
                </Card>

                {unassignedPassengers.length > 0 && (() => {
                    const normalizedSearch = unassignedSearch.toLowerCase();
                    const displayedUnassigned = unassignedSearch
                        ? unassignedPassengers.filter(p => {
                            switch (unassignedSearchField) {
                                case 'name':
                                    return (
                                        p.firstName?.toLowerCase().includes(normalizedSearch) ||
                                        p.lastName?.toLowerCase().includes(normalizedSearch) ||
                                        `${p.firstName} ${p.lastName}`.toLowerCase().includes(normalizedSearch)
                                    );
                                case 'passportNo':
                                    return p.passportNo?.toLowerCase().includes(normalizedSearch);
                                case 'visaNo':
                                    return p.visaNumber?.toLowerCase().includes(normalizedSearch);
                                case 'mofaNo':
                                    return p.mofaApplicationNo?.toLowerCase().includes(normalizedSearch);
                                default:
                                    return (
                                        p.firstName?.toLowerCase().includes(normalizedSearch) ||
                                        p.lastName?.toLowerCase().includes(normalizedSearch) ||
                                        `${p.firstName} ${p.lastName}`.toLowerCase().includes(normalizedSearch) ||
                                        p.passportNo?.toLowerCase().includes(normalizedSearch) ||
                                        p.visaNumber?.toLowerCase().includes(normalizedSearch) ||
                                        p.mofaApplicationNo?.toLowerCase().includes(normalizedSearch)
                                    );
                            }
                        })
                        : unassignedPassengers;

                    return (
                        <Card style={{ marginTop: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <h3 style={{ margin: 0 }}>Available Passengers (No Group Assigned)</h3>
                                <Button
                                    variant="primary"
                                    onClick={handleAssignPassengers}
                                    disabled={selectedPassengers.length === 0 || assigning}
                                >
                                    {assigning ? 'Assigning...' : `Assign ${selectedPassengers.length > 0 ? selectedPassengers.length : ''} to Group`}
                                </Button>
                            </div>
                            <div className="quick-search-wrapper" style={{ marginBottom: '1rem', maxWidth: '480px' }}>
                                <select
                                    className="search-field-select"
                                    value={unassignedSearchField}
                                    onChange={(e) => { setUnassignedSearchField(e.target.value); setUnassignedSearch(''); }}
                                >
                                    <option value="all">All Fields</option>
                                    <option value="name">Name</option>
                                    <option value="passportNo">Passport No.</option>
                                    <option value="visaNo">Visa No.</option>
                                    <option value="mofaNo">MOFA No.</option>
                                </select>
                                <div className="search-box">
                                    <Search className="search-icon" size={16} />
                                    <input
                                        type="text"
                                        placeholder={
                                            unassignedSearchField === 'all' ? 'Quick search available passengers...' :
                                                unassignedSearchField === 'name' ? 'Search by name...' :
                                                    unassignedSearchField === 'passportNo' ? 'Search by passport no...' :
                                                        unassignedSearchField === 'visaNo' ? 'Search by visa no...' :
                                                            'Search by MOFA no...'
                                        }
                                        value={unassignedSearch}
                                        onChange={(e) => setUnassignedSearch(e.target.value)}
                                    />
                                    {unassignedSearch && (
                                        <button
                                            className="search-clear-btn"
                                            onClick={() => setUnassignedSearch('')}
                                            title="Clear search"
                                            type="button"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="unassigned-passengers-table">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '50px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPassengers.length === unassignedPassengers.length && unassignedPassengers.length > 0}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th>#</th>
                                            <th>First Name</th>
                                            <th>Last Name</th>
                                            <th>Passport No.</th>
                                            <th>Visa No.</th>
                                            <th>MOFA No.</th>
                                            <th>Created Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayedUnassigned.length === 0 ? (
                                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem', color: '#888' }}>No passengers match your search.</td></tr>
                                        ) : displayedUnassigned.map((passenger, index) => (
                                            <tr key={passenger._id}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPassengers.includes(passenger._id)}
                                                        onChange={() => handleSelectPassenger(passenger._id)}
                                                    />
                                                </td>
                                                <td>{index + 1}</td>
                                                <td>{passenger.firstName}</td>
                                                <td>{passenger.lastName}</td>
                                                <td>{passenger.passportNo}</td>
                                                <td>{passenger.visaNumber || '—'}</td>
                                                <td>{passenger.mofaApplicationNo || '—'}</td>
                                                <td>{new Date(passenger.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.875rem' }}>
                                Select passengers from the list above and click "Assign to Group" to add them to {group?.groupName}.
                            </p>
                        </Card>
                    );
                })()}
            </div>
        </div>
    );
};

export default GroupPassengers;
