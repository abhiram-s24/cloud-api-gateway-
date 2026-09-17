import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

interface WindowRecord {
  timestamps: number[];
}

const rateLimitWindows = new Map<string, WindowRecord>();

// Clean up inactive rate limit windows every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitWindows.entries()) {
    const validTimestamps = record.timestamps.filter((ts) => now - ts < 60000);
    if (validTimestamps.length === 0) {
      rateLimitWindows.delete(key);
    } else {
      record.timestamps = validTimestamps;
    }
  }
}, 300000);

export function rateLimiter(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Determine identifier: API key ID or client IP
  const clientKey = req.apiKey ? `key:${req.apiKey.id}` : `ip:${req.ip || req.socket.remoteAddress || 'anonymous'}`;
  
  // Rate limit quota per 60 seconds
  const limit = req.apiKey?.rateLimit || 120;
  const windowMs = 60000;
  const now = Date.now();

  let record = rateLimitWindows.get(clientKey);
  if (!record) {
    record = { timestamps: [] };
    rateLimitWindows.set(clientKey, record);
  }

  // Filter out timestamps older than windowMs
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  const currentCount = record.timestamps.length;
  const remaining = Math.max(0, limit - currentCount - 1);
  const oldestTimestamp = record.timestamps[0] || now;
  const resetSeconds = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000));

  // Set RFC-standard rate limiting headers
  res.setHeader('X-RateLimit-Limit', limit.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', resetSeconds.toString());

  if (currentCount >= limit) {
    res.setHeader('Retry-After', resetSeconds.toString());
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit tier exceeded (${limit} req/min). Please back off and retry in ${resetSeconds}s.`,
      retryAfterSeconds: resetSeconds,
      limit,
      statusCode: 429
    });
  }

  record.timestamps.push(now);
  next();
}
