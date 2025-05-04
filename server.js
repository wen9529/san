const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const CardValidator = require('./game_logic/card_rules');
const { CARD_MAP } = require('./utils/card_mapper');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// 游戏房间数据库
const rooms = new Map();

// 静态资源托管
app.use(express.static('public'));

// Socket事件处理
io.on('connection', (socket) => {
  console.log(`用户连接: ${socket.id}`);

  // 房间管理
  socket.on('create_room', handleCreateRoom);
  socket.on('join_room', handleJoinRoom);
  socket.on('leave_room', handleLeaveRoom);

  // 游戏操作
  socket.on('submit_cards', (data) => {
    try {
      CardValidator.validateSubmission(data.cards);
      socket.to(data.roomId).emit('opponent_played', data);
    } catch (err) {
      socket.emit('error', err.message);
    }
  });

  // 断连处理
  socket.on('disconnect', () => {
    [...rooms.values()].forEach(room => {
      room.players = room.players.filter(p => p.id !== socket.id);
    });
  });
});

// 房间处理函数
function handleCreateRoom(username) {
  const roomId = generateRoomId();
  rooms.set(roomId, {
    players: [{ id: this.id, username, ready: false }],
    gameState: 'waiting',
    deck: shuffleDeck()
  });
  this.join(roomId);
  this.emit('room_created', roomId);
}

function generateRoomId() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// 启动服务器
server.listen(3000, '0.0.0.0', () => {
  console.log('十三水服务器已启动:3000');
});
