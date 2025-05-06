// public/js/card_renderer.js （新建文件完整代码）
console.log('🃏 卡片渲染器已加载');

class CardRenderer {
  static init() {
    document.querySelectorAll('.card').forEach(card => {
      card.style.transform = 'rotate(0deg)';
      card.addEventListener('click', this.handleCardClick);
    });
  }

  static handleCardClick(event) {
    const card = event.currentTarget;
    card.style.transform = 'rotate(5deg) scale(1.05)';
    console.log('选中卡片:', {
      suit: card.dataset.suit,
      rank: card.dataset.rank
    });
    
    // 触发全局事件
    const cardEvent = new CustomEvent('cardSelected', {
      detail: {
        element: card,
        suit: card.dataset.suit,
        rank: card.dataset.rank
      }
    });
    document.dispatchEvent(cardEvent);
  }
}

document.addEventListener('DOMContentLoaded', () => CardRenderer.init());
