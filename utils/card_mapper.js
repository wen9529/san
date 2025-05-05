/**
 * @fileoverview Card mapping utility functions.
 */

const SUITS = ['C', 'D', 'H', 'S']; // Clubs, Diamonds, Hearts, Spades
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/**
 * Generates a unique card code from a suit and a rank.
 *
 * @param {string} suit - The suit of the card ('C', 'D', 'H', 'S').
 * @param {string} rank - The rank of the card ('2', '3', ..., '10', 'J', 'Q', 'K', 'A').
 * @returns {string} A unique code for the card (e.g., 'C2', 'DJ', 'HA').
 */
const getCardCode = (suit, rank) => `${suit}${rank}`;

/**
 * Maps a card code to its corresponding image file name.
 *
 * @param {string} cardCode - The card code (e.g., 'C2', 'DJ', 'HA').
 * @returns {string} The image file name of the card (e.g., '2_of_clubs.png').
 */
const mapCardCodeToImageName = (cardCode) => {
    const suit = cardCode.slice(0, 1);
    const rank = cardCode.slice(1);
    const suitName = {
        'C': 'clubs', 'D': 'diamonds', 'H': 'hearts', 'S': 'spades'
    }[suit];
    const rankName = rank === 'J' || rank === 'Q' || rank === 'K' || rank === 'A' ?
        `${rank.toLowerCase()}` : rank;
    return `${rankName}_of_${suitName}.png`;
};

/**
 * Generates all possible card codes and maps them to their image file names.
 *
 * @returns {Map<string, string>} A map of card codes to image file names.
 */
export const generateAllCards = () => {
    const cardMap = new Map();
    SUITS.forEach(suit => {
        RANKS.forEach(rank => {
            cardMap.set(getCardCode(suit, rank), mapCardCodeToImageName(getCardCode(suit, rank)));
        });
    });
    return cardMap;
};
