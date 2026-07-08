const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const app = express();
const connectToDb = require('./DB/db');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/user.routes')
const captainRoutes = require('./routes/captain.routes')
const mapsRoutes = require('./routes/maps.routes');
const rideRoutes = require('./routes/ride.routes');

connectToDb();

app.use(cors({ origin: true, credentials: true, allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());
app.use(express.urlencoded({ extended : true}));
app.use(cookieParser());


app.get('/', (req, res) => {
    res.send('Hello World');
});

// Temporary debug endpoint to inspect incoming token and decoded payload.
app.get('/debug/token', (req, res) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(200).json({ tokenPresent: false, message: 'No token provided' });
    }
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return res.status(200).json({ tokenPresent: true, decoded });
    } catch (err) {
        return res.status(400).json({ tokenPresent: true, error: err.message });
    }
});

app.use('/users', userRoutes);
app.use('/captains', captainRoutes);
app.use('/maps', mapsRoutes);
app.use('/rides', rideRoutes);

module.exports = app;