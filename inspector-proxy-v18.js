// inspector-proxy-v18.js - Compatible with Node.js v18.17.0
// ES Module version for mcp-inspector project

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import morgan from 'morgan';

const app = express();
const PORT = 6277;
const TARGET = 'http://localhost:3100';
const API_KEY = 'PRsQsjzf8liLtYdMx2doFR3/FPU4sFNYLL+84Ez9Qhk=';

// Enable logging
app.use(morgan('dev'));

// Enable CORS for all requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

// Special handling for the MCP inspector's SSE request format
app.use('/sse', (req, res, next) => {
  console.log('Intercepting MCP inspector SSE request');
  console.log('Query params:', req.query);
  
  // Create a proxy specifically for this request
  const proxy = createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    pathRewrite: () => {
      // Rewrite the path to the actual SSE endpoint
      return '/api/v1/stream?api_key=' + API_KEY;
    },
    onProxyReq: (proxyReq) => {
      // Add the API key header
      proxyReq.setHeader('x-api-key', API_KEY);
      console.log('Proxying SSE request to MCP server with API key');
    }
  });
  
  // Apply the proxy to this request
  proxy(req, res, next);
});

// Add API key to all requests
app.use('/', createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  onProxyReq: (proxyReq, req) => {
    // Add the API key header to every request
    proxyReq.setHeader('x-api-key', API_KEY);
    console.log(`Proxying ${req.method} ${req.url} to ${TARGET}`);
  },
  onProxyRes: (proxyRes, req) => {
    console.log(`Received ${proxyRes.statusCode} from ${TARGET}${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    res.end(`Proxy error: ${err.message}`);
  }
}));

app.listen(PORT, () => {
  console.log(`MCP Inspector Proxy running on port ${PORT}`);
  console.log(`Forwarding requests to ${TARGET} with API key`);
});