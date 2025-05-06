import { CardRenderer } from './card_renderer.js'; // We will use global renderer in this example
// import { SocketHandler } from './socket_handler.js'; // We will use global socket in this example

class Game {
    constructor() {
      this.renderer = new CardRenderer();
      this.socket = new SocketHandler(this);
      this.selectedCards = new Set();
      this.roomId = null;
      this.myCards = [];
      this.username = null;
      this.players = [];

      this.initUIListeners();
    }

    initUIListeners() {
      this.gameStatus = document.getElementById('game-status');
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
      this.updateGameStatus('当前房间玩家：' + this.players.map(p => p.username).join(', '));
    }

    handleGameStart(cards) {
      this.myCards = cards;
      this.updateGameStatus('游戏开始！你的牌：' + this.myCards.join(', '));
      this.renderer.renderCards(this.myCards);
    }

    handleOpponentPlay(cards) {
      this.updateGameStatus('对手出牌：' + cards.join(', '));
    }

    handleInvalidMove(message) {
      this.updateGameStatus("出牌失败");

      alert(`Invalid move: ${message}`);
      this.clearSelectedCards();
    }

    clearSelectedCards() {
      this.selectedCards.clear();
      // Optionally, you can add code here to visually unselect cards in the UI
    }

    addSelectedCard(card){
      this.renderer.toggleCardSelect(card);
      this.updateGameStatus("add card "+card)

      this.selectedCards.add(card)
    }
    removeSelectedCard(card){
      this.selectedCards.delete(card)
    }
}

class SocketHandler {
    constructor(game) {
        this.game = game;
        this.socket = io(); // Connect to the server
        this.socket.on('roomCreated', roomId => this.game.handleRoomCreated(roomId));
        this.socket.on('playerJoined', players => this.game.handlePlayerJoined(players));
        this.socket.on('gameStart', cards => this.game.handleGameStart(cards));
        this.socket.on('opponentPlay', cards => this.game.handleOpponentPlay(cards));
        this.socket.on('invalidMove', message => this.game.handleInvalidMove(message));
    }
    createRoom(username) {
        this.socket.emit('createRoom', username);
    }
    joinRoom(roomId, username) {
        this.socket.emit('joinRoom', roomId, username);
    }
    submitPlay(cards) {
        this.socket.emit('submitPlay', cards);
    }
}

Game.prototype.updateGameStatus = function(status) {
    this.gameStatus.innerText = status;
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
  window.SocketHandler = SocketHandler;
});