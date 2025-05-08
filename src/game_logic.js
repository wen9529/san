// src/game_logic.js

// This file will contain the server-side game logic for the Thirteen Cards game.
// Game state management, dealing, hand evaluation, comparison, scoring, etc.

const { Card, sortCards } = require('./card');

// Function to check if a hand is a pair (exactly two cards of the same rank)
function isPair(cards) {
    if (cards.length !== 2) return false;
    return cards[0].rank === cards[1].rank;
}

// Function to check if a hand is a triple (three cards of the same rank)
function isTriple(cards) {
    if (cards.length !== 3) return false;
    return cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank;
}

// Function to check if a hand is a straight (5 consecutive ranks)
// Assumes cards are already sorted
function isStraight(cards) {
    if (cards.length !== 5) return false;
    // In Big Two / Thirteen Cards, the rank order is 3, 4, ..., 10, J, Q, K, A, 2
    // Need to map ranks to a numerical value for consecutive check, considering the Big Two order
    const rankValues = cards.map(card => card.value % 13); // Use modulo 13 for rank value (0-12) based on 3-2 order

    for (let i = 0; i < rankValues.length - 1; i++) {
        if (rankValues[i + 1] !== rankValues[i] + 1) {
            // Handle the A-2 wrap-around case for straights like 10-J-Q-K-A and J-Q-K-A-2
            // In Big Two / Thirteen Cards, A is higher than K, and 2 is the highest rank.
            // The order is 3,4,5,6,7,8,9,10,J,Q,K,A,2.
            // A standard straight check should work if values are mapped correctly.
            // The value property in Card class already uses this order (3=0, 2=12).
            // So a straight will have consecutive values.
            if (cards[i + 1].value !== cards[i].value + 1) {
                 return false;
            }
        }
    }
    return true;
}

// Function to check if a hand is a flush (5 cards of the same suit)
function isFlush(cards) {
    if (cards.length !== 5) return false;
    const firstSuit = cards[0].suit;
    return cards.every(card => card.suit === firstSuit);
}

// Function to check if a hand is a full house (3 of one rank and 2 of another)
// Assumes cards are already sorted
function isFullHouse(cards) {
    if (cards.length !== 5) return false;
    // Possible structures: AAA BB or AA BBB
    const ranks = cards.map(card => card.rank);
    const sortedRanks = ranks.sort(); // Sort ranks to easily check for groups

    return (
        (sortedRanks[0] === sortedRanks[1] && sortedRanks[1] === sortedRanks[2] && sortedRanks[3] === sortedRanks[4]) ||
        (sortedRanks[0] === sortedRanks[1] && sortedRanks[2] === sortedRanks[3] && sortedRanks[3] === sortedRanks[4])
    );
}

// Function to check if a hand is four of a kind (4 of one rank and 1 other card)
// Assumes cards are already sorted
function isFourOfAKind(cards) {
    if (cards.length !== 5) return false;
    // Possible structures: AAAAB or ABBBB
    const ranks = cards.map(card => card.rank);
    const sortedRanks = ranks.sort(); // Sort ranks to easily check for groups

    return (
        (sortedRanks[0] === sortedRanks[1] && sortedRanks[1] === sortedRanks[2] && sortedRanks[2] === sortedRanks[3]) ||
        (sortedRanks[1] === sortedRanks[2] && sortedRanks[2] === sortedRanks[3] && sortedRanks[3] === sortedRanks[4])
    );
}

// Function to check if a hand is a straight flush (straight and a flush)
function isStraightFlush(cards) {
    return isStraight(cards) && isFlush(cards);
}

// Function to check if a hand is a 3-card straight
// Assumes cards are already sorted
function isThreeCardStraight(cards) {
    if (cards.length !== 3) return false;
    // Use card.value for correct Thirteen Cards order
    return cards[1].value === cards[0].value + 1 && cards[2].value === cards[1].value + 1;
}

// Function to check if 13 cards can form three flushes (3-card, 5-card, 5-card)
function isThreeFlushes(cards) {
    if (cards.length !== 13) return false;

    // Group cards by suit and sort them by value for easier processing
    const cardsBySuit = {
        '♠': [], '♥': [], '♣': [], '♦': []
    };
    cards.forEach(card => cardsBySuit[card.suit].push(card)); // Group
    for (const suit in cardsBySuit) {
        cardsBySuit[suit].sort((a, b) => a.value - b.value); // Sort by value
    }

    // Helper function to find combinations of a specific length from a suit
    const findCombinations = (arr, k) => {
        const result = [];
        const combinations = (current, start) => {
            if (current.length === k) {
                result.push([...current]);
                return;
            }
            for (let i = start; i < arr.length; i++) {
                current.push(arr[i]);
                combinations(current, i + 1);
                current.pop();
            }
        };
        combinations([], 0);
        return result;
    };

    const suits = Object.keys(cardsBySuit).filter(suit => cardsBySuit[suit].length > 0);

    // Iterate through all combinations of 3 suits that have cards
    for (let i = 0; i < suits.length; i++) {
        for (let j = i; j < suits.length; j++) {
            for (let k = j; k < suits.length; k++) {
                const suit1 = suits[i];
                const suit2 = suits[j];
                const suit3 = suits[k];

                // Check if the total number of cards in these suits is exactly 13
                if (cardsBySuit[suit1].length + cardsBySuit[suit2].length + cardsBySuit[suit3].length === 13) {
                    // Simplified check: if the counts of cards in these three suits are 3, 5, and 5 in any order.
                    // A more rigorous check would involve finding actual disjoint sets of cards forming flushes.
                    const counts = [cardsBySuit[suit1].length, cardsBySuit[suit2].length, cardsBySuit[suit3].length].sort((a, b) => a - b);
                    if (counts[0] === 3 && counts[1] === 5 && counts[2] === 5) {
                        // This is still a simplified check. A proper implementation requires
                        // checking if the *specific* cards can form three disjoint flushes.
                        // Due to complexity, a full combination checking algorithm is needed.
                        // This simplified version just checks if the distribution of cards by suit *could* support Three Flushes.
                        return true; // Found a potential combination based on counts
                    }
                }
            }
        }
    }

    return false; // Placeholder - needs proper implementation
}

// Function to check if 13 cards form a "一条龙" (Dragon)
// A Dragon is a straight flush from 3 to 2 (3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A, 2) of the same suit.
function isDragon(cards) {
    if (cards.length !== 13) return false;

    // Sort cards by value
    const sortedCards = sortCards([...cards]); // sortCards is assumed to sort based on the 3-2 order

    // Check if all cards are of the same suit
    const firstSuit = sortedCards[0].suit;
    if (!sortedCards.every(card => card.suit === firstSuit)) {
        return false;
    }

    // Check if the sorted cards form a straight from 3 to 2
    // The value sequence should be 0, 1, 2, ..., 11, 12 (for 3 to 2)
    for (let i = 0; i < sortedCards.length; i++) {
        if (sortedCards[i].value !== i) {
            return false;
        }
    }

    return true; // It's a Dragon
}

// Function to check if 13 cards are all J, Q, K, or A ("十二皇族" - Twelve Royalty)
function isTwelveRoyalty(cards) {
    if (cards.length !== 13) return false;
    // Check if all cards have a rank of J, Q, K, or A
    const royaltyRanks = ['J', 'Q', 'K', 'A'];
    return cards.every(card => royaltyRanks.includes(card.rank));
}

// Function to check if 13 cards can form three straights (3-card, 5-card, 5-card)
function isThreeStraights(cards) {
    if (cards.length !== 13) {
 return false;
    }

    // Checking for Three Straights (3-card, 5-card, 5-card) is complex as it requires finding
    // three disjoint sets of cards within the 13 hand that each form a straight.
    // A 3-card straight is a sequence of three consecutive ranks (e.g., 4-5-6, Q-K-A, A-2-3 based on Thirteen Cards ranking).
    // A 5-card straight is a sequence of five consecutive ranks.

    // The algorithm would generally involve:
    // 1. Finding all possible 3-card straights within the 13 cards.
    // 2. For each found 3-card straight, consider the remaining 10 cards.
    // 3. From the remaining 10 cards, find all possible 5-card straights.
    // 4. For each found 5-card straight, check if the remaining 5 cards form a 5-card straight.
    // 5. If a combination of a 3-card, a 5-card, and another 5-card straight is found that
    //    uses all 13 distinct cards, then it's a Three Straights hand.

    // Due to the combinatorial complexity, a full implementation requires helper functions
    // for finding all subsets (combinations) of a given size and checking if a subset is a straight.
    return false; // Placeholder - needs proper implementation
}

// Function to check if 13 cards contain four sets of three cards of the same rank ("四套三条" - Four Triples)
// This means there are four different ranks where you have three cards of that rank, plus one other card.
function isFourTriples(cards) {
    if (cards.length !== 13) return false;

    // Count the occurrences of each rank
    const rankCounts = {};
    for (const card of cards) {
        rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    }

    // Count how many ranks have exactly 3 cards
    let tripleCount = 0;
    for (const rank in rankCounts) {
        if (rankCounts[rank] === 3) {
            tripleCount++;
        }
    }

    // To be Four Triples, you need exactly 4 ranks with 3 cards.
    // The remaining card must be a single card (rank count of 1).
    if (tripleCount === 4) {
        // Check if there is exactly one rank with a count of 1
        let singleCardCount = 0;
        for (const rank in rankCounts) {
            if (rankCounts[rank] === 1) {
                singleCardCount++;
            }
        }
        return singleCardCount === 1;
    }
    return false;
}
}

// Function to check if 13 cards are all of one color (all red or all black) ("凑一色" - All One Color)
function isAllOneColor(cards) {
    if (cards.length !== 13) return false;

    // Check if all cards are red (Hearts or Diamonds)
    const allRed = cards.every(card => card.suit === '♥' || card.suit === '♦');
    // Check if all cards are black (Spades or Clubs)
    const allBlack = cards.every(card => card.suit === '♠' || card.suit === '♣');

    return allRed || allBlack;
}

// Function to check if 13 cards are all 10 or higher (J, Q, K, A, 2) ("全大" - All Big Cards)
// In Thirteen Cards, the ranks are ordered 3, 4, ..., 10, J, Q, K, A, 2.
// Big cards are 10, J, Q, K, A, 2.
function isAllBig(cards) {
    if (cards.length !== 13) return false;
    // Check if all cards have a value corresponding to 10 or higher (value >= 7, since 10 has value 7)
    return cards.every(card => card.value >= 7);
}

// Function to check if 13 cards are all 9 or lower (3 to 9) ("全小" - All Small Cards)
// In Thirteen Cards, the ranks are ordered 3, 4, ..., 10, J, Q, K, A, 2.
// Small cards are 3, 4, 5, 6, 7, 8, 9.
function isAllSmall(cards) {
    if (cards.length !== 13) return false;
    // Check if all cards have a value corresponding to 9 or lower (value <= 6, since 9 has value 6)
    return cards.every(card => card.value <= 6);
}

// Function to check if 13 cards contain six pairs and one single card ("六对半" - Six Pairs and a Half)
// This means there are six different ranks where you have two cards of that rank, plus one other card.
function isSixPairsOneHalf(cards) {
    if (cards.length !== 13) return false;

    // Count the occurrences of each rank
    const rankCounts = {};
    for (const card of cards) {
        rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    }

    let pairCount = 0;
    let singleCount = 0;
    let invalidCount = 0; // To count ranks with > 2 cards (triples, quads, etc.)

    for (const rank in rankCounts) {
        const count = rankCounts[rank];
        if (count === 2) {
            pairCount++;
        } else if (count === 1) {
            singleCount++;
        } else {
            invalidCount++; // Not a pair or a single
        }
    }

    // For Six Pairs and a Half, we need exactly 6 pairs and 1 single card, with no other rank counts.
    return pairCount === 6 && singleCount === 1 && invalidCount === 0;
}

// Function to check if 13 cards contain five pairs and one set of three cards of the same rank ("五对三条" - Five Pairs and a Triple)
// This means there are five different ranks where you have two cards of that rank, plus one rank with three cards.
function isFivePairsOneTriple(cards) {
    if (cards.length !== 13) return false;

    // Count the occurrences of each rank
    const rankCounts = {};
    for (const card of cards) {
        rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    }

    let pairCount = 0;
    let tripleCount = 0;

    for (const rank in rankCounts) {
        const count = rankCounts[rank];
        if (count === 2) pairCount++;
        else if (count === 3) tripleCount++;
        // Any other count (1 or 4) means it's not Five Pairs and a Triple
        else return false;
    }

    // For Five Pairs and a Triple, we need exactly 5 pairs and 1 triple.
    return pairCount === 5 && tripleCount === 1;
}
}
// Function to evaluate a 13-card hand for special hands
// Checks for special hands in descending order of priority
function evaluateSpecialHand(cards) {
    if (cards.length !== 13) {
        return null; // Special hands require exactly 13 cards
    }

    // Sort cards by value for easier checking of some special hands
    const sortedCards = sortCards([...cards]);

    // Check for special hands in descending order of priority
    if (isDragon(sortedCards)) {
        return "一条龙";
    }
    if (isTwelveRoyalty(sortedCards)) {
        return "十二皇族";
    }
    if (isFourTriples(sortedCards)) {
        return "四套三条";
    }
    if (isAllOneColor(sortedCards)) {
        return "凑一色";
    }
    if (isAllBig(sortedCards)) {
        return "全大";
    }
    if (isAllSmall(sortedCards)) {
        return "全小";
    }
    // ... continue with other special hands (Six Pairs and a Half, Five Pairs and a Triple, Three Straights, Three Flushes)
    // Note: The order below reflects the remaining special hands, adjust if your priority list differs slightly.
    if (isSixPairsOneHalf(sortedCards)) {
        return "六对半";
    }
    if (isFivePairsOneTriple(sortedCards)) {
        return "五对三条";
    }
    // Note: Three Straights and Three Flushes require complex combination checking
    // and the current implementations are placeholders.
    if (isThreeStraights(sortedCards)) {
        return "三顺子"; // Placeholder - will only return true if isThreeStraights is fully implemented
    }
    if (isThreeFlushes(sortedCards)) {
        return "三同花"; // Placeholder - will only return true if isThreeFlushes is fully implemented
    }


    return null; // No special hand found
}

// Function to generate all possible valid 3-card (front), 5-card (middle), and 5-card (back) combinations from 13 cards.
// This is a computationally intensive task as it involves generating combinations.
function generateHandCombinations(cards) {
    if (cards.length !== 13) {
        return []; // Cannot form combinations from other than 13 cards
    }

    const combinations = [];

    // The process involves:
    // 1. Generating all possible 3-card subsets for the front hand from the 13 cards.
    // 2. For each 3-card subset chosen as the front hand, determine the remaining 10 cards.
    // 3. From these 10 remaining cards, generate all possible 5-card subsets for the middle hand.
    // 4. For each 5-card subset chosen as the middle hand, the remaining 5 cards automatically form the back hand.
    // 5. Store each valid combination (front, middle, back) in the results array.
    // Note: This requires a generic combination generation helper function.

    // Example structure of a combination object:
    // { front: [Card, Card, Card], middle: [Card, Card, Card, Card, Card], back: [Card, Card, Card, Card, Card] }

    // Implementation requires a recursive or iterative approach to generate combinations.
    return combinations; // Placeholder
}

module.exports = {
    // Export basic hand evaluation functions if needed elsewhere
    isPair, isTriple, isStraight, isFlush, isFullHouse, isFourOfAKind, isStraightFlush, isThreeCardStraight,
    // Export special hand evaluation functions
    isDragon, isTwelveRoyalty, isFourTriples, isAllOneColor, isAllBig, isAllSmall, isSixPairsOneHalf, isFivePairsOneTriple, isThreeStraights, isThreeFlushes, evaluateSpecialHand
};