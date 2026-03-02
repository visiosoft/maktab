import React, { useState, useEffect } from 'react';
import { passengersAPI, groupsAPI } from '../services/api';
import PassengersTable from '../components/PassengersTable';
import './Passengers.css';

const Passengers = () => {
    const [passengers, setPassengers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPassengers();
        fetchGroups();
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
            <div className="passengers-header">
                <h1>Passenger Management</h1>
                <p>Manage all your passengers in one place</p>
            </div>

            <PassengersTable
                passengers={passengers}
                groups={groups}
                onAdd={handleAddPassenger}
                onUpdate={handleUpdatePassenger}
                onDelete={handleDeletePassenger}
                onImport={handleImportPassengers}
            />
        </div>
    );
};

export default Passengers;
