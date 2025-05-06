// app.js 完整代码
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// 初始化应用
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 配置中间件
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store');
  }
}));

// 视图引擎配置
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 强制端口回收逻辑
const PORT = 3000;
process.on('uncaughtException', (err) => {
  if (err.code === 'EADDRINUSE') {
    require('child_process').exec(`fuser -k ${PORT}/tcp`, () => {
      server.listen(PORT, () => {
        console.log(`端口 ${PORT} 已强制回收并重启`);
      });
    });
  }
});

// 扑克牌类（核心逻辑）
class Card {
  constructor(filename) {
    const [rank, suit] = filename.replace('.png', '').split('_of_');
    this.suit = this.#parseSuit(suit);
    this.rank = this.#parseRank(rank);
  }

  // 私有方法：解析花色
  #parseSuit(suit) {
    const suitMap = {
      clubs: '♣',
      spades: '♠', 
      diamonds: '♦',
      hearts: '♥'
    };
    return suitMap[suit] || '🃏';
  }

  // 私有方法：解析牌面
  #parseRank(rank) {
    const rankMap = {
      ace: 'A',
      jack: 'J',
      queen: 'Q',
      king: 'K'
    };
    return rankMap[rank] || rank.toUpperCase();
  }

  // 获取图片路径
  get imagePath() {
    return this.rank === 'back' ? 
      '/images/back.png' : 
      `/images/${this.rank.toLowerCase()}_of_${this.suitName}.png`;
  }

  // 获取英文花色名称
  get suitName() {
    return {
      '♣': 'clubs',
      '♠': 'spades',
      '♦': 'diamonds',
      '♥': 'hearts'
    }[this.suit];
  }

  toString() {
    return `${this.rank}${this.suit}`;
  }
}

// 路由配置
app.get('/', (req, res) => {
  const demoCards = [
    '10_of_clubs.png',
    'ace_of_spades.png',
    'king_of_diamonds.png',
    'queen_of_hearts.png',
    'jack_of_spades.png',
    'back.png'
  ].map(filename => new Card(filename));

  res.render('index', { cards: demoCards });
});

// 特殊JS文件路由（修复404关键）
app.get('/js/:filename', (req, res) => {
  const fileMap = {
    'card_renderer.js': true,
    'socket_handler.js': true,
    'game_init.js': true
  };

  if (fileMap[req.params.filename]) {
    res.sendFile(path.join(__dirname, 'public/js', req.params.filename), {
      headers: {
        'Content-Type': 'application/javascript',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } else {
    res.status(404).send('Not Found');
  }
});

// Socket.IO 事件处理
io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] 客户端连接: ${socket.id}`);

  socket.on('cardOperation', (data) => {
    io.emit('cardUpdate', {
      ...data,
      timestamp: Date.now(),
      source: socket.id
    });
  });

  socket.on('disconnect', () => {
    console.log(`[${new Date().toISOString()}] 客户端断开: ${socket.id}`);
  });
});

// 启动服务
server.listen(PORT, () => {
  console.log(`
  ===================================
  游戏服务已启动于: http://localhost:${PORT}
  ===================================
  `);
});
