import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupsAPI, passengersAPI, companiesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import PassengersTable from '../components/PassengersTable';
import { ArrowLeft, Users, Home, Building2, LogOut, FileText } from 'lucide-react';
import { SAUDI_AIRPORTS } from '../constants/airports';
import './GroupPassengers.css';

const GroupPassengers = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [group, setGroup] = useState(null);
    const [passengers, setPassengers] = useState([]);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    const getAirportCity = (code) => {
        const airport = SAUDI_AIRPORTS.find(a => a.code === code);
        return airport ? airport.city : code;
    };

    useEffect(() => {
        fetchGroupData();
        fetchCompany();
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
                <button className="nav-item" onClick={() => navigate('/hotels')}>
                    <Building2 size={20} />
                    <span>Hotels</span>
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
                    <h3>Passengers</h3>
                    <PassengersTable
                        passengers={passengers}
                        onAdd={handleAddPassenger}
                        onUpdate={handleUpdatePassenger}
                        onDelete={handleDeletePassenger}
                    />
                </Card>
            </div>
        </div>
    );
};

export default GroupPassengers;
