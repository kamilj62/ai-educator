import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const response = await fetch('http://localhost:8000/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const error = await response.json();
      res.status(response.status).json(error);
      return;
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error forwarding request:', error);
    res.status(500).json({ error: 'Failed to forward request' });
  }
}
