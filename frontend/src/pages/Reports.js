import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsAPI, companiesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { Home, Building2, LogOut, FileText, Calendar, Download, Users, UserCheck } from 'lucide-react';
import './Reports.css';

const Reports = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [groups, setGroups] = useState([]);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    // Report 1: Maktab & Date filter
    const [selectedMaktab, setSelectedMaktab] = useState('All');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Report 2: Arrival Date filter
    const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);

    // Report 3: Departure Date filter
    const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);

    // Report 4: Hotel Arrivals by Date
    const [hotelArrivalDate, setHotelArrivalDate] = useState(new Date().toISOString().split('T')[0]);

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

    // Report 1: Filter by Maktab and Date, group by Maktab + Flight + Hotel
    const getMaktabReport = () => {
        const filteredGroups = groups.filter(group => {
            const arrivalDate = group.arrivalDate ? new Date(group.arrivalDate).toISOString().split('T')[0] : null;
            const matchesMaktab = selectedMaktab === 'All' || group.maktab === selectedMaktab;
            return matchesMaktab && arrivalDate === selectedDate;
        });

        // Group by Maktab + Flight Number + Hotel
        const groupedData = {};
        filteredGroups.forEach(group => {
            const hotelId = (group.arrivalHotel || group.hotel)?._id || 'no-hotel';
            const key = `${group.maktab}-${group.arrivalFlightNo || 'N/A'}-${hotelId}`;
            if (!groupedData[key]) {
                groupedData[key] = {
                    maktab: group.maktab,
                    arrivalFlightNo: group.arrivalFlightNo,
                    arrivalAirport: group.arrivalAirport,
                    arrivalCity: group.arrivalCity,
                    hotel: group.arrivalHotel || group.hotel,
                    passengers: [],
                    groups: []
                };
            }
            groupedData[key].passengers.push(...(group.passengers || []));
            groupedData[key].groups.push(group);
        });

        return Object.values(groupedData).sort((a, b) => {
            if (a.maktab !== b.maktab) return a.maktab.localeCompare(b.maktab);
            if ((a.arrivalFlightNo || '') !== (b.arrivalFlightNo || '')) {
                return (a.arrivalFlightNo || '').localeCompare(b.arrivalFlightNo || '');
            }
            return (a.hotel?.name || '').localeCompare(b.hotel?.name || '');
        });
    };

    // Report 2: Filter by Date only, group by Maktab + Flight + Hotel
    const getDateReport = () => {
        const filteredGroups = groups.filter(group => {
            const arrivalDate = group.arrivalDate ? new Date(group.arrivalDate).toISOString().split('T')[0] : null;
            return arrivalDate === travelDate;
        });

        // Group by Maktab + Flight Number + Hotel
        const groupedData = {};
        filteredGroups.forEach(group => {
            const hotelId = (group.arrivalHotel || group.hotel)?._id || 'no-hotel';
            const key = `${group.maktab}-${group.arrivalFlightNo || 'N/A'}-${hotelId}`;
            if (!groupedData[key]) {
                groupedData[key] = {
                    maktab: group.maktab,
                    arrivalFlightNo: group.arrivalFlightNo,
                    arrivalAirport: group.arrivalAirport,
                    arrivalCity: group.arrivalCity,
                    hotel: group.arrivalHotel || group.hotel,
                    passengers: [],
                    groups: []
                };
            }
            groupedData[key].passengers.push(...(group.passengers || []));
            groupedData[key].groups.push(group);
        });

        return Object.values(groupedData).sort((a, b) => {
            if (a.maktab !== b.maktab) return a.maktab.localeCompare(b.maktab);
            if ((a.arrivalFlightNo || '') !== (b.arrivalFlightNo || '')) {
                return (a.arrivalFlightNo || '').localeCompare(b.arrivalFlightNo || '');
            }
            return (a.hotel?.name || '').localeCompare(b.hotel?.name || '');
        });
    };

    // Report 3: Departure Date Report
    const getDepartureReport = () => {
        const filteredGroups = groups.filter(group => {
            const deptDate = group.departureDate ? new Date(group.departureDate).toISOString().split('T')[0] : null;
            return deptDate === departureDate;
        });

        // Group by Maktab + Flight Number + Hotel
        const groupedData = {};
        filteredGroups.forEach(group => {
            const hotelId = (group.departureHotel || group.hotel)?._id || 'no-hotel';
            const key = `${group.maktab}-${group.departureFlightNo || 'N/A'}-${hotelId}`;
            if (!groupedData[key]) {
                groupedData[key] = {
                    maktab: group.maktab,
                    departureFlightNo: group.departureFlightNo,
                    departureAirport: group.departureAirport,
                    departureCity: group.departureCity,
                    hotel: group.departureHotel || group.hotel,
                    passengers: [],
                    groups: []
                };
            }
            groupedData[key].passengers.push(...(group.passengers || []));
            groupedData[key].groups.push(group);
        });

        return Object.values(groupedData).sort((a, b) => {
            if (a.maktab !== b.maktab) return a.maktab.localeCompare(b.maktab);
            if ((a.departureFlightNo || '') !== (b.departureFlightNo || '')) {
                return (a.departureFlightNo || '').localeCompare(b.departureFlightNo || '');
            }
            return (a.hotel?.name || '').localeCompare(b.hotel?.name || '');
        });
    };

    // Report 4: Hotel Arrivals by Date
    const getHotelArrivalsReport = () => {
        const filteredGroups = groups.filter(group => {
            const arrivalDate = group.arrivalDate ? new Date(group.arrivalDate).toISOString().split('T')[0] : null;
            return arrivalDate === hotelArrivalDate && (group.arrivalHotel || group.hotel);
        });

        // Group by hotel
        const hotelMap = {};
        filteredGroups.forEach(group => {
            const hotel = group.arrivalHotel || group.hotel;
            const hotelId = hotel._id;
            const hotelName = hotel.name;

            if (!hotelMap[hotelId]) {
                hotelMap[hotelId] = {
                    hotelId,
                    hotelName,
                    hotelAddress: hotel.address,
                    hotelCity: hotel.city,
                    maktabFlightGroups: {},
                    totalPassengers: 0
                };
            }

            // Group by maktab + flight within each hotel
            const key = `${group.maktab}-${group.arrivalFlightNo || 'N/A'}`;
            if (!hotelMap[hotelId].maktabFlightGroups[key]) {
                hotelMap[hotelId].maktabFlightGroups[key] = {
                    maktab: group.maktab,
                    arrivalFlightNo: group.arrivalFlightNo,
                    arrivalAirport: group.arrivalAirport,
                    passengers: []
                };
            }

            hotelMap[hotelId].maktabFlightGroups[key].passengers.push(...(group.passengers || []));
            hotelMap[hotelId].totalPassengers += group.passengers?.length || 0;
        });

        // Convert maktabFlightGroups object to array
        return Object.values(hotelMap).map(hotel => ({
            ...hotel,
            maktabFlightGroups: Object.values(hotel.maktabFlightGroups).sort((a, b) => {
                if (a.maktab !== b.maktab) return a.maktab.localeCompare(b.maktab);
                return (a.arrivalFlightNo || '').localeCompare(b.arrivalFlightNo || '');
            })
        })).sort((a, b) => a.hotelName.localeCompare(b.hotelName));
    };

    const maktabReportGroups = getMaktabReport();
    const dateReportGroups = getDateReport();
    const departureReportGroups = getDepartureReport();
    const hotelArrivalsData = getHotelArrivalsReport();

    const getTotalPassengers = (groupsList) => {
        return groupsList.reduce((sum, item) => sum + (item.passengers?.length || 0), 0);
    };

    // Generate summary: count of arrivals by maktab and hotel
    const getSummaryByMaktabAndHotel = (groupsList) => {
        const summary = {};
        groupsList.forEach(item => {
            const maktab = item.maktab;
            const hotelName = item.hotel?.name || 'Not Assigned';

            if (!summary[maktab]) {
                summary[maktab] = {
                    total: 0,
                    hotels: {}
                };
            }

            const passengerCount = item.passengers?.length || 0;
            summary[maktab].total += passengerCount;

            if (!summary[maktab].hotels[hotelName]) {
                summary[maktab].hotels[hotelName] = 0;
            }
            summary[maktab].hotels[hotelName] += passengerCount;
        });

        return summary;
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
                <button className="nav-item" onClick={() => navigate('/passengers')}>
                    <UserCheck size={20} />
                    <span>Passengers</span>
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
                            <p className="report-subtitle">View passengers traveling to Maktab(s) on selected date</p>
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
                                <option value="All">All Maktabs</option>
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
                            <h1>{selectedMaktab === 'All' ? 'All Maktabs' : `Maktab ${selectedMaktab}`} Travel Report</h1>
                            <p>Date: {new Date(selectedDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</p>
                        </div>

                        <div className="summary">
                            <strong>Total Arrivals:</strong> {getTotalPassengers(maktabReportGroups)} passengers
                        </div>

                        {maktabReportGroups.length > 0 && (() => {
                            const summary = getSummaryByMaktabAndHotel(maktabReportGroups);
                            return (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#667eea' }}>📊 Arrivals by Maktab & Hotel</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                                        {Object.entries(summary).sort(([a], [b]) => a.localeCompare(b)).map(([maktab, data]) => (
                                            <div key={maktab} style={{
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                color: 'white',
                                                padding: '1rem',
                                                borderRadius: '10px',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                            }}>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '0.5rem' }}>
                                                    Maktab {maktab}
                                                    <span style={{ float: 'right', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.9rem' }}>
                                                        {data.total}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                                                    {Object.entries(data.hotels).sort(([a], [b]) => a.localeCompare(b)).map(([hotel, count]) => (
                                                        <div key={hotel} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                                                            <span style={{ opacity: 0.95 }}>📍 {hotel}</span>
                                                            <span style={{ fontWeight: 'bold' }}>{count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {maktabReportGroups.length === 0 ? (
                            <div className="empty-report">
                                <FileText size={48} />
                                <p>No groups found for {selectedMaktab === 'All' ? 'any Maktab' : `Maktab ${selectedMaktab}`} on {new Date(selectedDate).toLocaleDateString()}</p>
                            </div>
                        ) : (
                            maktabReportGroups.map((item, idx) => (
                                <div key={`${item.maktab}-${item.arrivalFlightNo}-${idx}`} className="report-group">
                                    <h2>Maktab {item.maktab} - Flight {item.arrivalFlightNo || 'N/A'}</h2>
                                    <div className="group-info">
                                        <p><strong>Airport:</strong> {item.arrivalAirport || 'N/A'}</p>
                                        <p><strong>City:</strong> {item.arrivalCity || 'N/A'}</p>
                                        <p><strong>Hotel:</strong> {item.hotel?.name || 'Not Assigned'}{item.hotel?.city && ` (${item.hotel.city})`}</p>
                                        <p><strong>PAX:</strong> {item.passengers?.length || 0}</p>
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
                                            {item.passengers && item.passengers.length > 0 ? (
                                                item.passengers.map((passenger, index) => (
                                                    <tr key={passenger._id}>
                                                        <td>{index + 1}</td>
                                                        <td>{passenger.firstName}</td>
                                                        <td>{passenger.lastName}</td>
                                                        <td>{passenger.passportNo}</td>
                                                        <td>{item.hotel?.name || 'Not Assigned'}</td>
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
                            <h2 className="report-title">Arrival Travel Report</h2>
                            <p className="report-subtitle">View all passengers arriving on selected date with hotel information</p>
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
                            <label>Arrival Date</label>
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
                            <h1>Arrival Travel Report</h1>
                            <p>Date: {new Date(travelDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</p>
                        </div>

                        <div className="summary">
                            <strong>Total Arrivals:</strong> {getTotalPassengers(dateReportGroups)} passengers
                        </div>

                        {dateReportGroups.length > 0 && (() => {
                            const summary = getSummaryByMaktabAndHotel(dateReportGroups);
                            return (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#667eea' }}>📊 Arrivals by Maktab & Hotel</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                                        {Object.entries(summary).sort(([a], [b]) => a.localeCompare(b)).map(([maktab, data]) => (
                                            <div key={maktab} style={{
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                color: 'white',
                                                padding: '1rem',
                                                borderRadius: '10px',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                            }}>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '0.5rem' }}>
                                                    Maktab {maktab}
                                                    <span style={{ float: 'right', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.9rem' }}>
                                                        {data.total}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                                                    {Object.entries(data.hotels).sort(([a], [b]) => a.localeCompare(b)).map(([hotel, count]) => (
                                                        <div key={hotel} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                                                            <span style={{ opacity: 0.95 }}>📍 {hotel}</span>
                                                            <span style={{ fontWeight: 'bold' }}>{count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {dateReportGroups.length === 0 ? (
                            <div className="empty-report">
                                <Calendar size={48} />
                                <p>No groups arriving on {new Date(travelDate).toLocaleDateString()}</p>
                            </div>
                        ) : (
                            dateReportGroups.map((item, idx) => (
                                <div key={`${item.maktab}-${item.arrivalFlightNo}-${idx}`} className="report-group">
                                    <h2>Maktab {item.maktab} - Flight {item.arrivalFlightNo || 'N/A'}</h2>
                                    <div className="group-info">
                                        <p><strong>Airport:</strong> {item.arrivalAirport || 'N/A'}</p>
                                        <p><strong>City:</strong> {item.arrivalCity || 'N/A'}</p>
                                        <p><strong>Hotel:</strong> {item.hotel?.name || 'Not Assigned'}{item.hotel?.city && ` (${item.hotel.city})`}</p>
                                        <p><strong>PAX:</strong> {item.passengers?.length || 0}</p>
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
                                            {item.passengers && item.passengers.length > 0 ? (
                                                item.passengers.map((passenger, index) => (
                                                    <tr key={passenger._id}>
                                                        <td>{index + 1}</td>
                                                        <td>{passenger.firstName}</td>
                                                        <td>{passenger.lastName}</td>
                                                        <td>{passenger.passportNo}</td>
                                                        <td>{item.hotel?.name || 'Not Assigned'}</td>
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

                {/* Report 3: Departure Travel Report */}
                <Card style={{ marginTop: '2rem' }}>
                    <div className="report-header">
                        <div>
                            <h2 className="report-title">Departure Travel Report</h2>
                            <p className="report-subtitle">View all passengers departing on selected date with hotel information</p>
                        </div>
                        <Button
                            variant="secondary"
                            icon={<Download size={18} />}
                            onClick={() => printReport('departure-report')}
                        >
                            Print Report
                        </Button>
                    </div>

                    <div className="report-filters">
                        <div className="filter-group">
                            <label>Departure Date</label>
                            <input
                                type="date"
                                value={departureDate}
                                onChange={(e) => setDepartureDate(e.target.value)}
                                className="report-input"
                            />
                        </div>
                    </div>

                    <div id="departure-report" className="report-content">
                        <div className="report-print-header">
                            <h1>Departure Travel Report</h1>
                            <p>Date: {new Date(departureDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</p>
                        </div>

                        <div className="summary">
                            <strong>Total Departures:</strong> {getTotalPassengers(departureReportGroups)} passengers
                        </div>

                        {departureReportGroups.length > 0 && (() => {
                            const summary = getSummaryByMaktabAndHotel(departureReportGroups);
                            return (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#667eea' }}>📊 Departures by Maktab & Hotel</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                                        {Object.entries(summary).sort(([a], [b]) => a.localeCompare(b)).map(([maktab, data]) => (
                                            <div key={maktab} style={{
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                color: 'white',
                                                padding: '1rem',
                                                borderRadius: '10px',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                            }}>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '0.5rem' }}>
                                                    Maktab {maktab}
                                                    <span style={{ float: 'right', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.9rem' }}>
                                                        {data.total}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                                                    {Object.entries(data.hotels).sort(([a], [b]) => a.localeCompare(b)).map(([hotel, count]) => (
                                                        <div key={hotel} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                                                            <span style={{ opacity: 0.95 }}>📍 {hotel}</span>
                                                            <span style={{ fontWeight: 'bold' }}>{count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {departureReportGroups.length === 0 ? (
                            <div className="empty-report">
                                <Calendar size={48} />
                                <p>No groups departing on {new Date(departureDate).toLocaleDateString()}</p>
                            </div>
                        ) : (
                            departureReportGroups.map((item, idx) => (
                                <div key={`${item.maktab}-${item.departureFlightNo}-${idx}`} className="report-group">
                                    <h2>Maktab {item.maktab} - Flight {item.departureFlightNo || 'N/A'}</h2>
                                    <div className="group-info">
                                        <p><strong>Airport:</strong> {item.departureAirport || 'N/A'}</p>
                                        <p><strong>City:</strong> {item.departureCity || 'N/A'}</p>
                                        <p><strong>Hotel:</strong> {item.hotel?.name || 'Not Assigned'}{item.hotel?.city && ` (${item.hotel.city})`}</p>
                                        <p><strong>PAX:</strong> {item.passengers?.length || 0}</p>
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
                                            {item.passengers && item.passengers.length > 0 ? (
                                                item.passengers.map((passenger, index) => (
                                                    <tr key={passenger._id}>
                                                        <td>{index + 1}</td>
                                                        <td>{passenger.firstName}</td>
                                                        <td>{passenger.lastName}</td>
                                                        <td>{passenger.passportNo}</td>
                                                        <td>{item.hotel?.name || 'Not Assigned'}</td>
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

                {/* Report 4: Hotel Arrivals Report */}
                <Card style={{ marginTop: '2rem' }}>
                    <div className="report-header">
                        <div>
                            <h2 className="report-title">Hotel Arrivals Report</h2>
                            <p className="report-subtitle">View which hotels are receiving passengers on selected date</p>
                        </div>
                        <Button
                            variant="secondary"
                            icon={<Download size={18} />}
                            onClick={() => printReport('hotel-arrivals-report')}
                        >
                            Print Report
                        </Button>
                    </div>

                    <div className="report-filters">
                        <div className="filter-group">
                            <label>Arrival Date</label>
                            <input
                                type="date"
                                value={hotelArrivalDate}
                                onChange={(e) => setHotelArrivalDate(e.target.value)}
                                className="report-input"
                            />
                        </div>
                    </div>

                    <div id="hotel-arrivals-report" className="report-content">
                        <div className="report-print-header">
                            <h1>Hotel Arrivals Report</h1>
                            <p>Date: {new Date(hotelArrivalDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</p>
                        </div>

                        <div className="summary">
                            <strong>Total Arrivals:</strong> {hotelArrivalsData.reduce((sum, hotel) => sum + hotel.totalPassengers, 0)} passengers
                        </div>

                        {hotelArrivalsData.length > 0 && (() => {
                            // Create maktab summary from hotel data
                            const maktabSummary = {};
                            hotelArrivalsData.forEach(hotel => {
                                hotel.maktabFlightGroups.forEach(mfGroup => {
                                    const maktab = mfGroup.maktab;
                                    const hotelName = hotel.hotelName;
                                    const passengerCount = mfGroup.passengers?.length || 0;

                                    if (!maktabSummary[maktab]) {
                                        maktabSummary[maktab] = { total: 0, hotels: {} };
                                    }

                                    maktabSummary[maktab].total += passengerCount;

                                    if (!maktabSummary[maktab].hotels[hotelName]) {
                                        maktabSummary[maktab].hotels[hotelName] = 0;
                                    }
                                    maktabSummary[maktab].hotels[hotelName] += passengerCount;
                                });
                            });

                            return (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#667eea' }}>📊 Arrivals by Maktab & Hotel</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                                        {Object.entries(maktabSummary).sort(([a], [b]) => a.localeCompare(b)).map(([maktab, data]) => (
                                            <div key={maktab} style={{
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                color: 'white',
                                                padding: '1rem',
                                                borderRadius: '10px',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                            }}>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '0.5rem' }}>
                                                    Maktab {maktab}
                                                    <span style={{ float: 'right', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.9rem' }}>
                                                        {data.total}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                                                    {Object.entries(data.hotels).sort(([a], [b]) => a.localeCompare(b)).map(([hotel, count]) => (
                                                        <div key={hotel} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                                                            <span style={{ opacity: 0.95 }}>📍 {hotel}</span>
                                                            <span style={{ fontWeight: 'bold' }}>{count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {hotelArrivalsData.length === 0 ? (
                            <div className="empty-report">
                                <Building2 size={48} />
                                <p>No hotel arrivals found for {new Date(hotelArrivalDate).toLocaleDateString()}</p>
                            </div>
                        ) : (
                            hotelArrivalsData.map(hotel => (
                                <div key={hotel.hotelId} className="report-group">
                                    <h2>
                                        <Building2 size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                                        {hotel.hotelName}{hotel.hotelCity && ` (${hotel.hotelCity})`}
                                    </h2>
                                    <div className="group-info">
                                        <p><strong>City:</strong> {hotel.hotelCity || 'N/A'}</p>
                                        <p><strong>Address:</strong> {hotel.hotelAddress || 'N/A'}</p>
                                        <p><strong>Total Arrivals:</strong> {hotel.totalPassengers} passengers</p>
                                    </div>

                                    {/* List of maktab-flight groups */}
                                    <div style={{ marginBottom: '1rem' }}>
                                        <h3 style={{ fontSize: '1rem', color: '#667eea', marginBottom: '0.5rem' }}>Arrivals by Maktab & Flight:</h3>
                                        {hotel.maktabFlightGroups.map((mfGroup, idx) => (
                                            <div key={`${mfGroup.maktab}-${mfGroup.arrivalFlightNo}-${idx}`} style={{
                                                background: '#f8f9fa',
                                                padding: '0.75rem',
                                                marginBottom: '0.5rem',
                                                borderRadius: '8px',
                                                borderLeft: '4px solid #667eea'
                                            }}>
                                                <strong>Maktab {mfGroup.maktab}</strong> |
                                                Flight: {mfGroup.arrivalFlightNo || 'N/A'} ({mfGroup.arrivalAirport || 'N/A'}) |
                                                PAX: {mfGroup.passengers?.length || 0}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Detailed passenger list */}
                                    <table className="passengers-report-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>First Name</th>
                                                <th>Last Name</th>
                                                <th>Passport No.</th>
                                                <th>Maktab</th>
                                                <th>Flight</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hotel.maktabFlightGroups.flatMap(mfGroup =>
                                                (mfGroup.passengers || []).map(passenger => ({
                                                    ...passenger,
                                                    maktab: mfGroup.maktab,
                                                    flight: mfGroup.arrivalFlightNo
                                                }))
                                            ).map((passenger, index) => (
                                                <tr key={`${passenger._id}-${index}`}>
                                                    <td>{index + 1}</td>
                                                    <td>{passenger.firstName}</td>
                                                    <td>{passenger.lastName}</td>
                                                    <td>{passenger.passportNo}</td>
                                                    <td>Maktab {passenger.maktab}</td>
                                                    <td>{passenger.flight || 'N/A'}</td>
                                                </tr>
                                            ))}
                                            {hotel.totalPassengers === 0 && (
                                                <tr>
                                                    <td colSpan="6" style={{ textAlign: 'center', color: '#999' }}>
                                                        No passengers assigned yet
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
