// Import necessary modules
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
const Game = require('./game_logic/game.js');

// Get directory and file names for static file serving
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Configure Socket.IO with CORS settings
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins (for development, consider restricting in production)
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
        credentials: true
    }
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Game state management
const games = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`[INFO] Client connected: ${socket.id}`);
    //create room
    socket.on('create_room', (username) => {
        const game = new Game();
        const roomId = game.id;
        games.set(roomId, game);
        socket.join(roomId);
        game.addPlayer(username, socket.id);
        socket.emit('room_created', roomId);
        io.to(roomId).emit('player_joined', game.getPlayers());
        console.log(`[INFO] Room created: ${roomId} by ${username}`);
    });
    //join room
    socket.on('join_room', (roomId, username) => {
        const game = games.get(roomId);
        if (game) {
            socket.join(roomId);
            game.addPlayer(username, socket.id);
            io.to(roomId).emit('player_joined', game.getPlayers());
            console.log(`[INFO] ${username} joined room: ${roomId}`);
        } else {
            socket.emit('error', 'Room not found');
            console.error(`[ERROR] Room not found: ${roomId}`);
        }
    });

    //submit cards
    socket.on('submit_cards', ({roomId, cards}) => {
        const game = games.get(roomId);
        if(game){
            game.submitCards(socket.id, cards);
            console.log(`[INFO] ${socket.id} submitted cards: ${cards} in room: ${roomId}`);
        } else {
            socket.emit('error', 'Room not found');
            console.error(`[ERROR] Room not found: ${roomId}`);
        }
    })

    // Disconnect handling
    socket.on('disconnect', () => {
        console.log(`[INFO] Client disconnected: ${socket.id}`);
        for(const [roomId,game] of games){
            game.removePlayerBySocketId(socket.id);
            io.to(roomId).emit('player_joined', game.getPlayers());
        }
    });

    // Error handling
    socket.on('error', (error) => {
        console.error(`[ERROR] Socket error: ${error}`);
    });
});

// Server error handling
httpServer.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error('[ERROR] Port 3000 is already in use!');
    } else {
        console.error(`[ERROR] Server error: ${error}`);
    }
    process.exit(1);
});

// Start server and log listening details
const PORT = 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[INFO] Server listening on port ${PORT}`);
    const ifaces = os.networkInterfaces();
    Object.keys(ifaces).forEach((ifname) => {
        ifaces[ifname].forEach((iface) => {
            if ('IPv4' === iface.family && !iface.internal) {
                console.log(`[INFO] Access URL: http://${iface.address}:${PORT}`);
            }
        });
    });
});
