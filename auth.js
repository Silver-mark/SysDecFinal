const jwt = require('jsonwebtoken');

// Simplified token generation - longer expiry and simpler payload
const generateToken = (userId, isAdmin = false) => {
    return jwt.sign(
        { id: userId, isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: '60d' } // Extended token validity
    );
};

// Simple token verification function
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        console.error('Token error:', error);
        return null;
    }
};

module.exports = { generateToken, verifyToken };