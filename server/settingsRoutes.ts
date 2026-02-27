import type { Express } from "express";
import { storage } from "./storage";

export function registerSettingsRoutes(app: Express) {
  // ==================== 2FA/TOTP API ROUTES ====================

  // Generate TOTP setup (QR code and secret)
  app.post("/api/manager/2fa/setup/:userId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (req.user && user.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      
      if (user.role !== 'MANAGER') {
        return res.status(403).json({ error: "2FA is only available for managers" });
      }
      
      const { generateTotpSetup } = await import("./totpService");
      const setup = await generateTotpSetup(user.email);
      
      // Store the secret temporarily (user must verify before enabling)
      await storage.updateUser(userId, { totpSecret: setup.secret, totpEnabled: false });
      
      res.json({
        qrCodeDataUrl: setup.qrCodeDataUrl,
        secret: setup.secret // For manual entry fallback
      });
    } catch (error) {
      console.error("Error generating 2FA setup:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Verify and enable 2FA
  app.post("/api/manager/2fa/enable/:userId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Verification token required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || !user.totpSecret) {
        return res.status(400).json({ error: "2FA setup not initiated" });
      }
      if (req.user && user.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      
      const { verifyTotpToken } = await import("./totpService");
      const isValid = verifyTotpToken(token, user.totpSecret);
      
      if (!isValid) {
        return res.status(400).json({ error: "Invalid verification code" });
      }
      
      await storage.updateUser(userId, { totpEnabled: true });
      
      const { logAudit } = await import("./auditService");
      await logAudit({
        companyId: user.companyId,
        userId: user.id,
        action: 'UPDATE',
        entity: 'SETTINGS',
        details: { action: '2FA enabled' },
        req
      });
      
      res.json({ success: true, message: "Two-factor authentication enabled" });
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Disable 2FA
  app.post("/api/manager/2fa/disable/:userId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const { token } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (req.user && user.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      
      // Require valid TOTP token to disable
      if (user.totpEnabled && user.totpSecret) {
        const { verifyTotpToken } = await import("./totpService");
        const isValid = verifyTotpToken(token, user.totpSecret);
        if (!isValid) {
          return res.status(400).json({ error: "Invalid verification code" });
        }
      }
      
      await storage.updateUser(userId, { totpSecret: null, totpEnabled: false });
      
      const { logAudit } = await import("./auditService");
      await logAudit({
        companyId: user.companyId,
        userId: user.id,
        action: 'UPDATE',
        entity: 'SETTINGS',
        details: { action: '2FA disabled' },
        req
      });
      
      res.json({ success: true, message: "Two-factor authentication disabled" });
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get 2FA status for user
  app.get("/api/manager/2fa/status/:userId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (req.user && user.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      
      res.json({
        enabled: user.totpEnabled || false,
        hasSecret: !!user.totpSecret
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });


  // ==================== COMPANY FEATURE SETTINGS ====================

  app.patch("/api/manager/company/:companyId/settings", async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      if (req.user && companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const { settings } = req.body;
      if (!settings || typeof settings !== "object") {
        return res.status(400).json({ error: "Invalid settings" });
      }
      const company = await storage.getCompanyById(companyId);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      const mergedSettings = { ...(company.settings as Record<string, any>), ...settings };
      const updated = await storage.updateCompany(companyId, { settings: mergedSettings });
      res.json(updated);
    } catch (error) {
      console.error("Failed to update company settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  // ==================== GOOGLE DRIVE SETTINGS ====================
  
  // Update Google Drive settings for company
  app.patch("/api/manager/company/:companyId/gdrive", async (req, res) => {
    try {
      const { clientId, clientSecret, refreshToken, folderId, disconnect } = req.body;
      const companyId = Number(req.params.companyId);
      if (req.user && companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      
      if (disconnect) {
        const updated = await storage.updateCompany(companyId, {
          googleDriveConnected: false,
          driveClientId: null,
          driveClientSecret: null,
          driveRefreshToken: null,
          driveRootFolderId: null,
        });
        return res.json(updated);
      }
      
      if (!clientId || !clientSecret || !refreshToken) {
        return res.status(400).json({ error: "Missing Google credentials" });
      }
      
      // Encrypt all credentials before storing
      const { encrypt } = await import("./encryption");
      
      const updated = await storage.updateCompany(companyId, {
        googleDriveConnected: true,
        driveClientId: encrypt(clientId),
        driveClientSecret: encrypt(clientSecret),
        driveRefreshToken: encrypt(refreshToken),
        driveRootFolderId: folderId || null,
      });
      
      if (!updated) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Test Google Drive connection
  app.post("/api/manager/company/:companyId/gdrive/test", async (req, res) => {
    try {
      const requestedCompanyId = Number(req.params.companyId);
      if (req.user && requestedCompanyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const { clientId, clientSecret, refreshToken } = req.body;
      
      if (!clientId || !clientSecret || !refreshToken) {
        return res.status(400).json({ error: "Missing Google credentials" });
      }
      
      const { googleDriveService } = await import("./googleDriveService");
      const result = await googleDriveService.testConnection(clientId, clientSecret, refreshToken);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });


  // ==================== LOGO UPLOAD ====================

  // Get presigned URL for logo upload
  app.post("/api/manager/company/:companyId/logo/upload", async (req, res) => {
    try {
      const requestedCompanyId = Number(req.params.companyId);
      if (req.user && requestedCompanyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorage = new ObjectStorageService();
      const uploadURL = await objectStorage.getLogoUploadURL(requestedCompanyId);
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting logo upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Save uploaded logo URL to company
  app.patch("/api/manager/company/:companyId/logo", async (req, res) => {
    try {
      const { logoURL } = req.body;
      const companyId = Number(req.params.companyId);
      if (req.user && companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      
      if (!logoURL) {
        return res.status(400).json({ error: "Missing logoURL" });
      }
      
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorage = new ObjectStorageService();
      const normalizedPath = objectStorage.normalizeLogoPath(logoURL);
      
      const updated = await storage.updateCompany(companyId, {
        logoUrl: normalizedPath,
      });
      
      if (!updated) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error saving logo:", error);
      res.status(500).json({ error: "Failed to save logo" });
    }
  });

}
