/**
 * Admin Authentication API
 * Handles login and token validation
 */

const jwt = require('jsonwebtoken');

// JWT secret from environment variable (fallback for development)
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRY = process.env.ADMIN_JWT_EXPIRY || '24h'; // Token expires in 24 hours

// Admin password from environment variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.warn('[Admin Auth] ⚠️ ADMIN_PASSWORD not set in environment variables. Admin login will be disabled.');
}

/**
 * Generate JWT token for authenticated admin
 */
function generateToken() {
  return jwt.sign(
    {
      role: 'admin',
      timestamp: Date.now()
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRY
    }
  );
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Middleware to protect admin endpoints
 * Use this in other admin API files
 * Returns true if authenticated, false otherwise (and sends error response)
 */
function requireAuth(req, res) {
  // Get token from Authorization header or cookie
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.adminToken) {
    token = req.cookies.adminToken;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please login.'
    });
    return false;
  }

  const verification = verifyToken(token);
  if (!verification.valid) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token. Please login again.'
    });
    return false;
  }

  // Add user info to request
  req.user = verification.decoded;
  return true;
}

module.exports = async (req, res) => {
  // Set headers first to ensure JSON response
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Wrap everything in try-catch to ensure JSON error responses
  try {
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

  // POST - Login
  if (req.method === 'POST') {
    try {
      // Parse body if it's a string (Vercel sometimes sends string)
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          console.error('[Admin Auth] Failed to parse body:', e);
        }
      }
      
      const { password } = body;

      // Debug logging (remove sensitive info in production)
      console.log('[Admin Auth] Login attempt received');
      console.log('[Admin Auth] ADMIN_PASSWORD is set:', !!ADMIN_PASSWORD);
      console.log('[Admin Auth] Password provided:', password ? 'Yes (length: ' + password.length + ')' : 'No');
      
      if (!ADMIN_PASSWORD) {
        // If ADMIN_PASSWORD is not set, reject all login attempts for security
        // Do NOT fall back to old hardcoded password
        await new Promise(resolve => setTimeout(resolve, 100)); // Prevent timing attacks
        console.error('[Admin Auth] ADMIN_PASSWORD not configured in environment variables');
        return res.status(503).json({
          success: false,
          error: 'Admin authentication is not configured. Please set ADMIN_PASSWORD environment variable.'
        });
      }

      if (!password) {
        console.log('[Admin Auth] No password provided');
        return res.status(400).json({
          success: false,
          error: 'Password is required'
        });
      }

      // Verify password
      // Also explicitly reject the old hardcoded password for security
      const OLD_PASSWORD = 'SDeal2024!';
      if (password === OLD_PASSWORD) {
        // Add small delay to prevent timing attacks
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('[Admin Auth] Old password rejected');
        return res.status(401).json({
          success: false,
          error: 'Old password is no longer valid. Please use the new password configured in ADMIN_PASSWORD environment variable.'
        });
      }
      
      // Compare passwords (trim whitespace to avoid issues)
      const providedPassword = String(password).trim();
      const configuredPassword = String(ADMIN_PASSWORD).trim();
      
      console.log('[Admin Auth] Comparing passwords (lengths match):', providedPassword.length === configuredPassword.length);
      
      if (providedPassword !== configuredPassword) {
        // Add small delay to prevent timing attacks
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('[Admin Auth] Password mismatch');
        return res.status(401).json({
          success: false,
          error: 'Incorrect password'
        });
      }
      
      console.log('[Admin Auth] Password verified successfully');

      // Generate token
      const token = generateToken();

      return res.json({
        success: true,
        data: {
          token,
          expiresIn: JWT_EXPIRY
        }
      });

    } catch (error) {
      console.error('[Admin Auth] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

    // GET - Verify token (optional endpoint to check if token is still valid)
    if (req.method === 'GET') {
      const authHeader = req.headers.authorization;
      let token = null;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          valid: false,
          error: 'No token provided'
        });
      }

      const verification = verifyToken(token);
      return res.json({
        success: true,
        valid: verification.valid,
        error: verification.valid ? null : verification.error
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    // Catch any unexpected errors and return JSON response
    console.error('[Admin Auth] Unexpected error:', error);
    console.error('[Admin Auth] Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
};

// Export middleware for use in other files
module.exports.requireAuth = requireAuth;
module.exports.verifyToken = verifyToken;

