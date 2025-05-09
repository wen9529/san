// public/js/card_renderer.js
// public/js/card_renderer.js
import { SocketManager } from './socket_handler.js';

class CardRenderer {
  constructor() {
    this.cardContainer = document.getElementById('card-container');
    this.playedCardsContainer = document.getElementById('played-cards-container'); // Assuming you add this div in your HTML
    this.currentPlayerDisplay = document.getElementById('current-player-display'); // Assuming you add this div in your HTML
    this.playerAreas = { top: document.getElementById('player-top'), right: document.getElementById('player-right'), bottom: document.getElementById('player-bottom'), left: document.getElementById('player-left') }; // Assuming these divs exist
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
      renderer.renderHand(cards, document.getElementById('current-player-hand')); // Render the dealt hand
    });

    document.addEventListener('card:play', e => {
      // This event listener seems misplaced. Card selection should happen before playing.
      // The play logic is likely triggered by a button click, not a card click after playing.
      // Removing this line as it doesn't seem to fit the intended workflow.
      // card.addEventListener('click', this.handleClick);
    });
  }

  // Renders a single card HTML element
  static renderCard(card) {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card'); // Use the general card class from CSS
    cardElement.dataset.rank = card.rank;
    cardElement.dataset.suit = card.suit;
    cardElement.textContent = `${card.rank} ${card.suit}`; // Display rank and suit text
    cardElement.classList.add(card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'); // Add color class

    return cardElement;
  }

  // Renders a hand (array of cards) into a container element
  static renderHand(cards, containerElement, handType = null) {
 console.log('CardRenderer: Starting to render cards');
    renderer.cardContainer.innerHTML = ''; // Clear previous cards
    cards.forEach(card => {
 console.log('CardRenderer: Rendering card', card);
      const cardElement = CardRenderer.renderCard(card); // Use the static renderCard method
      cardElement.addEventListener('click', () => {
        CardRenderer.toggleCardSelection(cardElement, card); // Use static method
      });
      renderer.cardContainer.appendChild(cardElement);
    });

    // Add hand type display if provided
    if (handType) {
      const handTypeElement = document.createElement('div');
      handTypeElement.classList.add('hand-type');
      handTypeElement.textContent = handType;
      // Add a specific class for special hands (you'll need to define which types are special)
      if (['一条龙', '十二皇族', '四套三条', '凑一色', '全大', '全小', '六对半', '五对三条', '三顺子', '三同花'].includes(handType)) { // TODO: Define your special hand types
 handTypeElement.classList.add('special-hand-type');
      }
      containerElement.appendChild(handTypeElement); // Append the type below the cards
    }
  }

  static renderPlayedCards(playedCards) {
    const renderer = new this(); // Create an instance
    renderer.playedCardsContainer.innerHTML = ''; // Clear previous played cards
    if (playedCards && playedCards.length > 0) {
 console.log('CardRenderer: Rendering played cards:', playedCards);
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
    const index = CardRenderer.selectedCards.findIndex(c => c.rank === card.rank && c.suit === card.suit);

    if (index > -1) {
      // Card is already selected, unselect it
      CardRenderer.selectedCards.splice(index, 1);
      cardElement.classList.remove('selected');
    } else {
      // Card is not selected, select it
      cardElement.classList.add('selected');
      CardRenderer.selectedCards.push(card); // Add to selected cards
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
