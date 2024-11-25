// backend/app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Import routes
const imageRoutes = require('./routes/images');
const reportsRoute = require('./api/reports');
const singleimageRoute = require('./api/singleimage'); // Ensure this file is correctly implemented
const carpartsRoute = require('./api/carparts');
const damageAnnotationsRoute = require('./api/damageAnnotations');

// Use routes
app.use('/api', imageRoutes);
app.use('/api/imageReports', reportsRoute);
app.use('/api/singleimage', singleimageRoute); // Consider renaming to '/api/imageReportByImageName'
app.use('/api/carparts', carpartsRoute);
app.use('/api/damageannotations', damageAnnotationsRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
