export function json() {
  return (req, res, next) => {
    const contentType = req.headers['content-type'] || '';

    if (!contentType.includes('application/json')) {
      next();
      return;
    }

    if (!req.rawBody) {
      req.body = {};
      next();
      return;
    }

    try {
      req.body = JSON.parse(req.rawBody);
      next();
    } catch {
      res.status(400).json({ error: 'Invalid JSON' });
    }
  };
}
