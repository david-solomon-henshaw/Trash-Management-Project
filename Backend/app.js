// Import the Express module to create a web server
const express = require('express');

// Initialize the Express application
const app = express();

// Define a route for HTTP GET requests to the root path ('/')
app.get('/', (req, res) => {
   // Send a response to the client with the text "Server is Running"
   res.send('Server is Running');
});

// Start the server and make it listen on port 4000
app.listen(4000, () => {
    // Log a message to the console once the server is running
    console.log('Server is running');
});
