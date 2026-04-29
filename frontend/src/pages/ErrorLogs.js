import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Building2, FileText, Home, LogOut, UserCheck, AlertTriangle, CheckCircle, XCircle, Clock, User, Globe, Monitor, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { errorLogsAPI } from '../services/api';
import Button from '../components/Button';
import './Dashboard.css';
import './ErrorLogs.css';

const ErrorLogs = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        type: '',
        resolved: '',
    });

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const params = { page, limit: 30 };
            if (filters.search) params.search = filters.search;
            if (filters.type) params.type = filters.type;
            if (filters.resolved) params.resolved = filters.resolved;

            const response = await errorLogsAPI.getAll(params);
            setLogs(response.data.logs);
            setTotal(response.data.total);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Failed to fetch error logs:', error);
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Debounced search
    const [searchInput, setSearchInput] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters(f => ({ ...f, search: searchInput }));
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const handleToggleResolve = async (id, e) => {
        e.stopPropagation();
        try {
            await errorLogsAPI.toggleResolve(id);
            fetchLogs();
        } catch (error) {
            console.error('Failed to toggle resolve:', error);
        }
    };

    const handleClearResolved = async () => {
        if (!window.confirm('Delete all resolved error logs?')) return;
        try {
            await errorLogsAPI.clearResolved();
            fetchLogs();
        } catch (error) {
            console.error('Failed to clear resolved:', error);
        }
    };

    const formatDate = (dateStr) => {
        return new Intl.DateTimeFormat('en-GB', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(dateStr));
    };

    const unresolvedCount = logs.filter(l => !l.resolved).length;

    return (
        <div className="dashboard error-logs-page">
            <div className="dashboard-header">
                <div className="dashboard-header-content flex-between">
                    <div className="dashboard-logo">
                        <div className="dashboard-logo-icon">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="dashboard-logo-text">
                            <h1>AL NAFI MUNAZZAM</h1>
                            <p>Error Logs</p>
                        </div>
                    </div>
                    <div className="dashboard-header-tools">
                        <button className="dashboard-notification" title="Notifications">
                            <Bell size={20} />
                        </button>
                        <div className="dashboard-user">
                            <div className="dashboard-avatar">
                                {user?.email?.[0]?.toUpperCase() || 'A'}
                            </div>
                            <div className="dashboard-user-info">
                                <p>Logged in as</p>
                                <h3>{user?.email}</h3>
                            </div>
                            <Button variant="secondary" size="small" icon={<LogOut size={16} />} onClick={logout}>
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-nav">
                <button className="nav-item" onClick={() => navigate('/super-admin/dashboard')}>
                    <Home size={20} />
                    <span>Dashboard</span>
                </button>
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
                <button className="nav-item" onClick={() => navigate('/reports')}>
                    <FileText size={20} />
                    <span>Reports</span>
                </button>
                <button className="nav-item active" onClick={() => navigate('/super-admin/error-logs')}>
                    <AlertTriangle size={20} />
                    <span>Error Logs</span>
                </button>
            </div>

            <div className="dashboard-container">
                <div className="dashboard-welcome fade-in">
                    <h2>Error Logs</h2>
                    <p>Monitor and review errors reported by users in production.</p>
                </div>

                <div className="error-logs-stats fade-in">
                    <div className="error-stat-card">
                        <div className="stat-icon total"><Monitor size={20} /></div>
                        <div>
                            <div className="stat-value">{total}</div>
                            <div className="stat-label">Total Errors</div>
                        </div>
                    </div>
                    <div className="error-stat-card">
                        <div className="stat-icon unresolved"><XCircle size={20} /></div>
                        <div>
                            <div className="stat-value">{unresolvedCount}</div>
                            <div className="stat-label">Unresolved</div>
                        </div>
                    </div>
                </div>

                <div className="error-logs-toolbar fade-in">
                    <input
                        type="text"
                        placeholder="Search by message, email, or page URL..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <select
                        value={filters.type}
                        onChange={(e) => { setFilters(f => ({ ...f, type: e.target.value })); setPage(1); }}
                    >
                        <option value="">All Types</option>
                        <option value="api">API</option>
                        <option value="runtime">Runtime</option>
                        <option value="unhandled_rejection">Unhandled Rejection</option>
                        <option value="network">Network</option>
                        <option value="unknown">Unknown</option>
                    </select>
                    <select
                        value={filters.resolved}
                        onChange={(e) => { setFilters(f => ({ ...f, resolved: e.target.value })); setPage(1); }}
                    >
                        <option value="">All Status</option>
                        <option value="false">Unresolved</option>
                        <option value="true">Resolved</option>
                    </select>
                    <Button variant="secondary" size="small" icon={<Trash2 size={14} />} onClick={handleClearResolved}>
                        Clear Resolved
                    </Button>
                </div>

                {loading ? (
                    <div className="flex-center" style={{ padding: '3rem' }}>Loading...</div>
                ) : logs.length === 0 ? (
                    <div className="error-logs-empty fade-in">
                        <CheckCircle size={48} />
                        <h3>No errors found</h3>
                        <p>Everything looks good!</p>
                    </div>
                ) : (
                    <>
                        <div className="error-log-list fade-in">
                            {logs.map((log) => (
                                <div
                                    key={log._id}
                                    className={`error-log-item ${log.resolved ? 'resolved' : 'unresolved'}`}
                                    onClick={() => setExpandedId(expandedId === log._id ? null : log._id)}
                                >
                                    <div className="error-log-header">
                                        <div className="error-log-message">{log.message}</div>
                                        <span className={`error-log-type ${log.type}`}>{log.type}</span>
                                    </div>
                                    <div className="error-log-meta">
                                        <span><Clock size={13} /> {formatDate(log.createdAt)}</span>
                                        {log.userEmail && <span><User size={13} /> {log.userEmail}</span>}
                                        {log.userRole && <span>({log.userRole})</span>}
                                        {log.pageUrl && <span><Globe size={13} /> {log.pageUrl.replace(/https?:\/\/[^/]+/, '')}</span>}
                                        {log.statusCode && <span>Status: {log.statusCode}</span>}
                                        {log.method && log.url && <span>{log.method} {log.url}</span>}
                                    </div>

                                    {expandedId === log._id && (
                                        <div className="error-log-detail">
                                            {log.userAgent && (
                                                <div className="error-log-detail-row">
                                                    <strong>User Agent:</strong>
                                                    <span>{log.userAgent}</span>
                                                </div>
                                            )}
                                            {log.companyId && (
                                                <div className="error-log-detail-row">
                                                    <strong>Company ID:</strong>
                                                    <span>{log.companyId}</span>
                                                </div>
                                            )}
                                            {log.stack && (
                                                <>
                                                    <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Stack Trace:</strong>
                                                    <pre>{log.stack}</pre>
                                                </>
                                            )}
                                            {log.meta && (
                                                <>
                                                    <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Extra Data:</strong>
                                                    <pre>{JSON.stringify(log.meta, null, 2)}</pre>
                                                </>
                                            )}
                                            <div className="error-log-actions">
                                                <Button
                                                    variant={log.resolved ? 'secondary' : 'primary'}
                                                    size="small"
                                                    icon={log.resolved ? <XCircle size={14} /> : <CheckCircle size={14} />}
                                                    onClick={(e) => handleToggleResolve(log._id, e)}
                                                >
                                                    {log.resolved ? 'Mark Unresolved' : 'Mark Resolved'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="error-logs-pagination">
                                <Button
                                    variant="secondary"
                                    size="small"
                                    icon={<ChevronLeft size={14} />}
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    Previous
                                </Button>
                                <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant="secondary"
                                    size="small"
                                    icon={<ChevronRight size={14} />}
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ErrorLogs;
