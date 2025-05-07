// app.js
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');

// Initialize app
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Security Headers
// app.use(helmet({
//     contentSecurityPolicy: {
//         directives: {
//             defaultSrc: ["'self'"],
//             scriptSrc: ["'self'"],
//             styleSrc: ["'self'"],
//             imgSrc: ["'self'", "data:"],
//             connectSrc: ["'self'"]
//         }
//     },
//     crossOriginEmbedderPolicy: false
// }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res) => {
        res.set('Cache-Control', 'no-store');
        res.set('X-Content-Type-Options', 'nosniff');
    }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Card Class
class Card {
    static SUITS = {
        clubs: '♣', spades: '♠', diamonds: '♦', hearts: '♥'
    };

    constructor(filename) {
        const [rank, suit] = filename.replace('.png', '').split('_of_');
        this.suit = Card.SUITS[suit] || '';
        this.rank = this.#parseRank(rank);
    }

    #parseRank(rank) {
        const map = { ace: 'A', jack: 'J', queen: 'Q', king: 'K' };
        return map[rank] || rank;
    }

    get imagePath() {
        return `/images/${this.rank}_of_${this.suit}.png`;
    }
}

// Routes
app.get('/', (req, res) => {
    const cards = [
        '10_of_clubs.png', 'ace_of_spades.png',
        'king_of_diamonds.png', 'queen_of_hearts.png'
    ].map(f => new Card(f));

    res.render('index', { cards });
});

// Room management
const rooms = {};
for (let i = 1; i <= 4; i++) {
    rooms[i] = { players: [], ready: [] };
}
// Socket.IO
io.on('connection', (socket) => {
    console.log('new connection', socket.id);

    socket.on('player-id', (playerId) => {
        socket.playerId = playerId;
        console.log('player-id', socket.playerId, socket.id);
    });

    socket.on('join-room', (roomId, playerId) => {
        console.log('join-room', roomId, playerId);
        if (!rooms[roomId]) {
            console.error('Room not found:', roomId);
            return;
        }

        const room = rooms[roomId];
        if (room.players.length >= 4) {
            console.log('Room full:', roomId);
            return;
        }
        room.players.push(playerId);
        socket.join(roomId);
        io.to(roomId).emit('new-player', playerId);
        io.emit('room-update', rooms);
    });

    socket.on('ready', (roomId, playerId) => {
        console.log('ready', roomId, playerId);
        const room = rooms[roomId];
        if (!room || !room.players.includes(playerId)) {
            console.error('Player not in room:', playerId, roomId);
            return;
        }
        room.ready.push(playerId);
        if (room.ready.length === 4) {
            io.to(roomId).emit('game-start');
            room.ready = [];
        }
    });

    socket.on('game-start', (data) => {
        console.log('game-start', socket.playerId, socket.id, data);
    });

    socket.on('player-move', (data) => {
        console.log('player-move', socket.playerId, socket.id, data);
    });

    socket.on('player-join', (data) => {
        console.log('player-join', socket.playerId, socket.id, data);
    });

    socket.on('disconnecting', () => {
        console.log('disconnecting', socket.playerId, socket.id);
    });

    socket.on('disconnect', () => {
        console.log('disconnect', socket.playerId, socket.id);
    });
});

// Start server
server.listen(3000, '0.0.0.0', () => {
    console.log('server started');
    console.log(`
    ==========================
    安全服务已启动
    访问地址: http://localhost:3000
    ==========================
    `);
});

// Process management
process.on('SIGTERM', () => process.exit(0));