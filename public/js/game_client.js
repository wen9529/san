// public/js/game_client.js

// This file will contain the client-side logic for the Shisanshui game.
// It will handle displaying the player's hand, allowing card selection
// for combinations, sending moves to the server, and updating the UI
// based on game state received from the server.

// Basic structure for the client game logic

document.addEventListener('DOMContentLoaded', () => {
    console.log('game_client.js loaded');

    // TODO: Initialize game elements and event listeners
});

// Function to handle receiving dealt cards from the server
window.handleDealCards = function(cardsData) {
 console.log('Received dealt cards:', cardsData);

    // Get the container to display the cards
 const playerBottom = document.getElementById('player-bottom');

 if (playerBottom) {
 playerBottom.innerHTML = ''; // Clear any existing content
        // For each card, create an element and append it to the container
 cardsData.forEach(cardData => {
 const cardElement = createCardElement(cardData); // createCardElement is assumed to be in card.js
 playerBottom.appendChild(cardElement);
 });
 }
}

// Function to display player's hand
function displayHand(cards) {
    // cards is expected to be an array of card objects
    // each card object might have properties like rank, suit, imagePath

    const handElement = document.getElementById('player-hand'); // Assuming an element with this ID exists

    if (handElement) {
        handElement.innerHTML = ''; // Clear current hand display

        cards.forEach(card => {
            const cardElement = createCardElement(card); // createCardElement will be defined in card.js
            handElement.appendChild(cardElement);
        });
    }
}

// Function to handle server game state updates
function handleGameStateUpdate(gameState) {
    console.log('Received game state update:', gameState);
    // TODO: Update UI based on the received game state
    // This might include:
    // - Updating player scores
    // - Indicating the current player's turn
    // - Displaying played hands
    // - Showing messages (e.g., "Waiting for other players")
}

// Function to handle card selection by the player
function handleCardSelection(cardElement) {
    // TODO: Implement logic for selecting cards to form combinations
    // This might involve adding a class to the selected card element
    // and keeping track of selected cards in an array.
}

// Function to send the selected combination to the server
function sendCombination() {
    // TODO: Get the currently selected cards
    const selectedCards = []; // Array of selected card data

    // TODO: Send the selected cards to the server via Socket.IO
    // socket.emit('game:play', selectedCards); // Assuming a socket object is available (handled by socket_handler.js)
}

// Event listener for selecting cards (attach to card elements after they are displayed)
// handElement.addEventListener('click', (event) => {
//     const cardElement = event.target.closest('.card'); // Assuming card elements have a 'card' class
//     if (cardElement) {
//         handleCardSelection(cardElement);
//     }
// });

// Event listener for a play button (assuming a button with id 'play-button' exists)
// const playButton = document.getElementById('play-button');
// if (playButton) {
//     playButton.addEventListener('click', sendCombination);
// }

// Other client-side game functions as needed
// - Displaying results
// - Handling game end
// - Showing player rankings