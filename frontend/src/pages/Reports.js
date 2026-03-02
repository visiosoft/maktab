import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsAPI, companiesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { Home, Building2, LogOut, FileText, Calendar, Download, Users } from 'lucide-react';
import './Reports.css';

const Reports = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [groups, setGroups] = useState([]);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    // Report 1: Maktab & Date filter
    const [selectedMaktab, setSelectedMaktab] = useState('A');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Report 2: Date only filter
    const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchGroups();
        fetchCompany();
    }, []);

    const fetchCompany = async () => {
        try {
            const response = await companiesAPI.getAll();
            setCompany(response.data);
        } catch (error) {
            console.error('Error fetching company:', error);
        }
    };

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const response = await groupsAPI.getAll();

            // Fetch passengers for each group
            const groupsWithPassengers = await Promise.all(
                response.data.map(async (group) => {
                    try {
                        const passengersResponse = await groupsAPI.getPassengers(group._id);
                        return { ...group, passengers: passengersResponse.data };
                    } catch (error) {
                        console.error(`Error fetching passengers for group ${group._id}:`, error);
                        return { ...group, passengers: [] };
                    }
                })
            );

            setGroups(groupsWithPassengers);
        } catch (error) {
            console.error('Error fetching groups:', error);
            alert('Failed to fetch groups data');
        } finally {
            setLoading(false);
        }
    };

    // Report 1: Filter by Maktab and Date
    const getMaktabReport = () => {
        return groups.filter(group => {
            const arrivalDate = group.arrivalDate ? new Date(group.arrivalDate).toISOString().split('T')[0] : null;
            return group.maktab === selectedMaktab && arrivalDate === selectedDate;
        });
    };

    // Report 2: Filter by Date only
    const getDateReport = () => {
        return groups.filter(group => {
            const arrivalDate = group.arrivalDate ? new Date(group.arrivalDate).toISOString().split('T')[0] : null;
            return arrivalDate === travelDate;
        });
    };

    const maktabReportGroups = getMaktabReport();
    const dateReportGroups = getDateReport();

    const getTotalPassengers = (groupsList) => {
        return groupsList.reduce((sum, group) => sum + (group.passengers?.length || 0), 0);
    };

    const printReport = (reportId) => {
        const printContent = document.getElementById(reportId);
        const winPrint = window.open('', '', 'left=0,top=0,width=800,height=600,toolbar=0,scrollbars=0,status=0');
        winPrint.document.write(`
      <html>
        <head>
          <title>Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; margin-bottom: 10px; }
            h2 { color: #666; font-size: 1.2rem; margin: 20px 0 10px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #667eea; color: white; }
            .summary { background: #f0f0f0; padding: 10px; margin-bottom: 20px; border-radius: 8px; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
        winPrint.document.close();
    };

    if (loading) {
        return (
            <div className="reports-page">
                <div className="dashboard-header">
                    <div className="dashboard-header-content">
                        <h1>Reports</h1>
                    </div>
                </div>
                <div className="page-content">
                    <div className="loading-state">Loading reports...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="reports-page">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-logo">
                        <div className="dashboard-logo-icon">
                            <FileText size={28} />
                        </div>
                        <div className="dashboard-logo-text">
                            <h1>{company?.name || 'Maktab'}</h1>
                            <p>Travel Reports & Analytics</p>
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
                <button className="nav-item" onClick={() => navigate('/groups')}>
                    <Users size={20} />
                    <span>Groups</span>
                </button>
                <button className="nav-item active" onClick={() => navigate('/reports')}>
                    <FileText size={20} />
                    <span>Reports</span>
                </button>
            </div>

            <div className="page-content">
                {/* Report 1: Maktab & Date Report */}
                <Card>
                    <div className="report-header">
                        <div>
                            <h2 className="report-title">Maktab Travel Report</h2>
                            <p className="report-subtitle">View passengers traveling to specific Maktab on selected date</p>
                        </div>
                        <Button
                            variant="secondary"
                            icon={<Download size={18} />}
                            onClick={() => printReport('maktab-report')}
                        >
                            Print Report
                        </Button>
                    </div>

                    <div className="report-filters">
                        <div className="filter-group">
                            <label>Maktab</label>
                            <select
                                value={selectedMaktab}
                                onChange={(e) => setSelectedMaktab(e.target.value)}
                                className="report-select"
                            >
                                <option value="A">Maktab A</option>
                                <option value="B">Maktab B</option>
                                <option value="C">Maktab C</option>
                                <option value="D">Maktab D</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Travel Date</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="report-input"
                            />
                        </div>
                    </div>

                    <div id="maktab-report" className="report-content">
                        <div className="report-print-header">
                            <h1>Maktab {selectedMaktab} Travel Report</h1>
                            <p>Date: {new Date(selectedDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</p>
                        </div>

                        <div className="summary">
                            <strong>Total Groups:</strong> {maktabReportGroups.length} |
                            <strong> Total Passengers:</strong> {getTotalPassengers(maktabReportGroups)}
                        </div>

                        {maktabReportGroups.length === 0 ? (
                            <div className="empty-report">
                                <FileText size={48} />
                                <p>No groups found for Maktab {selectedMaktab} on {new Date(selectedDate).toLocaleDateString()}</p>
                            </div>
                        ) : (
                            maktabReportGroups.map(group => (
                                <div key={group._id} className="report-group">
                                    <h2>{group.groupName}</h2>
                                    <div className="group-info">
                                        <p><strong>Hotel:</strong> {group.hotel?.name || 'Not Assigned'}</p>
                                        <p><strong>Flight:</strong> {group.arrivalFlightNo || 'N/A'} {group.arrivalAirport && `(${group.arrivalAirport})`}</p>
                                        <p><strong>PAX:</strong> {group.passengers?.length || 0} / {group.numberOfPax}</p>
                                    </div>

                                    <table className="passengers-report-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>First Name</th>
                                                <th>Last Name</th>
                                                <th>Passport No.</th>
                                                <th>Hotel</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.passengers && group.passengers.length > 0 ? (
                                                group.passengers.map((passenger, index) => (
                                                    <tr key={passenger._id}>
                                                        <td>{index + 1}</td>
                                                        <td>{passenger.firstName}</td>
                                                        <td>{passenger.lastName}</td>
                                                        <td>{passenger.passportNo}</td>
                                                        <td>{group.hotel?.name || 'Not Assigned'}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" style={{ textAlign: 'center', color: '#999' }}>
                                                        No passengers added yet
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Report 2: Date Report */}
                <Card style={{ marginTop: '2rem' }}>
                    <div className="report-header">
                        <div>
                            <h2 className="report-title">Daily Travel Report</h2>
                            <p className="report-subtitle">View all passengers traveling on selected date with hotel information</p>
                        </div>
                        <Button
                            variant="secondary"
                            icon={<Download size={18} />}
                            onClick={() => printReport('date-report')}
                        >
                            Print Report
                        </Button>
                    </div>

                    <div className="report-filters">
                        <div className="filter-group">
                            <label>Travel Date</label>
                            <input
                                type="date"
                                value={travelDate}
                                onChange={(e) => setTravelDate(e.target.value)}
                                className="report-input"
                            />
                        </div>
                    </div>

                    <div id="date-report" className="report-content">
                        <div className="report-print-header">
                            <h1>Daily Travel Report</h1>
                            <p>Date: {new Date(travelDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</p>
                        </div>

                        <div className="summary">
                            <strong>Total Groups:</strong> {dateReportGroups.length} |
                            <strong> Total Passengers:</strong> {getTotalPassengers(dateReportGroups)}
                        </div>

                        {dateReportGroups.length === 0 ? (
                            <div className="empty-report">
                                <Calendar size={48} />
                                <p>No groups traveling on {new Date(travelDate).toLocaleDateString()}</p>
                            </div>
                        ) : (
                            dateReportGroups.map(group => (
                                <div key={group._id} className="report-group">
                                    <h2>{group.groupName} <span className="maktab-tag">Maktab {group.maktab}</span></h2>
                                    <div className="group-info">
                                        <p><strong>Hotel:</strong> {group.hotel?.name || 'Not Assigned'}</p>
                                        <p><strong>Flight:</strong> {group.arrivalFlightNo || 'N/A'} {group.arrivalAirport && `(${group.arrivalAirport})`}</p>
                                        <p><strong>PAX:</strong> {group.passengers?.length || 0} / {group.numberOfPax}</p>
                                    </div>

                                    <table className="passengers-report-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>First Name</th>
                                                <th>Last Name</th>
                                                <th>Passport No.</th>
                                                <th>Hotel</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.passengers && group.passengers.length > 0 ? (
                                                group.passengers.map((passenger, index) => (
                                                    <tr key={passenger._id}>
                                                        <td>{index + 1}</td>
                                                        <td>{passenger.firstName}</td>
                                                        <td>{passenger.lastName}</td>
                                                        <td>{passenger.passportNo}</td>
                                                        <td>{group.hotel?.name || 'Not Assigned'}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" style={{ textAlign: 'center', color: '#999' }}>
                                                        No passengers added yet
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Reports;
