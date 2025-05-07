// public/js/socket_handler.js
document.addEventListener('DOMContentLoaded', () => {

  class SocketManager {
  static init() {
    this.socket = io();
    
    this.socket.on('connect', () => {
      document.getElementById('connection-status').className = 'connected';
      console.log('Connected to server', this.socket.id);
      document.getElementById('connection-status').textContent = '🟢 已连接';
    });

    this.socket.on('disconnect', () => {
      document.getElementById('connection-status').className = 'disconnected';
      document.getElementById('connection-status').textContent = '🔴 断开连接';
      setTimeout(() => SocketManager.init(), 5000);
    });

    // 添加其他事件处理器
    this.socket.on('game-start', data => {
      console.log('game-start', data);
    });

    this.socket.on('player-move', data => {
      console.log('player-move', data);
    });

    this.socket.on('player-join', data => {
      console.log('player-join', data);
    });

    this.socket.on('card:update', data => {
      const event = new CustomEvent('card:update', { detail: data });
      document.dispatchEvent(event);
    });
  }
  }