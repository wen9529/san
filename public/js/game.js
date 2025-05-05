import { CardRenderer } from './card_renderer.js';
import { SocketHandler } from './socket_handler.js';

class Game {
    constructor() {
      this.renderer = new CardRenderer();
      this.socket = new SocketHandler(this);
      this.selectedCards = new Set();
      this.roomId = null;
      this.username = null;
      this.players = [];
  
      this.initUIListeners();
    }
  
    initUIListeners() {
      document.getElementById('create-btn').addEventListener('click', () => {
        this.handleCreateRoom();
      });
  
      document.getElementById('join-btn').addEventListener('click', () => {
        this.handleJoinRoom();
      });
  
      document.getElementById('submit-btn').addEventListener('click', () => {
        this.handleSubmitCards();
      });
    }
  
    handleCreateRoom() {
      this.username = document.getElementById('username').value;
      if (!this.username) {
        alert('请输入用户名！');
        return;
      }
      this.socket.createRoom(this.username);
    }
  
    handleJoinRoom() {
      this.roomId = document.getElementById('roomId').value;
      this.username = document.getElementById('username').value;
      if (!this.roomId || !this.username) {
        alert('请输入房间号和用户名！');
        return;
      }
      this.socket.joinRoom(this.roomId, this.username);
    }
  
    handleSubmitCards() {
      if (this.selectedCards.size === 13) {
        this.socket.submitPlay([...this.selectedCards]);
        this.clearSelectedCards();
      } else {
        alert('请选择13张牌！');
      }
    }
  
    handleRoomCreated(roomId) {
      this.roomId = roomId;
      alert(`房间创建成功！房间号：${roomId}`);
      console.log(`Room ${roomId} created.`);
    }
  
    handlePlayerJoined(players) {
      this.players = players;
      console.log('当前房间玩家：', this.players);
    }
  
    handleGameStart() {
      console.log('Game Start');
    }
  
    handleInvalidMove(message) {
      alert(`Invalid move: ${message}`);
      this.clearSelectedCards();
    }
  
    clearSelectedCards() {
      this.selectedCards.clear();
      // Optionally, you can add code here to visually unselect cards in the UI
    }

    addSelectedCard(card){
      this.selectedCards.add(card)
    }
    removeSelectedCard(card){
      this.selectedCards.delete(card)
    }
}


window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
