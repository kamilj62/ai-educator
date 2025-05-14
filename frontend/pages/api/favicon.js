import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // Get the absolute path to the favicon file
    const filePath = path.join(process.cwd(), 'public', 'favicon.ico');
    const imageBuffer = await fs.readFile(filePath);

    // Set the content type and cache control headers
    res.setHeader('Content-Type', 'image/x-icon');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Send the image data
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error serving favicon:', error);
    res.status(404).end();
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for this route
  },
};
