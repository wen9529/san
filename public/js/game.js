
```
diff
--- a/public/js/game.js
+++ b/public/js/game.js
@@ -1,15 +1,14 @@
 import { CardRenderer } from './card_renderer.js'; // We will use global renderer in this example
-// import { SocketHandler } from './socket_handler.js'; // We will use global socket in this example
+import { SocketHandler } from './socket_handler.js'; // We will use global socket in this example
 
 class Game {
     constructor() {
       this.renderer = new CardRenderer();
-      this.socket = new SocketHandler(this);
       this.selectedCards = new Set();
       this.roomId = null;
       this.myCards = [];
       this.username = null;
       this.players = [];
-
-      this.initUIListeners();
+      
+      // Moved initUIListeners call to DOMContentLoaded
     }
 
     initUIListeners() {
@@ -90,5 +89,6 @@
 
 window.addEventListener('DOMContentLoaded', () => {
   window.game = new Game();
+  window.game.initUIListeners(); // Call initUIListeners here
   window.SocketHandler = SocketHandler;
+  window.game.socket = new window.SocketHandler(window.game); // Instantiate SocketHandler here
 });
```