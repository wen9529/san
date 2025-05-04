// server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// 增强CORS配置
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  }
});

app.use(express.static(path.join(__dirname, 'public')));

// 添加心跳检测
io.engine.on("connection", (socket) => {
  console.log(`Socket连接ID: ${socket.id}`);
});

io.on('connection', (socket) => {
  console.log('客户端连接成功:', socket.id);

  socket.on('disconnect', () => {
    console.log('客户端断开:', socket.id);
  });
});

// 错误处理
httpServer.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error('端口3000被占用！');
    process.exit(1);
  }
});

const PORT = 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  const ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach((ifname) => {
    ifaces[ifname].forEach((iface) => {
      if ('IPv4' === iface.family && !iface.internal) {
        console.log(`访问地址: http://${iface.address}:${PORT}`);
      }
    });
  });
});
