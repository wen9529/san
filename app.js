const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.img = `${suit}${rank}.png`;
    this.value = {'2':15,A:14,K:13,Q:12,J:11,10:10,9:9,8:8,7:7,6:6,5:5,4:4,3:3}[rank];
  }
}

class Deck {
  constructor() {
    const suits = ['S','H','C','D'];
    const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    this.cards = suits.flatMap(s => ranks.map(r => new Card(s,r)));
    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal() {
    return Array.from({length:4}, (_,i) => 
      this.cards.slice(i*13, (i+1)*13)
       .sort((a,b) => b.value - a.value)
    );
  }
}

app.get('/', (req, res) => {
  const deck = new Deck();
  res.render('game', { players: deck.deal() });
});

app.listen(3000, () => console.log('Running on port 3000'));
