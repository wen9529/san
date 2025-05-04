// public/js/socket_handler.js
export class SocketHandler {
  constructor(gameClient) {
    this.socket = io();
    this.gameClient = gameClient;
    
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('deal_cards', (cards) => {
      this.gameClient.initGame(cards);
    });
  }

  submitPlay(cards) {
    this.socket.emit('submit_cards', {
      roomId: this.currentRoomId,
      cards: cards
    });
  }
}
