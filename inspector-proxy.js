const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');

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
  
  // Extract the target URL from the query parameters
  const targetUrl = req.query.url ? req.query.url.trim() : `${TARGET}/api/v1/stream`;
  
  // Create a proxy specifically for this request
  const proxy = createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    pathRewrite: (path, req) => {
      // Rewrite the path to the actual SSE endpoint
      return '/api/v1/stream?api_key=' + API_KEY;
    },
    onProxyReq: (proxyReq, req, res) => {
      // Add the API key header
      proxyReq.setHeader('x-api-key', API_KEY);
      console.log('Proxying SSE request to MCP server with API key');
    }
  });
  
  // Apply the proxy to this request
  proxy(req, res, next);
});

// Special handling for direct SSE endpoint access
app.get('/api/v1/stream', (req, res, next) => {
  console.log('Intercepting direct SSE request');
  // Add the API key to the query parameters if not already present
  if (!req.query.api_key) {
    const separator = req.url.includes('?') ? '&' : '?';
    req.url = `${req.url}${separator}api_key=${API_KEY}`;
    console.log(`Modified URL: ${req.url}`);
  }
  next();
});

// Add API key to all requests
app.use('/', createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    // Add the API key header to every request
    proxyReq.setHeader('x-api-key', API_KEY);
    console.log(`Proxying ${req.method} ${req.url} to ${TARGET}`);
  },
  onProxyRes: (proxyRes, req, res) => {
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