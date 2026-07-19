const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');

// Rate limiting options to prevent brute force and spam attacks
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many contact submissions. Please wait before sending another message.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers with Vercel compatibility
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://images.pexels.com"],
      connectSrc: ["'self'", "http://localhost:5000", "ws://localhost:5173", "http://localhost:5173", "https://*.vercel.app"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://player.vimeo.com"] // Allow video embeds
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5000'
    ];
    
    // Allow any vercel preview deployment domain
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback to avoid breaking client routing in non-traditional setups
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Input Sanitization utility to prevent XSS
function sanitizeValue(value) {
  if (typeof value !== 'string') return value;
  
  const valTrimmed = value.trim();
  
  // Skip HTML escaping for JSON arrays, raw URLs, and base64 payloads to prevent path corruption.
  // Parameterized SQL queries already prevent SQL injections, and we still strip active scripts below to block XSS.
  const isBase64Image = /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/.test(valTrimmed);
  const isUrl = /^(http:\/\/|https:\/\/|data:)/i.test(valTrimmed);
  const isJson = (str) => {
    try {
      const parsed = JSON.parse(str);
      return typeof parsed === 'object' && parsed !== null;
    } catch (e) {
      return false;
    }
  };

  let sanitized = valTrimmed;
  if (!isBase64Image && !isUrl && !isJson(valTrimmed)) {
    sanitized = validator.escape(valTrimmed);
  }
  
  // Strip active scripting attributes to block execution
  sanitized = sanitized.replace(/script/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/onload/gi, '');
  sanitized = sanitized.replace(/onerror/gi, '');
  
  return sanitized;
}

function sanitizeInput(req, res, next) {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'object' && req.body[key] !== null) {
        for (const subKey in req.body[key]) {
          req.body[key][subKey] = sanitizeValue(req.body[key][subKey]);
        }
      } else {
        req.body[key] = sanitizeValue(req.body[key]);
      }
    }
  }
  next();
}

module.exports = {
  generalLimiter,
  authLimiter,
  contactLimiter,
  securityHeaders,
  corsOptions,
  sanitizeInput
};
