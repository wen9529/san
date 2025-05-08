
import { SocketManager } from './socket_handler.js';

class Game {
    constructor() {
        this.hand = [];
        this.playedCards = [];
    }

    static init() {
        SocketManager.socket.on('card:deal', data => {
            this.dealCards(data);
        });

        SocketManager.socket.on('card:update', data => {
            this.updateCardStatus(data);
        });

        SocketManager.socket.on('card:played', data => {
 this.handleCardPlayed(data);
        });
    }

    static dealCards(cards) {
        this.hand = cards;
        console.log('dealed cards', this.hand);
        const event = new CustomEvent('card:deal', { detail: this.hand });
        document.dispatchEvent(event);
    }

    static updateCardStatus(data) {
        console.log('card status update', data);
        if (data.playerId != SocketManager.playerId) {
            const card = document.querySelector(`[data-rank="${data.rank}"][data-suit="${data.suit}"]`);
            card.classList.add('played');
            console.log('card status updated');
        }
    }

    static handleCardPlayed(data) {
        console.log('Card played:', data);
        // If the played card belongs to the current player, remove it from hand
 if (data.playerId === SocketManager.playerId) {
            this.hand = this.hand.filter(card => !(card.rank === data.rank && card.suit === data.suit));
            console.log('Updated hand:', this.hand);
 }
        // Trigger event to notify renderer to update played cards display
        const event = new CustomEvent('card:played', { detail: data });
        document.dispatchEvent(event);
    }
}

document.addEventListener('DOMContentLoaded', () => {
 Game.init();
});
export { Game };
