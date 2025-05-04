const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'];
const RANK_MAP = {
    1: 'ace', 11: 'jack', 12: 'queen', 13: 'king'
};

export const CARD_MAP = new Map();

SUITS.forEach(suit => {
    for (let rank = 1; rank <= 13; rank++) {
        const code = `${String(rank).padStart(2, '0')}${suit[0]}`;
        const fileName = `${RANK_MAP[rank] || rank}_of_${suit}.png`;
        CARD_MAP.set(code, fileName);
    }
});

// 示例：梅花10 → 10c → 10_of_clubs.png
