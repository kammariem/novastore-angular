const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const { createAuthentication } = require('../middleware/authenticate');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  }
});

function getImageType(buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { extension: '.jpg' };
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { extension: '.png' };
  }

  if (
    buffer.length >= 6 &&
    (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' ||
      buffer.subarray(0, 6).toString('ascii') === 'GIF89a')
  ) {
    return { extension: '.gif' };
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { extension: '.webp' };
  }

  return null;
}

function safeBaseName(originalName) {
  const extension = path.extname(originalName);
  return path.basename(originalName, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'product';
}

function createUploadRouter(prisma, apiConfig) {
  const router = express.Router();
  const { requireAuth, requireAdmin } = createAuthentication(prisma, apiConfig);

  router.post('/upload', requireAuth, requireAdmin, upload.single('image'), async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'Aucun fichier image reçu.' });
        return;
      }

      const imageType = getImageType(req.file.buffer);

      if (!imageType) {
        const error = new Error('INVALID_FILE_TYPE');
        error.code = 'INVALID_FILE_TYPE';
        throw error;
      }

      const filename = `${Date.now()}-${crypto.randomUUID()}-${safeBaseName(req.file.originalname)}${imageType.extension}`;
      await fs.promises.mkdir(apiConfig.uploadDir, { recursive: true });
      await fs.promises.writeFile(path.join(apiConfig.uploadDir, filename), req.file.buffer, { flag: 'wx' });

      res.status(201).json({
        imagePath: `assets/uploaded_imgs/${filename}`
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createUploadRouter };
