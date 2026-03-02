import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { passengersAPI, groupsAPI, companiesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import PassengersTable from '../components/PassengersTable';
import { Home, Building2, Users, LogOut, FileText, UserCheck } from 'lucide-react';
import './Passengers.css';

const Passengers = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [passengers, setPassengers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPassengers();
        fetchGroups();
        fetchCompany();
    }, []);

    const fetchPassengers = async () => {
        setLoading(true);
        try {
            const response = await passengersAPI.getAll();
            setPassengers(response.data);
        } catch (error) {
            console.error('Error fetching passengers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const response = await groupsAPI.getAll();
            setGroups(response.data);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const fetchCompany = async () => {
        try {
            const response = await companiesAPI.getAll();
            setCompany(response.data);
        } catch (error) {
            console.error('Error fetching company:', error);
        }
    };

    const handleAddPassenger = async (passengerData) => {
        try {
            await passengersAPI.create(passengerData);
            fetchPassengers();
        } catch (error) {
            console.error('Error adding passenger:', error);
            const errorMessage = error.response?.data?.message || 'Failed to add passenger';
            alert(errorMessage);
            throw error;
        }
    };

    const handleUpdatePassenger = async (id, passengerData) => {
        try {
            await passengersAPI.update(id, passengerData);
            fetchPassengers();
        } catch (error) {
            console.error('Error updating passenger:', error);
            alert(error.response?.data?.message || 'Failed to update passenger');
            throw error;
        }
    };

    const handleDeletePassenger = async (id) => {
        try {
            await passengersAPI.delete(id);
            fetchPassengers();
        } catch (error) {
            console.error('Error deleting passenger:', error);
            alert('Failed to delete passenger');
            throw error;
        }
    };

    const handleImportPassengers = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await passengersAPI.bulkImport(formData);

            if (response.data.errors && response.data.errors.length > 0) {
                const quotaErrors = response.data.errors.filter(err =>
                    err.message.includes('Quota limit reached')
                );

                if (quotaErrors.length > 0) {
                    alert(`Import completed with quota limit reached.\nCreated: ${response.data.created}\nFailed: ${response.data.failed}`);
                } else {
                    alert(`Import completed.\nCreated: ${response.data.created}\nFailed: ${response.data.failed}`);
                }
            } else {
                alert(`Successfully imported ${response.data.created} passengers`);
            }

            fetchPassengers();
        } catch (error) {
            console.error('Error importing passengers:', error);
            const errorMessage = error.response?.data?.message || 'Failed to import passengers';
            alert(errorMessage);
            throw error;
        }
    };

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
                            <h1>{company?.name || 'Maktab'}</h1>
                            <p>Passenger Management</p>
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
                <button className="nav-item active" onClick={() => navigate('/passengers')}>
                    <UserCheck size={20} />
                    <span>Passengers</span>
                </button>
                <button className="nav-item" onClick={() => navigate('/groups')}>
                    <Users size={20} />
                    <span>Groups</span>
                </button>
                <button className="nav-item" onClick={() => navigate('/reports')}>
                    <FileText size={20} />
                    <span>Reports</span>
                </button>
            </div>

            <div className="page-content">
                <PassengersTable
                    passengers={passengers}
                    groups={groups}
                    onAdd={handleAddPassenger}
                    onUpdate={handleUpdatePassenger}
                    onDelete={handleDeletePassenger}
                    onImport={handleImportPassengers}
                />
            </div>
        </div>
    );
};

export default Passengers;
