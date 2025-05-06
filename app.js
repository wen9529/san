const express = require('express');
const app = express();
const path = require('path');

// 配置视图引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 静态文件目录
app.use(express.static(path.join(__dirname, 'public')));

// 扑克牌解析逻辑
class Card {
  constructor(filename) {
    const parts = filename.replace('.png', '').split('_');
    this.suit = this.parseSuit(parts.pop());
    this.rank = this.parseRank(parts.join('_'));
  }

  parseSuit(suit) {
    const suits = {
      clubs: '♣',
      spades: '♠',
      diamonds: '♦',
      hearts: '♥'
    };
    return suits[suit] || '';
  }

  parseRank(rank) {
    const ranks = {
      ace: 'A',
      jack: 'J',
      queen: 'Q',
      king: 'K'
    };
    return ranks[rank] || rank;
  }

  toString() {
    return `${this.rank}${this.suit}`;
  }
}

// 路由
app.get('/', (req, res) => {
  // 示例牌组
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
