import React, { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Save,
    X,
    Edit2,
    Trash2,
    Users,
    Loader,
    Search,
    Upload,
    Download
} from 'lucide-react';
import Button from './Button';
import './PassengersTable.css';

const PassengersTable = ({ passengers, groups = [], onAdd, onUpdate, onDelete, onImport, loading, deleteLabel = 'delete' }) => {
    const [editingId, setEditingId] = useState(null);
    const [newRow, setNewRow] = useState(null);
    const [editData, setEditData] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [groupFilter, setGroupFilter] = useState('');
    const [filteredPassengers, setFilteredPassengers] = useState(passengers);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        let filtered = passengers;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.passportNo.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by group
        if (groupFilter) {
            if (groupFilter === 'no-group') {
                filtered = filtered.filter(p => !p.group);
            } else {
                filtered = filtered.filter(p => p.group?._id === groupFilter);
            }
        }

        setFilteredPassengers(filtered);
    }, [searchTerm, groupFilter, passengers]);

    const handleAddNew = () => {
        if (newRow || editingId) return;

        setNewRow({
            firstName: '',
            lastName: '',
            passportNo: '',
            group: ''
        });
    };

    const handleNewRowChange = (field, value) => {
        setNewRow({
            ...newRow,
            [field]: value
        });
    };

    const handleSaveNew = async () => {
        if (!newRow.firstName || !newRow.lastName || !newRow.passportNo) {
            alert('First Name, Last Name, and Passport Number are required');
            return;
        }

        try {
            await onAdd(newRow);
            setNewRow(null);
        } catch (error) {
            console.error('Error saving new passenger:', error);
            // Error is already shown by parent component
            // Keep the row open so user can edit and try again
        }
    };

    const handleCancelNew = () => {
        setNewRow(null);
    };

    const handleEdit = (passenger) => {
        if (newRow) return;

        setEditingId(passenger._id);
        setEditData({
            firstName: passenger.firstName,
            lastName: passenger.lastName,
            passportNo: passenger.passportNo,
            group: passenger.group?._id || ''
        });
    };

    const handleEditChange = (field, value) => {
        setEditData({
            ...editData,
            [field]: value
        });
    };

    const handleSaveEdit = async (id) => {
        if (!editData.firstName || !editData.lastName || !editData.passportNo) {
            alert('First Name, Last Name, and Passport Number are required');
            return;
        }

        try {
            await onUpdate(id, editData);
            setEditingId(null);
            setEditData({});
        } catch (error) {
            console.error('Error updating passenger:', error);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.name.endsWith('.csv')) {
            alert('Please select a CSV file');
            return;
        }

        setImporting(true);
        try {
            const result = await onImport(file);
            alert(`Successfully imported ${result.success} passengers. ${result.failed > 0 ? `Failed: ${result.failed}` : ''}`);
        } catch (error) {
            console.error('Import error:', error);
            alert(error.message || 'Failed to import CSV file');
        } finally {
            setImporting(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDownloadSample = () => {
        // Create sample CSV content
        const sampleCSV = `firstName,lastName,passportNo,groupName
Ahmad,Ahmed,A1234567,Group A
Fatima,Hassan,B2345678,Group B
Mohammed,Ali,C3456789,
Sarah,Khan,D4567890,Group A
Omar,Ibrahim,E5678901,`;

        // Create blob and download
        const blob = new Blob([sampleCSV], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'sample-passenger-import.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const handleDelete = async (id) => {
        if (window.confirm(`Are you sure you want to ${deleteLabel} this passenger?`)) {
            try {
                await onDelete(id);
            } catch (error) {
                console.error(`Error ${deleteLabel.replace(' ', '-')}ing passenger:`, error);
            }
        }
    };

    if (loading) {
        return (
            <div className="passengers-table-container">
                <div className="loading-spinner">
                    <Loader size={40} />
                </div>
            </div>
        );
    }

    return (
        <div className="passengers-table-container">
            <div className="table-header">
                <h3 className="table-title">
                    <Users size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                    Passenger List
                </h3>
                <div className="table-actions">
                    <div className="search-box">
                        <Search className="search-icon" size={16} />
                        <input
                            type="text"
                            placeholder="Search passengers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="group-filter"
                        value={groupFilter}
                        onChange={(e) => setGroupFilter(e.target.value)}
                    >
                        <option value="">All Groups</option>
                        <option value="no-group">No Group</option>
                        {groups.map(group => (
                            <option key={group._id} value={group._id}>
                                {group.groupName}
                            </option>
                        ))}
                    </select>
                    <Button
                        variant="primary"
                        icon={<Plus size={18} />}
                        onClick={handleAddNew}
                        disabled={!!newRow || !!editingId}
                    >
                        Add Passenger
                    </Button>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
                        <Button
                            variant="secondary"
                            icon={importing ? <Loader size={18} className="spin" /> : <Upload size={18} />}
                            onClick={handleImportClick}
                            disabled={importing || !!newRow || !!editingId}
                        >
                            {importing ? 'Importing...' : 'Import CSV'}
                        </Button>
                        <button
                            onClick={handleDownloadSample}
                            className="sample-download-link"
                            type="button"
                        >
                            <Download size={12} />
                            Download Sample CSV
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>

            <div className="passengers-table-wrapper">
                <table className="passengers-table">
                    <thead>
                        <tr>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Passport No.</th>
                            <th>Group</th>
                            <th>Date Created</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* New Row */}
                        {newRow && (
                            <tr className="new-row">
                                <td>
                                    <input
                                        type="text"
                                        className="table-cell-input"
                                        value={newRow.firstName}
                                        onChange={(e) => handleNewRowChange('firstName', e.target.value)}
                                        placeholder="First Name *"
                                        autoFocus
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        className="table-cell-input"
                                        value={newRow.lastName}
                                        onChange={(e) => handleNewRowChange('lastName', e.target.value)}
                                        placeholder="Last Name *"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        className="table-cell-input"
                                        value={newRow.passportNo}
                                        onChange={(e) => handleNewRowChange('passportNo', e.target.value)}
                                        placeholder="Passport No. *"
                                    />
                                </td>
                                <td>
                                    <select
                                        className="table-cell-input"
                                        value={newRow.group}
                                        onChange={(e) => handleNewRowChange('group', e.target.value)}
                                    >
                                        <option value="">No Group</option>
                                        {groups.map(group => (
                                            <option key={group._id} value={group._id}>
                                                {group.groupName}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <span className="text-muted">-</span>
                                </td>
                                <td>
                                    <div className="row-actions">
                                        <button
                                            className="action-icon-button save"
                                            onClick={handleSaveNew}
                                            title="Save"
                                        >
                                            <Save size={18} />
                                        </button>
                                        <button
                                            className="action-icon-button cancel"
                                            onClick={handleCancelNew}
                                            title="Cancel"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {/* Existing Rows */}
                        {filteredPassengers.length === 0 && !newRow ? (
                            <tr>
                                <td colSpan="6">
                                    <div className="empty-state">
                                        <Users size={48} />
                                        <h3>No passengers yet</h3>
                                        <p>Click "Add Passenger" to add your first passenger</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredPassengers.map((passenger) => {
                                const isEditing = editingId === passenger._id;

                                return (
                                    <tr key={passenger._id} className={isEditing ? 'editing-row' : ''}>
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    className="table-cell-input"
                                                    value={editData.firstName}
                                                    onChange={(e) => handleEditChange('firstName', e.target.value)}
                                                    autoFocus
                                                />
                                            ) : (
                                                <div className="table-cell-display" onClick={() => handleEdit(passenger)}>
                                                    {passenger.firstName}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    className="table-cell-input"
                                                    value={editData.lastName}
                                                    onChange={(e) => handleEditChange('lastName', e.target.value)}
                                                />
                                            ) : (
                                                <div className="table-cell-display" onClick={() => handleEdit(passenger)}>
                                                    {passenger.lastName}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    className="table-cell-input"
                                                    value={editData.passportNo}
                                                    onChange={(e) => handleEditChange('passportNo', e.target.value)}
                                                />
                                            ) : (
                                                <div className="table-cell-display" onClick={() => handleEdit(passenger)}>
                                                    {passenger.passportNo}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <select
                                                    className="table-cell-input"
                                                    value={editData.group}
                                                    onChange={(e) => handleEditChange('group', e.target.value)}
                                                >
                                                    <option value="">No Group</option>
                                                    {groups.map(group => (
                                                        <option key={group._id} value={group._id}>
                                                            {group.groupName}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="table-cell-display">
                                                    {passenger.group ? (
                                                        <span className="group-badge">{passenger.group.groupName}</span>
                                                    ) : (
                                                        <span className="text-muted">No Group</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="table-cell-display">
                                                {new Date(passenger.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="row-actions">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            className="action-icon-button save"
                                                            onClick={() => handleSaveEdit(passenger._id)}
                                                            title="Save"
                                                        >
                                                            <Save size={18} />
                                                        </button>
                                                        <button
                                                            className="action-icon-button cancel"
                                                            onClick={handleCancelEdit}
                                                            title="Cancel"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="action-icon-button edit"
                                                            onClick={() => handleEdit(passenger)}
                                                            title="Edit"
                                                            disabled={!!newRow}
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            className="action-icon-button delete"
                                                            onClick={() => handleDelete(passenger._id)}
                                                            title={deleteLabel.charAt(0).toUpperCase() + deleteLabel.slice(1)}
                                                            disabled={!!newRow || !!editingId}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {filteredPassengers.length > 0 && (
                <div className="table-info">
                    <span>
                        Showing {filteredPassengers.length} of {passengers.length} passenger{passengers.length !== 1 ? 's' : ''}
                    </span>
                    {searchTerm && (
                        <span>
                            Filtered by: "{searchTerm}"
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default PassengersTable;
