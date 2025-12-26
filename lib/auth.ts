export function hashPassword(password: string): string {
  // Simple hash for demo - in production use bcrypt or similar
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

export function verifyToken(token: string | null): boolean {
  if (!token) return false;
  // Simple token verification - check against environment variable
  return token === process.env.AUTOW_STAFF_TOKEN;
}

export function verifyStaffCredentials(username: string, password: string): boolean {
  const validUsername = process.env.AUTOW_STAFF_USERNAME || 'admin';
  const validPassword = process.env.AUTOW_STAFF_PASSWORD || 'autow2024';

  return username === validUsername && password === validPassword;
}
