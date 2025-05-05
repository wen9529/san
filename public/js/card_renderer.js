export class CardRenderer {
  constructor() {
    this.template = document.getElementById('card-template');
    this.cardContainer = null;
  }

  setCardContainer(container) {
    this.cardContainer = container;
    this.cardContainer.innerHTML = ''; // Clear previous cards
  }

  renderCard(cardData) {
    if (!cardData) {
      console.error("Card data is undefined");
      return null;
    }
    const clone = this.template.content.cloneNode(true);
    const card = clone.querySelector('.card');
    const frontImg = clone.querySelector('.card-front');

    card.dataset.cardCode = cardData.code;
    frontImg.src = this.getImagePath(cardData);

    card.addEventListener('click', () => this.toggleCardSelection(card));
    return clone;
  }

  getImagePath(card) {
    const suitMap = {
      'c': 'clubs',
      'd': 'diamonds',
      'h': 'hearts',
      's': 'spades'
    };

    const rankMap = {
      1: 'ace',
      11: 'jack',
      12: 'queen',
      13: 'king'
    };

    const rank = rankMap[card.rank] || card.rank;
    const suit = suitMap[card.code.slice(-1)];

    return `/images/${rank}_of_${suit}.png`;
  }

  renderHand(cards) {
    if (!this.cardContainer) {
      console.error('Card container is not set!');
      return;
    }
    this.clearCards();

    cards.forEach(card => {
      const cardElement = this.renderCard(card);
      this.cardContainer.appendChild(cardElement);
    });
  }

  toggleCardSelection(cardElement) {
    cardElement.classList.toggle('selected');
  }

  clearCards() {
    if (!this.cardContainer) {
      console.error('Card container is not set!');
      return;
    }
    this.cardContainer.innerHTML = '';
  }


}
