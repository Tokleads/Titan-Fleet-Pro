import { Router } from 'express';
import { db } from './db';
import { eq, and } from 'drizzle-orm';
import { users, companies, accountSetupTokens, passwordResetTokens } from '@shared/schema';
import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';
import { sendPasswordResetEmail } from './emailService';
import { storage } from './storage';
import { generateUniquePin, generateUniqueCompanyCode } from './pinUtils';
import { signToken, setAuthCookie, clearAuthCookie } from './jwtAuth';

const router = Router();

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const forgotPasswordAttempts = new Map<string, { count: number; lastAttempt: number }>();
const resetPasswordAttempts = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(attemptsMap: Map<string, { count: number; lastAttempt: number }>, key: string): boolean {
  const attempt = attemptsMap.get(key);
  if (attempt && attempt.count >= RATE_LIMIT_MAX && (Date.now() - attempt.lastAttempt) < RATE_LIMIT_WINDOW_MS) {
    return false;
  }
  if (attempt && (Date.now() - attempt.lastAttempt) >= RATE_LIMIT_WINDOW_MS) {
    attemptsMap.delete(key);
  }
  return true;
}

function recordFailedAttempt(attemptsMap: Map<string, { count: number; lastAttempt: number }>, key: string): void {
  const current = attemptsMap.get(key) || { count: 0, lastAttempt: 0 };
  attemptsMap.set(key, { count: current.count + 1, lastAttempt: Date.now() });
}

router.get('/verify-setup-token', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Missing token' });
    }
    
    const [setupToken] = await db.select().from(accountSetupTokens)
      .where(and(
        eq(accountSetupTokens.token, token),
        eq(accountSetupTokens.used, false)
      ));
    
    if (!setupToken) {
      return res.status(404).json({ error: 'Invalid or expired token' });
    }
    
    if (new Date() > setupToken.expiresAt) {
      return res.status(410).json({ error: 'This setup link has expired. Please contact support@titanfleet.co.uk' });
    }
    
    res.json({
      valid: true,
      email: setupToken.email,
      tier: setupToken.tier,
      maxVehicles: setupToken.maxVehicles
    });
  } catch (error) {
    console.error('Verify setup token error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/setup-account', async (req, res) => {
  try {
    const { token, companyName, contactName, password } = req.body;
    
    if (!token || !companyName || !contactName || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    const [setupToken] = await db.select().from(accountSetupTokens)
      .where(and(
        eq(accountSetupTokens.token, token),
        eq(accountSetupTokens.used, false)
      ));
    
    if (!setupToken) {
      return res.status(404).json({ error: 'Invalid or expired setup link' });
    }
    
    if (new Date() > setupToken.expiresAt) {
      return res.status(410).json({ error: 'This setup link has expired' });
    }
    
    const companyCode = await generateUniqueCompanyCode(companyName);
    
    const normalizedEmail = setupToken.email.toLowerCase().trim();
    
    const existingUser = await db.select().from(users).where(eq(users.email, normalizedEmail));
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in instead.' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const [company] = await db.insert(companies).values({
      companyCode,
      name: companyName,
      contactEmail: normalizedEmail,
      licenseTier: setupToken.tier || 'starter',
      vehicleAllowance: setupToken.maxVehicles || 10,
      stripeCustomerId: setupToken.stripeCustomerId || null,
      stripeSubscriptionId: setupToken.stripeSubscriptionId || null,
    }).returning();
    
    const [user] = await db.insert(users).values({
      companyId: company.id,
      email: normalizedEmail,
      name: contactName,
      role: 'TRANSPORT_MANAGER',
      password: hashedPassword,
      pin: await generateUniquePin(company.id),
    }).returning();
    
    await db.update(accountSetupTokens)
      .set({ used: true })
      .where(eq(accountSetupTokens.id, setupToken.id));
    
    if (setupToken.referralCode) {
      try {
        const referral = await storage.getReferralByCode(setupToken.referralCode);
        if (referral && referral.referrerCompanyId !== company.id && referral.referredCompanyId === null) {
          await storage.updateReferral(referral.id, {
            referredCompanyId: company.id,
            status: 'signed_up',
            signedUpAt: new Date(),
          });
          console.log(`[REFERRAL] Referral ${setupToken.referralCode} linked to company ${company.id}`);
        } else if (referral) {
          console.log(`[REFERRAL] Skipping referral link: self-referral=${referral.referrerCompanyId === company.id}, already-linked=${referral.referredCompanyId !== null}`);
        }
      } catch (err) {
        console.error('[REFERRAL] Failed to apply referral during account setup:', err);
      }
    }
    
    res.json({
      success: true,
      companyCode,
      companyName: company.name,
      email: setupToken.email,
      userName: contactName,
    });
  } catch (error: any) {
    console.error('Account setup error:', error);
    res.status(500).json({ error: 'Failed to set up account' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const emailKey = email.toLowerCase().trim();
    if (!checkRateLimit(forgotPasswordAttempts, emailKey)) {
      return res.status(429).json({ error: 'Too many requests. Please try again in 15 minutes.' });
    }
    recordFailedAttempt(forgotPasswordAttempts, emailKey);
    
    const successResponse = { success: true, message: 'If an account exists with that email, a reset link has been sent.' };
    
    const [user] = await db.select().from(users)
      .where(eq(users.email, email.toLowerCase().trim()));
    
    if (!user || !user.active) {
      return res.json(successResponse);
    }
    
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });
    
    const appDomain = process.env.APP_DOMAIN || process.env.REPLIT_DOMAINS?.split(',')[0];
    const baseUrl = appDomain ? `https://${appDomain}` : 'http://localhost:5000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
    });
    
    res.json(successResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }
    
    if (!checkRateLimit(resetPasswordAttempts, token)) {
      return res.status(429).json({ error: 'Too many attempts. Please try again in 15 minutes.' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    const [resetToken] = await db.select().from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false)
      ));
    
    if (!resetToken) {
      return res.status(404).json({ error: 'Invalid or expired reset link' });
    }
    
    if (new Date() > resetToken.expiresAt) {
      return res.status(410).json({ error: 'This reset link has expired. Please request a new one.' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, resetToken.userId));
    
    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, resetToken.id));
    
    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Missing token' });
    }
    
    const [resetToken] = await db.select().from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false)
      ));
    
    if (!resetToken) {
      return res.status(404).json({ error: 'Invalid or expired reset link' });
    }
    
    if (new Date() > resetToken.expiresAt) {
      return res.status(410).json({ error: 'This reset link has expired' });
    }
    
    res.json({ valid: true });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, totpToken } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const emailKey = email.toLowerCase().trim();
    if (!checkRateLimit(loginAttempts, emailKey)) {
      return res.status(429).json({ error: 'Too many login attempts. Please try again in 15 minutes.' });
    }
    
    const matchingUsers = await db.select().from(users)
      .where(eq(users.email, emailKey));
    
    const MANAGER_ROLE_PRIORITY = ['ADMIN', 'TRANSPORT_MANAGER', 'OFFICE', 'PLANNER', 'AUDITOR', 'MECHANIC', 'manager'];
    const user = matchingUsers.length > 1
      ? matchingUsers.find(u => MANAGER_ROLE_PRIORITY.includes(u.role)) || matchingUsers[0]
      : matchingUsers[0];
    
    if (!user || !user.active || !user.password) {
      recordFailedAttempt(loginAttempts, emailKey);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      recordFailedAttempt(loginAttempts, emailKey);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const [company] = await db.select().from(companies)
      .where(eq(companies.id, user.companyId));
    
    if (!company) {
      return res.status(401).json({ error: 'Company not found' });
    }
    
    if (user.totpEnabled && user.totpSecret) {
      if (!totpToken) {
        return res.json({
          requiresTwoFactor: true,
          managerId: user.id,
          managerName: user.name
        });
      }
      
      const { verifyTotpToken } = await import('./totpService');
      const isValid = verifyTotpToken(totpToken, user.totpSecret);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid verification code' });
      }
    }
    
    loginAttempts.delete(emailKey);
    
    const token = signToken({
      userId: user.id,
      companyId: user.companyId,
      role: user.role as any,
      email: user.email || '',
      name: user.name,
    });
    
    setAuthCookie(res, token);
    
    res.json({
      manager: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: company.id,
        permissions: user.permissions,
      },
      company: {
        id: company.id,
        name: company.name,
        companyCode: company.companyCode,
        logoUrl: company.logoUrl,
        primaryColor: company.primaryColor,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
