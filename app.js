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

    constructor(rank, suit) {
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

    setOwner(playerId) {
        this.owner = playerId;
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.createDeck();
        this.shuffle();
    }

    createDeck() {
        const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace', '2'];
        const suits = ['clubs', 'spades', 'diamonds', 'hearts'];
        for (const suit of suits) {
            for (const rank of ranks) {
                this.cards.push(new Card(rank, suit));
            }
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
}

// Routes
app.get('/', (req, res) => {
    const cards = [
 '10_of_clubs', 'ace_of_spades',
 'king_of_diamonds', 'queen_of_hearts'
    ].map(f => {
        return new Card(rank, suit);
    });
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
        if (room.players.includes(playerId)){
            console.log('Player already in room:', playerId, roomId);
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
        if(!room.ready.includes(playerId)){
             room.ready.push(playerId);
        }

        if (room.ready.length === 4) {
            io.to(roomId).emit('game-start');
            const deck = new Deck();
            const players = room.players;
            for(let i=0;i<52;i++){
                const card = deck.cards[i];
                card.setOwner(players[count]);
                count++;
                if(count === 4){
                    count = 0;
                }
            }
            for(let i=0;i<players.length;i++){
                const hand = deck.cards.filter(c=>c.owner === players[i]).map(c=>{return {rank:c.rank,suit:c.suit}});
                io.to(roomId).emit('card:deal', hand);
            }
            console.log('game start');
            io.to(roomId).emit('game-start');
            const deck = new Deck();
            const players = room.players;
            let count = 0;
            for(let i=0;i<52;i++){
                const card = deck.cards[i];
                card.setOwner(players[count]);
                count++;
                if(count === 4){
                    count = 0;
                }
            }
            for(let i=0;i<players.length;i++){
                const hand = deck.cards.filter(c=>c.owner === players[i]).map(c=>{return {rank:c.rank,suit:c.suit}});
                io.to(roomId).emit('card:deal', hand);
            }

            room.ready = [];

        }
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