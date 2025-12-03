import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Path to data files
const dataDir = path.join(__dirname, '../../src/data');
const originalDataPath = path.join(dataDir, 'response-original.json');
const alteredDataPath = path.join(dataDir, 'response-altered.json');

// Route to get original data
app.get('/api/data/original', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(originalDataPath, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('Error reading original data:', error);
    res.status(500).json({ error: 'Failed to read original data' });
  }
});

// Route to get altered data (simulates compromised database)
app.get('/api/data/altered', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(alteredDataPath, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('Error reading altered data:', error);
    res.status(500).json({ error: 'Failed to read altered data' });
  }
});

// Route to get specific records for integrity proof
app.get('/api/data/records', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(originalDataPath, 'utf8'));
    const records = data.results.slice(0, 5);
    res.json(records);
  } catch (error) {
    console.error('Error reading records:', error);
    res.status(500).json({ error: 'Failed to read records' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
