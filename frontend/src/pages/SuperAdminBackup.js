import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Building2, Download, FileText, Home, LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { superAdminAPI } from '../services/api';
import Button from '../components/Button';
import './Dashboard.css';
import './SuperAdminBackup.css';

const getTimestampLabel = (value) => new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium'
}).format(value);

const getFilenameFromDisposition = (headerValue) => {
    if (!headerValue) {
        return null;
    }

    const match = headerValue.match(/filename="?([^";]+)"?/i);
    return match ? match[1] : null;
};

const getFallbackFilename = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `maktab-backup-${timestamp}.json`;
};

const SuperAdminBackup = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isDownloading, setIsDownloading] = useState(false);
    const [lastBackupAt, setLastBackupAt] = useState(null);
    const [statusMessage, setStatusMessage] = useState(null);

    const handleBackupDownload = async () => {
        try {
            setIsDownloading(true);
            setStatusMessage(null);

            const response = await superAdminAPI.downloadBackup();
            const filename = getFilenameFromDisposition(response.headers['content-disposition']) || getFallbackFilename();
            const blob = new Blob([response.data], { type: 'application/json' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            const completedAt = new Date();
            setLastBackupAt(completedAt);
            setStatusMessage({
                type: 'success',
                text: `Backup downloaded to your browser's default download location as ${filename}.`
            });
        } catch (error) {
            console.error('Error downloading backup:', error);
            setStatusMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to download database backup.'
            });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="dashboard super-admin-backup-page">
            <div className="dashboard-header">
                <div className="dashboard-header-content flex-between">
                    <div className="dashboard-logo">
                        <div className="dashboard-logo-icon">
                            <Download size={24} />
                        </div>
                        <div className="dashboard-logo-text">
                            <h1>AL NAFI MUNAZZAM
                            </h1>
                            <p>Database Backup</p>
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
                <button className="nav-item active" onClick={() => navigate('/super-admin/backup')}>
                    <Download size={20} />
                    <span>Backup</span>
                </button>
            </div>

            <div className="dashboard-container">
                <div className="dashboard-welcome fade-in">
                    <h2>Full Database Backup</h2>
                    <p>Download a full JSON backup of the application database to your local computer with the current date and time in the file name.</p>
                </div>

                <div className="backup-grid fade-in">
                    <section className="backup-card primary">
                        <h3>Create Backup</h3>
                        <p>The downloaded file includes super admins, companies, company admins, hotels, groups, and passengers.</p>
                        <Button variant="primary" icon={<Download size={18} />} onClick={handleBackupDownload} disabled={isDownloading}>
                            {isDownloading ? 'Preparing Backup...' : 'Download Full Backup'}
                        </Button>
                        <p className="backup-help-text">Your browser will save the file to your default download folder unless you choose a different location.</p>
                    </section>

                    <section className="backup-card">
                        <h3>Latest Download</h3>
                        <div className="backup-detail-row">
                            <span>Status</span>
                            <strong>{lastBackupAt ? 'Completed' : 'Not downloaded yet'}</strong>
                        </div>
                        <div className="backup-detail-row">
                            <span>Downloaded At</span>
                            <strong>{lastBackupAt ? getTimestampLabel(lastBackupAt) : 'Waiting for first backup'}</strong>
                        </div>
                        <div className="backup-detail-row">
                            <span>Format</span>
                            <strong>JSON</strong>
                        </div>
                    </section>
                </div>

                {statusMessage && (
                    <div className={`backup-status ${statusMessage.type}`}>
                        {statusMessage.text}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdminBackup;