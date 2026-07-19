import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Start a simple HTTP server to serve media files (GIFs, images, etc.)
 */
export function startFileServer(port = 3001) {
  const server = http.createServer((req, res) => {
    try {
      // Only allow specific files
      if (req.url === '/standard.gif') {
        const filePath = path.join(__dirname, '../../standard.gif');
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('File not found');
          logger.warn({ file: 'standard.gif' }, '⚠️ File not found');
          return;
        }

        // Read and serve the file
        const fileStream = fs.createReadStream(filePath);
        res.writeHead(200, {
          'Content-Type': 'image/gif',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
        });
        fileStream.pipe(res);
        logger.info({ file: 'standard.gif' }, '📸 GIF served');
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      }
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server error');
      logger.error({ error: error.message }, '❌ File server error');
    }
  });

  server.listen(port, () => {
    logger.info({ port }, `📸 File server started - GIF available at http://localhost:${port}/standard.gif`);
  });

  return server;
}
