class CardRules {
  static validateSubmission(cards) {
    if (cards.length !== 13) throw new Error('必须提交13张牌');
    this.checkDuplicates(cards);
  }

  static checkDuplicates(cards) {
    const unique = new Set(cards.map(c => c.code));
    if (unique.size !== 13) throw new Error('存在重复卡牌');
  }

  static evaluateHand(cards) {
    const sorted = this.sortCards([...cards]);
    return {
      straightFlush: this.isStraightFlush(sorted),
      fourOfAKind: this.findFourOfAKind(sorted)
      // 其他牌型判断...
    };
  }

  static isStraightFlush(cards) {
    const suits = new Set(cards.map(c => c.suit));
    if (suits.size > 1) return false;
    return this.isStraight(cards);
  }

  static isStraight(cards) {
    const ranks = cards.map(c => c.rank).sort((a,b) => a-b);
    // 特殊处理A-2-3-4-5
    if (ranks[0] === 1 && ranks[1] === 2) {
      return ranks[12] - ranks[1] === 4;
    }
    return ranks[12] - ranks[0] === 12;
  }
}

module.exports = CardRules;
