const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory store: id -> { imageDataUrl, annotations, createdAt }
const store = new Map();

// Clean up entries older than 7 days every hour
setInterval(() => {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const [id, entry] of store.entries()) {
    if (entry.createdAt < cutoff) store.delete(id);
  }
}, 60 * 60 * 1000);

app.use(express.static(path.join(__dirname)));
app.use(express.json({ limit: '50mb' }));

app.post('/api/share', (req, res) => {
  const { imageDataUrl, annotations } = req.body;
  if (!imageDataUrl || !Array.isArray(annotations)) {
    return res.status(400).json({ error: '잘못된 요청입니다.' });
  }
  const id = uuidv4();
  store.set(id, { imageDataUrl, annotations, createdAt: Date.now() });
  res.json({ id, url: `/view/${id}` });
});

app.get('/api/view/:id', (req, res) => {
  const entry = store.get(req.params.id);
  if (!entry) return res.status(404).json({ error: '링크가 만료되었거나 존재하지 않습니다.' });
  res.json({ imageDataUrl: entry.imageDataUrl, annotations: entry.annotations });
});

app.get('/view/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'viewer.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
