
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
}

document.addEventListener('DOMContentLoaded', () => {
 Game.init();
});
export { Game };
