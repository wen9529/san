// public/js/socket_handler.js
// Assuming game_client.js is loaded before this script and provides a global `gameClient` object or functions.
// Assuming game_client.js is loaded before this script and provides a global `gameClient` object or functions.
class SocketManager {
    constructor() {
        SocketManager.instance = this;

        this.socket = io();

        this.roomId = null;
 this.playerId = SocketManager.generatePlayerId();

        this.setupRoomHandlers();
        this.setupGameHandlers();
        this.setupControlButtons();

        // Initial player ID emission (can be done after connection)
        document.getElementById('connection-status').className = 'connected';
        console.log('Connected to server', this.socket.id);
        document.getElementById('connection-status').textContent = '🟢 已连接';
        this.socket.emit('player-id', this.playerId);
    }

    // Static method to get the singleton instance
    static init() {
        return SocketManager.instance;
    }
    setupConnectionHandlers() {
      this.socket.on('disconnect', () => {
        document.getElementById('connection-status').className = 'disconnected';
        setTimeout(() => SocketManager.init(), 5000);
      });
    }

    setupGameHandlers() {
        // Listen for the 'deal_cards' event from the server
        this.socket.on('deal_cards', (cardsData) => {
            document.dispatchEvent(new CustomEvent('deal-cards', { detail: cardsData }));
        });
        this.socket.on('room-update', (rooms) => {
            document.dispatchEvent(new CustomEvent('room-update', { detail: rooms }));
        });
        this.socket.on('card:update', data => {
 document.dispatchEvent(new CustomEvent('card:update', { detail: data }));
        });

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
            document.dispatchEvent(new CustomEvent('room-list', { detail: rooms }));
        });

        this.socket.on('joined-room', (roomId) => {
            console.log('Joined room:', roomId);
            this.roomId = roomId;
            document.dispatchEvent(new CustomEvent('joined-room', { detail: roomId }));
        });

        // Handle player joining/leaving within a room (for UI updates)
        this.socket.on('player-joined-room', ({ roomId, playerId }) => {
            console.log(`Player ${playerId} joined room ${roomId}`);
            document.dispatchEvent(new CustomEvent('player-joined-room', { detail: { roomId, playerId } }));
        });

        this.socket.on('player-left-room', ({ roomId, playerId }) => {
            document.dispatchEvent(new CustomEvent('player-left-room', { detail: { roomId, playerId } }));
        });
    }

      static renderRoomList(rooms) {
        const roomListContainer = document.getElementById('room-list'); // Assuming you have a container with this ID
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
                SocketManager.instance.socket.emit('join-room', id, SocketManager.instance.playerId);
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



    static generatePlayerId() {
      return Math.random().toString(36).substring(2, 9);
    }
  }
SocketManager.init();
export { SocketManager };