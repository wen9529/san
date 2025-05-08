// public/js/socket_handler.js
// Assuming game_client.js is loaded before this script and provides a global `gameClient` object or functions.
// Assuming game_client.js is loaded before this script and provides a global `gameClient` object or functions.
class SocketManager {
    constructor() {
 this.socket = io();
        this.roomId = null;
 this.playerId = this.generatePlayerId();

        this.setupConnectionHandlers();
        this.setupRoomHandlers();
        this.setupGameHandlers();
        this.setupControlButtons();

        // Initial player ID emission (can be done after connection)
        document.getElementById('connection-status').className = 'connected';
        console.log('Connected to server', this.socket.id);
        document.getElementById('connection-status').textContent = '🟢 已连接';
 this.socket.emit('player-id', this.playerId);
    }
    setupConnectionHandlers() {
      this.socket.on('disconnect', () => {
        document.getElementById('connection-status').className = 'disconnected';
        document.getElementById('connection-status').textContent = '🔴 断开连接';
        document.getElementById('connection-status').textContent = '🔴 断开连接';
        setTimeout(() => SocketManager.init(), 5000);
      });
 this.socket = io();
        this.playerId = this.generatePlayerId();
    }

    setupGameHandlers() {
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
            this.updateGameStatus('房间列表已更新'); // Example status update
        });

        this.socket.on('card:update', data => {
 const event = new CustomEvent('card:update', { detail: data });
 document.dispatchEvent(event);
        });
    }

        this.socket.on('game-start', () => {
            console.log('Received game-start!');
            document.getElementById('ready-button').style.display = 'none';
            document.getElementById('game-area').style.display = 'block';
            document.getElementById('room-list').style.display = 'none';
        });
    }

    updateGameStatus(statusText) {
        document.getElementById('game-status-display').textContent = statusText; // Assuming you have an element with this ID
    }

    setupRoomHandlers() {
        this.socket.on('room-list', (rooms) => {
            console.log('Received room-list:', rooms);
            this.renderRoomList(rooms);
        });

        this.socket.on('joined-room', (roomId) => {
            console.log('Joined room:', roomId);
            this.roomId = roomId;
            document.getElementById('room-list').style.display = 'none';
            document.getElementById('ready-button').style.display = 'block';
            // Potentially hide other room-related UI here
        });

        // Handle player joining/leaving within a room (for UI updates)
        this.socket.on('player-joined-room', ({ roomId, playerId }) => {
            console.log(`Player ${playerId} joined room ${roomId}`);
            // Update the UI for the specific room, e.g., player count
        });

        this.socket.on('player-left-room', ({ roomId, playerId }) => {
            console.log(`Player ${playerId} left room ${roomId}`);
            // Update the UI for the specific room, e.g., player count
        });
    }

      static renderRoomList(rooms) {
        const roomListContainer = document.getElementById('room-list-container'); // Assuming you have a container with this ID
        if (!roomListContainer) {
            console.error('Room list container not found');
            return;
        }
        roomListContainer.innerHTML = ''; // Clear existing list

        // Create a list item for each room
        for (const id in rooms) {
            const room = rooms[id];
            const roomElement = document.createElement('div'); // Use div for flexibility
            roomElement.classList.add('room-item');
            roomElement.dataset.roomId = id;
            roomElement.innerHTML = `
                <span>房间号: ${id}</span>
                <span>人数: ${room.players.length}/4</span>
                <button class="join-button">加入</button>
            `;

            // Add event listener to the join button
            const joinButton = roomElement.querySelector('.join-button');
            if (room.players.length >= 4) {
                joinButton.disabled = true; // Disable if room is full
            }
            joinButton.addEventListener('click', () => {
                console.log('Joining room:', id);
                SocketManager.socket.emit('join-room', id, SocketManager.playerId);
            });

            roomListContainer.appendChild(roomElement);
        }
      }

      static setupControlButtons() {
        const playButton = document.getElementById('play-button');
        const passButton = document.getElementById('pass-button');
        const readyButton = document.getElementById('ready-button');
        const createRoomButton = document.getElementById('create-room-button');
        const joinRoomButton = document.getElementById('join-room-button'); // Assuming you have a join room button for initial room selection

        if (playButton) {
          playButton.addEventListener('click', () => {
            // Assuming CardRenderer has a static method to get selected cards
            const selectedCards = CardRenderer.getSelectedCards();
            if (selectedCards.length > 0) {
              console.log('Playing cards:', selectedCards);
              SocketManager.socket.emit('card:play', { roomId: this.roomId, playerId: this.playerId, cards: selectedCards });
              CardRenderer.clearSelectedCards(); // Clear selection after playing
            }
          });
        }

        if (passButton) {
          passButton.addEventListener('click', () => {
            console.log('Passing turn');
            SocketManager.socket.emit('card:pass', { roomId: this.roomId, playerId: this.playerId });
          });
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

          readyButton.addEventListener('click', () => {
            console.log('Ready button clicked', this.playerId, this.roomId);
            SocketManager.socket.emit('ready', { roomId: this.roomId, playerId: this.playerId });
            readyButton.disabled = true;
          });
        }

        if (createRoomButton) {
          createRoomButton.addEventListener('click', () => {
            // Prompt user for room name or get it from an input field
            const roomName = prompt('请输入房间名称:'); // Basic prompt for demonstration
            if (roomName) {
              console.log('Creating room:', roomName);
              SocketManager.socket.emit('create-room', { roomName: roomName, playerId: this.playerId });
            }
          });
        }

    }


    static generatePlayerId() {
      return Math.random().toString(36).substring(2, 9);
    }
  }
SocketManager.init();
export { SocketManager };