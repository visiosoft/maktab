import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupsAPI, passengersAPI, companiesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import PassengersTable from '../components/PassengersTable';
import { ArrowLeft, Users, Home, Building2, LogOut, FileText, UserCheck } from 'lucide-react';
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
            await passengersAPI.delete(passengerId);
            setPassengers(passengers.filter(p => p._id !== passengerId));
        } catch (error) {
            console.error('Error deleting passenger:', error);
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
                    <div className="dashboard-header-content">
                        <div className="dashboard-logo">
                            <div className="dashboard-logo-icon">
                                <Users size={28} />
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
                <div className="dashboard-header-content">
                    <div className="dashboard-logo">
                        <div className="dashboard-logo-icon">
                            <Users size={28} />
                        </div>
                        <div className="dashboard-logo-text">
                            <h1>Maktab</h1>
                            <p>Group Passengers</p>
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
                                {group?.hotel && ` • ${group.hotel.name}`}
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
                    />
                </Card>

                {unassignedPassengers.length > 0 && (
                    <Card style={{ marginTop: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3>Available Passengers (No Group Assigned)</h3>
                            <Button
                                variant="primary"
                                onClick={handleAssignPassengers}
                                disabled={selectedPassengers.length === 0 || assigning}
                            >
                                {assigning ? 'Assigning...' : `Assign ${selectedPassengers.length > 0 ? selectedPassengers.length : ''} to Group`}
                            </Button>
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
                                        <th>Created Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {unassignedPassengers.map((passenger, index) => (
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
                )}
            </div>
        </div>
    );
};

export default GroupPassengers;
