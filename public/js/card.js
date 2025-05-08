// Client-side card logic

// Function to create an HTML element for a card
function createCardElement(card) {
    const img = document.createElement('img');
    img.classList.add('game-card');

    // Map suit symbols to names for image file path
    const suitMap = {
        '♣': 'clubs',
        '♠': 'spades',
        '♦': 'diamonds',
        '♥': 'hearts'
    };
    const suitName = suitMap[card.suit] || card.suit; // Use symbol if not found in map

    img.src = `/images/${card.rank.toLowerCase()}_of_${suitName}.png`;
    img.alt = `${card.rank} of ${suit.suit}`; // Add alt text for accessibility
    return img;
}