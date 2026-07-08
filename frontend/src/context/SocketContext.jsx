
import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();

const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const baseUrl = import.meta.env.VITE_BASE_URL || '/';
        const client = io(baseUrl, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
        });

        client.on('connect', () => {
            console.log('Socket connected', client.id);
        });

        client.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        client.on('disconnect', (reason) => {
            console.log('Socket disconnected', reason);
        });

        setSocket(client);

        return () => {
            client.off('connect');
            client.off('connect_error');
            client.off('disconnect');
            client.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketProvider;