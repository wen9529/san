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

// Socket.IO
io.on('connection', (socket) => {
    console.log('new connection', socket.id);

    socket.on('player-id', (playerId) => {
        socket.playerId = playerId;
        console.log('player-id', socket.playerId, socket.id);
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