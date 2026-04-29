import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5010/api';

// Store for current page form data - pages can register their form state here
let _currentFormData = null;

export function setFormDataForErrorLog(data) {
    _currentFormData = data;
}

export function clearFormDataForErrorLog() {
    _currentFormData = null;
}

export function getCurrentFormData() {
    return _currentFormData;
}

function getUserContext() {
    try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        return {
            userId: userData._id || userData.id,
            userEmail: userData.email,
            userRole: userData.role,
            companyId: userData.companyId,
        };
    } catch {
        return {};
    }
}

function sendErrorLog(errorData) {
    // Attach any current form data
    if (_currentFormData) {
        errorData.meta = { ...errorData.meta, formData: _currentFormData };
    }

    axios.post(`${API_URL}/error-logs`, {
        ...errorData,
        ...getUserContext(),
        userAgent: navigator.userAgent,
        pageUrl: window.location.href,
    }, {
        headers: { 'Content-Type': 'application/json' },
    }).catch(() => { }); // silently fail
}

export function initGlobalErrorHandler() {
    // Catch unhandled JS errors
    window.addEventListener('error', (event) => {
        sendErrorLog({
            message: event.message || 'Unknown error',
            stack: event.error?.stack,
            type: 'runtime',
            meta: {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
            },
        });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason;
        sendErrorLog({
            message: error?.message || String(error) || 'Unhandled Promise Rejection',
            stack: error?.stack,
            type: 'unhandled_rejection',
        });
    });
}
