import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Path to the favicon file
    const filePath = path.join(process.cwd(), 'public', 'favicon.ico');
    
    // Read the favicon file
    const fileContents = await fs.readFile(filePath);
    
    // Set the content type
    res.setHeader('Content-Type', 'image/x-icon');
    
    // Cache for 1 year
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    
    // Send the file
    return res.status(200).send(fileContents);
  } catch (error) {
    console.error('Error serving favicon:', error);
    return res.status(404).json({ error: 'Favicon not found' });
  }
}
