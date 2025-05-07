// public/js/card_renderer.js
// public/js/card_renderer.js
import { SocketManager } from './socket_handler.js';
class CardInteractor {
  static init() {
    document.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', this.handleClick);
    });

    document.addEventListener('card:update', e => {
      const { suit, rank } = e.detail;
      const target = document.querySelector(`[data-suit="${suit}"][data-rank="${rank}"]`);
      target?.classList.add('played');
    });
  }

  static handleClick(e) {
    const card = e.currentTarget;
    const data = {
      suit: card.dataset.suit,
      rank: card.dataset.rank
    };
    
    card.classList.add('selected');
    SocketManager.socket.emit('card:play', data);
  }
}

document.addEventListener('DOMContentLoaded', () => CardInteractor.init());
