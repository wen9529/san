// public/js/card_renderer.js
// public/js/card_renderer.js
import { SocketManager } from './socket_handler.js';
import { Game } from './game.js';

class CardRenderer {
  constructor() {
 this.cardContainer = document.getElementById('card-container');
 this.suits = {
 clubs: '♣',
 spades: '♠',
 diamonds: '♦',
 hearts: '♥'
 };

  }
  static init() {
    document.addEventListener('card:deal', e => {
      const cards = e.detail;
 this.renderCards(cards);
    });

    document.addEventListener('card:play', e => {
      card.addEventListener('click', this.handleClick);
    });
  }

  static renderCards(cards) {
 cards.forEach(card => {
 const cardElement = document.createElement('div');
 cardElement.classList.add('game-card');
 cardElement.dataset.rank = card.rank;
 cardElement.dataset.suit = card.suit;
 cardElement.textContent = `${card.rank}${card.suit}`;
 cardElement.addEventListener('click', (e) => {
 const data = {
 suit: e.currentTarget.dataset.suit,
 rank: e.currentTarget.dataset.rank,
 playerId: SocketManager.playerId
 };
 SocketManager.socket.emit('card:play', data);
 e.currentTarget.classList.add('selected');
 });

 this.cardContainer.appendChild(cardElement);
    });
  }

  static handleClick(e) {
 const data = e.detail;
 const card = document.querySelector(`[data-suit="${data.suit}"][data-rank="${data.rank}"]`);
 card?.classList.add('played');
  }
}

document.addEventListener('DOMContentLoaded', () => CardRenderer.init());
export { CardRenderer };
