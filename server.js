import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os'; // 修复的OS模块引入

// 解决ESM路径问题
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

// 强制设置MIME类型中间件
app.use((req, res, next) => {
  if (req.url.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript');
  }
  next();
});

// 静态资源托管
app.use(express.static(path.join(__dirname, 'public')));

// 房间管理系统
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] 客户端连接: ${socket.id}`);

  // 房间创建逻辑
  socket.on('create_room', (username) => {
    const roomId = generateRoomId();
    rooms.set(roomId, {
      players: [{ id: socket.id, username, ready: false }],
      gameState: 'waiting',
      cards: []
    });
    socket.join(roomId);
    socket.emit('room_created', roomId);
  });

  // 其他保持原有代码...
});

// 获取本机IP函数（已修复）
function getLocalIP() {
  const interfaces = os.networkInterfaces(); // 正确引入方式
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

// 保持其他函数不变...

// 启动服务器
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ===================================
  服务器运行中 ➤ http://localhost:${PORT}
  局域网访问 ➤ http://${getLocalIP()}:${PORT}
  ===================================
  `);
});
