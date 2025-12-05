require('dotenv').config();
const express = require('express');
const cors = require('cors');
const handleDataRequest = require('./api/data');

const app = express();
app.use(cors());
app.use(express.json());

// Local dev uses the same handler as Vercel
app.get('/api/data', handleDataRequest);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));