import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import CompanyAdminDashboard from './pages/CompanyAdminDashboard';
import Hotels from './pages/Hotels';
import Groups from './pages/Groups';
import GroupForm from './pages/GroupForm';
import GroupPassengers from './pages/GroupPassengers';
import Reports from './pages/Reports';
import Passengers from './pages/Passengers';

const PrivateRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="flex-center" style={{ minHeight: '100vh' }}>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/login" />;
    }

    return children;
};

function AppRoutes() {
    const { user } = useAuth();

    return (
        <Routes>
            <Route
                path="/login"
                element={user ? <Navigate to={user.role === 'super_admin' ? '/super-admin/dashboard' : '/company-admin/dashboard'} /> : <Login />}
            />
            <Route
                path="/super-admin/dashboard"
                element={
                    <PrivateRoute requiredRole="super_admin">
                        <SuperAdminDashboard />
                    </PrivateRoute>
                }
            />
            <Route
                path="/company-admin/dashboard"
                element={
                    <PrivateRoute requiredRole="company_admin">
                        <CompanyAdminDashboard />
                    </PrivateRoute>
                }
            />
            <Route
                path="/hotels"
                element={
                    <PrivateRoute requiredRole="company_admin">
                        <Hotels />
                    </PrivateRoute>
                }
            />
            <Route
                path="/passengers"
                element={
                    <PrivateRoute requiredRole="company_admin">
                        <Passengers />
                    </PrivateRoute>
                }
            />
            <Route
                path="/groups"
                element={
                    <PrivateRoute requiredRole="company_admin">
                        <Groups />
                    </PrivateRoute>
                }
            />
            <Route
                path="/groups/new"
                element={
                    <PrivateRoute requiredRole="company_admin">
                        <GroupForm />
                    </PrivateRoute>
                }
            />
            <Route
                path="/groups/:id/edit"
                element={
                    <PrivateRoute requiredRole="company_admin">
                        <GroupForm />
                    </PrivateRoute>
                }
            />
            <Route
                path="/groups/:id/passengers"
                element={
                    <PrivateRoute requiredRole="company_admin">
                        <GroupPassengers />
                    </PrivateRoute>
                }
            />
            <Route
                path="/reports"
                element={
                    <PrivateRoute requiredRole="company_admin">
                        <Reports />
                    </PrivateRoute>
                }
            />
            <Route
                path="/"
                element={
                    user ? (
                        <Navigate to={user.role === 'super_admin' ? '/super-admin/dashboard' : '/company-admin/dashboard'} />
                    ) : (
                        <Navigate to="/login" />
                    )
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}

export default App;
