import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), 'public', 'favicon.ico');
  const stat = fs.statSync(filePath);

  res.setHeader('Content-Type', 'image/x-icon');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
