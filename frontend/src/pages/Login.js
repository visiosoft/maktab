import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Building2, AlertCircle, Shield, Users, ArrowLeft } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import './Login.css';

const Login = () => {
    const [userType, setUserType] = useState(null); // null means showing selection screen
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleUserTypeSelection = (type) => {
        setUserType(type);
        setError('');
        setFormData({ email: '', password: '' });
    };

    const handleBack = () => {
        setUserType(null);
        setError('');
        setFormData({ email: '', password: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(formData.email, formData.password, userType);

            if (result.success) {
                if (userType === 'super_admin') {
                    navigate('/super-admin/dashboard');
                } else {
                    navigate('/company-admin/dashboard');
                }
            } else {
                setError(result.message || 'Login failed');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Selection Screen
    if (userType === null) {
        return (
            <div className="login-container">
                <div className="login-card login-card-wide fade-in">
                    <div className="login-header">
                        <div className="login-logo">
                            <Building2 size={48} />
                        </div>
                        <h1 className="login-title">Maktab</h1>
                        <p className="login-subtitle">Multi-Company Management System</p>
                    </div>

                    <div className="user-type-selection">
                        <h2 className="selection-title">Choose Your Login Type</h2>
                        <p className="selection-subtitle">Select how you want to sign in</p>

                        <div className="user-type-buttons">
                            <button
                                className="user-type-button super-admin-button"
                                onClick={() => handleUserTypeSelection('super_admin')}
                            >
                                <div className="user-type-icon">
                                    <Shield size={48} />
                                </div>
                                <h3 className="user-type-title">Super Admin</h3>
                                <p className="user-type-description">
                                    Manage all companies, admins, and system settings
                                </p>
                            </button>

                            <button
                                className="user-type-button company-admin-button"
                                onClick={() => handleUserTypeSelection('company_admin')}
                            >
                                <div className="user-type-icon">
                                    <Users size={48} />
                                </div>
                                <h3 className="user-type-title">Company Admin</h3>
                                <p className="user-type-description">
                                    Manage your company's groups and passengers
                                </p>
                            </button>
                        </div>
                    </div>

                    <div className="login-footer">
                        <p>© 2026 Maktab. All rights reserved.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Login Form Screen
    return (
        <div className="login-container">
            <div className="login-card fade-in">
                <button className="back-button" onClick={handleBack}>
                    <ArrowLeft size={20} />
                    <span>Back to selection</span>
                </button>

                <div className="login-header">
                    <div className={`login-logo ${userType === 'super_admin' ? 'super-admin-logo' : 'company-admin-logo'}`}>
                        {userType === 'super_admin' ? <Shield size={40} /> : <Users size={40} />}
                    </div>
                    <h1 className="login-title">
                        {userType === 'super_admin' ? 'Super Admin Login' : 'Company Admin Login'}
                    </h1>
                    <p className="login-subtitle">
                        {userType === 'super_admin'
                            ? 'Sign in to manage the system'
                            : 'Sign in to manage your company'}
                    </p>
                </div>

                {error && (
                    <div className="login-error">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <Input
                        label="Email Address"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                        icon={<Mail size={20} />}
                    />

                    <Input
                        label="Password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        icon={<Lock size={20} />}
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                        style={{ width: '100%' }}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                </form>

                <div className="login-footer">
                    <p>© 2026 Maktab. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
