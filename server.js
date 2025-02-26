// server.js
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

// Initialize Express application
const app = express();
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server instance
const wss = new WebSocketServer({ server });

// Path to store message history
const historyFilePath = path.join(__dirname, 'messageHistory.json');

// Load existing message history or initialize an empty array
let messageHistory = [];
if (fs.existsSync(historyFilePath)) {
  const data = fs.readFileSync(historyFilePath);
  messageHistory = JSON.parse(data);
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send existing message history to the newly connected client
  ws.send(JSON.stringify({ type: 'history', data: messageHistory }));

  // Handle incoming messages from clients
  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message);

    // Broadcast the new message to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'message', data: parsedMessage }));
      }
    });

    // Add message to history
    messageHistory.push(parsedMessage);

    // Save updated message history to file
    fs.writeFileSync(historyFilePath, JSON.stringify(messageHistory, null, 2));
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
