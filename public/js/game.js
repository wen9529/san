import { CardRenderer } from './card_renderer.js';
import { SocketHandler } from './socket_handler.js';

class GameClient {
    constructor() {
        this.renderer = new CardRenderer();
        this.socket = new SocketHandler(this);
        this.selectedCards = new Set();
        
        this.initUIListeners();
    }

    initUIListeners() {
        document.getElementById('create-btn').addEventListener('click', () => {
            const username = document.getElementById('username').value;
            this.socket.createRoom(username);
        });

        document.getElementById('join-btn').addEventListener('click', () => {
            const roomId = document.getElementById('roomId').value;
            const username = document.getElementById('username').value;
            this.socket.joinRoom(roomId, username);
        });

        document.getElementById('submit-btn').addEventListener('click', () => {
            this.submitCards();
        });
    }

    submitCards() {
        if (this.selectedCards.size === 13) {
            this.socket.submitPlay([...this.selectedCards]);
            this.selectedCards.clear();
        } else {
            alert('请选择13张牌！');
        }
    }
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    new GameClient();
});
