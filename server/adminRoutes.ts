import { Router, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { companies, users, vehicles, accountSetupTokens, referrals } from "@shared/schema";
import { eq, sql, like, or, desc } from "drizzle-orm";

const router = Router();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "titan-admin-secret-2024";

export function verifyAdminToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["x-admin-token"] as string;
  
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized - Invalid admin token" });
  }
  
  next();
}

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return res.status(500).json({ error: "Admin credentials not configured" });
    }
    
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    res.json({ 
      success: true, 
      message: "Admin authentication successful",
      adminToken: ADMIN_TOKEN
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats", verifyAdminToken, async (req: Request, res: Response) => {
  try {
    const companies = await storage.getAllCompanies();
    const activeCompanies = companies.filter(c => c.id > 0);
    
    let totalUsers = 0;
    let totalVehicles = 0;
    const recentActivity: { type: string; description: string; timestamp: string }[] = [];
    
    const tierPricing: Record<string, number> = {
      starter: 59,
      growth: 129,
      pro: 249,
      scale: 399
    };
    
    let monthlyRevenue = 0;
    const tierBreakdown: Record<string, number> = {
      starter: 0,
      growth: 0,
      pro: 0,
      scale: 0
    };
    
    for (const company of companies) {
      const users = await storage.getUsersByCompany(company.id);
      totalUsers += users.length;
      
      const vehiclesResult = await storage.getVehiclesByCompany(company.id, 1000, 0);
      totalVehicles += vehiclesResult.total;
      
      let tier = company.licenseTier || "starter";
      if (tier === 'core') tier = 'starter';
      if (tier === 'operator') tier = 'scale';
      tierBreakdown[tier] = (tierBreakdown[tier] || 0) + 1;
      monthlyRevenue += tierPricing[tier] || 59;
      
      recentActivity.push({
        type: "company",
        description: `Company "${company.name}" (${tier.toUpperCase()}) - ${vehiclesResult.total} vehicles`,
        timestamp: company.createdAt.toISOString()
      });
    }
    
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json({
      totalCompanies: companies.length,
      activeCompanies: activeCompanies.length,
      totalUsers,
      totalVehicles,
      monthlyRevenue,
      tierBreakdown,
      recentActivity: recentActivity.slice(0, 10)
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to fetch admin statistics" });
  }
});

router.get("/companies", verifyAdminToken, async (req: Request, res: Response) => {
  try {
    const { search, page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;
    
    let allCompanies = await db.select().from(companies);
    
    if (search && typeof search === "string" && search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      allCompanies = allCompanies.filter(c => 
        c.name.toLowerCase().includes(searchTerm) || 
        c.companyCode.toLowerCase().includes(searchTerm)
      );
    }
    
    const total = allCompanies.length;
    const paginatedCompanies = allCompanies.slice(offset, offset + limitNum);
    
    const companiesWithStats = await Promise.all(
      paginatedCompanies.map(async (company) => {
        const companyUsers = await storage.getUsersByCompany(company.id);
        const vehiclesResult = await storage.getVehiclesByCompany(company.id, 1000, 0);
        
        return {
          ...company,
          userCount: companyUsers.length,
          vehicleCount: vehiclesResult.total
        };
      })
    );
    
    res.json({
      companies: companiesWithStats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error("Admin companies error:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

router.post("/companies", verifyAdminToken, async (req: Request, res: Response) => {
  try {
    const { name, companyCode, contactEmail, licenseTier } = req.body;
    
    if (!name || !companyCode) {
      return res.status(400).json({ error: "Name and company code are required" });
    }
    
    const existingCompany = await storage.getCompanyByCode(companyCode);
    if (existingCompany) {
      return res.status(400).json({ error: "A company with this code already exists" });
    }
    
    const [newCompany] = await db.insert(companies).values({
      name,
      companyCode: companyCode.toUpperCase(),
      contactEmail: contactEmail || null,
      licenseTier: licenseTier || "starter",
      isActive: true,
      vehicleAllowance: licenseTier === "scale" ? 100 : licenseTier === "pro" ? 50 : licenseTier === "growth" ? 25 : 15,
      graceOverage: 3,
      enforcementMode: "soft_block"
    }).returning();
    
    res.status(201).json(newCompany);
  } catch (error) {
    console.error("Create company error:", error);
    res.status(500).json({ error: "Failed to create company" });
  }
});

router.patch("/companies/:id", verifyAdminToken, async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.params.id, 10);
    if (isNaN(companyId)) {
      return res.status(400).json({ error: "Invalid company ID" });
    }
    
    const { name, companyCode, contactEmail, licenseTier, isActive } = req.body;
    
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (companyCode !== undefined) updates.companyCode = companyCode.toUpperCase();
    if (contactEmail !== undefined) updates.contactEmail = contactEmail;
    if (licenseTier !== undefined) {
      updates.licenseTier = licenseTier;
      updates.vehicleAllowance = licenseTier === "scale" ? 100 : licenseTier === "pro" ? 50 : licenseTier === "growth" ? 25 : 15;
    }
    if (isActive !== undefined) updates.isActive = isActive;
    
    const [updatedCompany] = await db
      .update(companies)
      .set(updates)
      .where(eq(companies.id, companyId))
      .returning();
    
    if (!updatedCompany) {
      return res.status(404).json({ error: "Company not found" });
    }
    
    res.json(updatedCompany);
  } catch (error) {
    console.error("Update company error:", error);
    res.status(500).json({ error: "Failed to update company" });
  }
});

router.delete("/companies/:id", verifyAdminToken, async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.params.id, 10);
    if (isNaN(companyId)) {
      return res.status(400).json({ error: "Invalid company ID" });
    }
    
    const [updatedCompany] = await db
      .update(companies)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(companies.id, companyId))
      .returning();
    
    if (!updatedCompany) {
      return res.status(404).json({ error: "Company not found" });
    }
    
    res.json({ success: true, message: "Company deactivated successfully" });
  } catch (error) {
    console.error("Delete company error:", error);
    res.status(500).json({ error: "Failed to delete company" });
  }
});

router.get("/subscriptions", verifyAdminToken, async (req: Request, res: Response) => {
  try {
    const allCompanies = await db.select().from(companies).orderBy(desc(companies.createdAt));
    
    const TIER_PRICES: Record<string, number> = {
      starter: 59, growth: 129, pro: 249, scale: 399
    };
    
    let stripe: any = null;
    try {
      const { getUncachableStripeClient } = await import('./stripeClient');
      stripe = await getUncachableStripeClient();
    } catch (e) {
      console.error('Failed to init Stripe client for admin:', e);
    }
    
    const subscriptions = await Promise.all(
      allCompanies.map(async (company) => {
        let stripeStatus = null;
        let trialEnd = null;
        let currentPeriodEnd = null;
        let cancelAt = null;
        let stripePlanAmount = null;
        
        if (stripe && company.stripeSubscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(company.stripeSubscriptionId);
            stripeStatus = sub.status;
            trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
            currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
            cancelAt = sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null;
            stripePlanAmount = sub.items?.data?.[0]?.price?.unit_amount || null;
          } catch (e: any) {
            console.error(`Failed to fetch Stripe sub for company ${company.id}:`, e.message);
          }
        }
        
        let tier = company.licenseTier || 'starter';
        if (tier === 'core') tier = 'starter';
        if (tier === 'operator') tier = 'scale';
        const monthlyPrice = stripePlanAmount ? stripePlanAmount / 100 : (TIER_PRICES[tier] || 59);
        
        return {
          companyId: company.id,
          companyName: company.name,
          companyCode: company.companyCode,
          contactEmail: company.contactEmail,
          tier,
          monthlyPrice,
          stripeCustomerId: company.stripeCustomerId,
          stripeSubscriptionId: company.stripeSubscriptionId,
          stripeStatus: stripeStatus || (company.stripeSubscriptionId ? 'unknown' : 'no_subscription'),
          trialEnd,
          currentPeriodEnd,
          cancelAt,
          isActive: company.isActive !== false,
          createdAt: company.createdAt?.toISOString(),
        };
      })
    );
    
    const active = subscriptions.filter(s => s.stripeStatus === 'active').length;
    const trialing = subscriptions.filter(s => s.stripeStatus === 'trialing').length;
    const canceled = subscriptions.filter(s => s.stripeStatus === 'canceled').length;
    const pastDue = subscriptions.filter(s => s.stripeStatus === 'past_due').length;
    const noSub = subscriptions.filter(s => s.stripeStatus === 'no_subscription').length;
    const mrr = subscriptions
      .filter(s => s.stripeStatus === 'active' || s.stripeStatus === 'trialing')
      .reduce((sum, s) => sum + s.monthlyPrice, 0);
    
    res.json({
      subscriptions,
      summary: { active, trialing, canceled, pastDue, noSubscription: noSub, mrr }
    });
  } catch (error) {
    console.error("Admin subscriptions error:", error);
    res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
});

router.get("/onboarding", verifyAdminToken, async (req: Request, res: Response) => {
  try {
    const tokens = await db.select().from(accountSetupTokens).orderBy(desc(accountSetupTokens.createdAt));
    
    const now = new Date();
    const onboarding = tokens.map(token => ({
      id: token.id,
      email: token.email,
      tier: token.tier || 'starter',
      maxVehicles: token.maxVehicles || 10,
      referralCode: token.referralCode,
      stripeCustomerId: token.stripeCustomerId,
      status: token.used ? 'completed' : (new Date(token.expiresAt) < now ? 'expired' : 'pending'),
      createdAt: token.createdAt?.toISOString(),
      expiresAt: token.expiresAt?.toISOString(),
    }));
    
    const completed = onboarding.filter(o => o.status === 'completed').length;
    const pending = onboarding.filter(o => o.status === 'pending').length;
    const expired = onboarding.filter(o => o.status === 'expired').length;
    
    res.json({
      tokens: onboarding,
      summary: { total: onboarding.length, completed, pending, expired }
    });
  } catch (error) {
    console.error("Admin onboarding error:", error);
    res.status(500).json({ error: "Failed to fetch onboarding data" });
  }
});

router.get("/referrals", verifyAdminToken, async (req: Request, res: Response) => {
  try {
    const allReferrals = await db.select().from(referrals).orderBy(desc(referrals.createdAt));
    
    const referralData = await Promise.all(
      allReferrals.map(async (ref) => {
        const referrerCompany = await storage.getCompanyById(ref.referrerCompanyId);
        let referredCompanyName = null;
        if (ref.referredCompanyId) {
          const referred = await storage.getCompanyById(ref.referredCompanyId);
          referredCompanyName = referred?.name || null;
        }
        
        return {
          id: ref.id,
          referralCode: ref.referralCode,
          referrerCompanyId: ref.referrerCompanyId,
          referrerCompanyName: referrerCompany?.name || 'Unknown',
          referredCompanyId: ref.referredCompanyId,
          referredCompanyName,
          status: ref.status,
          rewardType: ref.rewardType,
          rewardValue: ref.rewardValue,
          rewardClaimed: ref.rewardClaimed,
          signedUpAt: ref.signedUpAt?.toISOString() || null,
          convertedAt: ref.convertedAt?.toISOString() || null,
          createdAt: ref.createdAt?.toISOString(),
        };
      })
    );
    
    const totalReferrals = referralData.length;
    const signedUp = referralData.filter(r => ['signed_up', 'converted', 'rewarded'].includes(r.status)).length;
    const rewarded = referralData.filter(r => r.status === 'rewarded').length;
    
    res.json({
      referrals: referralData,
      summary: { total: totalReferrals, signedUp, rewarded, conversionRate: totalReferrals > 0 ? Math.round((signedUp / totalReferrals) * 100) : 0 }
    });
  } catch (error) {
    console.error("Admin referrals error:", error);
    res.status(500).json({ error: "Failed to fetch referrals" });
  }
});

export default router;
