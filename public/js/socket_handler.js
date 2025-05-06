// public/js/socket_handler.js
class SocketManager {
  static init() {
    this.socket = io();
    
    this.socket.on('connect', () => {
      document.getElementById('connection-status').className = 'connected';
      document.getElementById('connection-status').textContent = '🟢 已连接';
    });

    this.socket.on('disconnect', () => {
      document.getElementById('connection-status').className = 'disconnected';
      document.getElementById('connection-status').textContent = '🔴 断开连接';
      setTimeout(() => SocketManager.init(), 5000);
    });

    this.socket.on('card:update', data => {
      const event = new CustomEvent('card:update', { detail: data });
      document.dispatchEvent(event);
    });
  }
}

SocketManager.init();
