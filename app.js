// app.js
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 配置中间件
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 自动释放端口中间件
const port = 3000;
process.on('uncaughtException', (err) => {
  if (err.code === 'EADDRINUSE') {
    require('child_process').exec(`fuser -k ${port}/tcp`, () => {
      server.listen(port, () => {
        console.log(`Port ${port} recycled successfully`);
      });
    });
  }
});

// 扑克牌类
class Card {
  constructor(filename) {
    const [rank, suit] = filename.replace('.png', '').split('_of_');
    this.suit = this.#parseSuit(suit);
    this.rank = this.#parseRank(rank);
  }

  #parseSuit(suit) {
    const suits = {
      clubs: '♣',
      spades: '♠',
      diamonds: '♦',
      hearts: '♥'
    };
    return suits[suit] || '';
  }

  #parseRank(rank) {
    const ranks = { ace: 'A', jack: 'J', queen: 'Q', king: 'K' };
    return ranks[rank] || rank.toUpperCase();
  }

  get imagePath() {
    return this.rank === 'back' ? 
      '/images/back.png' : 
      `/images/${this.rank.toLowerCase()}_of_${this.suitName}.png`;
  }

  get suitName() {
    return Object.entries({
      '♣': 'clubs',
      '♠': 'spades',
      '♦': 'diamonds',
      '♥': 'hearts'
    }).find(([k]) => k === this.suit)[1];
  }

  toString() {
    return `${this.rank}${this.suit}`;
  }
}

// 路由
app.get('/', (req, res) => {
  const demoCards = [
    new Card('10_of_clubs.png'),
    new Card('ace_of_spades.png'),
    new Card('king_of_diamonds.png'),
    new Card('queen_of_hearts.png'),
    new Card('jack_of_spades.png'),
    new Card('back.png')
  ];

  res.render('index', { cards: demoCards });
});

// Socket.IO 逻辑
io.on('connection', (socket) => {
  console.log(`用户连接: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`用户断开: ${socket.id}`);
  });

  socket.on('cardClick', (data) => {
    io.emit('cardAction', { 
      ...data,
      timestamp: Date.now(),
      player: socket.id.slice(0,6)
    });
  });
});

// 启动服务器
server.listen(port, () => {
  console.log(`服务运行在 http://localhost:${port}`);
});
