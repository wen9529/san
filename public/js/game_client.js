// public/js/game_client.js

// This file will contain the client-side logic for the Shisanshui game.
// It will handle displaying the player's hand, allowing card selection
// for combinations, sending moves to the server, and updating the UI
// based on game state received from the server.

import { CardRenderer } from './card_renderer.js';
import { SocketManager } from './socket_handler.js';

const gameContainer = document.getElementById('game-container');
const roomLobby = document.getElementById('room-lobby');
const gameInfo = document.getElementById('game-info');
// Basic structure for the client game logic

document.addEventListener('DOMContentLoaded', () => {
    console.log('game_client.js loaded');

    const playButton = document.getElementById('play-card-button');
    const passButton = document.getElementById('pass-button');

    // Listen for room list updates
    if (SocketManager.instance && SocketManager.instance.socket) {
        SocketManager.instance.socket.on('room-list', (rooms) => {
            displayRooms(rooms);
        });
        SocketManager.instance.socket.on('room-update', (rooms) => {
            displayRooms(rooms);
        });
    }

    // Listen for game state updates
    if (SocketManager.instance && SocketManager.instance.socket) {
        SocketManager.instance.socket.on('game-state-update', (gameState) => {
            handleGameStateUpdate(gameState);
        });

        // Listen for game end event
        SocketManager.instance.socket.on('game-end', (results) => {
            handleGameEnd(results);
        });
    }

});

// Function to display the list of available rooms
function displayRooms(rooms) {
    const roomListDiv = document.getElementById('room-list');
    if (!roomListDiv) return;

    roomListDiv.innerHTML = ''; // Clear the current list

    // Assuming rooms is an array of room objects from the server
    // Each room object should at least have an 'id' and 'name'
    rooms.forEach(room => {
        const roomElement = document.createElement('div');
        roomElement.classList.add('room-item'); // Add a class for styling
        roomElement.innerHTML = `
            <span>${room.name} (Players: ${room.players.length}/4) - Status: ${room.state}</span>
            <button class="join-room-button" data-room-id="${room.id}">加入房间</button>
        `;

        // Add event listener to the Join Room button
        roomElement.querySelector('.join-room-button').addEventListener('click', () => {
            SocketManager.instance.socket.emit('join-room', room.id, SocketManager.instance.playerId); // Use SocketManager instance's socket to emit join-room
        });
        roomListDiv.appendChild(roomElement);
    });
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

    // Hide lobby and show game container if not already
    roomLobby.style.display = 'none';
    gameContainer.style.display = 'block';
    gameInfo.style.display = 'none'; // Hide game info during play

    // Update current player indicator
    CardRenderer.updateCurrentPlayer(gameState.currentPlayer);

    // Display the last played cards
    CardRenderer.renderPlayedCards(gameState.playedCards);

    // Update player's hand display (only if the hand size changes, or when a card is played)
    // A more robust solution would be to receive the updated hand in the game state,
    // but for now, we'll assume the player's own hand is managed locally after playing.
    // However, initially dealing and after playing from other players, we need to update.
    // Assuming gameState.hands contains the current player's hand after playing
    if (gameState.hands && gameState.hands[SocketManager.instance.playerId]) {
        CardRenderer.renderCards(gameState.hands[SocketManager.instance.playerId]);
    }

    // Update other players' hand sizes (assuming gameState includes this information)
    // This requires elements in index.html for each player's hand size display
    // Assuming gameState.players is an array of player objects with id and handSize
    const playersInRoom = gameState.players; // Use players array from game state
    playersInRoom.forEach(player => {
        // Find the corresponding player area element based on their position relative to the current player
        // This requires knowing the order of players in the room, which is complex.
        // For simplicity, let's update hand size for all other players.
        // You'll need to add elements in your HTML for each player's hand size.
        if (player.id !== SocketManager.instance.playerId) {
            const handSizeElement = document.getElementById(`player-${player.position}-hand-size`); // Assuming elements like player-top-hand-size, etc.
            if (handSizeElement) {
 handSizeElement.textContent = `手牌: ${player.handSize}`;
            }
        }
    });

    // TODO: Add logic to handle other aspects of game state, e.g., scores, messages, game phase
    // Example: Display game messages
    // document.getElementById('game-status').textContent = gameState.message;

    // Enable/disable play/pass buttons based on whose turn it is
    const myTurn = gameState.currentPlayer === SocketManager.instance.playerId;
    playButton.disabled = !myTurn;
    passButton.disabled = !myTurn;
}

// Function to handle game end
function handleGameEnd(results) {
    console.log('Game ended:', results);

    // Display game results (e.g., scores, rankings)
    const resultsDisplay = document.createElement('div');
    resultsDisplay.classList.add('game-results');
    let resultsHTML = '<h2>游戏结束!</h2>';
    resultsHTML += '<h3>得分:</h3><ul>';
    results.scores.forEach(score => {
        resultsHTML += `<li>玩家 ${score.playerId}: ${score.points} 分</li>`;
    });
    resultsHTML += '</ul>';

    // Display rankings (assuming results include rankings)
    if (results.rankings) {
        resultsHTML += '<h3>排名:</h3><ol>';
        results.rankings.forEach((playerId, index) => {
            resultsHTML += `<li>玩家 ${playerId}</li>`;
        });
        resultsHTML += '</ol>';
    }

    resultsDisplay.innerHTML = resultsHTML;
    gameContainer.appendChild(resultsDisplay); // Append results to the game container or a dedicated results area

    // Provide options to play again or return to lobby
    // TODO: Add buttons for "Play Again" and "Return to Lobby" and their event listeners
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