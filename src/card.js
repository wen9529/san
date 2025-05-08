// Server-side card logic

// Define suits and ranks for a standard deck
const SUITS = ['♦', '♣', '♥', '♠']; // Diamond < Club < Heart < Spade
const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']; // 3 < 4 < ... < A < 2

class Card {
    constructor(rank, suit) {
        if (!RANKS.includes(rank) || !SUITS.includes(suit)) {
            throw new Error(`Invalid card: ${rank}${suit}`);
        }
        this.rank = rank;
        this.suit = suit;
    }

    // Get a numerical value for comparison
    get value() {
        return RANKS.indexOf(this.rank) * SUITS.length + SUITS.indexOf(this.suit);
    }

    toString() {
        return `${this.rank}${this.suit}`;
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.createDeck();
        this.shuffle();
    }

    createDeck() {
        this.cards = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                this.cards.push(new Card(rank, suit));
            }
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal(numCards) {
        if (this.cards.length < numCards) {
            // Not enough cards, could throw an error or return remaining cards
            const dealtCards = this.cards;
            this.cards = [];
            return dealtCards;
        }
        return this.cards.splice(0, numCards);
    }
}

// Function to sort an array of Card objects
function sortCards(cards) {
    // Sort by value (which considers rank then suit)
    return cards.sort((a, b) => a.value - b.value);
}

module.exports = { Card, Deck, sortCards, SUITS, RANKS };