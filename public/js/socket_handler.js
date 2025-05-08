// public/js/socket_handler.js
// Assuming game_client.js is loaded before this script and provides a global `gameClient` object or functions.
class SocketManager {
        this.socket = io();
 constructor() {
 this.socket = io();
 }
        this.playerId = this.generatePlayerId();
        this.roomId = null;
        this.socket.on('connect', () => {
        document.getElementById('connection-status').className = 'connected';
        console.log('Connected to server', this.socket.id);
        document.getElementById('connection-status').textContent = '🟢 已连接';
      });
 this.socket.emit('player-id', this.playerId);
      this.socket.on('disconnect', () => {
        document.getElementById('connection-status').className = 'disconnected';
        document.getElementById('connection-status').textContent = '🔴 断开连接';
        setTimeout(() => SocketManager.init(), 5000);
      });

        // Listen for the 'deal_cards' event from the server
        this.socket.on('deal_cards', (cardsData) => {
 console.log('Received dealt cards:', cardsData);
 gameClient.handleDealCards(cardsData); // Call a function in game_client.js
        });
      
        this.socket.on('room-update', (rooms) => {
            console.log('Received room-update:', rooms);
            this.updateRoomDisplay(rooms);
            // Hide ready button if room is full and player is in that room
            // This handles the case where a player joins a full room that auto-starts
            if (this.roomId && rooms[this.roomId] && rooms[this.roomId].players.includes(this.playerId) && rooms[this.roomId].players.length === 4) {
                document.getElementById('ready-button').style.display = 'none';
            } else if (this.roomId && rooms[this.roomId] && rooms[this.roomId].players.includes(this.playerId) && rooms[this.roomId].players.length < 4) {
                document.getElementById('ready-button').style.display = 'none';
            }
        });

        this.socket.on('new-player', (playerId) => {
            console.log('Received new-player:', playerId);
        });

        this.socket.on('game-start', () => {
            console.log('Received game-start!');
            document.getElementById('ready-button').style.display = 'none';
            document.getElementById('game-area').style.display = 'block';
            document.getElementById('room-list').style.display = 'none';
        });

      this.setupPassButton();
        this.socket.on('card:update', data => {
          const event = new CustomEvent('card:update', { detail: data });
          document.dispatchEvent(event);
        });
      }

      static updateRoomDisplay(rooms) {
        for (const roomId in rooms) {
          const room = rooms[roomId];
          const roomDiv = document.getElementById(`room-${roomId}`);
          if (roomDiv) {
            roomDiv.querySelector('p').textContent = `人数: ${room.players.length}/4`;
            const joinButton = roomDiv.querySelector('.join-button');
            if (room.players.length >= 4) {
              joinButton.disabled = true;
            } else {
              joinButton.disabled = false;
            }
          }
        }
      }

      static setupRoomJoinButtons() {
        document.querySelectorAll('.join-button').forEach(button => {
          button.addEventListener('click', (event) => {
            // Use a check to prevent joining if already in a room
            const roomId = event.target.closest('.room').dataset.roomId;
            console.log('Join button clicked for room:', roomId);
            if (this.roomId) {
              console.log('Player already in room', this.roomId);
              return;
            }
            this.roomId = roomId;
            console.log('Emitting join-room:', roomId, this.playerId);
            this.socket.emit('join-room', roomId, this.playerId);
            document.getElementById('room-list').style.display = 'none';
            document.getElementById('ready-button').style.display = 'block';
          });
        });
      }

    static setupReadyButton() {
      const readyButton = document.getElementById('ready-button');
      readyButton.addEventListener('click', () => {
        console.log('Ready button clicked', this.playerId, this.roomId);
        this.socket.emit('ready', this.roomId, this.playerId);
        readyButton.disabled = true;

      });
    }

    static setupPassButton() {
      const passButton = document.getElementById('pass-button'); // Assuming you have a button with id 'pass-button' in your HTML
      if (passButton) {
        passButton.addEventListener('click', () => {
          console.log('Pass button clicked', this.playerId, this.roomId);
          this.socket.emit('card:pass', this.roomId, this.playerId);
        });
      }
    }
    static generatePlayerId() {
      return Math.random().toString(36).substring(2, 9);
    }
  }
SocketManager.init();
    export { SocketManager };