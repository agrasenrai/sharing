const path = require('path');
// Load .env from repo root if present (backend is run from backend/ folder)
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

const cloudRoutes = require('./routes/cloud');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ ok: true, name: 'sharingspace-backend' }));

app.use('/cloud', cloudRoutes);

app.listen(port, () => console.log(`Backend running on port ${port}`));
