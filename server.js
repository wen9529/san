import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// 解决ESM模块的路径问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 强制设置MIME类型
app.use((req, res, next) => {
  if (req.url.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript');
  }
  next();
});

// 配置静态资源（关键修复）
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// 游戏房间管理
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] 客户端连接: ${socket.id}`);

  // 房间系统
  socket.on('create_room', (username) => {
    const roomId = generateRoomId();
    rooms.set(roomId, {
      players: [{ id: socket.id, username, ready: false }],
      gameState: 'waiting',
      cards: []
    });
    socket.join(roomId);
    console.log(`房间创建: ${roomId}`);
    socket.emit('room_created', roomId);
  });

  socket.on('join_room', (roomId, username) => {
    if (!rooms.has(roomId)) {
      return socket.emit('error', '房间不存在');
    }

    const room = rooms.get(roomId);
    if (room.players.length >= 4) {
      return socket.emit('error', '房间已满');
    }

    room.players.push({ id: socket.id, username, ready: false });
    socket.join(roomId);
    io.to(roomId).emit('player_joined', room.players);
    console.log(`用户加入: ${username} => ${roomId}`);
  });

  // 游戏事件
  socket.on('submit_cards', (data) => {
    try {
      validateSubmission(data);
      io.to(data.roomId).emit('cards_submitted', {
        playerId: socket.id,
        cards: data.cards
      });
    } catch (err) {
      socket.emit('error', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`客户端断开: ${socket.id}`);
    cleanupRooms(socket.id);
  });
});

// 工具函数
function generateRoomId() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function validateSubmission(data) {
  if (!data.roomId || !data.cards) {
    throw new Error('无效的提交数据');
  }
  if (data.cards.length !== 13) {
    throw new Error('必须提交13张牌');
  }
}

function cleanupRooms(playerId) {
  rooms.forEach((room, roomId) => {
    room.players = room.players.filter(p => p.id !== playerId);
    if (room.players.length === 0) {
      rooms.delete(roomId);
      console.log(`房间关闭: ${roomId}`);
    }
  });
}

// 启动服务器
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ===================================
  十三水服务器已启动
  访问地址: http://localhost:${PORT}
  内网访问: http://${getLocalIP()}:${PORT}
  ===================================
  `);
});

// 获取本机IP地址
function getLocalIP() {
  const interfaces = require('os').networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '0.0.0.0';
}
