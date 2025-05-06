// app.js 完整代码
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

// 动态生成哈希值
const generateHashes = () => {
  const files = ['socket_handler.js', 'card_renderer.js'];
  return files.reduce((acc, file) => {
    try {
      const content = fs.readFileSync(path.join(__dirname, 'public/js', file));
      acc[file] = crypto.createHash('sha256').update(content).digest('base64');
    } catch (error) {
      console.error(`⚠️ 文件读取错误: ${file}`, error);
      acc[file] = 'INVALID_HASH';
    }
    return acc;
  }, {});
};

// 安全头配置（精确调整版）
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (req, res) => {
        const hashes = generateHashes();
        return `'sha256-${hashes.socket_handler.js}' 'sha256-${hashes.card_renderer.js}'`;
      }],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      formAction: ["'self'"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// 静态资源配置
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store');
  }
}));

// 视图引擎配置
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 端口管理（增强版）
const PORT = 3000;
const killPortProcess = () => {
  return new Promise((resolve) => {
    require('child_process').exec(`lsof -i :${PORT} | grep LISTEN | awk '{print $2}' | xargs kill -9`, (err) => {
      if (err) console.log('🔄 端口未占用');
      resolve();
    });
  });
};

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

// 路由处理
app.get('/', (req, res) => {
  const demoCards = [
    '10_of_clubs.png',
    'ace_of_spades.png',
    'king_of_diamonds.png',
    'queen_of_hearts.png',
    'jack_of_spades.png',
    'back.png'
  ].map(f => new Card(f));

  res.render('index', { 
    cards: demoCards,
    hashes: generateHashes()
  });
});

// Socket.IO事件处理
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

// 启动服务（安全模式）
const startServer = async () => {
  await killPortProcess();
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ===================================
    🚀 服务已安全启动
    🌐 访问地址: http://localhost:${PORT}
    ===================================
    `);
  });
};

// 异常处理
process.on('uncaughtException', (err) => {
  console.error('❌ 致命错误:', err);
  startServer(); // 自动重启
});

// 启动服务
startServer();
