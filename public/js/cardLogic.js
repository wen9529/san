// public/js/cardLogic.js
class CardManager {
  static init() {
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        if (card.classList.contains('disabled')) return;
        
        const cardData = {
          suit: card.dataset.suit,
          rank: card.dataset.rank,
          position: {
            x: card.offsetLeft,
            y: card.offsetTop
          }
        };
        
        socket.emit('cardClick', cardData);
        card.classList.add('played');
      });
    });
  }

  static updateCardState(data) {
    const target = [...document.querySelectorAll('.card')]
      .find(card => 
        card.dataset.suit === data.suit && 
        card.dataset.rank === data.rank
      );
    
    if (target) {
      target.style.transform = `translate(${data.position.x}px, ${data.position.y}px)`;
      target.classList.add('animate');
    }
  }
}

document.addEventListener('DOMContentLoaded', CardManager.init);
document.addEventListener('serverCardAction', e => CardManager.updateCardState(e.detail));
