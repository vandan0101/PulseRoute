const userModel = require('../models/user.model');
const blackListTokenModel = require('../models/blacklistToken.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const captainModel = require('../models/captain.model')


module.exports.authUser = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[ 1 ];

    if (!token) {
        return res.status(401).json({ message: 'Missing token' });
    }

    console.log('authUser token present length:', token ? token.length : 0);

    const isBlacklisted = await blackListTokenModel.findOne({ token: token });

    if (isBlacklisted) {
        return res.status(401).json({ message: 'Token blacklisted' });
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('authUser decoded id:', decoded && decoded._id);
        const user = await userModel.findById(decoded._id);

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = user;

        return next();

    } catch (err) {
        console.error('authUser verify error:', err && err.message);
        return res.status(401).json({ message: 'Invalid token' });
    }
}

module.exports.authCaptain = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[ 1 ];
    if (!token) {
        return res.status(401).json({ message: 'Missing token' });
    }

    console.log('authCaptain token present length:', token ? token.length : 0);

    const isBlacklisted = await blackListTokenModel.findOne({ token: token });



    if (isBlacklisted) {
        return res.status(401).json({ message: 'Token blacklisted' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('authCaptain decoded id:', decoded && decoded._id);
        const captain = await captainModel.findById(decoded._id);

        if (!captain) {
            console.warn('authCaptain: no captain found for id', decoded && decoded._id);
            return res.status(401).json({ message: 'Captain not found' });
        }

        console.log('authCaptain: found captain', captain._id.toString());

        req.captain = captain;

        return next();
    } catch (err) {
        console.error('authCaptain verify error:', err && err.message);
        res.status(401).json({ message: 'Invalid token' });
    }
}