class GameClient {
    constructor() {
        this.cards = [];
        this.selected = new Set();
        this.renderer = new CardRenderer();
        this.socketHandler = new SocketHandler(this);
    }

    initGame(cards) {
        this.cards = cards;
        this.renderHand();
        this.setupInteractions();
    }

    renderHand() {
        const container = document.querySelector('.player-hand');
        this.renderer.renderHand(this.cards, container);
    }

    setupInteractions() {
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', () => {
                const code = card.dataset.cardCode;
                this.toggleSelect(code);
                card.classList.toggle('selected');
            });
        });
    }

    toggleSelect(code) {
        if (this.selected.has(code)) {
            this.selected.delete(code);
        } else {
            this.selected.add(code);
        }
        document.getElementById('selected-count').textContent = this.selected.size;
    }

    submitCards() {
        if (this.selected.size !== 13) {
            alert('请选择13张牌进行出牌！');
            return;
        }
        this.socketHandler.submitPlay([...this.selected]);
        this.selected.clear();
    }
}

// 初始化游戏
const gameClient = new GameClient();
