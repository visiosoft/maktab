import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { companiesAPI, passengersAPI, groupsAPI } from '../services/api';
import {
    Building2,
    LogOut,
    Mail,
    Phone,
    Globe,
    Users,
    Home,
    UserCheck,
    FileText,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    Hotel,
    Plane,
    Calendar,
    AlertCircle,
    PlusCircle,
    BarChart3,
    ArrowRight,
    Clock,
    MapPin
} from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import './Dashboard.css';

const CompanyAdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [stats, setStats] = useState({
        totalPassengers: 0,
        quota: 100,
        remaining: 0,
        maktabCounts: {
            A: 0,
            B: 0,
            C: 0,
            D: 0,
            unassigned: 0
        }
    });
    const [loading, setLoading] = useState(true);
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [showMaktabModal, setShowMaktabModal] = useState(false);
    const [selectedMaktab, setSelectedMaktab] = useState(null);
    const [maktabPassengers, setMaktabPassengers] = useState([]);
    const [loadingPassengers, setLoadingPassengers] = useState(false);
    const [groups, setGroups] = useState([]);
    const [upcomingArrivals, setUpcomingArrivals] = useState([]);
    const [upcomingDepartures, setUpcomingDepartures] = useState([]);
    const [hotelStats, setHotelStats] = useState({});
    const [todayArrivals, setTodayArrivals] = useState([]);
    const [todayDepartures, setTodayDepartures] = useState([]);
    const [recentGroups, setRecentGroups] = useState([]);
    const [flightStats, setFlightStats] = useState({ totalFlights: 0, uniqueRoutes: 0 });

    useEffect(() => {
        fetchCompanyData();
        fetchStats();
        fetchGroups();
    }, []);

    const fetchCompanyData = async () => {
        try {
            const response = await companiesAPI.getAll();
            setCompany(response.data);
        } catch (error) {
            console.error('Error fetching company data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await passengersAPI.getStats();
            setStats({
                totalPassengers: response.data.totalPassengers ?? 0,
                quota: response.data.quota ?? 100,
                remaining: response.data.remaining ?? 0,
                maktabCounts: response.data.maktabCounts ?? {
                    A: 0,
                    B: 0,
                    C: 0,
                    D: 0,
                    unassigned: 0
                }
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            // Keep the default state on error
        }
    };

    const fetchGroups = async () => {
        try {
            const response = await groupsAPI.getAll();
            const groupsData = response.data;
            setGroups(groupsData);

            // Calculate upcoming arrivals (next 7 days)
            const now = new Date();
            const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            const arrivals = groupsData.filter(group => {
                const arrivalDate = new Date(group.arrivalDate);
                return arrivalDate >= now && arrivalDate <= sevenDaysFromNow;
            }).sort((a, b) => new Date(a.arrivalDate) - new Date(b.arrivalDate));

            const departures = groupsData.filter(group => {
                const departureDate = new Date(group.departureDate);
                return departureDate >= now && departureDate <= sevenDaysFromNow;
            }).sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));

            setUpcomingArrivals(arrivals);
            setUpcomingDepartures(departures);

            // Calculate today's arrivals and departures
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const arrivalsToday = groupsData.filter(group => {
                const arrivalDate = new Date(group.arrivalDate);
                arrivalDate.setHours(0, 0, 0, 0);
                return arrivalDate.getTime() === today.getTime();
            });

            const departuresToday = groupsData.filter(group => {
                const departureDate = new Date(group.departureDate);
                departureDate.setHours(0, 0, 0, 0);
                return departureDate.getTime() === today.getTime();
            });

            setTodayArrivals(arrivalsToday);
            setTodayDepartures(departuresToday);

            // Recent groups (last 5)
            const recent = [...groupsData]
                .sort((a, b) => new Date(b.createdAt || b.arrivalDate) - new Date(a.createdAt || a.arrivalDate))
                .slice(0, 5);
            setRecentGroups(recent);

            // Calculate hotel usage stats
            const hotels = {};
            groupsData.forEach(group => {
                const arrivalHotel = group.arrivalHotel || group.hotel;
                const departureHotel = group.departureHotel;

                if (arrivalHotel) {
                    const hotelId = arrivalHotel._id || arrivalHotel;
                    const hotelName = arrivalHotel.name || 'Unknown Hotel';
                    if (!hotels[hotelId]) {
                        hotels[hotelId] = { name: hotelName, count: 0 };
                    }
                    hotels[hotelId].count += group.passengerCount || 0;
                }
            });

            setHotelStats(hotels);

            // Calculate flight statistics
            const uniqueArrivalFlights = new Set(groupsData.map(g => g.arrivalFlightNo).filter(Boolean));
            const uniqueDepartureFlights = new Set(groupsData.map(g => g.departureFlightNo).filter(Boolean));
            const allFlights = new Set([...uniqueArrivalFlights, ...uniqueDepartureFlights]);
            setFlightStats({
                totalFlights: allFlights.size,
                uniqueRoutes: uniqueArrivalFlights.size
            });
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const fetchMaktabPassengers = async (maktab) => {
        setLoadingPassengers(true);
        try {
            const response = await passengersAPI.getAll();
            console.log('All passengers:', response.data);
            console.log('Looking for maktab:', maktab);
            console.log('Sample passenger group structure:', response.data[0]?.group);

            const filtered = response.data.filter(passenger => {
                console.log(`Passenger ${passenger.firstName}: group =`, passenger.group, 'maktab =', passenger.group?.maktab);
                return maktab === 'unassigned'
                    ? (!passenger.group || !passenger.group.maktab)
                    : passenger.group?.maktab === maktab;
            });

            console.log('Filtered passengers:', filtered);
            setMaktabPassengers(filtered);
        } catch (error) {
            console.error('Error fetching maktab passengers:', error);
            setMaktabPassengers([]);
        } finally {
            setLoadingPassengers(false);
        }
    };

    const handleMaktabClick = (maktab) => {
        setSelectedMaktab(maktab);
        setShowMaktabModal(true);
        fetchMaktabPassengers(maktab);
    };

    if (loading) {
        return <div className="flex-center" style={{ minHeight: '100vh' }}>Loading...</div>;
    }

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-logo">
                        <div className="dashboard-logo-icon">
                            <Building2 size={28} />
                        </div>
                        <div className="dashboard-logo-text" onClick={() => setShowCompanyModal(true)} style={{ cursor: 'pointer' }}>
                            <h1>{company?.name || 'Loading...'}</h1>
                            <p>Company Admin Portal</p>
                        </div>
                    </div>
                    <div className="dashboard-user">
                        <div className="dashboard-user-info">
                            <p>Logged in as</p>
                            <h3>{user?.email}</h3>
                        </div>
                        <Button variant="danger" size="small" icon={<LogOut size={18} />} onClick={logout}>
                            Logout
                        </Button>
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <div className="dashboard-nav">
                <button
                    className="nav-item active"
                    onClick={() => navigate('/company-admin/dashboard')}
                >
                    <Home size={20} />
                    <span>Dashboard</span>
                </button>
                <button
                    className="nav-item"
                    onClick={() => navigate('/passengers')}
                >
                    <UserCheck size={20} />
                    <span>Passengers</span>
                </button>
                <button
                    className="nav-item"
                    onClick={() => navigate('/groups')}
                >
                    <Users size={20} />
                    <span>Groups</span>
                </button>
                <button
                    className="nav-item"
                    onClick={() => navigate('/reports')}
                >
                    <FileText size={20} />
                    <span>Reports</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="dashboard-container">
                <div className="dashboard-welcome fade-in">
                    <h2>Welcome, {user?.username}!</h2>
                    <p>Monitor your passenger quota and allocations.</p>
                </div>

                {/* Quota Overview Cards */}
                <div className="fade-in">
                    <h3 className="section-title">Quota Overview</h3>
                    <div className="quota-cards">
                        <div className="quota-card primary-card">
                            <div className="quota-card-header">
                                <div className="quota-icon">
                                    <CheckCircle2 size={32} />
                                </div>
                                <div className="quota-trend">
                                    <TrendingUp size={20} />
                                </div>
                            </div>
                            <div className="quota-card-body">
                                <h2>{stats.quota}</h2>
                                <p>Total Quota</p>
                                <div className="quota-subtitle">Maximum passengers allowed</div>
                            </div>
                        </div>

                        <div className="quota-card success-card">
                            <div className="quota-card-header">
                                <div className="quota-icon">
                                    <Users size={32} />
                                </div>
                                <div className="quota-trend">
                                    {stats.totalPassengers > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                </div>
                            </div>
                            <div className="quota-card-body">
                                <h2>{stats.totalPassengers}</h2>
                                <p>Passengers Added</p>
                                <div className="quota-subtitle">
                                    {Math.round((stats.totalPassengers / stats.quota) * 100)}% of quota used
                                </div>
                            </div>
                        </div>

                        <div className="quota-card warning-card">
                            <div className="quota-card-header">
                                <div className="quota-icon">
                                    <UserCheck size={32} />
                                </div>
                                <div className="quota-trend">
                                    {stats.remaining > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                </div>
                            </div>
                            <div className="quota-card-body">
                                <h2>{stats.remaining}</h2>
                                <p>Remaining Slots</p>
                                <div className="quota-subtitle">Available for new passengers</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Maktab Distribution */}
                <div className="fade-in" style={{ marginTop: '2rem' }}>
                    <h3 className="section-title">Maktab Distribution</h3>
                    <div className="maktab-cards">
                        <div className="maktab-card maktab-a" onClick={() => handleMaktabClick('A')} style={{ cursor: 'pointer' }}>
                            <div className="maktab-label">Maktab A</div>
                            <div className="maktab-count">{stats.maktabCounts?.A ?? 0}</div>
                            <div className="maktab-progress">
                                <div
                                    className="maktab-progress-bar"
                                    style={{ width: `${((stats.maktabCounts?.A ?? 0) / Math.max(stats.totalPassengers, 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="maktab-card maktab-b" onClick={() => handleMaktabClick('B')} style={{ cursor: 'pointer' }}>
                            <div className="maktab-label">Maktab B</div>
                            <div className="maktab-count">{stats.maktabCounts?.B ?? 0}</div>
                            <div className="maktab-progress">
                                <div
                                    className="maktab-progress-bar"
                                    style={{ width: `${((stats.maktabCounts?.B ?? 0) / Math.max(stats.totalPassengers, 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="maktab-card maktab-c" onClick={() => handleMaktabClick('C')} style={{ cursor: 'pointer' }}>
                            <div className="maktab-label">Maktab C</div>
                            <div className="maktab-count">{stats.maktabCounts?.C ?? 0}</div>
                            <div className="maktab-progress">
                                <div
                                    className="maktab-progress-bar"
                                    style={{ width: `${((stats.maktabCounts?.C ?? 0) / Math.max(stats.totalPassengers, 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="maktab-card maktab-d" onClick={() => handleMaktabClick('D')} style={{ cursor: 'pointer' }}>
                            <div className="maktab-label">Maktab D</div>
                            <div className="maktab-count">{stats.maktabCounts?.D ?? 0}</div>
                            <div className="maktab-progress">
                                <div
                                    className="maktab-progress-bar"
                                    style={{ width: `${((stats.maktabCounts?.D ?? 0) / Math.max(stats.totalPassengers, 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="maktab-card maktab-unassigned" onClick={() => handleMaktabClick('unassigned')} style={{ cursor: 'pointer' }}>
                            <div className="maktab-label">Unassigned</div>
                            <div className="maktab-count">{stats.maktabCounts?.unassigned ?? 0}</div>
                            <div className="maktab-progress">
                                <div
                                    className="maktab-progress-bar"
                                    style={{ width: `${((stats.maktabCounts?.unassigned ?? 0) / Math.max(stats.totalPassengers, 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Card */}
                <div className="fade-in" style={{ marginTop: '2rem' }}>
                    <h3 className="section-title">Quick Actions</h3>
                    <div className="quick-actions-grid">
                        <button className="action-card" onClick={() => navigate('/groups')}>
                            <div className="action-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                <Users size={24} />
                            </div>
                            <div className="action-content">
                                <div className="action-title">Create Group</div>
                                <div className="action-subtitle">Add new travel group</div>
                            </div>
                            <ArrowRight size={20} />
                        </button>

                        <button className="action-card" onClick={() => navigate('/passengers')}>
                            <div className="action-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                                <UserCheck size={24} />
                            </div>
                            <div className="action-content">
                                <div className="action-title">Add Passenger</div>
                                <div className="action-subtitle">Register new traveler</div>
                            </div>
                            <ArrowRight size={20} />
                        </button>

                        <button className="action-card" onClick={() => navigate('/reports')}>
                            <div className="action-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                                <FileText size={24} />
                            </div>
                            <div className="action-content">
                                <div className="action-title">View Reports</div>
                                <div className="action-subtitle">Generate travel reports</div>
                            </div>
                            <ArrowRight size={20} />
                        </button>

                        <button className="action-card" onClick={() => navigate('/groups')}>
                            <div className="action-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                                <BarChart3 size={24} />
                            </div>
                            <div className="action-content">
                                <div className="action-title">Manage Groups</div>
                                <div className="action-subtitle">View & edit groups</div>
                            </div>
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Quick Insights Grid */}
                <div className="fade-in" style={{ marginTop: '2rem' }}>
                    <h3 className="section-title">Quick Insights</h3>
                    <div className="quick-stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                <Users size={24} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{groups.length}</div>
                                <div className="stat-label">Total Groups</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                                <Hotel size={24} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{Object.keys(hotelStats).length}</div>
                                <div className="stat-label">Hotels Used</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                                <Plane size={24} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{upcomingArrivals.length}</div>
                                <div className="stat-label">Coming Soon</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                                <Calendar size={24} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{upcomingDepartures.length}</div>
                                <div className="stat-label">Departing Soon</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Today's Schedule */}
                <div className="fade-in" style={{ marginTop: '2rem' }}>
                    <h3 className="section-title">
                        <Clock size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                        Today's Schedule
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="schedule-card">
                            <div className="schedule-header" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                                <Plane size={20} />
                                <span>Arrivals Today</span>
                                <span className="schedule-count">{todayArrivals.length}</span>
                            </div>
                            <div className="schedule-body">
                                {todayArrivals.length > 0 ? (
                                    todayArrivals.map(group => (
                                        <div key={group._id} className="schedule-item">
                                            <div className="schedule-time">{new Date(group.arrivalDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            <div className="schedule-details">
                                                <div className="schedule-flight">Flight {group.arrivalFlightNo}</div>
                                                <div className="schedule-meta">Maktab {group.maktab} • {group.passengerCount || 0} pax</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="schedule-empty">No arrivals scheduled for today</div>
                                )}
                            </div>
                        </div>

                        <div className="schedule-card">
                            <div className="schedule-header" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                                <Plane size={20} style={{ transform: 'rotate(45deg)' }} />
                                <span>Departures Today</span>
                                <span className="schedule-count">{todayDepartures.length}</span>
                            </div>
                            <div className="schedule-body">
                                {todayDepartures.length > 0 ? (
                                    todayDepartures.map(group => (
                                        <div key={group._id} className="schedule-item">
                                            <div className="schedule-time">{new Date(group.departureDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            <div className="schedule-details">
                                                <div className="schedule-flight">Flight {group.departureFlightNo}</div>
                                                <div className="schedule-meta">Maktab {group.maktab} • {group.passengerCount || 0} pax</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="schedule-empty">No departures scheduled for today</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Groups & Top Hotels */}
                <div className="fade-in" style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        {/* Recent Groups */}
                        <div>
                            <h3 className="section-title">Recent Groups</h3>
                            <div className="report-card">
                                {recentGroups.length > 0 ? (
                                    recentGroups.map(group => (
                                        <div key={group._id} className="report-item">
                                            <div className="report-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                                <Users size={16} />
                                            </div>
                                            <div className="report-content">
                                                <div className="report-title">Maktab {group.maktab} • {group.arrivalCity || 'N/A'}</div>
                                                <div className="report-meta">
                                                    Arrival: {new Date(group.arrivalDate).toLocaleDateString()} • {group.passengerCount || 0} passengers
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state">
                                        <AlertCircle size={32} />
                                        <p>No groups created yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Hotels */}
                        <div>
                            <h3 className="section-title">Top Hotels</h3>
                            <div className="report-card">
                                {Object.keys(hotelStats).length > 0 ? (
                                    Object.entries(hotelStats)
                                        .sort((a, b) => b[1].count - a[1].count)
                                        .slice(0, 5)
                                        .map(([hotelId, data]) => (
                                            <div key={hotelId} className="report-item">
                                                <div className="report-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                                                    <Hotel size={16} />
                                                </div>
                                                <div className="report-content">
                                                    <div className="report-title">{data.name}</div>
                                                    <div className="report-meta">{data.count} passengers booked</div>
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <div className="empty-state">
                                        <Hotel size={32} />
                                        <p>No hotel bookings yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Arrivals & Departures */}
                <div className="fade-in" style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                        {/* Upcoming Arrivals */}
                        <div>
                            <h3 className="section-title">
                                <Plane size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                                Upcoming Arrivals (Next 7 Days)
                            </h3>
                            <div className="activity-list">
                                {upcomingArrivals.length > 0 ? (
                                    upcomingArrivals.slice(0, 5).map(group => (
                                        <div key={group._id} className="activity-item">
                                            <div className="activity-icon arrival-icon">
                                                <Plane size={16} />
                                            </div>
                                            <div className="activity-content">
                                                <div className="activity-title">Maktab {group.maktab}</div>
                                                <div className="activity-meta">
                                                    {new Date(group.arrivalDate).toLocaleDateString()} • Flight {group.arrivalFlightNo} • Maktab {group.maktab}
                                                </div>
                                                <div className="activity-detail">
                                                    {group.passengerCount || 0} passengers → {(group.arrivalHotel || group.hotel)?.name || 'Hotel TBD'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state">
                                        <AlertCircle size={32} />
                                        <p>No arrivals scheduled for the next 7 days</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Upcoming Departures */}
                        <div>
                            <h3 className="section-title">
                                <Plane size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem', transform: 'rotate(45deg)' }} />
                                Upcoming Departures (Next 7 Days)
                            </h3>
                            <div className="activity-list">
                                {upcomingDepartures.length > 0 ? (
                                    upcomingDepartures.slice(0, 5).map(group => (
                                        <div key={group._id} className="activity-item">
                                            <div className="activity-icon departure-icon">
                                                <Plane size={16} style={{ transform: 'rotate(45deg)' }} />
                                            </div>
                                            <div className="activity-content">
                                                <div className="activity-title">Maktab {group.maktab}</div>
                                                <div className="activity-meta">
                                                    {new Date(group.departureDate).toLocaleDateString()} • Flight {group.departureFlightNo} • Maktab {group.maktab}
                                                </div>
                                                <div className="activity-detail">
                                                    {group.passengerCount || 0} passengers from {group.departureHotel?.name || (group.arrivalHotel || group.hotel)?.name || 'Hotel TBD'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state">
                                        <AlertCircle size={32} />
                                        <p>No departures scheduled for the next 7 days</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quota Progress Bar */}
                <div className="fade-in" style={{ marginTop: '2rem' }}>
                    <h3 className="section-title">Quota Usage</h3>
                    <div className="quota-progress-container">
                        <div className="quota-progress-header">
                            <span className="quota-progress-label">
                                <strong>{stats.totalPassengers}</strong> of <strong>{stats.quota}</strong> passengers
                            </span>
                            <span className="quota-progress-percentage">
                                {stats.quota > 0 ? Math.round((stats.totalPassengers / stats.quota) * 100) : 0}%
                            </span>
                        </div>
                        <div className="quota-progress-bar-wrapper">
                            <div
                                className="quota-progress-bar-fill"
                                style={{
                                    width: `${stats.quota > 0 ? (stats.totalPassengers / stats.quota) * 100 : 0}%`,
                                    background: stats.totalPassengers > stats.quota * 0.9
                                        ? 'linear-gradient(90deg, #f5576c 0%, #f093fb 100%)'
                                        : stats.totalPassengers > stats.quota * 0.7
                                            ? 'linear-gradient(90deg, #fee140 0%, #fa709a 100%)'
                                            : 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'
                                }}
                            ></div>
                        </div>
                        <div className="quota-progress-footer">
                            <span className="quota-progress-info">
                                {stats.remaining > 0 ? (
                                    <><CheckCircle2 size={16} /> {stats.remaining} slots available</>
                                ) : (
                                    <><AlertCircle size={16} /> Quota reached</>
                                )}
                            </span>
                            {stats.totalPassengers > stats.quota && (
                                <span className="quota-warning">
                                    <AlertCircle size={16} /> {stats.totalPassengers - stats.quota} over limit
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="reports-footer">
                <div className="company-name">Innovative Layer</div>
                <div className="contact-info">
                    Phone: +92 333 3775889 | Website: <a href="https://www.innovativelayer.com" target="_blank" rel="noopener noreferrer">www.innovativelayer.com</a>
                </div>
            </div>

            {/* Company Information Modal */}
            <Modal
                isOpen={showCompanyModal}
                onClose={() => setShowCompanyModal(false)}
                title="Company Information"
            >
                {company ? (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <strong style={{ color: '#667eea' }}>Company Name:</strong>
                            <p style={{ margin: '0.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
                                {company.name}
                            </p>
                        </div>
                        <div>
                            <strong style={{ color: '#667eea', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Mail size={16} /> Email:
                            </strong>
                            <p style={{ margin: '0.5rem 0' }}>{company.email}</p>
                        </div>
                        {company.phone && (
                            <div>
                                <strong style={{ color: '#667eea', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Phone size={16} /> Phone:
                                </strong>
                                <p style={{ margin: '0.5rem 0' }}>{company.phone}</p>
                            </div>
                        )}
                        {company.industry && (
                            <div>
                                <strong style={{ color: '#667eea' }}>Industry:</strong>
                                <p style={{ margin: '0.5rem 0' }}>{company.industry}</p>
                            </div>
                        )}
                        {company.website && (
                            <div>
                                <strong style={{ color: '#667eea', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Globe size={16} /> Website:
                                </strong>
                                <p style={{ margin: '0.5rem 0' }}>
                                    <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
                                        {company.website}
                                    </a>
                                </p>
                            </div>
                        )}
                        <div>
                            <strong style={{ color: '#667eea', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users size={16} /> Passenger Quota:
                            </strong>
                            <p style={{ margin: '0.5rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                                {company.passengerQuota || 100} passengers
                            </p>
                        </div>
                        <div>
                            <strong style={{ color: '#667eea' }}>Status:</strong>
                            <p style={{ margin: '0.5rem 0' }}>
                                <span className={`company-status ${company.isActive ? 'active' : 'inactive'}`}>
                                    {company.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </p>
                        </div>
                    </div>
                ) : (
                    <p>No company data available.</p>
                )}
            </Modal>

            {/* Maktab Passengers Modal */}
            <Modal
                isOpen={showMaktabModal}
                onClose={() => setShowMaktabModal(false)}
                title={`Maktab ${selectedMaktab === 'unassigned' ? 'Unassigned' : selectedMaktab} - Passengers`}
            >
                {loadingPassengers ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Loading passengers...</div>
                ) : maktabPassengers.length > 0 ? (
                    <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        <table className="data-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Passport Number</th>
                                    <th>Phone</th>
                                    <th>Hotel</th>
                                </tr>
                            </thead>
                            <tbody>
                                {maktabPassengers.map((passenger) => (
                                    <tr key={passenger._id}>
                                        <td>{passenger.firstName} {passenger.lastName}</td>
                                        <td>{passenger.passportNo}</td>
                                        <td>{passenger.phone || '-'}</td>
                                        <td>{passenger.group?.hotel?.name || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ marginTop: '1rem', textAlign: 'center', color: '#667eea', fontWeight: '600' }}>
                            Total: {maktabPassengers.length} passenger{maktabPassengers.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                        No passengers found in this maktab.
                    </p>
                )}
            </Modal>
        </div>
    );
};

export default CompanyAdminDashboard;
