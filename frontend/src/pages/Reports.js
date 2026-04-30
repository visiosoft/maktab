import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsAPI, companiesAPI, superAdminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { Home, Building2, LogOut, FileText, Calendar, Download, Users, UserCheck, Bell, Search } from 'lucide-react';
import './Reports.css';

const REPORT_CONFIG = {
    maktab: {
        key: 'maktab',
        path: '/reports/maktab',
        navLabel: 'Maktab Report',
        title: 'Maktab Travel Report',
        subtitle: 'View passengers traveling to Maktab(s) on selected date',
        printId: 'maktab-report'
    },
    arrival: {
        key: 'arrival',
        path: '/reports/arrival',
        navLabel: 'Arrival Report',
        title: 'Arrival Travel Report',
        subtitle: 'View all passengers arriving on selected date with hotel information',
        printId: 'arrival-report'
    },
    'arrival-2': {
        key: 'arrival-2',
        path: '/reports/arrival-2',
        navLabel: 'Arrival Report 2',
        title: 'Arrival Report 2',
        subtitle: 'View arrival schedule by flight, company, and hotel for the selected date',
        printId: 'arrival-report-2'
    },
    departure: {
        key: 'departure',
        path: '/reports/departure',
        navLabel: 'Departure Report',
        title: 'Departure Travel Report',
        subtitle: 'View all passengers departing on selected date with hotel information',
        printId: 'departure-report'
    },
    'hotel-arrivals': {
        key: 'hotel-arrivals',
        path: '/reports/hotel-arrivals',
        navLabel: 'Hotel Arrivals',
        title: 'Hotel Arrivals Report',
        subtitle: 'View which hotels are receiving passengers on selected date',
        printId: 'hotel-arrivals-report'
    }
};

const reportLinks = Object.values(REPORT_CONFIG);

const Reports = ({ reportType = 'maktab' }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [groups, setGroups] = useState([]);
    const [company, setCompany] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedMaktab, setSelectedMaktab] = useState('All');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
    const [arrivalReport2Date, setArrivalReport2Date] = useState(new Date().toISOString().split('T')[0]);
    const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
    const [hotelArrivalDate, setHotelArrivalDate] = useState(new Date().toISOString().split('T')[0]);

    const isSuperAdmin = user?.role === 'super_admin';
    const activeReport = REPORT_CONFIG[reportType] || REPORT_CONFIG.maktab;

    useEffect(() => {
        if (!user?.role) {
            return;
        }

        if (isSuperAdmin) {
            fetchCompanies();
            return;
        }

        fetchCompanyAdminReports();
    }, [user?.role]);

    useEffect(() => {
        if (!isSuperAdmin || !selectedCompanyId) {
            return;
        }

        fetchSuperAdminReports(selectedCompanyId);
    }, [isSuperAdmin, selectedCompanyId]);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const response = await companiesAPI.getAll();
            const companyList = Array.isArray(response.data) ? response.data : [];

            setCompanies(companyList);

            if (companyList.length === 0) {
                setCompany(null);
                setGroups([]);
                setSelectedCompanyId('');
                return;
            }

            setSelectedCompanyId((currentCompanyId) => {
                if (currentCompanyId && (currentCompanyId === 'all' || companyList.some((item) => item._id === currentCompanyId))) {
                    return currentCompanyId;
                }

                return 'all';
            });
        } catch (error) {
            console.error('Error fetching companies:', error);
            alert('Failed to fetch companies');
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanyAdminReports = async () => {
        try {
            setLoading(true);
            const [groupsResponse, companyResponse] = await Promise.all([
                groupsAPI.getAll(),
                companiesAPI.getAll()
            ]);

            setCompany(companyResponse.data);

            const groupsWithPassengers = await Promise.all(
                groupsResponse.data.map(async (group) => {
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

    const fetchSuperAdminReports = async (companyId) => {
        try {
            setLoading(true);
            const response = await superAdminAPI.getReports(companyId);
            setCompany(response.data.company);
            setGroups(response.data.groups || []);
        } catch (error) {
            console.error('Error fetching report data:', error);
            alert('Failed to fetch report data');
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    const appendCompanyName = (companyNames, companyName) => {
        if (!companyName || companyNames.includes(companyName)) {
            return companyNames;
        }

        return [...companyNames, companyName];
    };

    const formatCompanyNames = (companyNames) => {
        if (!companyNames || companyNames.length === 0) {
            return company?.name || 'N/A';
        }

        return companyNames.join(', ');
    };

    const getMaktabReport = () => {
        const filteredGroups = groups.filter((group) => {
            const arrivalDate = group.arrivalDate ? new Date(group.arrivalDate).toISOString().split('T')[0] : null;
            const matchesMaktab = selectedMaktab === 'All' || group.maktab === selectedMaktab;
            return matchesMaktab && arrivalDate === selectedDate;
        });

        const groupedData = {};
        filteredGroups.forEach((group) => {
            const hotelId = (group.arrivalHotel || group.hotel)?._id || 'no-hotel';
            const key = `${group.maktab}-${group.arrivalFlightNo || 'N/A'}-${hotelId}`;

            if (!groupedData[key]) {
                groupedData[key] = {
                    maktab: group.maktab,
                    arrivalFlightNo: group.arrivalFlightNo,
                    arrivalAirport: group.arrivalAirport,
                    arrivalCity: group.arrivalCity,
                    hotel: group.arrivalHotel || group.hotel,
                    companyNames: [],
                    passengers: []
                };
            }

            groupedData[key].companyNames = appendCompanyName(groupedData[key].companyNames, group.company?.name);
            groupedData[key].passengers.push(...(group.passengers || []));
        });

        return Object.values(groupedData).sort((a, b) => {
            if (a.maktab !== b.maktab) return a.maktab.localeCompare(b.maktab);
            if ((a.arrivalFlightNo || '') !== (b.arrivalFlightNo || '')) {
                return (a.arrivalFlightNo || '').localeCompare(b.arrivalFlightNo || '');
            }
            return (a.hotel?.name || '').localeCompare(b.hotel?.name || '');
        });
    };

    const getDateReport = () => {
        const filteredGroups = groups.filter((group) => {
            const arrivalDate = group.arrivalDate ? new Date(group.arrivalDate).toISOString().split('T')[0] : null;
            return arrivalDate === travelDate;
        });

        const groupedData = {};
        filteredGroups.forEach((group) => {
            const hotelId = (group.arrivalHotel || group.hotel)?._id || 'no-hotel';
            const key = `${group.maktab}-${group.arrivalFlightNo || 'N/A'}-${hotelId}`;

            if (!groupedData[key]) {
                groupedData[key] = {
                    maktab: group.maktab,
                    arrivalFlightNo: group.arrivalFlightNo,
                    arrivalAirport: group.arrivalAirport,
                    arrivalCity: group.arrivalCity,
                    hotel: group.arrivalHotel || group.hotel,
                    companyNames: [],
                    passengers: []
                };
            }

            groupedData[key].companyNames = appendCompanyName(groupedData[key].companyNames, group.company?.name);
            groupedData[key].passengers.push(...(group.passengers || []));
        });

        return Object.values(groupedData).sort((a, b) => {
            if (a.maktab !== b.maktab) return a.maktab.localeCompare(b.maktab);
            if ((a.arrivalFlightNo || '') !== (b.arrivalFlightNo || '')) {
                return (a.arrivalFlightNo || '').localeCompare(b.arrivalFlightNo || '');
            }
            return (a.hotel?.name || '').localeCompare(b.hotel?.name || '');
        });
    };

    const getDepartureReport = () => {
        const filteredGroups = groups.filter((group) => {
            const currentDepartureDate = group.departureDate ? new Date(group.departureDate).toISOString().split('T')[0] : null;
            return currentDepartureDate === departureDate;
        });

        const groupedData = {};
        filteredGroups.forEach((group) => {
            const hotelId = (group.departureHotel || group.hotel)?._id || 'no-hotel';
            const key = `${group.maktab}-${group.departureFlightNo || 'N/A'}-${hotelId}`;

            if (!groupedData[key]) {
                groupedData[key] = {
                    maktab: group.maktab,
                    departureFlightNo: group.departureFlightNo,
                    departureAirport: group.departureAirport,
                    departureCity: group.departureCity,
                    hotel: group.departureHotel || group.hotel,
                    companyNames: [],
                    passengers: []
                };
            }

            groupedData[key].companyNames = appendCompanyName(groupedData[key].companyNames, group.company?.name);
            groupedData[key].passengers.push(...(group.passengers || []));
        });

        return Object.values(groupedData).sort((a, b) => {
            if (a.maktab !== b.maktab) return a.maktab.localeCompare(b.maktab);
            if ((a.departureFlightNo || '') !== (b.departureFlightNo || '')) {
                return (a.departureFlightNo || '').localeCompare(b.departureFlightNo || '');
            }
            return (a.hotel?.name || '').localeCompare(b.hotel?.name || '');
        });
    };

    const getArrivalReport2 = () => {
        return groups.filter((group) => {
            const arrivalDate = group.arrivalDate ? new Date(group.arrivalDate).toISOString().split('T')[0] : null;
            return arrivalDate === arrivalReport2Date;
        }).map((group) => ({
            id: group._id,
            arrivalFlightNo: group.arrivalFlightNo,
            arrivalTime: group.arrivalTime,
            arrivalAirport: group.arrivalAirport,
            paxCount: group.passengers?.length || 0,
            maktab: group.maktab,
            companyName: group.company?.name || company?.name || 'N/A',
            hotel: group.arrivalHotel || group.hotel
        })).sort((a, b) => {
            if ((a.arrivalFlightNo || '') !== (b.arrivalFlightNo || '')) {
                return (a.arrivalFlightNo || '').localeCompare(b.arrivalFlightNo || '');
            }

            if ((a.arrivalTime || '') !== (b.arrivalTime || '')) {
                return (a.arrivalTime || '').localeCompare(b.arrivalTime || '');
            }

            return (a.companyName || '').localeCompare(b.companyName || '');
        });
    };

    const getHotelArrivalsReport = () => {
        const filteredGroups = groups.filter((group) => {
            const arrivalDate = group.arrivalDate ? new Date(group.arrivalDate).toISOString().split('T')[0] : null;
            return arrivalDate === hotelArrivalDate && (group.arrivalHotel || group.hotel);
        });

        const hotelMap = {};
        filteredGroups.forEach((group) => {
            const hotel = group.arrivalHotel || group.hotel;
            const hotelId = hotel._id;

            if (!hotelMap[hotelId]) {
                hotelMap[hotelId] = {
                    hotelId,
                    hotelName: hotel.name,
                    hotelAddress: hotel.address,
                    hotelCity: hotel.city,
                    companyNames: [],
                    maktabFlightGroups: {},
                    totalPassengers: 0
                };
            }

            hotelMap[hotelId].companyNames = appendCompanyName(hotelMap[hotelId].companyNames, group.company?.name);

            const key = `${group.maktab}-${group.arrivalFlightNo || 'N/A'}`;
            if (!hotelMap[hotelId].maktabFlightGroups[key]) {
                hotelMap[hotelId].maktabFlightGroups[key] = {
                    maktab: group.maktab,
                    arrivalFlightNo: group.arrivalFlightNo,
                    arrivalAirport: group.arrivalAirport,
                    companyNames: [],
                    passengers: []
                };
            }

            hotelMap[hotelId].maktabFlightGroups[key].companyNames = appendCompanyName(
                hotelMap[hotelId].maktabFlightGroups[key].companyNames,
                group.company?.name
            );
            hotelMap[hotelId].maktabFlightGroups[key].passengers.push(...(group.passengers || []));
            hotelMap[hotelId].totalPassengers += group.passengers?.length || 0;
        });

        return Object.values(hotelMap).map((hotel) => ({
            ...hotel,
            maktabFlightGroups: Object.values(hotel.maktabFlightGroups).sort((a, b) => {
                if (a.maktab !== b.maktab) return a.maktab.localeCompare(b.maktab);
                return (a.arrivalFlightNo || '').localeCompare(b.arrivalFlightNo || '');
            })
        })).sort((a, b) => a.hotelName.localeCompare(b.hotelName));
    };

    const maktabReportGroups = getMaktabReport();
    const dateReportGroups = getDateReport();
    const arrivalReport2Rows = getArrivalReport2();
    const departureReportGroups = getDepartureReport();
    const hotelArrivalsData = getHotelArrivalsReport();

    const getTotalPassengers = (groupsList) => groupsList.reduce((sum, item) => sum + (item.passengers?.length || 0), 0);

    const getSummaryByMaktabAndHotel = (groupsList) => {
        const summary = {};
        groupsList.forEach((item) => {
            const maktab = item.maktab;
            const hotelName = item.hotel?.name || 'Not Assigned';

            if (!summary[maktab]) {
                summary[maktab] = { total: 0, hotels: {} };
            }

            const passengerCount = item.passengers?.length || 0;
            summary[maktab].total += passengerCount;
            summary[maktab].hotels[hotelName] = (summary[maktab].hotels[hotelName] || 0) + passengerCount;
        });

        return summary;
    };

    const printReport = (reportId) => {
        const printContent = document.getElementById(reportId);
        if (!printContent) {
            return;
        }

        const companyName = company?.name || 'Maktab Travel Management';
        const printDate = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const winPrint = window.open('', '', 'left=0,top=0,width=1024,height=768,toolbar=0,scrollbars=1,status=0');
        winPrint.document.write(`
      <html>
        <head>
          <title>${companyName} - Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { margin: 1.5cm; size: A4; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; color: #333; line-height: 1.6; background: white; }
            .print-header { border-bottom: 3px solid #667eea; padding-bottom: 15px; margin-bottom: 25px; }
            .print-header h1 { font-size: 24pt; color: #667eea; font-weight: 700; margin-bottom: 5px; }
            .print-header .subtitle { font-size: 10pt; color: #666; font-style: italic; }
            .report-print-header h1 { color: #333; font-size: 18pt; margin: 20px 0 10px 0; font-weight: 600; }
            .report-print-header p { color: #666; font-size: 10pt; margin-bottom: 15px; }
            h2 { color: #444; font-size: 14pt; margin: 20px 0 12px 0; font-weight: 600; page-break-after: avoid; }
            h3 { color: #667eea; font-size: 11pt; margin: 15px 0 8px 0; font-weight: 600; }
            .summary { background: #f8f9fa; border-left: 4px solid #667eea; padding: 12px 15px; margin-bottom: 20px; font-size: 11pt; font-weight: 600; page-break-inside: avoid; }
            .summary strong { color: #667eea; }
            [style*="linear-gradient"] { background: #f0f0f5 !important; border: 2px solid #667eea !important; page-break-inside: avoid; }
            [style*="linear-gradient"] [style*="border-bottom"] { border-bottom: 1px solid #ccc !important; color: #333 !important; }
            [style*="linear-gradient"] span { color: #333 !important; }
            .group-info { display: flex; gap: 20px; margin-bottom: 12px; padding: 10px 15px; background: #f8f9fa; border-radius: 6px; font-size: 10pt; page-break-inside: avoid; }
            .group-info p { margin: 0; }
            .group-info strong { color: #333; font-weight: 600; }
            .report-group { margin-bottom: 30px; page-break-inside: avoid; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0 25px 0; font-size: 10pt; page-break-inside: avoid; }
            thead { display: table-header-group; }
            th { background-color: #667eea !important; color: white !important; padding: 10px 8px; text-align: left; font-weight: 600; border: 1px solid #5568d3; font-size: 10pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            tbody tr:nth-child(even) { background-color: #f9f9f9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            tbody tr:first-child td { border-top: 2px solid #667eea; }
            .empty-report { text-align: center; padding: 40px; color: #999; font-style: italic; }
            .print-footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 7pt; color: #666; padding: 4px 0; border-top: 1px solid #ccc; background: white; }
            .print-footer .company-name { font-weight: 600; color: #667eea; font-size: 7.5pt; }
            .print-footer .contact-info { margin-top: 2px; font-size: 6.5pt; color: #999; }
            .print-footer a { color: #667eea; text-decoration: none; }
            @page { margin-bottom: 1.5cm; }
            button, input, select, svg, .filter-group { display: none !important; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; padding-bottom: 60px; }
              .print-footer { position: fixed; bottom: 0; width: 100%; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .report-group { page-break-inside: avoid; }
              h2, h3 { page-break-after: avoid; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>${companyName}</h1>
            <div class="subtitle">Travel Management System - Report Generated on ${printDate}</div>
          </div>
          ${printContent.innerHTML}
          <div class="print-footer">
            <div class="company-name">Innovative Layer</div>
            <div class="contact-info">Phone: +92 333 3775889 | Website: <a href="https://www.innovativelayer.com">www.innovativelayer.com</a></div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 100);
            };
          </script>
        </body>
      </html>
    `);
        winPrint.document.close();
    };

    const renderSummaryCards = (summary, title) => (
        <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#667eea' }}>{title}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {Object.entries(summary).sort(([a], [b]) => a.localeCompare(b)).map(([maktab, data]) => (
                    <div
                        key={maktab}
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: '10px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '0.5rem' }}>
                            Maktab {maktab}
                            <span style={{ float: 'right', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.9rem' }}>
                                {data.total}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                            {Object.entries(data.hotels).sort(([a], [b]) => a.localeCompare(b)).map(([hotel, count]) => (
                                <div key={hotel} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                                    <span style={{ opacity: 0.95 }}>Hotel: {hotel}</span>
                                    <span style={{ fontWeight: 'bold' }}>{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderMaktabReport = () => (
        <Card>
            <div className="report-header">
                <div>
                    <h2 className="report-title">{REPORT_CONFIG.maktab.title}</h2>
                    <p className="report-subtitle">{REPORT_CONFIG.maktab.subtitle}</p>
                </div>
                <Button variant="secondary" icon={<Download size={18} />} onClick={() => printReport(REPORT_CONFIG.maktab.printId)}>
                    Print Report
                </Button>
            </div>

            <div className="report-filters">
                <div className="filter-group">
                    <label>Maktab</label>
                    <select value={selectedMaktab} onChange={(e) => setSelectedMaktab(e.target.value)} className="report-select">
                        <option value="All">All Maktabs</option>
                        <option value="A">Maktab A</option>
                        <option value="B">Maktab B</option>
                        <option value="C">Maktab C</option>
                        <option value="D">Maktab D</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Travel Date</label>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="report-input" />
                </div>
            </div>

            <div id={REPORT_CONFIG.maktab.printId} className="report-content">
                <div className="report-print-header">
                    <h1>{selectedMaktab === 'All' ? 'All Maktabs' : `Maktab ${selectedMaktab}`} Travel Report</h1>
                    <p>Date: {new Date(selectedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div className="summary">
                    <strong>Total Arrivals:</strong> {getTotalPassengers(maktabReportGroups)} passengers
                </div>

                {maktabReportGroups.length > 0 && renderSummaryCards(getSummaryByMaktabAndHotel(maktabReportGroups), 'Arrivals by Maktab & Hotel')}

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
                                <p><strong>Company:</strong> {formatCompanyNames(item.companyNames)}</p>
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
                                    {item.passengers.length > 0 ? item.passengers.map((passenger, index) => (
                                        <tr key={passenger._id}>
                                            <td>{index + 1}</td>
                                            <td>{passenger.firstName}</td>
                                            <td>{passenger.lastName}</td>
                                            <td>{passenger.passportNo}</td>
                                            <td>{item.hotel?.name || 'Not Assigned'}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', color: '#999' }}>No passengers added yet</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );

    const renderArrivalReport = () => (
        <Card>
            <div className="report-header">
                <div>
                    <h2 className="report-title">{REPORT_CONFIG.arrival.title}</h2>
                    <p className="report-subtitle">{REPORT_CONFIG.arrival.subtitle}</p>
                </div>
                <Button variant="secondary" icon={<Download size={18} />} onClick={() => printReport(REPORT_CONFIG.arrival.printId)}>
                    Print Report
                </Button>
            </div>

            <div className="report-filters">
                <div className="filter-group">
                    <label>Arrival Date</label>
                    <input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className="report-input" />
                </div>
            </div>

            <div id={REPORT_CONFIG.arrival.printId} className="report-content">
                <div className="report-print-header">
                    <h1>Arrival Travel Report</h1>
                    <p>Date: {new Date(travelDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div className="summary">
                    <strong>Total Arrivals:</strong> {getTotalPassengers(dateReportGroups)} passengers
                </div>

                {dateReportGroups.length > 0 && renderSummaryCards(getSummaryByMaktabAndHotel(dateReportGroups), 'Arrivals by Maktab & Hotel')}

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
                                <p><strong>Company:</strong> {formatCompanyNames(item.companyNames)}</p>
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
                                    {item.passengers.length > 0 ? item.passengers.map((passenger, index) => (
                                        <tr key={passenger._id}>
                                            <td>{index + 1}</td>
                                            <td>{passenger.firstName}</td>
                                            <td>{passenger.lastName}</td>
                                            <td>{passenger.passportNo}</td>
                                            <td>{item.hotel?.name || 'Not Assigned'}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', color: '#999' }}>No passengers added yet</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );

    const renderArrivalReport2 = () => (
        <Card>
            <div className="report-header">
                <div>
                    <h2 className="report-title">{REPORT_CONFIG['arrival-2'].title}</h2>
                    <p className="report-subtitle">{REPORT_CONFIG['arrival-2'].subtitle}</p>
                </div>
                <Button variant="secondary" icon={<Download size={18} />} onClick={() => printReport(REPORT_CONFIG['arrival-2'].printId)}>
                    Print Report
                </Button>
            </div>

            <div className="report-filters">
                <div className="filter-group">
                    <label>Arrival Date</label>
                    <input type="date" value={arrivalReport2Date} onChange={(e) => setArrivalReport2Date(e.target.value)} className="report-input" />
                </div>
            </div>

            <div id={REPORT_CONFIG['arrival-2'].printId} className="report-content">
                <div className="report-print-header">
                    <h1>Arrival Report 2</h1>
                    <p>Date: {new Date(arrivalReport2Date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div className="summary">
                    <strong>Total Arrivals:</strong> {arrivalReport2Rows.reduce((sum, row) => sum + row.paxCount, 0)} passengers
                </div>

                {arrivalReport2Rows.length === 0 ? (
                    <div className="empty-report">
                        <Calendar size={48} />
                        <p>No arrivals found on {new Date(arrivalReport2Date).toLocaleDateString()}</p>
                    </div>
                ) : (
                    <table className="passengers-report-table">
                        <thead>
                            <tr>
                                <th>Flight No</th>
                                <th>Time</th>
                                <th>Airport</th>
                                <th>No of Pax</th>
                                <th>Maktab</th>
                                <th>Company</th>
                                <th>Hotel</th>
                            </tr>
                        </thead>
                        <tbody>
                            {arrivalReport2Rows.map((row) => (
                                <tr key={row.id}>
                                    <td>{row.arrivalFlightNo || 'N/A'}</td>
                                    <td>{row.arrivalTime || 'N/A'}</td>
                                    <td>{row.arrivalAirport || 'N/A'}</td>
                                    <td>{row.paxCount}</td>
                                    <td>{row.maktab || 'N/A'}</td>
                                    <td>{row.companyName}</td>
                                    <td>{row.hotel?.name || 'Not Assigned'}{row.hotel?.city && ` (${row.hotel.city})`}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </Card>
    );

    const renderDepartureReport = () => (
        <Card>
            <div className="report-header">
                <div>
                    <h2 className="report-title">{REPORT_CONFIG.departure.title}</h2>
                    <p className="report-subtitle">{REPORT_CONFIG.departure.subtitle}</p>
                </div>
                <Button variant="secondary" icon={<Download size={18} />} onClick={() => printReport(REPORT_CONFIG.departure.printId)}>
                    Print Report
                </Button>
            </div>

            <div className="report-filters">
                <div className="filter-group">
                    <label>Departure Date</label>
                    <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="report-input" />
                </div>
            </div>

            <div id={REPORT_CONFIG.departure.printId} className="report-content">
                <div className="report-print-header">
                    <h1>Departure Travel Report</h1>
                    <p>Date: {new Date(departureDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div className="summary">
                    <strong>Total Departures:</strong> {getTotalPassengers(departureReportGroups)} passengers
                </div>

                {departureReportGroups.length > 0 && renderSummaryCards(getSummaryByMaktabAndHotel(departureReportGroups), 'Departures by Maktab & Hotel')}

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
                                <p><strong>Company:</strong> {formatCompanyNames(item.companyNames)}</p>
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
                                    {item.passengers.length > 0 ? item.passengers.map((passenger, index) => (
                                        <tr key={passenger._id}>
                                            <td>{index + 1}</td>
                                            <td>{passenger.firstName}</td>
                                            <td>{passenger.lastName}</td>
                                            <td>{passenger.passportNo}</td>
                                            <td>{item.hotel?.name || 'Not Assigned'}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', color: '#999' }}>No passengers added yet</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );

    const renderHotelArrivalsReport = () => {
        const maktabSummary = {};
        hotelArrivalsData.forEach((hotel) => {
            hotel.maktabFlightGroups.forEach((flightGroup) => {
                const passengerCount = flightGroup.passengers?.length || 0;

                if (!maktabSummary[flightGroup.maktab]) {
                    maktabSummary[flightGroup.maktab] = { total: 0, hotels: {} };
                }

                maktabSummary[flightGroup.maktab].total += passengerCount;
                maktabSummary[flightGroup.maktab].hotels[hotel.hotelName] = (maktabSummary[flightGroup.maktab].hotels[hotel.hotelName] || 0) + passengerCount;
            });
        });

        return (
            <Card>
                <div className="report-header">
                    <div>
                        <h2 className="report-title">{REPORT_CONFIG['hotel-arrivals'].title}</h2>
                        <p className="report-subtitle">{REPORT_CONFIG['hotel-arrivals'].subtitle}</p>
                    </div>
                    <Button variant="secondary" icon={<Download size={18} />} onClick={() => printReport(REPORT_CONFIG['hotel-arrivals'].printId)}>
                        Print Report
                    </Button>
                </div>

                <div className="report-filters">
                    <div className="filter-group">
                        <label>Arrival Date</label>
                        <input type="date" value={hotelArrivalDate} onChange={(e) => setHotelArrivalDate(e.target.value)} className="report-input" />
                    </div>
                </div>

                <div id={REPORT_CONFIG['hotel-arrivals'].printId} className="report-content">
                    <div className="report-print-header">
                        <h1>Hotel Arrivals Report</h1>
                        <p>Date: {new Date(hotelArrivalDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    <div className="summary">
                        <strong>Total Arrivals:</strong> {hotelArrivalsData.reduce((sum, hotel) => sum + hotel.totalPassengers, 0)} passengers
                    </div>

                    {hotelArrivalsData.length > 0 && renderSummaryCards(maktabSummary, 'Arrivals by Maktab & Hotel')}

                    {hotelArrivalsData.length === 0 ? (
                        <div className="empty-report">
                            <Building2 size={48} />
                            <p>No hotel arrivals found for {new Date(hotelArrivalDate).toLocaleDateString()}</p>
                        </div>
                    ) : (
                        hotelArrivalsData.map((hotel) => (
                            <div key={hotel.hotelId} className="report-group">
                                <h2>
                                    <Building2 size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                                    {hotel.hotelName}{hotel.hotelCity && ` (${hotel.hotelCity})`}
                                </h2>
                                <div className="group-info">
                                    <p><strong>Company:</strong> {formatCompanyNames(hotel.companyNames)}</p>
                                    <p><strong>City:</strong> {hotel.hotelCity || 'N/A'}</p>
                                    <p><strong>Address:</strong> {hotel.hotelAddress || 'N/A'}</p>
                                    <p><strong>Total Arrivals:</strong> {hotel.totalPassengers} passengers</p>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '1rem', color: '#667eea', marginBottom: '0.5rem' }}>Arrivals by Maktab & Flight:</h3>
                                    {hotel.maktabFlightGroups.map((flightGroup, idx) => (
                                        <div
                                            key={`${flightGroup.maktab}-${flightGroup.arrivalFlightNo}-${idx}`}
                                            style={{
                                                background: '#f8f9fa',
                                                padding: '0.75rem',
                                                marginBottom: '0.5rem',
                                                borderRadius: '8px',
                                                borderLeft: '4px solid #667eea'
                                            }}
                                        >
                                            <strong>Maktab {flightGroup.maktab}</strong> |
                                            Flight: {flightGroup.arrivalFlightNo || 'N/A'} ({flightGroup.arrivalAirport || 'N/A'}) |
                                            Company: {formatCompanyNames(flightGroup.companyNames)} |
                                            PAX: {flightGroup.passengers?.length || 0}
                                        </div>
                                    ))}
                                </div>

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
                                        {hotel.maktabFlightGroups.flatMap((flightGroup) => (
                                            (flightGroup.passengers || []).map((passenger) => ({
                                                ...passenger,
                                                maktab: flightGroup.maktab,
                                                flight: flightGroup.arrivalFlightNo
                                            }))
                                        )).map((passenger, index) => (
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
                                                <td colSpan="6" style={{ textAlign: 'center', color: '#999' }}>No passengers assigned yet</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        );
    };

    const renderActiveReport = () => {
        if (reportType === 'arrival') {
            return renderArrivalReport();
        }

        if (reportType === 'arrival-2') {
            return renderArrivalReport2();
        }

        if (reportType === 'departure') {
            return renderDepartureReport();
        }

        if (reportType === 'hotel-arrivals') {
            return renderHotelArrivalsReport();
        }

        return renderMaktabReport();
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
            <div className="dashboard-header">
                <div className="dashboard-header-content flex-between">
                    <div className="dashboard-logo">
                        <div className="dashboard-logo-icon">
                            <FileText size={24} />
                        </div>
                        <div className="dashboard-logo-text">
                            <h1>{company?.name || 'Maktab'}</h1>
                            <p>{isSuperAdmin ? 'Super Admin Travel Reports' : 'Travel Reports & Analytics'}</p>
                        </div>
                    </div>
                    <div className="dashboard-header-tools">
                        <div className="dashboard-search">
                            <Search size={16} />
                            <input type="text" placeholder="Quick search…" />
                        </div>
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
                <button className="nav-item" onClick={() => navigate(isSuperAdmin ? '/super-admin/dashboard' : '/company-admin/dashboard')}>
                    <Home size={20} />
                    <span>Dashboard</span>
                </button>
                {isSuperAdmin ? (
                    <>
                        <button className="nav-item" onClick={() => navigate('/super-admin/companies')}>
                            <Building2 size={20} />
                            <span>Companies</span>
                        </button>
                        <button className="nav-item" onClick={() => navigate('/super-admin/passengers')}>
                            <UserCheck size={20} />
                            <span>Passengers</span>
                        </button>
                        <button className="nav-item" onClick={() => navigate('/hotels')}>
                            <Building2 size={20} />
                            <span>Hotels</span>
                        </button>
                    </>
                ) : (
                    <>
                        <button className="nav-item" onClick={() => navigate('/passengers')}>
                            <UserCheck size={20} />
                            <span>Passengers</span>
                        </button>
                        <button className="nav-item" onClick={() => navigate('/groups')}>
                            <Users size={20} />
                            <span>Groups</span>
                        </button>
                    </>
                )}
                <button className="nav-item active" onClick={() => navigate('/reports/maktab')}>
                    <FileText size={20} />
                    <span>Reports</span>
                </button>
                <div className="reports-nav-group">
                    {reportLinks.map((report) => (
                        <button
                            key={report.key}
                            className={`report-subnav-item${activeReport.key === report.key ? ' active' : ''}`}
                            onClick={() => navigate(report.path)}
                        >
                            <span>{report.navLabel}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="page-content">
                {isSuperAdmin && (
                    <Card>
                        <div className="report-header">
                            <div>
                                <h2 className="report-title">Company Reports</h2>
                                <p className="report-subtitle">Select a company to view the same report set available to company admins</p>
                            </div>
                        </div>

                        <div className="report-filters">
                            <div className="filter-group">
                                <label>Company</label>
                                <select value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value)} className="report-select">
                                    {companies.length === 0 ? (
                                        <option value="">No companies available</option>
                                    ) : (
                                        <>
                                            <option value="all">All Companies</option>
                                            {companies.map((item) => (
                                                <option key={item._id} value={item._id}>{item.name}</option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>
                    </Card>
                )}

                {isSuperAdmin && !selectedCompanyId ? (
                    <Card>
                        <div className="empty-report">
                            <p>Select a company or choose All Companies to view reports.</p>
                        </div>
                    </Card>
                ) : (
                    renderActiveReport()
                )}

                <div className="reports-footer">
                    <div className="company-name">Innovative Layer</div>
                    <div className="contact-info">
                        Phone: +92 333 3775889 | Website: <a href="https://www.innovativelayer.com" target="_blank" rel="noopener noreferrer">www.innovativelayer.com</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
