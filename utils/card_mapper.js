// utils/card_mapper.js
const SUITS = {
  'clubs': '♣',
  'diamonds': '♦',
  'hearts': '♥',
  'spades': '♠'
};

const RANKS = {
  1: 'ace',
  11: 'jack',
  12: 'queen',
  13: 'king'
};

// 生成图片路径映射表
function generateCardMap() {
  const cardMap = new Map();
  
  // 遍历所有花色
  Object.entries(SUITS).forEach(([suitKey, suitSymbol]) => {
    // 生成1-13的牌
    for (let rank = 1; rank <= 13; rank++) {
      const rankKey = RANKS[rank] || rank;
      const fileName = `${rankKey}_of_${suitKey}.png`;
      const cardValue = {
        suit: suitSymbol,
        rank: rank,
        code: `${rank.toString().padStart(2, '0')}${suitKey[0]}` // 例如: 10c
      };
      cardMap.set(cardValue.code, fileName);
    }
  });
  
  return cardMap;
}

// 导出映射表
export const CARD_MAP = generateCardMap();
