const socketIo = require('socket.io');
const mongoose = require('mongoose');
const userModel = require('../models/user.model');
const captainModel = require('../models/captain.model');

let io;

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: '*',
            methods: [ 'GET', 'POST' ]
        }
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.on('join', async (data) => {
            try {
                const { userId, userType } = data;

                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    return socket.emit('error', { message: 'Invalid user id' });
                }

                if (userType === 'user') {
                    await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
                } else if (userType === 'captain') {
                    await captainModel.findByIdAndUpdate(userId, { socketId: socket.id });
                }
            } catch (error) {
                console.error('Socket join failed:', error);
                socket.emit('error', { message: 'Unable to join socket session' });
            }
        });


        socket.on('update-location-captain', async (data) => {
            try {
                const { userId, location } = data;

                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    return socket.emit('error', { message: 'Invalid captain id' });
                }

                if (!location || typeof location.ltd !== 'number' || typeof location.lng !== 'number') {
                    return socket.emit('error', { message: 'Invalid location data' });
                }

                await captainModel.findByIdAndUpdate(userId, {
                    location: {
                        ltd: location.ltd,
                        lng: location.lng
                    }
                });
            } catch (error) {
                console.error('Socket location update failed:', error);
                socket.emit('error', { message: 'Unable to update captain location' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
}

const sendMessageToSocketId = (socketId, messageObject) => {
    console.log(messageObject);

    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.log('Socket.io not initialized.');
    }
}

module.exports = { initializeSocket, sendMessageToSocketId };
