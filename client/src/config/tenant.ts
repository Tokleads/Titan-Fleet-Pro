/**
 * Tenant Configuration
 * 
 * This file controls the white-label branding for the application.
 * Edit these values to rebrand for different transport companies.
 */

export interface TenantConfig {
  companyCode: string;
  companyName: string;
  logoUrl: string;
  colors: {
    primary: string;
    primaryHsl: string;
    secondary: string;
    accent: string;
  };
  features: {
    fuelEnabled: boolean;
    adblueEnabled: boolean;
    trailerChecks: boolean;
    endOfShiftCheck: boolean;
    dvsaIntegration: boolean;
  };
}

export const tenantConfig: TenantConfig = {
  companyCode: "APEX",
  companyName: "DC European Haulage Ltd",
  logoUrl: "/dc-european-logo.png",
  colors: {
    primary: "#4169b2",
    primaryHsl: "220 46% 54%",
    secondary: "#1e293b",
    accent: "#10b981",
  },
  features: {
    fuelEnabled: true,
    adblueEnabled: true,
    trailerChecks: true,
    endOfShiftCheck: false,
    dvsaIntegration: true,
  },
};

export default tenantConfig;
