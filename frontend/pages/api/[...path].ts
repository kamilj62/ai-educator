import { NextApiRequest, NextApiResponse } from 'next';
import httpProxy from 'http-proxy';
import type { ClientRequest, IncomingMessage, ServerResponse } from 'http';

// Create proxy server
const proxy = httpProxy.createProxyServer();

// Disable body parsing, let the proxy handle it
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

// Error handler type definition
type ProxyErrorHandler = (err: Error, req: ClientRequest, res: ServerResponse) => void;

// Error handler for proxy errors
const errorHandler: ProxyErrorHandler = (err, req, res) => {
  console.error('❌ Proxy error:', err);
  
  // Check if headers have already been sent
  if (!res.headersSent) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    
    // Get the requested endpoint
    const url = (req as any).url as string;
    const method = (req as any).method;
    
    res.end(JSON.stringify({
      type: 'PROXY_ERROR',
      message: 'Failed to connect to backend server',
      context: {
        endpoint: url,
        method: method,
        error: err.message
      },
      recommendations: [
        'Check that the backend server is running on port 8000',
        'Verify that the endpoint URL is correct',
        'Ensure you have the correct permissions',
        'Try again in a few moments'
      ]
    }));
  }
};

// Attach error handler with type assertion
proxy.on('error', errorHandler as any);

// Log proxy requests
proxy.on('proxyReq', (proxyReq) => {
  const oldPath = proxyReq.path;
  console.log(`🔄 Proxying request: ${oldPath}`);
});

// Handle proxy response
proxy.on('proxyRes', (proxyRes, req, res) => {
  const statusCode = proxyRes.statusCode || 500;
  
  // Log response status
  console.log(`📥 Response from backend: ${statusCode} for ${(req as any).url}`);
  
  // Add CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
});

// API route handler
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return new Promise<void>((resolve, reject) => {
    console.log('🔄 Proxying request to backend:', req.method, req.url);
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.status(200).end();
      resolve();
      return;
    }
    
    proxy.web(req, res, {
      target: 'http://localhost:8000',
      changeOrigin: true,
      xfwd: true,
    }, (err: Error) => {
      if (err) {
        console.error('❌ Proxy error:', err);
        reject(err);
      } else {
        console.log('✅ Request proxied successfully');
        resolve();
      }
    });
  }).catch((err: Error) => {
    console.error('❌ Request failed:', err);
    if (!res.headersSent) {
      res.status(500).json({
        type: 'PROXY_ERROR',
        message: 'Failed to connect to backend server',
        context: {
          endpoint: req.url,
          method: req.method,
          error: err.message
        },
        recommendations: [
          'Check that the backend server is running on port 8000',
          'Verify that the endpoint URL is correct',
          'Ensure you have the correct permissions',
          'Try again in a few moments'
        ]
      });
    }
  });
}
