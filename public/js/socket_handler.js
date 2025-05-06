class SocketHandler {
    constructor(gameClient, url = 'http://localhost:3000') {
        this.game = gameClient;
        this.url = url;
        this.socket = null;
        this.currentRoom = null;
        this.connect();
    }

    connect() {
        this.socket = io(this.url);
        this.socket.on('connect', () => {
            console.log('成功连接到游戏服务器');
        });
        this.socket.on('room_created', (roomId) => {
            this.currentRoom = roomId;
            alert(`房间创建成功！房间号：${roomId}`);
        });
        this.socket.on('player_joined', (players) => {
            console.log('当前房间玩家：', players);
        });
        // Add event to update game status
        this.socket.on('game_update', (gameData) => {
            this.game.updateGame(gameData);
        });
    }

    createRoom(username) {
        this.socket.emit('create_room', username);
    } 

    joinRoom(roomId, username) {
        this.socket.emit('join_room', roomId, username);
    }

    submitPlay(cards) {
        this.socket.emit('submit_cards', {
            roomId: this.currentRoom,
            cards: cards
        });
    }
}

// Make SocketHandler available globally
window.SocketHandler = SocketHandler;
export default SocketHandler;
