const socketIo = require('socket.io');
const mongoose = require('mongoose');
const userModel = require('../models/user.model');
const captainModel = require('../models/captain.model');
const rideModel = require('../models/ride.model');

let io;
const connections = new Map();

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

                connections.set(socket.id, { userId, userType });
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

                const activeRide = await rideModel
                    .findOne({
                        captain: userId,
                        status: { $in: [ 'accepted', 'ongoing' ] }
                    })
                    .populate('user')
                    .populate('captain');

                if (activeRide?.user?.socketId) {
                    sendMessageToSocketId(activeRide.user.socketId, {
                        event: 'captain-location-updated',
                        data: {
                            rideId: activeRide._id,
                            location: {
                                ltd: location.ltd,
                                lng: location.lng
                            }
                        }
                    });
                }
            } catch (error) {
                console.error('Socket location update failed:', error);
                socket.emit('error', { message: 'Unable to update captain location' });
            }
        });

        socket.on('disconnect', async () => {
            console.log(`Client disconnected: ${socket.id}`);
            const connection = connections.get(socket.id);

            if (connection) {
                const { userId, userType } = connection;

                try {
                    if (userType === 'user') {
                        await userModel.findByIdAndUpdate(userId, { $unset: { socketId: '' } });
                    } else if (userType === 'captain') {
                        await captainModel.findByIdAndUpdate(userId, { $unset: { socketId: '' } });
                    }
                } catch (error) {
                    console.error('Error clearing socketId on disconnect:', error);
                }

                connections.delete(socket.id);
            }
        });
    });
}

const sendMessageToSocketId = async (socketId, messageObject) => {
    console.log('sendMessageToSocketId', { socketId, event: messageObject.event });

    if (!io) {
        console.log('Socket.io not initialized.');
        return;
    }

    const socketInstance = io.sockets.sockets.get(socketId);
    if (!socketInstance) {
        console.log(`Socket not found for id ${socketId}. Cleaning stale socketId.`);
        try {
            await captainModel.findOneAndUpdate({ socketId }, { $unset: { socketId: '' } });
            await userModel.findOneAndUpdate({ socketId }, { $unset: { socketId: '' } });
        } catch (err) {
            console.error('Failed to clear stale socketId:', err);
        }
        return;
    }

    socketInstance.emit(messageObject.event, messageObject.data);
};

module.exports = { initializeSocket, sendMessageToSocketId };
