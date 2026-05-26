import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

export function serveStatic(rootDir) {
  const resolvedRoot = path.resolve(moduleDir, '..', rootDir);

  return (req, res, next) => {
    if (req.method !== 'GET') {
      next();
      return;
    }

    const relativePath = req.path === '/' ? 'index.html' : req.path.replace(/^\//, '');
    const filePath = path.join(resolvedRoot, relativePath);
    const resolvedPath = path.resolve(filePath);

    if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(resolvedRoot + path.sep)) {
      res.status(403).send('Access denied');
      return;
    }

    fs.stat(resolvedPath, (err, stats) => {
      if (err || !stats.isFile()) {
        next();
        return;
      }

      res.sendFile(resolvedPath, stats);
    });
  };
}
