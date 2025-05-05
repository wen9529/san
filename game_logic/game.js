class Game {
    constructor() {
        this.rooms = {}; // Structure: { roomId: { players: [], deck: [], gameStarted: false } }
    }

    createRoom(roomId) {
        if (!this.rooms[roomId]) {
            this.rooms[roomId] = { players: [], deck: [], gameStarted: false };
            console.log(`Room ${roomId} created.`);
        }
    }

    addPlayerToRoom(roomId, player) {
        if (this.rooms[roomId] && !this.rooms[roomId].gameStarted) {
            this.rooms[roomId].players.push(player);
            console.log(`Player ${player.username} added to room ${roomId}.`);
        } else {
          console.log(`Failed to add player ${player.username} to room ${roomId}.`)
        }
    }

    removePlayerFromRoom(roomId, playerId) {
        if (this.rooms[roomId]) {
            this.rooms[roomId].players = this.rooms[roomId].players.filter(player => player.id !== playerId);
            console.log(`Player ${playerId} removed from room ${roomId}.`);
            if (this.rooms[roomId].players.length === 0){
              delete this.rooms[roomId];
              console.log(`Room ${roomId} is empty and has been removed.`)
            }
        }
    }

    getPlayersInRoom(roomId) {
        return this.rooms[roomId] ? this.rooms[roomId].players : [];
    }
    
    dealCardsToPlayers(roomId, cards) {
        if (this.rooms[roomId] && !this.rooms[roomId].gameStarted) {
          this.rooms[roomId].deck = cards;
          const players = this.rooms[roomId].players;
          const numPlayers = players.length;
          const cardsPerPlayer = Math.floor(cards.length / numPlayers);

          for (let i = 0; i < numPlayers; i++) {
              players[i].hand = cards.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer);
          }
          const remainingCards = cards.slice(numPlayers * cardsPerPlayer);
          this.rooms[roomId].deck = remainingCards;
          console.log(`cards has deal to players in room ${roomId}.`);
        }
    }

    startGame(roomId) {
        if (this.rooms[roomId]) {
            this.rooms[roomId].gameStarted = true;
            console.log(`Game started in room ${roomId}.`);
        }
    }

    getRoomData(roomId){
      return this.rooms[roomId];
    }
}

module.exports = Game;
