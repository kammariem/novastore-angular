function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error.code === 'INVALID_FILE_TYPE') {
    res.status(400).json({ message: 'Seuls les fichiers image JPEG, PNG, GIF ou WebP sont acceptés.' });
    return;
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ message: 'Image trop volumineuse. Taille maximale : 5 Mo.' });
    return;
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE' || error.code === 'LIMIT_FILE_COUNT') {
    res.status(400).json({ message: 'Un seul fichier image est accepté sous le champ "image".' });
    return;
  }

  if (error.code === 'CORS_ORIGIN_DENIED') {
    res.status(403).json({ message: 'Origine non autorisée.' });
    return;
  }

  if (error.code === 'DATABASE_UNAVAILABLE') {
    console.error('Database health check failed:', {
      name: error.cause?.name,
      code: error.cause?.code
    });
    res.status(503).json({ status: 'error', message: 'Base de données indisponible.' });
    return;
  }

  if (error.status === 401 || error.status === 403 || error.status === 409) {
    res.status(error.status).json({ message: error.message });
    return;
  }

  if (error.code === 'P2002') {
    res.status(409).json({ message: 'A record with that unique value already exists.' });
    return;
  }

  if (error.code === 'P2003') {
    res.status(409).json({ message: 'This record is referenced by another resource.' });
    return;
  }

  if (error.code === 'P2025') {
    res.status(404).json({ message: 'Resource not found.' });
    return;
  }

  if (error.status === 400) {
    res.status(400).json({ message: error.message });
    return;
  }

  if (error.status === 404) {
    res.status(404).json({ message: error.message });
    return;
  }

  console.error('API request failed:', {
    method: req.method,
    path: req.path,
    name: error.name,
    code: error.code
  });
  res.status(500).json({
    message: req.path === '/api/upload'
      ? 'Erreur pendant l’upload de l’image.'
      : 'Erreur interne du serveur.'
  });
}

module.exports = { errorHandler };
