// app.js 最终修复版
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
// 这些模块在最终版本中未使用，可以考虑移除如果确定不再需要
// const crypto = require('crypto');
const crypto = require('crypto');
const fs = require('fs');

// 初始化应用
const app = express();
const server = http.createServer(app);
const io = new Server(server);

<<<<<<< HEAD
// 安全头配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"]
    }
  }
  crossOriginEmbedderPolicy: false
}));

// 静态资源处理
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Content-Type-Options', 'nosniff');
  }
}));

// 视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 扑克牌类
class Card {
  static SUITS = {
    clubs: '♣', spades: '♠', diamonds: '♦', hearts: '♥'
  };

  constructor(filename) {
    const [rank, suit] = filename.replace('.png', '').split('_of_');
    this.suit = Card.SUITS[suit] || '';
    this.rank = this.#parseRank(rank);
  }

  #parseRank(rank) {
    const map = { ace: 'A', jack: 'J', queen: 'Q', king: 'K' };
    return map[rank] || rank;
  }

  get imagePath() {
    return `/images/${this.rank}_of_${this.suit}.png`;
  }
}

// 路由
app.get('/', (req, res) => {
  const cards = [
    '10_of_clubs.png', 'ace_of_spades.png',
    'king_of_diamonds.png', 'queen_of_hearts.png'
  ].map(f => new Card(f));

  res.render('index', { cards });
});

// Socket.IO
io.on('connection', (socket) => {
<<<<<<< HEAD

  socket.on('game-start', (data) => {
    console.log('game-start', socket.id, data);
  });

  socket.on('player-move', (data) => {
    console.log('player-move', socket.id, data);
  });

  socket.on('player-join', (data) => {
    console.log('player-join', socket.id, data);
  });

  socket.on('disconnecting', () => {
    console.log('disconnecting', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('disconnect', socket.id);
=======
  console.log('new connection', socket.id);
>>>>>>> main
});

// 启动服务
server.listen(3000, '127.0.0.1', () => {
  console.log('server started');
  console.log(`
  ==========================
  安全服务已启动
  访问地址: http://localhost:3000
  ==========================
  `);
});

// 进程管理
process.on('SIGTERM', () => process.exit(0));
