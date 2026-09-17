import { Router } from 'express';
import crypto from 'crypto';
import { store, User } from '../store';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

const router = Router();

// List demo users for quick developer access
router.get('/demo-users', (req, res) => {
  const users = Array.from(store.users.values()).map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar
  }));
  res.json({ success: true, data: users });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Email and password are required.'
    });
  }

  const user = Array.from(store.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid email or password.'
    });
  }

  const hash = store.hashPassword(password);
  if (user.passwordHash !== hash) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid email or password.'
    });
  }

  // Create token
  const token = 'tok_' + crypto.randomBytes(24).toString('hex');
  store.sessions.set(token, {
    userId: user.id,
    expiresAt: Date.now() + 7 * 86400000 // 7 days
  });

  const { passwordHash: _, ...safeUser } = user;

  res.json({
    success: true,
    token,
    user: safeUser
  });
});

// Register
router.post('/register', (req, res) => {
  const { name, email, password, role = 'developer' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Name, email, and password are required.'
    });
  }

  const existing = Array.from(store.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'A user with this email address already exists.'
    });
  }

  const newUser: User = {
    id: 'usr_' + crypto.randomUUID().slice(0, 8),
    name,
    email,
    role: role === 'admin' ? 'admin' : 'developer',
    avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    createdAt: new Date().toISOString(),
    passwordHash: store.hashPassword(password)
  };

  store.users.set(newUser.id, newUser);

  const token = 'tok_' + crypto.randomBytes(24).toString('hex');
  store.sessions.set(token, {
    userId: newUser.id,
    expiresAt: Date.now() + 7 * 86400000
  });

  const { passwordHash: _, ...safeUser } = newUser;

  res.status(201).json({
    success: true,
    token,
    user: safeUser
  });
});

// Current authenticated profile
router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  if (req.user) {
    const { passwordHash: _, ...safeUser } = req.user;
    return res.json({
      success: true,
      authType: 'user',
      user: safeUser
    });
  }

  if (req.apiKey) {
    return res.json({
      success: true,
      authType: 'api-key',
      apiKey: {
        id: req.apiKey.id,
        name: req.apiKey.name,
        keyPrefix: req.apiKey.keyPrefix,
        scopes: req.apiKey.scopes,
        environment: req.apiKey.environment,
        rateLimit: req.apiKey.rateLimit
      }
    });
  }

  res.status(401).json({ error: 'Unauthorized' });
});

// Logout
router.post('/logout', (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    store.sessions.delete(token);
  }
  res.json({ success: true, message: 'Successfully logged out.' });
});

export default router;
