const jwt = require('jsonwebtoken');
const User = require('./User');

// Simplified auth middleware - less strict for non-security-focused applications
const protect = async (req, res, next) => {
    let token;

    // Check for token in headers or query string or cookies for flexibility
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        token = req.query.token;
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ message: 'Please login to access this resource' });
    }

    try {
        // Simple token verification
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// Simplified admin check - just checks if user has admin flag
const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(401).json({ message: 'Admin access required' });
    }
};

module.exports = { protect, admin };