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