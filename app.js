// app.js 完整代码
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// 中间件配置
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 强制释放端口逻辑
process.on('uncaughtException', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('强制释放3000端口...');
    const { exec } = require('child_process');
    exec('pkill -9 node', () => {
      http.listen(3000, () => {
        console.log('端口3000重新激活成功');
      });
    });
  }
});

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  socket.on('disconnect', () => {
    console.log('用户断开:', socket.id);
  });
});

// 路由处理
app.get('/', (req, res) => {
  const exampleCards = [
    '10_of_clubs.png',
    'ace_of_spades.png', 
    'king_of_diamonds.png',
    'queen_of_hearts.png',
    'jack_of_spades.png'
  ].map(filename => new Card(filename));

  res.render('index', {
    cards: exampleCards,
    backCard: new Card('back.png')
  });
});

// 扑克牌类（保持不变）
class Card {
  // ... 保持原有Card类代码不变 ...
}

// 启动服务器
http.listen(3000, () => {
  console.log('服务已启动在 http://localhost:3000');
});
