// public/js/socket_handler.js （新建文件完整代码）
console.log('📡 Socket处理器已加载');

const SocketManager = {
  init() {
    this.socket = io();
    
    this.socket.on('connect', () => {
      console.log('✅ 成功连接到游戏服务器');
      document.dispatchEvent(new Event('socketConnected'));
    });

    this.socket.on('disconnect', () => {
      console.warn('⚠️ 服务器连接断开');
      document.dispatchEvent(new Event('socketDisconnected'));
    });

    this.socket.on('cardAction', data => {
      console.log('收到卡牌动作:', data);
      const event = new CustomEvent('remoteCardAction', { detail: data });
      document.dispatchEvent(event);
    });
  }
};

// 初始化Socket连接
SocketManager.init();

// 自动重连机制
document.addEventListener('socketDisconnected', () => {
  setTimeout(() => {
    console.log('🔄 尝试重新连接...');
    SocketManager.init();
  }, 5000);
});
