/**
 * Admin Authentication API
 * Supports Clerk (primary) and legacy password login.
 * When CLERK_SECRET_KEY is set, Bearer token must be a Clerk session token and user must have publicMetadata.role === 'admin'.
 */

const jwt = require('jsonwebtoken');
const { createClerkClient, verifyToken } = require('@clerk/backend');

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRY = process.env.ADMIN_JWT_EXPIRY || '24h';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const clerkClient = CLERK_SECRET_KEY ? createClerkClient({ secretKey: CLERK_SECRET_KEY }) : null;

function generateLegacyToken() {
  return jwt.sign(
    { role: 'admin', timestamp: Date.now() },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

function verifyLegacyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Verify Clerk Bearer token and ensure user has role 'admin'.
 * Returns { valid: true, user } or { valid: false, error }.
 */
async function verifyClerkAdminToken(token) {
  if (!CLERK_SECRET_KEY || !clerkClient) {
    return { valid: false, error: 'Clerk not configured' };
  }
  try {
    const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
    const userId = payload.sub;
    if (!userId) return { valid: false, error: 'Invalid token' };
    const user = await clerkClient.users.getUser(userId);
    const role = user?.publicMetadata?.role;
    if (role !== 'admin') {
      return { valid: false, error: 'Admin role required' };
    }
    return { valid: true, user: { id: userId, role } };
  } catch (error) {
    return { valid: false, error: error.message || 'Invalid token' };
  }
}

/**
 * Middleware to protect admin endpoints.
 * Accepts Clerk Bearer token (when CLERK_SECRET_KEY set) or legacy JWT.
 */
async function requireAuth(req, res) {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.adminToken) {
    token = req.cookies.adminToken;
  }

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required. Please login.' });
    return false;
  }

  if (clerkClient) {
    const clerkResult = await verifyClerkAdminToken(token);
    if (clerkResult.valid) {
      req.user = clerkResult.user;
      return true;
    }
  }

  const legacy = verifyLegacyToken(token);
  if (legacy.valid) {
    req.user = legacy.decoded;
    return true;
  }

  res.status(401).json({ success: false, error: 'Invalid or expired token. Please login again.' });
  return false;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
      if (!token) {
        return res.status(401).json({ success: false, valid: false, error: 'No token provided' });
      }
      if (clerkClient) {
        const clerkResult = await verifyClerkAdminToken(token);
        return res.json({
          success: true,
          valid: clerkResult.valid,
          error: clerkResult.valid ? null : clerkResult.error
        });
      }
      const legacy = verifyLegacyToken(token);
      return res.json({ success: true, valid: legacy.valid, error: legacy.valid ? null : legacy.error });
    }

    if (req.method === 'POST') {
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
      if (bearerToken && clerkClient) {
        const clerkResult = await verifyClerkAdminToken(bearerToken);
        if (clerkResult.valid) {
          return res.json({ success: true, data: { token: bearerToken, expiresIn: 'session' } });
        }
      }
      if (!ADMIN_PASSWORD) {
        await new Promise(r => setTimeout(r, 100));
        return res.status(503).json({
          success: false,
          error: 'Admin authentication is not configured. Use Clerk or set ADMIN_PASSWORD.'
        });
      }
      let body = req.body;
      if (typeof body === 'string') try { body = JSON.parse(body); } catch (e) {}
      const { password } = body || {};
      if (!password) {
        return res.status(400).json({ success: false, error: 'Password is required' });
      }
      const OLD_PASSWORD = 'SDeal2024!';
      if (password === OLD_PASSWORD) {
        await new Promise(r => setTimeout(r, 100));
        return res.status(401).json({ success: false, error: 'Old password is no longer valid.' });
      }
      const provided = String(password).trim();
      const configured = String(ADMIN_PASSWORD).trim();
      if (provided !== configured) {
        await new Promise(r => setTimeout(r, 100));
        return res.status(401).json({ success: false, error: 'Incorrect password' });
      }
      const token = generateLegacyToken();
      return res.json({ success: true, data: { token, expiresIn: JWT_EXPIRY } });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('[Admin Auth] Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports.requireAuth = requireAuth;
module.exports.verifyToken = verifyLegacyToken;
