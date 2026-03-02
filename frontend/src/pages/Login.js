import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Building2, AlertCircle } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import './Login.css';

const Login = () => {
    const [userType, setUserType] = useState('super_admin');
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

    return (
        <div className="login-container">
            <div className="login-card fade-in">
                <div className="login-header">
                    <div className="login-logo">
                        <Building2 size={40} />
                    </div>
                    <h1 className="login-title">Maktab</h1>
                    <p className="login-subtitle">Multi-Company Management System</p>
                </div>

                <div className="login-tabs">
                    <button
                        className={`login-tab ${userType === 'super_admin' ? 'active' : ''}`}
                        onClick={() => setUserType('super_admin')}
                    >
                        Super Admin
                    </button>
                    <button
                        className={`login-tab ${userType === 'company_admin' ? 'active' : ''}`}
                        onClick={() => setUserType('company_admin')}
                    >
                        Company Admin
                    </button>
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
