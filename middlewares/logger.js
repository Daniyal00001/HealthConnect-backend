// middlewares/logger.js
/**
 * Professional API Request/Response/Error Logger Middleware
 * Displays formatted boxes for better readability
 */

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Text colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

// Helper function to create a box
const createBox = (title, content, color = colors.cyan, width = 80) => {
  const border = '═'.repeat(width - 4);
  const topBorder = `${color}${colors.bright}╔${border}╗${colors.reset}`;
  const titleLine = `${color}${colors.bright}║${colors.reset} ${title.padEnd(width - 6)} ${color}${colors.bright}║${colors.reset}`;
  const middleBorder = `${color}${colors.bright}╠${border}╣${colors.reset}`;
  const bottomBorder = `${color}${colors.bright}╚${border}╝${colors.reset}`;
  
  return `${topBorder}\n${titleLine}\n${middleBorder}\n${content}\n${bottomBorder}`;
};

// Helper function to format JSON with indentation
const formatJSON = (obj, maxLength = 2000) => {
  try {
    const json = JSON.stringify(obj, (key, value) => {
      // Handle BigInt
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    }, 2);
    
    // Truncate if too long
    if (json.length > maxLength) {
      return json.substring(0, maxLength) + '\n... (truncated)';
    }
    return json;
  } catch (error) {
    return String(obj);
  }
};

// Helper function to get status color
const getStatusColor = (statusCode) => {
  if (statusCode >= 200 && statusCode < 300) return colors.green;
  if (statusCode >= 300 && statusCode < 400) return colors.yellow;
  if (statusCode >= 400 && statusCode < 500) return colors.red;
  if (statusCode >= 500) return colors.red + colors.bright;
  return colors.white;
};

// Helper function to get method color
const getMethodColor = (method) => {
  switch (method.toUpperCase()) {
    case 'GET': return colors.blue;
    case 'POST': return colors.green;
    case 'PUT': return colors.yellow;
    case 'PATCH': return colors.magenta;
    case 'DELETE': return colors.red;
    default: return colors.white;
  }
};

// Main logger middleware
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Build request info
  let requestInfo = [];
  
  // Method and URL
  const methodColor = getMethodColor(method);
  requestInfo.push(`${methodColor}${colors.bright}${method}${colors.reset} ${url}`);
  requestInfo.push(`${colors.dim}IP: ${ip}${colors.reset}`);
  requestInfo.push(`${colors.dim}Time: ${timestamp}${colors.reset}`);
  
  // User info if available
  if (req.user) {
    requestInfo.push(`${colors.dim}User: ${req.user.id} (${req.user.email || 'N/A'})${colors.reset}`);
    if (req.user.clinic_id) {
      requestInfo.push(`${colors.dim}Clinic ID: ${req.user.clinic_id}${colors.reset}`);
    }
  }
  
  // Query parameters
  if (req.query && Object.keys(req.query).length > 0) {
    requestInfo.push(`\n${colors.cyan}Query Parameters:${colors.reset}`);
    requestInfo.push(formatJSON(req.query));
  }
  
  // Route parameters
  if (req.params && Object.keys(req.params).length > 0) {
    requestInfo.push(`\n${colors.cyan}Route Parameters:${colors.reset}`);
    requestInfo.push(formatJSON(req.params));
  }
  
  // Request body (exclude sensitive data)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields
    if (sanitizedBody.password) sanitizedBody.password = '***HIDDEN***';
    if (sanitizedBody.password_hash) sanitizedBody.password_hash = '***HIDDEN***';
    if (sanitizedBody.token) sanitizedBody.token = '***HIDDEN***';
    
    requestInfo.push(`\n${colors.cyan}Request Body:${colors.reset}`);
    requestInfo.push(formatJSON(sanitizedBody));
  }
  
  // Log request
  console.log('\n' + createBox(
    `📥 API REQUEST`,
    requestInfo.join('\n'),
    colors.cyan
  ));
  
  // Flag to prevent multiple logs for the same response
  let responseLogged = false;
  
  // Helper function to log response (only once)
  const logResponse = (statusCode, duration, data = null) => {
    if (responseLogged) return;
    responseLogged = true;
    
    const statusColor = getStatusColor(statusCode);
    let responseInfo = [];
    responseInfo.push(`${statusColor}${colors.bright}Status: ${statusCode}${colors.reset}`);
    responseInfo.push(`${colors.cyan}Duration: ${duration}ms${colors.reset}`);
    
    if (data !== null) {
      if (typeof data === 'object') {
        responseInfo.push(`\n${colors.cyan}Response Data:${colors.reset}`);
        responseInfo.push(formatJSON(data, 1500));
      } else {
        responseInfo.push(`\n${colors.cyan}Response:${colors.reset}`);
        responseInfo.push(String(data));
      }
    }
    
    console.log('\n' + createBox(
      `📤 API RESPONSE`,
      responseInfo.join('\n'),
      statusCode >= 200 && statusCode < 300 ? colors.green : statusCode >= 400 ? colors.red : colors.yellow
    ));
  };
  
  // Override res.json to log responses
  const originalJson = res.json;
  const originalSend = res.send;
  const originalEnd = res.end;
  
  res.json = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const statusCode = res.statusCode || 200;
    
    // Convert BigInt to string for JSON serialization
    const converted = JSON.parse(
      JSON.stringify(data, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
    
    // Log response
    logResponse(statusCode, duration, converted);
    
    return originalJson.call(this, converted);
  };
  
  res.send = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const statusCode = res.statusCode || 200;
    
    // Log response
    logResponse(statusCode, duration, data);
    
    return originalSend.call(this, data);
  };
  
  res.end = function(data) {
    if (!responseLogged && data) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const statusCode = res.statusCode || 200;
      
      logResponse(statusCode, duration, data);
    }
    
    return originalEnd.call(this, data);
  };
  
  next();
};

// Error logger middleware
export const errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const statusCode = err.status || 500;
  
  // Build error info
  let errorInfo = [];
  errorInfo.push(`${colors.red}${colors.bright}Status: ${statusCode}${colors.reset}`);
  errorInfo.push(`${colors.red}Method: ${method}${colors.reset}`);
  errorInfo.push(`${colors.red}URL: ${url}${colors.reset}`);
  errorInfo.push(`${colors.dim}Time: ${timestamp}${colors.reset}`);
  
  // Error message
  errorInfo.push(`\n${colors.red}${colors.bright}Error Message:${colors.reset}`);
  errorInfo.push(`${colors.red}${err.message || 'Unknown error'}${colors.reset}`);
  
  // Error stack (only in development)
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorInfo.push(`\n${colors.red}Stack Trace:${colors.reset}`);
    errorInfo.push(`${colors.dim}${err.stack}${colors.reset}`);
  }
  
  // Request details if available
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '***HIDDEN***';
    if (sanitizedBody.password_hash) sanitizedBody.password_hash = '***HIDDEN***';
    
    errorInfo.push(`\n${colors.yellow}Request Body:${colors.reset}`);
    errorInfo.push(formatJSON(sanitizedBody, 1000));
  }
  
  if (req.query && Object.keys(req.query).length > 0) {
    errorInfo.push(`\n${colors.yellow}Query Parameters:${colors.reset}`);
    errorInfo.push(formatJSON(req.query));
  }
  
  if (req.params && Object.keys(req.params).length > 0) {
    errorInfo.push(`\n${colors.yellow}Route Parameters:${colors.reset}`);
    errorInfo.push(formatJSON(req.params));
  }
  
  // Log error
  console.error('\n' + createBox(
    `❌ API ERROR`,
    errorInfo.join('\n'),
    colors.red
  ));
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      path: url,
      method: method
    })
  });
};

// 404 Not Found logger
export const notFoundLogger = (req, res) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  
  let notFoundInfo = [];
  notFoundInfo.push(`${colors.yellow}${colors.bright}Method: ${method}${colors.reset}`);
  notFoundInfo.push(`${colors.yellow}URL: ${url}${colors.reset}`);
  notFoundInfo.push(`${colors.dim}Time: ${timestamp}${colors.reset}`);
  
  if (req.query && Object.keys(req.query).length > 0) {
    notFoundInfo.push(`\n${colors.yellow}Query Parameters:${colors.reset}`);
    notFoundInfo.push(formatJSON(req.query));
  }
  
  console.warn('\n' + createBox(
    `⚠️  ROUTE NOT FOUND`,
    notFoundInfo.join('\n'),
    colors.yellow
  ));
  
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: url,
    method: method
  });
};

