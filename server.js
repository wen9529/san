// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Require Deck and sortCards from card.js (assuming it's needed for scoring)
// Require functions from game_logic.js
const {
 isPair, isTriple, isStraight, isFlush, isFullHouse, isFourOfAKind, isStraightFlush, isThreeCardStraight,
 isDragon, isTwelveRoyalty, isFourTriples, isAllOneColor, isAllBig, isAllSmall, isSixPairsOneHalf, isFivePairsOneTriple, isThreeStraights, isThreeFlushes, evaluateSpecialHand,
 // Assuming these comparison functions exist or need to be implemented in game_logic.js
 evaluateHandType, // Function to determine hand type (e.g., Pair, Straight, Flush)
 compareHandTypes, // Function to compare different hand types (hierarchy)
 compareHandsSameType, // Function to compare hands of the same type
 getSpecialHandPoints, // Function to get bonus points for 13-card special hands
 getHandTypeBonusPoints // Function to get bonus points for special hands within front/middle/back
} = require('./src/game_logic');

// Initialize app
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Simple in-memory room management
const rooms = {}; // { roomId: { name: roomName, players: [{ id: playerId, socketId: socketId, ready: false, finished: false, hands: { front: [], middle: [], back: [] } }], state: 'waiting', deck: null, currentPlayerIndex: 0, currentHand: null, playedHands: {} } }

// Serve static files (e.g., HTML, CSS, client-side JS)
app.use(express.static(path.join(__dirname, 'public')));

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log('a user connected', socket.id);
  let player = { id: null, socketId: socket.id, roomId: null, ready: false };

  socket.on('player-id', (playerId) => {
    player.id = playerId;
    console.log(`Player ${player.id} connected with socket ${socket.id}`);
    // Optionally send initial room list to the newly connected player
    socket.emit('room-list', rooms);
  });

  socket.on('create-room', ({ roomName, playerId }) => {
    const roomId = generateRoomId(); // Implement a function to generate unique room IDs
    rooms[roomId] = {
      name: roomName,
      players: [],
      state: 'waiting',
      playedHands: {}, // Store the three hands played by each player
 deck: null,
 hands: {}
    };
    console.log(`Room created: ${roomId} by player ${playerId}`);
    socket.emit('joined-room', roomId);
    joinRoom(socket, roomId, player);
  });

  socket.on('join-room', (roomId, playerId) => {
    if (rooms[roomId] && rooms[roomId].players.length < 4) { // Assuming max 4 players
      socket.emit('joined-room', roomId);
      joinRoom(socket, roomId, player);
    } else if (rooms[roomId] && rooms[roomId].players.length >= 4) {
      socket.emit('join-room-error', 'Room is full');
    } else {
      socket.emit('join-room-error', 'Room not found');
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id, player.id);
    if (player.roomId && rooms[player.roomId]) {
      leaveRoom(socket, player.roomId, player.id);
    }
  });

  // Implement joining a room
  function joinRoom(socket, roomId, player) {
    player.roomId = roomId;
    rooms[roomId].players.push({ id: player.id, socketId: socket.id, ready: false, finished: false, hands: { front: [], middle: [], back: [] } }); // Initialize hands structure
    io.emit('room-update', rooms); // Notify all clients about the room update
    console.log(`Player ${player.id} joined room ${roomId}`);
  }

  // Implement leaving a room
  function leaveRoom(socket, roomId, playerId) {
    rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== playerId);
    io.emit('room-update', rooms); // Notify all clients about the room update
    console.log(`Player ${playerId} left room ${roomId}`);
    // Optional: Remove the room if it's empty
    if (rooms[roomId].players.length === 0) {
      delete rooms[roomId];
      io.emit('room-list', rooms); // Update room list if a room is removed
    }
  }

  // Handle player ready state
  socket.on('ready', ({ roomId, playerId }) => {
    if (rooms[roomId]) {
      const playerInRoom = rooms[roomId].players.find(p => p.id === playerId);
      if (playerInRoom) {
        playerInRoom.ready = true;
        console.log(`Player ${playerId} is ready in room ${roomId}`);
        io.to(roomId).emit('room-update', rooms); // Notify players in the room about ready state

        // Check if all players are ready and room is full
        if (rooms[roomId].players.length === 4 && rooms[roomId].players.every(p => p.ready)) {
          startGame(roomId);
          io.to(roomId).emit('game-start'); // Notify players in the room that the game is starting
 io.emit('room-update', rooms); // Notify all about room state change
 }
      }
    }
  });

  function startGame(roomId) {
    console.log(`Starting game in room ${roomId}`);
    rooms[roomId].state = 'playing';
    dealCards(roomId);
 io.emit('room-update', rooms); // Notify all about room state change
  }

  // Handle player playing cards
  socket.on('card:play', ({ roomId, playerId, cards }) => {
    const room = rooms[roomId];
    if (!room || room.state !== 'playing') {
 console.log('Cannot play cards: room not found or not in playing state');
      return;
    }

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1 || playerIndex !== room.currentPlayerIndex) {
 console.log('Cannot play cards: not your turn or player not in room');
      return;
    }

    // Basic validation: check if the player has these cards
    const hand = room.hands[playerId];
    const hasCards = cards.every(card => hand.some(hCard => hCard.suit === card.suit && hCard.rank === card.rank));
    if (!hasCards) {
 console.log('Cannot play cards: player does not have these cards');
      socket.emit('play-error', 'You do not have these cards.');
      return;
    }

    // Assuming 'cards' is an array of 13 cards for setting the three hands
    if (cards.length !== 13) {
 console.log('Cannot play cards: Invalid number of cards.');
 socket.emit('play-error', 'You must select 13 cards to arrange.');
 return;
    }

    // TODO: Add validation here to check if the played cards are a valid arrangement of three hands (3, 5, 5)
    // and if the front hand is weaker than the middle, and the middle weaker than the back.
    // This requires the scoring logic from game_logic.js

    // For now, just assume valid play if player has the cards
    // Also, players arrange their hands simultaneously, not in turns for playing the 13 cards.
    // This event 'card:play' should probably be 'hands:set' or similar.
    // The turn-based logic is for subsequent rounds in some variations, but the primary game is setting the 13 cards.

    // Assuming 'cards' is structured as { front: [3 cards], middle: [5 cards], back: [5 cards] }
    if (!cards.front || cards.front.length !== 3 || !cards.middle || cards.middle.length !== 5 || !cards.back || cards.back.length !== 5) {
 console.log('Cannot play cards: Invalid hand structure.');
 socket.emit('play-error', 'Invalid hand arrangement.');
 return;
    }

    // Store the played hands for this player
    room.playedHands[playerId] = cards;
    console.log(`Player ${playerId} set their hands in room ${roomId}`);

    // Mark player as finished arranging hands
    const playerInRoom = room.players.find(p => p.id === playerId);
    if (playerInRoom) {
 playerInRoom.finished = true;
    }

    // Check for game end
    const allFinishedArranging = room.players.every(p => p.finished);
    if (allFinishedArranging) {
 console.log(`All players finished arranging hands in room ${roomId}. Calculating scores...`);
      // Calculate scores
      const results = calculateScores(room);
      io.to(roomId).emit('game-end', results);
      // Reset room state for a new game or return to lobby
      resetRoom(roomId);
    } else {
      // Notify clients about players who have finished arranging hands
      const finishedPlayers = room.players.filter(p => p.finished).map(p => p.id);
      io.to(roomId).emit('player-finished-arranging', { playerId, finishedPlayers });
    }
  });

  // This event is likely not needed in the standard Shisanshui game flow where players arrange hands simultaneously.
  // socket.on('card:pass', ({ roomId, playerId }) => { ... });

  // Basic scoring logic (needs to be implemented based on Shisanshui rules)
  function calculateScores(room) {
    console.log('Calculating scores for room', room.id);
    const scores = {};

    const playedHands = room.playedHands;
    const playerIds = room.players.map(p => p.id);

    // For now, a simple placeholder:
    room.players.forEach(player => {
      // Example: Score based on remaining cards (lower is better)
      // In Shisanshui, scoring is based on comparing the three hands (front, middle, back)
      // of each player against every other player, plus points for special hands.
      scores[player.id] = 0; // Initialize score
    });

    // Compare each player's hands against every other player
    for (let i = 0; i < playerIds.length; i++) {
      // Start j from i + 1 to avoid comparing a player with themselves and comparing pairs twice
      for (let j = i + 1; j < playerIds.length; j++) {
        const player1Id = playerIds[i];
        const player2Id = playerIds[j];

        const player1Hands = playedHands[player1Id];
        const player2Hands = playedHands[player2Id];

        // Compare front hands
        // Assuming compareHands returns > 0 if hand1 wins, < 0 if hand2 wins, 0 if tie
        // Points for winning each hand: Front = 1, Middle = 2, Back = 3 (A common scoring variant)
        const frontComparison = compareHands(player1Hands.front, player2Hands.front);
        if (frontComparison > 0) { // player1 wins front
 scores[player1Id] += 1;
 scores[player2Id] -= 1;
        } else if (frontComparison < 0) { // player2 wins front
 scores[player1Id] -= 1;
 scores[player2Id] += 1;
        }

        // Compare middle hands
        const middleComparison = compareHands(player1Hands.middle, player2Hands.middle);
        if (middleComparison > 0) { // player1 wins middle
          scores[player1Id] += 2; // Middle hand usually worth more points
          scores[player2Id] -= 2;
        } else if (middleComparison < 0) { // player2 wins middle
          scores[player1Id] -= 2;
          scores[player2Id] += 2;
        }

        // Compare back hands
        const backComparison = compareHands(player1Hands.back, player2Hands.back);
        if (backComparison > 0) { // player1 wins back
          scores[player1Id] += 3; // Back hand usually worth the most points
          scores[player2Id] -= 3;
        } else if (backComparison < 0) { // player2 wins back
          scores[player1Id] -= 3;
          scores[player2Id] += 3;
        }

        // Check for "全垒打" (Home Run) - winning all three hands
        // Bonus points for winning all three hands against a single opponent
        if (frontComparison > 0 && middleComparison > 0 && backComparison > 0) {
          scores[player1Id] += 3; // Bonus points for winning all three
        } else if (frontComparison < 0 && middleComparison < 0 && backComparison < 0) {
          scores[player2Id] += 3; // Bonus points for winning all three

        }
      }
    }

    // --- Special Hands Scoring ---
    // This requires checking for 13-card special hands and special hands within the arranged hands.
    // The points for special hands are typically awarded regardless of whether the hand wins against an opponent's hand.
    // Special hands often have higher point values.

    room.players.forEach(player => {
      const allCards = player.hand; // The original 13 cards dealt to the player
      const arrangedHands = playedHands[player.id]; // The three hands arranged by the player
      // Check for 13-card special hands
      const specialHand = gameLogic.evaluateSpecialHand(allCards);
 if (specialHand) {
 // TODO: Add specific bonus points for each special hand type based on your rules
 console.log(`Player ${player.id} has a 13-card special hand: ${specialHand}`);
 switch (specialHand) {
 case "一条龙":
 scores[player.id] += 100; // Example points
 break;
 case "十二皇族":
 scores[player.id] += 80; // Example points
 break;
 case "四套三条":
 scores[player.id] += 60; // Example points
 break;
 case "凑一色":
 scores[player.id] += 40; // Example points
 break;
 case "全大":
 scores[player.id] += 30; // Example points
 break;
 case "全小":
 scores[player.id] += 30; // Example points
 break;
 case "六对半":
 scores[player.id] += 20; // Example points
 break;
 case "五对三条":
 scores[player.id] += 15; // Example points
 break;
 // TODO: Add other special hand types and their points
 default:
 // No specific bonus for this special hand type in this example
 break;
 }
      }

      // Check for special hands within the arranged hands (Front, Middle, Back)
      // Assuming evaluateHandType from game_logic.js can identify special hand types within a hand (e.g., Four of a Kind in Middle/Back)

      // Front Hand (3 cards) - can have Pair, Triple, Three-card Straight, Three-card Flush (if applicable in rules)
      const frontHandType = gameLogic.evaluateHandType(arrangedHands.front, 'front');
      let frontBonus = 0;
      // TODO: Add bonus points for specific hand types in the front hand
      if (frontHandType === '三条') {
        frontBonus = 5; // Example bonus for Three of a Kind in front
      } else if (frontHandType === '三张同花顺') { // Assuming gameLogic identifies this
        frontBonus = 6; // Example bonus
      } else if (frontHandType === '三张顺子') { // Assuming gameLogic identifies this
        frontBonus = 3; // Example bonus
      }
      // Note: Ensure evaluateHandType in game_logic.js returns specific names like '三条', '三张同花顺', '三张顺子'
      // and that the card ordering (3-2) is handled correctly for straights/straight flushes.


      if (frontBonus > 0) {
 scores[player.id] += frontBonus;
        console.log(`Player ${player.id} has a special front hand (${frontHandType}). Bonus points: ${frontBonus}`);
      }

      // Middle Hand (5 cards) - can have Pair, Two Pair, Triple, Straight, Flush, Full House, Four of a Kind, Straight Flush
      const middleHandType = gameLogic.evaluateHandType(arrangedHands.middle, 'middle');
      let middleBonus = 0;
      // TODO: Add bonus points for specific hand types in the middle hand
      if (middleHandType === '同花顺') {
        middleBonus = 10; // Example bonus
      } else if (middleHandType === '四条') {
        middleBonus = 8; // Example bonus
      } else if (middleHandType === '葫芦') {
        middleBonus = 4; // Example bonus
      }
      // Note: Adjust points based on your rules. Some rules give higher points for middle vs back.
      // Ensure evaluateHandType in game_logic.js returns specific names like '同花顺', '四条', '葫芦', etc.

      // In some rules, Four of a Kind in the middle is worth more than in the back, and vice versa for Straight Flush.
      // Adjust the bonus points logic here based on your specific rule set.
      // You might need separate bonus point lookups for middle and back hands if rules differ.
      // const middleBonus = gameLogic.getHandTypeBonusPoints(middleHandType, 'middle'); // A more flexible approach

      if (middleBonus > 0) {
 scores[player.id] += middleBonus;
        console.log(`Player ${player.id} has a special middle hand (${middleHandType}). Bonus points: ${middleBonus}`);
      }

      // Back Hand (5 cards) - can have Pair, Two Pair, Triple, Straight, Flush, Full House, Four of a Kind, Straight Flush
      const backHandType = gameLogic.evaluateHandType(arrangedHands.back, 'back');
      let backBonus = 0;
      // TODO: Add bonus points for specific hand types in the back hand
      if (backHandType === '同花顺') {
        backBonus = 10; // Example bonus
      } else if (backHandType === '四条') {
        backBonus = 8; // Example bonus
      } else if (backHandType === '葫芦') {
        backBonus = 4; // Example bonus
      }
      // Note: Adjust points based on your rules.
      // Ensure evaluateHandType in game_logic.js returns specific names like '同花顺', '四条', '葫芦', etc.

      // In some rules, Straight Flush in the back is worth more than in the middle, and vice versa for Four of a Kind.
      // Adjust the bonus points logic here based on your specific rule set.
      // You might need separate bonus point lookups for middle and back hands if rules differ.
      // const backBonus = gameLogic.getHandTypeBonusPoints(backHandType, 'back'); // A more flexible approach

      if (backBonus > 0) {
 scores[player.id] += backBonus;
        console.log(`Player ${player.id} has a special back hand (${backHandType}). Bonus points: ${backBonus}`);
      }

      // Note: You might need to adjust the bonus points logic based on your specific rules,
      // as some special hands might only grant points if they win the comparison as well,
      // or have different point values depending on the position (front, middle, back).
    });

    // Rank players by score
    const rankings = playerIds.sort((a, b) => {
        // Sort in descending order of score
        if (scores[b] !== scores[a]) {
            return scores[b] - scores[a];
        } else {
            // Optional: Add secondary sorting criteria if scores are tied (e.g., by player ID or original turn order)
            return 0; // Keep original order for ties
        }
    });

    return { scores, rankings };
  }

  // Hand comparison function
  function compareHands(hand1, hand2) {
    // --- INTEGRATION POINT: game_logic.js ---
    // This function needs to compare two hands based on the rules of Shisanshui.
    // It should return:
    // > 0 if hand1 wins
    // < 0 if hand2 wins
    // = 0 if it's a tie
    // console.log('Comparing hands:', hand1, hand2);

    // Determine hand types using game_logic.js functions
    // This is a simplified hierarchy for demonstration. You need to adjust based on your rules.
    // Assign a numerical value to each hand type based on hierarchy (higher value = stronger hand)
    const getHandTypeValue = (hand) => {
      if (hand.length === 3) {
        if (gameLogic.isThreeCardStraight(hand)) return 3; // Example value for 3-card straight
 if (gameLogic.isTriple(hand)) return 2; // Example value for triple (in front)
 if (gameLogic.isPair(hand)) return 1; // Example value for pair (in front)
 return 0; // High card (in front)
      } else if (hand.length === 5) {
        if (gameLogic.isStraightFlush(hand)) return 7; // Example value for straight flush
 if (gameLogic.isFourOfAKind(hand)) return 6; // Example value for four of a kind
 if (gameLogic.isFullHouse(hand)) return 5; // Example value for full house
 if (gameLogic.isFlush(hand)) return 4; // Example value for flush
 if (gameLogic.isStraight(hand)) return 3; // Example value for straight
 if (gameLogic.isTriple(hand)) return 2; // Example value for triple (in middle/back)
 if (gameLogic.isPair(hand)) return 1; // Example value for pair (in middle/back) - Note: Two Pair is also type 1 in this simplified example
 return 0; // High card (in middle/back)
      }
      // Handle other hand lengths if applicable (e.g., for special rules)
 return -1; // Unknown hand length
    };

    const hand1TypeValue = getHandTypeValue(hand1);
    const hand2TypeValue = getHandTypeValue(hand2);

    // Compare based on hand type hierarchy
    if (hand1TypeValue > hand2TypeValue) {
      return 1; // hand1 has a stronger hand type
    } else if (hand1TypeValue < hand2TypeValue) {
      return -1; // hand2 has a stronger hand type
    }

    // 3. If hand types are the same, compare based on the rank of the cards within the hand (e.g., higher pair wins).
    // TODO: Implement comparison for same-type hands using game_logic.js functions
    // This is complex and depends heavily on the specific implementation in game_logic.js
    // You will likely need to call different comparison functions based on hand1TypeValue
    console.warn(`Comparing same type hands (Type: ${hand1TypeValue}). Need to implement detailed comparison in server.js or game_logic.js`);
    // Example placeholder (needs actual logic based on hand type):
    // const comparisonResult = gameLogic.compareHandsSameType(hand1, hand2, hand1TypeValue); // Assuming such a function exists
    // return comparisonResult;

 // Placeholder return for tie in same type hands (you MUST replace this)
 return 0;

    // --- You NEED to implement/verify these functions in game_logic.js ---
    // - evaluateHandType(hand, position) // position can be 'front', 'middle', 'back' for specific rules
    // - compareHandTypes(type1, type2) // Defines the hierarchy of hand types (e.g., Straight Flush > Four of a Kind)
    // - compareHandsSameType(hand1, hand2, type) // Compares two hands that are of the same type
    // - getSpecialHandPoints(specialHandType) // Returns points for 13-card special hands
    // - getHandTypeBonusPoints(handType, position) // Returns bonus points for special hand types within front/middle/back hands (e.g., Four of a Kind in middle)
  }

  // Handle game reset
  socket.on('reset-game', ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.players.some(p => p.socketId === socket.id)) { // Ensure the request comes from a player in the room
      console.log(`Resetting room: ${roomId}`);
      room.state = 'waiting';
      room.deck = null;
      room.players.forEach(player => {
        player.ready = false;
        player.finished = false;
        player.hand = [];
        player.hands = { front: [], middle: [], back: [] };
      });
      io.emit('room-update', rooms); // Notify all clients about the room update
    }
  });

    }
  });

  // You can add more Socket.IO event handlers here for your game logic
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});

// Basic room ID generator (you might want a more robust one)
function generateRoomId() {
  return Math.random().toString(36).substring(2, 9);
}

function dealCards(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const deck = new Deck();
  deck.shuffle();
  room.deck = deck.cards; // Store remaining deck if needed later

  // Deal 13 cards to each player
  room.players.forEach(player => {
    player.hand = deck.deal(13); // Deal cards to player object directly
    // Emit the dealt cards to the specific player
 io.to(player.socketId).emit('deal_cards', player.hand);
    // Reset finished status for the new game
    player.finished = false;
  });
  // Set the first player's turn
  room.currentPlayerIndex = 0;
}

// Reset room state for a new game
function resetRoom(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  room.state = 'waiting';
  room.deck = null;
  // Clear players' hands and played hands
  room.players.forEach(player => {
    player.hand = [];
    player.finished = false;
    player.hands = { front: [], middle: [], back: [] };
  });
  room.currentPlayerIndex = 0;
  room.currentHand = null;
 room.playedHands = {};
 io.to(roomId).emit('room-reset'); // Notify players in the room (optional, could just rely on room-update)
}