const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.UPLOAD_API_PORT || 3001;

const uploadDir = path.join(__dirname, '..', 'src', 'assets', 'uploaded_imgs');
fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'product';

    cb(null, `${Date.now()}-${safeName}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('INVALID_FILE_TYPE'));
      return;
    }

    cb(null, true);
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'Aucun fichier image reçu.' });
    return;
  }

  res.status(201).json({
    imagePath: `assets/uploaded_imgs/${req.file.filename}`
  });
});

app.use((err, req, res, next) => {
  if (err.message === 'INVALID_FILE_TYPE') {
    res.status(400).json({ message: 'Seuls les fichiers image sont acceptés.' });
    return;
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ message: 'Image trop volumineuse. Taille maximale : 5 Mo.' });
    return;
  }

  res.status(500).json({ message: 'Erreur pendant l’upload de l’image.' });
});

app.listen(PORT, () => {
  console.log(`Upload API running on http://localhost:${PORT}`);
});
