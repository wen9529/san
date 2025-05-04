import { io } from '/socket.io/socket.io.esm.min.js';

export class SocketHandler {
    constructor(gameClient) {
        this.game = gameClient;
        this.socket = io('http://localhost:3000');
        this.currentRoom = null;

        // 事件绑定
        this.socket.on('connect', () => this.handleConnect());
        this.socket.on('room_created', (roomId) => this.handleRoomCreated(roomId));
        this.socket.on('player_joined', (players) => this.handlePlayerJoined(players));
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

    handleConnect() {
        console.log('成功连接到游戏服务器');
    }

    handleRoomCreated(roomId) {
        this.currentRoom = roomId;
        alert(`房间创建成功！房间号：${roomId}`);
    }

    handlePlayerJoined(players) {
        console.log('当前房间玩家：', players);
    }
}
