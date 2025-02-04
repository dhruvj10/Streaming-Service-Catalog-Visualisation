

const express = require('express');
const connectDB = require('./config');
const moviesRoutes = require('./routes/movies');
const path = require('path');
const app = express();
const PORT = 3003;

// Connect to MongoDB
connectDB();

// Middleware to serve static files
app.use(express.static(path.join(__dirname, '..',  'Public')));

// API routes
app.use('/api/movies', moviesRoutes);

// Serve index.html at the root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
