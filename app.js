// app.js 最终修复版
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const crypto = require('crypto');
const fs = require('fs');

// 初始化应用
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 安全扫描函数
const securityCheck = () => {
  // This function is intentionally left blank for now.
};

// 安全头配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"]
    }
  },
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
  try {
//    securityCheck(); // 每次请求执行安全扫描
    
    const cards = [
      '10_of_clubs.png', 'ace_of_spades.png',
      'king_of_diamonds.png', 'queen_of_hearts.png'
    ].map(f => new Card(f));

    res.render('index', { cards });
  } catch (err) {
    console.error('安全拦截:', err);
    res.status(500).send('系统安全检测异常');
  }
});

// Socket.IO
io.on('connection', (socket) => {
  console.log("new connection")
  socket.on('disconnect', () => {});
});

// 启动服务
server.listen(3000, '127.0.0.1', () => {
  console.log(`
  ==========================
  安全服务已启动
  访问地址: http://localhost:3000
  ==========================
  `);
});

// 进程管理
process.on('SIGTERM', () => process.exit(0));
