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

app.use('/cloud', cloudRoutes);

const frontendDist = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
if (process.env.NODE_ENV === 'production') {
	app.use(express.static(frontendDist));
	app.get('/', (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
	app.get('*', (req, res, next) => {
		if (req.path.startsWith('/cloud')) return next();
		res.sendFile(path.join(frontendDist, 'index.html'));
	});
} else {
	app.get('/', (req, res) => res.json({ ok: true, name: 'sharingspace-backend' }));
}

app.listen(port, () => console.log(`Backend running on port ${port}`));
