
document.addEventListener('DOMContentLoaded', () => {
    // 卡片点击事件处理
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            const rank = card.dataset.rank;
            const suit = card.dataset.suit;
            console.log(`Selected card: ${rank}${suit}`);
            // 添加游戏逻辑...
        });
    });
});
