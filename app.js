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

    get value() {
        const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
        return ranks.indexOf(this.rank);
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
        const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace', '2']; // Order matters for value
        const suits = ['diamonds', 'clubs', 'hearts', 'spades']; // Order matters for suit comparison (♦ < ♣ < ♥ < ♠)
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
        const [rank, suit] = f.replace('.png', '').split('_of_');
        return new Card(rank, suit);
    });
    res.render('index', { cards });
});

// Room management
const rooms = {};
for (let i = 1; i <= 4; i++) {
    rooms[i] = { players: [], ready: [] };
 // Add game state to room
    rooms[i].gameState = {
        playersHand: {}, // playerId: [Card objects]
        currentTurn: null, // playerId
        lastPlayed: { playerId: null, cards: [], type: null, value: -1 }, // cards: [Card objects], type: string, value: number
 passedPlayers: new Set(), // Set of playerIds who passed in the current round
 currentRoundStarter: null, // playerId who started the current round (played after everyone else passed)
        playersOrder: [], // Array of playerIds in turn order
        gameStarted: false,
 playerSockets: {} // playerId: socket.id
 ,
 gameEnded: false,
 playerRankings: [] // Array of playerId in order of finishing
 // Initialize empty hand for each player slot
 for(let p = 0; p < 4; p++){
 rooms[i].gameState.playersHand[`player-${i}-${p}`] = []; // Placeholder, will be filled on join
    };
}

// Helper function to parse cards from client data
function parseClientCards(cardsData) {
    const suitsMap = { '♣': 'clubs', '♠': 'spades', '♦': 'diamonds', '♥': 'hearts' };
    const rankMap = { 'A': 'ace', 'J': 'jack', 'Q': 'queen', 'K': 'king' };

 return cardsData.map(cardData => {
 // Reverse parse rank and suit
 let rank = cardData.rank;
 let suit = cardData.suit;

 // Find original suit string
 let originalSuit = Object.keys(suitsMap).find(key => suitsMap[key] === suit) || suit;
 // Find original rank string
 let originalRank = Object.keys(rankMap).find(key => rankMap[key] === rank) || rank;

 return new Card(originalRank, originalSuit);
    });
}

// Card Type and Comparison Logic (Big Two rules)

function getCardValue(card) {
    const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    const suits = ['♦', '♣', '♥', '♠'];
    return ranks.indexOf(card.rank) * 4 + suits.indexOf(card.suit);
}

function getSuitValue(suit) {
    const suits = ['♦', '♣', '♥', '♠'];
 return suits.indexOf(suit);
}
function sortCards(cards) {
 return cards.sort((a, b) => getCardValue(a) - getCardValue(b));
}

function getCardType(cards) {
    const sortedCards = sortCards([...cards]);
    const numCards = sortedCards.length;

 if (numCards === 1) {
 return { type: 'single', value: getCardValue(sortedCards[0]) };
    } else if (numCards === 2) {
 if (sortedCards[0].rank === sortedCards[1].rank) {
 return { type: 'pair', value: getCardValue(sortedCards[1]) };
        }
    } else if (numCards === 3) {
 if (sortedCards[0].rank === sortedCards[1].rank && sortedCards[1].rank === sortedCards[2].rank) {
 return { type: 'triple', value: getCardValue(sortedCards[2]) };
        }
    } else if (numCards === 5) {
 // Check for 5-card hands: straights, flushes, full houses, four of a kind, straight flushes
 const isFlush = sortedCards.every((card, i, arr) => i === 0 || card.suit === arr[i - 1].suit);
        const ranks = sortedCards.map(card => card.value % 4); // Get rank index (0-12)
        let isStraight = true;
 for (let i = 0; i < ranks.length - 1; i++) {
 if (ranks[i + 1] !== ranks[i] + 1) {
 isStraight = false;
 break;
            }
        }
 // Special case for A-2-3-4-5 straight (using 2 as highest)
 // In Big Two, A-2-3-4-5 is not a valid straight unless 2 is the highest card.
 // Standard Big Two straights are A-K-Q-J-10 down to 3-4-5-6-7.
 // Let's re-evaluate straight logic for Big Two. A straight is 5 consecutive ranks.
 // The order is 3 < 4 < ... < 10 < J < Q < K < A < 2.
 // Example straights: 3-4-5-6-7, 4-5-6-7-8, ..., 10-J-Q-K-A, J-Q-K-A-2.
 // For comparison, the highest card in the straight determines the winner, then suit of highest card.

        // Re-check straight logic based on Big Two ranks
 const ranksForStraight = sortedCards.map(card => card.value % 4); // 0-12
        let isBigTwoStraight = true;
 for (let i = 0; i < ranksForStraight.length - 1; i++) {
 if (ranksForStraight[i + 1] !== ranksForStraight[i] + 1) {
 isBigTwoStraight = false;
 break;
            }
        }

 if (!isStraight) {
 // Handle A-2-3-4-5 straight where Ace is high (this is not a standard Big Two straight)
        }

        if (isStraight && isFlush) {
 return { type: 'straight flush', value: getCardValue(sortedCards[sortedCards.length - 1]) };
        }
        if (isFlush) {
 return { type: 'flush', value: getCardValue(sortedCards[sortedCards.length - 1]) }; // Value based on highest card in flush
        }
        if (isStraight) {
 return { type: 'straight', value: getCardValue(sortedCards[sortedCards.length - 1]) }; // Value based on highest card in straight
        }

 // Check for four of a kind
 // In Big Two, Four of a Kind is a 5-card hand, the 5th card is a kicker.
 // Sort by rank to check for 4 of a kind
 // Example: 4-4-4-4-K. Value is based on the rank of the four cards.
            const sortedByRank = [...sortedCards].sort((a, b) => (a.value % 4) - (b.value % 4));
 if ((sortedByRank[0].rank === sortedByRank[1].rank && sortedByRank[1].rank === sortedByRank[2].rank && sortedByRank[2].rank === sortedByRank[3].rank) ||
 (sortedByRank[1].rank === sortedByRank[2].rank && sortedByRank[2].rank === sortedByRank[3].rank && sortedByRank[3].rank === sortedByRank[4].rank)) {
 // Value of four of a kind is based on the rank of the four cards
 return { type: 'four of a kind', value: getCardValue(sortedByRank[2]) };
            }
        }

 // Check for full house
 // In Big Two, Full House is a 5-card hand (3 of one rank, 2 of another).
 // Sort by rank to check for full house (3 of one rank, 2 of another)
 // Example: 3-3-3-K-K. Value is based on the rank of the three cards.
            const sortedByRank = [...sortedCards].sort((a, b) => (a.value % 4) - (b.value % 4));
 if ((sortedByRank[0].rank === sortedByRank[1].rank && sortedByRank[1].rank === sortedByRank[2].rank && sortedByRank[3].rank === sortedByRank[4].rank) ||
 (sortedByRank[0].rank === sortedByRank[1].rank && sortedByRank[2].rank === sortedByRank[3].rank && sortedByRank[3].rank === sortedByRank[4].rank)) {
 // Value of full house is based on the rank of the three cards
                return { type: 'full house', value: getCardValue(sortedByRank[2]) };
            }
        }
    }

 return { type: 'invalid', value: -1 };
}

function compareCardTypes(played, lastPlayed) {
 // Implement Big Two comparison rules
    if (lastPlayed.type === null) { // First move of the round
        // This is the first hand played in a round/game, it's always valid if it's a recognized type.
 // This check needs to be done elsewhere when determining the first player
 return true;
    }

    // Cannot beat a valid hand with an invalid hand
 if (played.type === 'invalid') {
 return false;
    }

    // Special rules for 5-card hands beating other hands
 // In Big Two, 5-card hands have a hierarchy regardless of the previous hand's type (if smaller)
 // Straight Flush > Four of a Kind > Full House > Flush > Straight
 // A smaller number of cards cannot beat a larger number of cards unless specified (like 4 of a kind or straight flush on anything)

    const fiveCardHierarchy = ['straight', 'flush', 'full house', 'four of a kind', 'straight flush'];
    const playedFiveCardIndex = fiveCardHierarchy.indexOf(played.type);
    const lastPlayedFiveCardIndex = fiveCardHierarchy.indexOf(lastPlayed.type);

    if (played.type === 'four of a kind' || played.type === 'straight flush') {
 // A Bomb (4 of a kind or straight flush) can be played on ANY hand, but must beat a previous Bomb.
 if (lastPlayed.type === 'four of a kind' || lastPlayed.type === 'straight flush') {
 return playedFiveCardIndex > lastPlayedFiveCardIndex ||
 (playedFiveCardIndex === lastPlayedFiveCardIndex && played.value > lastPlayed.value);
        } else {
 return true; // Bomb beats any non-bomb hand
        }
    }

    // For non-bomb hands, must play the same number of cards and beat the previous hand
 if (played.cards.length !== lastPlayed.cards.length) {
 return false;
    }

    // Now we know played.cards.length === lastPlayed.cards.length
    // And we know neither are bombs (handled above)

    if (played.cards.length === 5) {
 // Comparing 5-card hands of the same type (or according to the hierarchy if different)
 // This needs careful implementation based on the Big Two hierarchy and value comparison
 // For simplicity now, let's assume they are of the same type if we reach here and compare values.
 // A full implementation would compare types first based on the hierarchy.
        if (playedFiveCardIndex !== lastPlayedFiveCardIndex) {
 return playedFiveCardIndex > lastPlayedFiveCardIndex; // Higher in hierarchy wins
        }
 // If same type, compare values (e.g., higher straight beats lower straight)
 return played.value > lastPlayed.value;

    } else { // 1, 2, or 3 card hands
 // Must be the exact same type and beat the value
 if (played.type !== lastPlayed.type) {
 return false;
        }
        // Compare values for single, pair, triple
 return played.value > lastPlayed.value;
    }

    // Default case, should not be reached if types are handled
    /*
 case 'single':
 case 'pair':
 default:
 return false; // Invalid type comparison
    }
}

function startGame(roomId) {
    const room = rooms[roomId];
    if (!room || room.players.length !== 4) {
        room.gameState.gameStarted = false; // Ensure gameStarted is false if not enough players
        console.error('Cannot start game in room', roomId, '. Incorrect number of players.');
        return;
    }

    io.to(roomId).emit('game-start');
    room.gameState.gameStarted = true;
    room.gameState.lastPlayed = { playerId: null, cards: [], type: null, value: -1 }; // Reset last played cards
 room.gameState.passedPlayers.clear(); // Reset passed players
 room.gameState.currentRoundStarter = null; // Reset round starter

 room.gameState.gameEnded = false; // Reset game ended state
 room.gameState.playerRankings = []; // Reset rankings
    // Determine who has the 3 of diamonds to start the first round
    const deck = new Deck();
    const players = room.players;
    deck.shuffle(); // Ensure deck is shuffled before dealing

    // Clear previous hands
    for (const playerId of players) {
 room.gameState.playersHand[playerId] = [];
    }

    // Deal cards
 deck.cards.forEach((card, index) => {
        const playerId = players[index % 4];
 room.gameState.playersHand[playerId].push(card);
    });

    // Sort hands for each player (optional, but good for display)
 for (const playerId of players) {
 room.gameState.playersHand[playerId] = sortCards(room.gameState.playersHand[playerId]);
    }

    // Determine starting player (player with 3 of diamonds)
    let startingPlayer = null;
    for (const playerId of players) {
        if (room.gameState.playersHand[playerId].some(card => card.rank === '3' && card.suit === '♦')) {
 startingPlayer = playerId;
 break;
        }
    }

    room.gameState.playersOrder = rotateArray([...players], players.indexOf(startingPlayer)); // Set player order starting with the first player
 room.gameState.currentTurn = startingPlayer;
 room.gameState.currentRoundStarter = startingPlayer;

 // Deal cards and store hands in gameState
    console.log('game start in room', roomId);
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
        if (room.ready.length === 4) {
            // If enough players are ready and the room is full, start the game
 if (room.players.length === 4 && !room.gameState.gameStarted && !room.gameState.gameEnded) {
 // Initialize player's hand and socket ID in gameState for the newly joined player
 room.gameState.playersHand[playerId] = []; // Ensure this is done before dealing
                startGame(roomId);
                }
            }
            startGame(roomId);
 room.ready = []; // Reset ready state after game start
        }
    });

    socket.on('ready', (roomId, playerId) => {
        console.log('ready', roomId, playerId);
        const room = rooms[roomId];
        if (!room || !room.players.includes(playerId)) {
            console.error('Player not in room:', playerId, roomId);
            return;
        }
 // The ready event is now less critical with auto-start, but could be used for other game modes or confirmations
 // We'll keep the basic ready logic for now, but it won't trigger game start if auto-start is enabled
 if (!room.ready.includes(playerId)) {
 room.ready.push(playerId);
        }
 io.emit('room-update', rooms); // Update room display with ready status
    });

    socket.on('card:play', (roomId, playerId, cardsData) => {
        console.log('card:play', roomId, playerId, cardsData);
 const room = rooms[roomId];
        if (!room || !room.gameState.gameStarted || room.gameState.currentTurn !== playerId) {
            console.log(`Invalid move: not in game, game not started, or not your turn. Room: ${roomId}, Player: ${playerId}, Current Turn: ${room.gameState.currentTurn}`);
 // Optionally, emit an error back to the player
 return;
        }

        const playedCards = parseClientCards(cardsData);
        const playerHand = room.gameState.playersHand[playerId];

        // Basic check if cards are in hand
 const handRanksSuits = playerHand.map(card => `${card.rank}${card.suit}`);
 const playedRanksSuits = playedCards.map(card => `${card.rank}${card.suit}`);
        if (!playedRanksSuits.every(cardStr => handRanksSuits.includes(cardStr))) {
            console.log(`Invalid move: cards not in hand. Player: ${playerId}, Played: ${playedRanksSuits}, Hand: ${handRanksSuits}`);
 // Emit error
 return;
        }

        const playedType = getCardType(playedCards);
        const lastPlayed = room.gameState.lastPlayed;

        // Validate played cards against last played cards and game rules
        // Special case: First move must contain 3 of diamonds if it's the start of the game and currentRoundStarter.
        if (lastPlayed.type === null && room.gameState.currentTurn === playerId && !playedCards.some(card => card.rank === '3' && card.suit === '♦')) {
            console.log(`Invalid move: First move must contain 3 of diamonds. Player: ${playerId}`);
 return; // Emit error
        }

        if (playedType.type === 'invalid' || !compareCardTypes(playedType, lastPlayed)) {
            console.log(`Invalid move: invalid hand or cannot beat last played. Player: ${playerId}, Played Type: ${playedType.type}, Last Played Type: ${lastPlayed.type}`);
 // Emit error
 return;
        }

        // If a player made a valid move, clear the passed players set for the next round.
 room.gameState.passedPlayers.clear();
        // Valid move: Update game state
 room.gameState.lastPlayed = { playerId: playerId, cards: playedCards, type: playedType.type, value: playedType.value };
        // Remove played cards from hand
 room.gameState.playersHand[playerId] = playerHand.filter(card => !playedRanksSuits.includes(`${card.rank}${card.suit}`));

        // Determine next turn (basic round robin for now, need to add 'pass' logic)
 const currentPlayerIndex = room.gameState.playersOrder.indexOf(playerId);
 room.gameState.currentTurn = room.gameState.playersOrder[(currentPlayerIndex + 1) % 4];

        // Broadcast the played cards and updated game state
 io.to(roomId).emit('card:played', { playerId: playerId, cards: cardsData, lastPlayed: room.gameState.lastPlayed });
 io.to(roomId).emit('game-state-update', {
            currentTurn: room.gameState.currentTurn,
            playersHandSize: Object.fromEntries(Object.entries(room.gameState.playersHand).map(([pId, hand]) => [pId, hand.length]))
        });

        // Check for game end (player played last card)
 if (room.gameState.playersHand[playerId].length === 0) {
            console.log(`Player ${playerId} finished in room ${roomId}`);
 room.gameState.playerRankings.push(playerId); // Add player to ranking

            // Check if game has ended for all players (except the last one)
            if (room.gameState.playerRankings.length === 3) {
                // Find the last player remaining
                const lastPlayer = room.players.find(pId => !room.gameState.playerRankings.includes(pId));
                if (lastPlayer) {
 room.gameState.playerRankings.push(lastPlayer); // Add the last player to ranking
                }
                room.gameState.gameEnded = true;
                io.to(roomId).emit('game-end', { rankings: room.gameState.playerRankings });
 // Implement game end logic (ranking, reset, etc.)
                console.log(`Game ended in room ${roomId}. Rankings: ${room.gameState.playerRankings}`);
 // For now, just log and potentially reset the room
 // resetRoom(roomId); // Need a function to reset room state
        }
    });

    socket.on('card:pass', (roomId, playerId) => {
        console.log('pass', roomId, playerId);
        const room = rooms[roomId];
 if (!room || !room.gameState.gameStarted || room.gameState.currentTurn !== playerId) {
            console.log(`Invalid pass: not in game, game not started, or not your turn. Room: ${roomId}, Player: ${playerId}, Current Turn: ${room.gameState.currentTurn}`);
 // Optionally, emit an error back to the player
 return;
        }

        // Add player to the set of passed players for the current round.
 room.gameState.passedPlayers.add(playerId);

        // Check if all players except the one who played last have passed.
        // This signifies the end of a trick, and the last player who played wins the trick and starts a new round.
        const activePlayers = room.gameState.players.filter(pId => room.gameState.playersHand[pId].length > 0);
        const playersWhoDidNotPass = activePlayers.filter(pId => !room.gameState.passedPlayers.has(pId));

        if (room.gameState.lastPlayed.playerId !== null && playersWhoDidNotPass.length === 1 && playersWhoDidNotPass[0] === room.gameState.lastPlayed.playerId) {
            console.log(`Round ended in room ${roomId}. ${room.gameState.lastPlayed.playerId} wins the trick.`);

            // The player who played last wins the trick and gets to start the new round.
 room.gameState.currentTurn = room.gameState.lastPlayed.playerId;
 room.gameState.currentRoundStarter = room.gameState.lastPlayed.playerId;
            room.gameState.lastPlayed = { playerId: null, cards: [], type: null, value: -1 }; // Reset last played cards for the new round
 room.gameState.passedPlayers.clear(); // Reset passed players for the new round

 io.to(roomId).emit('round-end', { winner: room.gameState.currentTurn });

        } else if (room.gameState.lastPlayed.playerId === null && room.gameState.passedPlayers.size === activePlayers.length) {
            // Special case: If it was the very first turn of a round/game and everyone passes,
            // the original round starter should get the turn again.
            console.log(`All players passed in room ${roomId}. ${room.gameState.currentRoundStarter} gets the turn.`);
 room.gameState.currentTurn = room.gameState.currentRoundStarter;
 room.gameState.passedPlayers.clear(); // Reset passed players
 io.to(roomId).emit('round-end', { winner: room.gameState.currentTurn }); // Or a specific 'all-passed' event

        }




 // Determine next turn
 const currentPlayerIndex = room.gameState.playersOrder.indexOf(playerId);
 room.gameState.currentTurn = room.gameState.playersOrder[(currentPlayerIndex + 1) % 4];

        // Broadcast the pass action and updated game state
 io.to(roomId).emit('player:passed', { playerId: playerId });
 io.to(roomId).emit('game-state-update', {
            currentTurn: room.gameState.currentTurn,
            playersHandSize: Object.fromEntries(Object.entries(room.gameState.playersHand).map(([pId, hand]) => [pId, hand.length]))
        });
    });

    // Helper function to rotate an array
    function rotateArray(arr, count) {
 count -= arr.length * Math.floor(count / arr.length);
 arr.push.apply(arr, arr.splice(0, count));
 return arr; // Return a new array with the same elements rotated
    }

 // Initial room state update when a player connects
    io.emit('room-update', rooms);


    // Handle player disconnect
    socket.on('disconnecting', () => {
        console.log('disconnecting', socket.playerId, socket.id);
 // Need to handle player leaving mid-game
 // Remove player from room, update room state, potentially end game if not enough players
    });

    socket.on('disconnect', () => {
        console.log('disconnect', socket.playerId, socket.id);
    });

    // After successful connection and player ID is set, send initial room state
    // This might be better done after joining a room
});

// Helper function to reset a room (placeholder)
// function resetRoom(roomId) {
//    rooms[roomId] = {
//        players: [],
//        ready: [],
//        gameState: {
//            playersHand: {},
//            currentTurn: null,
//            lastPlayed: { playerId: null, cards: [], type: null, value: -1 },
//            playersOrder: [],
//            gameStarted: false,
// playerSockets: {}
//        }
//    };
//    io.emit('room-update', rooms); // Notify clients about room reset
// }


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
