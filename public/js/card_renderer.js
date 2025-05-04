export class CardRenderer {
    constructor() {
        this.template = document.getElementById('card-template');
    }

    renderCard(cardData) {
        const clone = this.template.content.cloneNode(true);
        const card = clone.querySelector('.card');
        const frontImg = clone.querySelector('.card-front');
        
        card.dataset.cardCode = cardData.code;
        frontImg.src = `/images/${this.getImagePath(cardData)}`;
        
        return clone;
    }

    getImagePath(card) {
        const suitMap = {
            'c': 'clubs',
            'd': 'diamonds',
            'h': 'hearts',
            's': 'spades'
        };
        
        const rank = card.rank === 1 ? 'ace' : 
                    card.rank === 11 ? 'jack' :
                    card.rank === 12 ? 'queen' :
                    card.rank === 13 ? 'king' : card.rank;
        
        return `${suitMap[card.code.slice(-1)]}/${rank}_of_${suitMap[card.code.slice(-1)]}.png`;
    }

    renderHand(cards, container) {
        container.innerHTML = '';
        cards.forEach(card => {
            const cardElement = this.renderCard(card);
            container.appendChild(cardElement);
        });
    }
}
