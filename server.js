// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Require Deck and sortCards from card.js
const { Deck, sortCards } = require('./src/card');

// Initialize app
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (e.g., HTML, CSS, client-side JS)
app.use(express.static(path.join(__dirname, 'public')));

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  // Test code for card display (TEMPORARY)
  const deck = new Deck();
  deck.shuffle();
  socket.emit('deal_cards', deck.cards); // Send the shuffled deck to the connected client

  // Temporary test code for card and deck - REMOVE LATER
  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
  });

  // You can add more Socket.IO event handlers here for your game logic
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});