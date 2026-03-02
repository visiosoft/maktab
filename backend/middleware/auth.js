const jwt = require('jsonwebtoken');

// Verify JWT token
exports.authMiddleware = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Check if user is super admin
exports.isSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Access denied. Super admin only.' });
    }
    next();
};

// Check if user is company admin
exports.isCompanyAdmin = (req, res, next) => {
    if (req.user.role !== 'company_admin') {
        return res.status(403).json({ message: 'Access denied. Company admin only.' });
    }
    next();
};

// Check if user is any type of admin
exports.isAdmin = (req, res, next) => {
    if (req.user.role !== 'super_admin' && req.user.role !== 'company_admin') {
        return res.status(403).json({ message: 'Access denied. Admin access required.' });
    }
    next();
};
