// public/js/socketHandler.js
const socket = io();

const connectionStatus = {
  element: document.querySelector('#connection-status span'),
  update: (status) => {
    connectionStatus.element.className = status;
    connectionStatus.element.textContent = status === 'connected' ? '已连接' : '断开';
  }
};

socket.io.on('reconnect_attempt', () => {
  connectionStatus.update('reconnecting');
});

socket.on('connect', () => {
  connectionStatus.update('connected');
  sessionStorage.setItem('sessionId', socket.id);
});

socket.on('disconnect', () => {
  connectionStatus.update('disconnected');
});

socket.on('cardAction', (data) => {
  const event = new CustomEvent('serverCardAction', { detail: data });
  document.dispatchEvent(event);
});
