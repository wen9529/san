// app.js
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const crypto = require('node:crypto');
const fs = require('node:fs');

// 初始化应用
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 安全配置
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        (req, res) => `'sha256-${res.locals.cspHash}'`
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      formAction: ["'self'"]
    }
  },
  crossOriginOpenerPolicy: false // 临时关闭COOP
});

// 中间件配置
app.use(securityHeaders);
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store');
  }
}));  // 增加一个闭合括号

// 视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 端口管理
const PORT = 3000;
const releasePort = () => {
  require('child_process').exec(`fuser -k ${PORT}/tcp`, () => {
    server.listen(PORT, () => {
      console.log(`🚀 服务已启动: http://localhost:${PORT}`);
    });
  });
};

process.on('uncaughtException', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('🔄 强制释放端口...');
    releasePort();
  } else {
    console.error('❌ 未捕获异常:', err);
  }
});

// 扑克牌核心类
class Card {
  static SUITS = {
    clubs: '♣',
    spades: '♠',
    diamonds: '♦',
    hearts: '♥'
  };

  constructor(filename) {
    const [rank, suit] = filename.replace('.png', '').split('_of_');
    this.suit = Card.SUITS[suit] || '🃏';
    this.rank = this.#parseRank(rank);
  }

  #parseRank(rank) {
    const map = { ace: 'A', jack: 'J', queen: 'Q', king: 'K' };
    return map[rank] || rank.toUpperCase();
  }

  get image() {
    return this.rank === 'back' ? 
      '/images/back.png' : 
      `/images/${this.rank.toLowerCase()}_of_${this.suitName}.png`;
  }

  get suitName() {
    return Object.entries(Card.SUITS).find(([,v]) => v === this.suit)[0];
  }

  toString() {
    return `${this.rank}${this.suit}`;
  }
}

// 路由
app.get('/', (req, res) => {
  const cards = [
    '10_of_clubs.png',
    'ace_of_spades.png',
    'king_of_diamonds.png',
    'queen_of_hearts.png',
    'jack_of_spades.png',
    'back.png'
  ].map(f => new Card(f));

  res.render('index', { 
    cards,
    hashes: {
      socket: generateHash('socket_handler.js'),
      card: generateHash('card_renderer.js')
    }
  });
});

// 哈希生成函数
const generateHash = (filename) => {
  const content = fs.readFileSync(path.join(__dirname, 'public/js', filename));
  return crypto.createHash('sha256').update(content).digest('base64');
};

// Socket.IO
io.on('connection', (socket) => {
  console.log(`🔗 客户端连接: ${socket.id.slice(0,6)}`);
  
  socket.on('card:play', (data) => {
    io.emit('card:update', {
      ...data,
      timestamp: Date.now(),
      player: socket.id.slice(0,6)
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ 客户端断开: ${socket.id.slice(0,6)}`);
  });
});

// 启动服务
releasePort();
