
import { SocketManager } from './socket_handler.js';

class Game {
    constructor() {
        this.hand = [];
        this.currentPlay = null; // Store the last played cards
        this.currentPlayer = null; // Store the ID of the player whose turn it is
        this.playersPassed = []; // Store players who passed in the current round
    }

    // Initialize game event listeners
    static init() {
        SocketManager.socket.on('card:deal', data => {
            this.dealCards(data);
        });

        SocketManager.socket.on('card:update', data => {
            this.updateCardStatus(data);
        });

        // Listen for updates to the current play
        SocketManager.socket.on('game:currentPlay', data => {
            this.currentPlay = data;
            console.log('Current play updated:', this.currentPlay);
            const event = new CustomEvent('game:currentPlay', { detail: this.currentPlay });
            document.dispatchEvent(event);
        });

        // Listen for updates to the current player
        SocketManager.socket.on('game:currentPlayer', playerId => {
            this.currentPlayer = playerId;
            console.log('Current player updated:', this.currentPlayer);
            const event = new CustomEvent('game:currentPlayer', { detail: this.currentPlayer });
            document.dispatchEvent(event);
        });

        // Listen for when a card is played
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

    // Update the visual status of a card (basic implementation)
    static updateCardStatus(data) {
        console.log('card status update', data);
        if (data.playerId != SocketManager.playerId) {
            const card = document.querySelector(`[data-rank="${data.rank}"][data-suit="${data.suit}"]`);
            card.classList.add('played');
            console.log('card status updated');
        }
    }

    static handleCardPlayed(data) {
        console.log('Card played event received:', data);
        // If the played card belongs to this client's player, remove it from hand
        if (data.playerId === SocketManager.playerId) {
            // Assuming data.cards is an array of cards played by the player
            this.hand = this.hand.filter(handCard =>
                !data.cards.some(playedCard => playedCard.rank === handCard.rank && playedCard.suit === handCard.suit)
            );
            console.log('Updated hand:', this.hand);
            const event = new CustomEvent('hand:update', { detail: this.hand });
            document.dispatchEvent(event);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
 Game.init();
});
export { Game };
