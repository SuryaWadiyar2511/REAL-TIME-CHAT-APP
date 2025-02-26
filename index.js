// index.js
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Create a WebSocket server listening on port 8080
const server = new WebSocket.Server({ port: 8080 });

// Path to store message history
const historyFilePath = path.join(__dirname, 'messageHistory.json');

// Load existing message history or initialize an empty array
let messageHistory = [];
if (fs.existsSync(historyFilePath)) {
  const data = fs.readFileSync(historyFilePath);
  messageHistory = JSON.parse(data);
}

// Store connected clients
const clients = new Set();

server.on('connection', (ws) => {
  // Add new client to the set
  clients.add(ws);

  // Send existing message history to the new client
  ws.send(JSON.stringify({ type: 'history', data: messageHistory }));

  // Handle incoming messages
  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message);

    // Broadcast the message to all connected clients except the sender
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'message', data: parsedMessage }));
      }
    });

    // Add message to history
    messageHistory.push(parsedMessage);

    // Save updated message history to file
    fs.writeFileSync(historyFilePath, JSON.stringify(messageHistory, null, 2));
  });

  // Remove client from the set when they disconnect
  ws.on('close', () => {
    clients.delete(ws);
  });
});

console.log('WebSocket server is running on ws://localhost:8080');
