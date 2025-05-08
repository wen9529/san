// public/js/card_renderer.js
// public/js/card_renderer.js
import { SocketManager } from './socket_handler.js';
import { Game } from './game.js';

class CardRenderer {
  constructor() {
    this.cardContainer = document.getElementById('card-container');
    this.playedCardsContainer = document.getElementById('played-cards-container'); // Assuming you add this div in your HTML
    this.currentPlayerDisplay = document.getElementById('current-player-display'); // Assuming you add this div in your HTML
    this.suits = {
      clubs: '♣',
      spades: '♠',
      diamonds: '♦',
      hearts: '♥'
    };
    this.selectedCards = [];
  }
  static init() {
    const renderer = new this(); // Create an instance to access instance properties
    document.addEventListener('card:deal', e => {
 console.log('CardRenderer: Received custom card:deal event', e.detail);
      const cards = e.detail;
      renderer.renderCards(cards);
    });


    document.addEventListener('card:play', e => {
      card.addEventListener('click', this.handleClick);
    });
  }

  static renderCards(cards) {
    const renderer = new this(); // Create an instance to access instance properties
 console.log('CardRenderer: Starting to render cards');
    renderer.cardContainer.innerHTML = ''; // Clear previous cards
    cards.forEach(card => {
 console.log('CardRenderer: Rendering card', card);
      const cardElement = document.createElement('div');
      cardElement.classList.add('game-card');
      cardElement.dataset.rank = card.rank;
      cardElement.dataset.suit = card.suit;
      const imageUrl = `images/cards/${card.suit.toLowerCase()}_${card.rank.toUpperCase()}.png`;
      cardElement.style.backgroundImage = `url(${imageUrl})`;
      cardElement.style.backgroundSize = 'contain'; // Or 'cover' depending on your image aspect ratio
      cardElement.addEventListener('click', () => {
        renderer.toggleCardSelection(cardElement, card);
      });
      renderer.cardContainer.appendChild(cardElement);
    });
  }

  static renderPlayedCards(playedCards) {
    const renderer = new this(); // Create an instance
    renderer.playedCardsContainer.innerHTML = ''; // Clear previous played cards
    if (playedCards && playedCards.length > 0) {
      playedCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('game-card', 'played');
        cardElement.dataset.rank = card.rank;
        cardElement.dataset.suit = card.suit;
        const imageUrl = `images/cards/${card.suit.toLowerCase()}_${card.rank.toUpperCase()}.png`;
        cardElement.style.backgroundImage = `url(${imageUrl})`;
        cardElement.style.backgroundSize = 'contain'; // Or 'cover'
        renderer.playedCardsContainer.appendChild(cardElement);
      });
    }
  }

  static updateCurrentPlayer(playerId) {
    const renderer = new this(); // Create an instance
    // You'll likely want to map player IDs to something more user-friendly (e.g., "You", "Player 2")
    renderer.currentPlayerDisplay.textContent = `Current Turn: ${playerId}`;
  }

  static toggleCardSelection(cardElement, card) {
    const renderer = new this(); // Create an instance
    const index = renderer.selectedCards.findIndex(c => c.rank === card.rank && c.suit === card.suit);

    if (index > -1) {
      // Card is already selected, unselect it
      renderer.selectedCards.splice(index, 1);
      cardElement.classList.remove('selected');
    } else {
      // Card is not selected, select it
      renderer.selectedCards.push(card);
      cardElement.classList.add('selected');
    }
    console.log('Selected Cards:', renderer.selectedCards);
  }

  static playSelectedCards() {
    const renderer = new this(); // Create an instance
    if (renderer.selectedCards.length > 0) {
      // Emit the 'card:play' event with the selected cards
      SocketManager.socket.emit('card:play', { cards: renderer.selectedCards, playerId: SocketManager.playerId });
      renderer.selectedCards = []; // Clear selected cards after playing
    }
  }

  static handleClick(e) {
    // This method seems unused based on the provided code and the new toggleCardSelection logic.
    // You might want to remove or refactor it.
  }
}

document.addEventListener('DOMContentLoaded', () => CardRenderer.init());
export { CardRenderer };
