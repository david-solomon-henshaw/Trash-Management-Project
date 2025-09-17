// Import the Express module to create a web server
const express = require('express');


const mongoose = require('mongoose')
require('dotenv').config()


// Initialize the Express application
const app = express();

const connectDb = async () => {

    try {

        await mongoose.connect(process.env.Mongo_Uri)
        console.log('Connected to database')
        
        // Start the server and make it listen on port 4000
        app.listen(4000, () => {
            // Log a message to the console once the server is running
            console.log('Server is running on port 4000');
        });


    } catch  (error) {
        console.log(error)

    }
}


connectDb();


// Define a route for HTTP GET requests to the root path ('/')
app.get('/', (req, res) => {
   // Send a response to the client with the text "Server is Running"
   res.send('Server is Running');
});


