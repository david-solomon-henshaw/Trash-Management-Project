// Import the Express module to create a web server
const express = require('express');
const staffRoute = require('./routes/staffRoute')
const mongoose = require('mongoose')
require('dotenv').config()
const cors = require('cors')

// Initialize the Express application
const app = express();
app.use(cors())

app.use(express.json())

app.use('/api/staff',staffRoute)

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


