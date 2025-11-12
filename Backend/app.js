// Import the Express module to create a web server
const express = require('express');
const staffRoute = require('./routes/staffRoute')
const truckRoute = require('./routes/truckRoute')
const streetRoute = require('./routes/streetRoute')
const customerRoute = require('./routes/customerRoutes')
const commercialSubtypeRoute = require('./routes/commercialSubTypeRoutes')
const apartmentTypeRoute = require('./routes/apartmentRoute')
const paymentRoute = require('./routes/paymentRoute')
const analyticsRoute = require('./routes/analyticsRoute')
const billingHistoryRoute = require('./routes/billingHistoryRoute');
const dashboardRoute = require('./routes/dashboardRoute'); 
const institutionalSubtypeRoutes = require('./routes/institutionalSubtypeRoutes');
 
const mongoose = require('mongoose')
require('dotenv').config()
const cors = require('cors')

// Initialize the Express application
const app = express();
app.use(cors())

app.use(express.json())

app.use('/api/staff',staffRoute)
app.use('/api/trucks', truckRoute)
app.use('/api/street',streetRoute)
app.use('/api/customers',customerRoute)
app.use('/api/apartment-types',apartmentTypeRoute)
app.use('/api/commercial-subtypes',commercialSubtypeRoute)
app.use('/api/payments', paymentRoute)
app.use('/api/analytics', analyticsRoute)
app.use('/api/billing', billingHistoryRoute);
app.use('/api/dashboard', dashboardRoute); 
app.use('/api/institutional-subtypes', institutionalSubtypeRoutes);
// Handle 404 for unmatched routes
app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

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


