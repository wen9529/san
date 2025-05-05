class CardRules {
  static validateSubmission(cards) { // 验证提交的牌是否有效
    if (cards.length !== 13) {
      throw new Error('必须提交13张牌');
    }
    if (new Set(cards.map((c) => c.code)).size !== 13) {
      throw new Error('存在重复卡牌');
    }
    // 可以添加更多的校验规则，比如特定牌型是否存在等
  }

  static sortCards(cards) { // 对牌进行排序
    return [...cards].sort((a, b) => {
      if (a.suit !== b.suit) {
        return a.suit - b.suit; // 先按花色排序
      }
      return a.rank - b.rank; // 再按大小排序
    });
  }

  static evaluateHand(cards) { // 对手牌进行评估
    const sorted = this.sortCards(cards);
    const handType = this.determineHandType(sorted);
    return { type: handType, cards: sorted };
  }

  static determineHandType(cards) { // 确定手牌的类型
    if (this.isStraightFlush(cards)) {
      return 'Straight Flush';
    }
    if (this.isFourOfAKind(cards)) {
      return 'Four of a Kind';
    }
    if (this.isFullHouse(cards)) {
      return 'Full House';
    }
    if (this.isFlush(cards)) {
      return 'Flush';
    }
    if (this.isStraight(cards)) {
      return 'Straight';
    }
    if (this.isThreeOfAKind(cards)) {
      return 'Three of a Kind';
    }
    if (this.isTwoPair(cards)) {
      return 'Two Pair';
    }
    if (this.isOnePair(cards)) {
      return 'One Pair';
    }
    return 'High Card';
  }

  static isStraightFlush(cards) { // 判断是否是同花顺
    return this.isFlush(cards) && this.isStraight(cards);
  }

  static isFourOfAKind(cards) { // 判断是否是四条
    const counts = {};
    for (const card of cards) {
      counts[card.rank] = (counts[card.rank] || 0) + 1;
    }
    return Object.values(counts).includes(4);
  }

  static isFullHouse(cards) { // 判断是否是葫芦
    const counts = {};
    for (const card of cards) {
      counts[card.rank] = (counts[card.rank] || 0) + 1;
    }
    return Object.values(counts).includes(3) && Object.values(counts).includes(2);
  }

  static isFlush(cards) { // 判断是否是同花
    const firstSuit = cards[0].suit;
    return cards.every((card) => card.suit === firstSuit);
  }

  static isStraight(cards) { // 判断是否是顺子
    const ranks = cards.map((c) => c.rank).sort((a, b) => a - b);
    // 处理 A-2-3-4-5 的特殊情况
    if (ranks.join(',') === '1,2,3,4,5') {
      return true;
    }
    for (let i = 0; i < ranks.length - 1; i++) {
      if (ranks[i + 1] - ranks[i] !== 1) {
        return false;
      }
    }
    return true;
  }

  static isThreeOfAKind(cards) { // 判断是否是三条
    const counts = {};
    for (const card of cards) {
      counts[card.rank] = (counts[card.rank] || 0) + 1;
    }
    return Object.values(counts).includes(3);
  }

  static isTwoPair(cards) { // 判断是否是两对
    const counts = {};
    for (const card of cards) {
      counts[card.rank] = (counts[card.rank] || 0) + 1;
    }
    return Object.values(counts).filter((count) => count === 2).length === 2;
  }

  static isOnePair(cards) { // 判断是否是一对
    const counts = {};
    for (const card of cards) {
      counts[card.rank] = (counts[card.rank] || 0) + 1;
    }
    return Object.values(counts).includes(2);
  }

  static compareHands(hand1, hand2) { // 比较手牌大小
    const handTypes = [
      'High Card', 'One Pair', 'Two Pair', 'Three of a Kind',
      'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush'
    ];
    const typeIndex1 = handTypes.indexOf(hand1.type);
    const typeIndex2 = handTypes.indexOf(hand2.type);
    return typeIndex1 - typeIndex2;
  }
}

export default CardRules;
