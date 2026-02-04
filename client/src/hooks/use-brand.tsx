import React, { createContext, useContext, useEffect, useState } from "react";
import { session } from "@/lib/session";
import tenantConfig from "@/config/tenant";
import type { Company } from "@shared/schema";

const DEFAULT_COMPANY: Partial<Company> & { name: string } = {
  name: "Fleet Management",
  primaryColor: "#2563eb",
  secondaryColor: "#1e293b",
  logoUrl: null,
};

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "217 91% 60%";
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

type BrandContextType = {
  currentCompany: Company | null;
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  refreshCompany: () => void;
  tenant: typeof tenantConfig;
};

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<Company | null>(() => session.getCompany());

  const refreshCompany = () => {
    setCompany(session.getCompany());
  };

  const companyName = company?.name || DEFAULT_COMPANY.name;
  const primaryColor = company?.primaryColor || DEFAULT_COMPANY.primaryColor!;
  const secondaryColor = company?.secondaryColor || DEFAULT_COMPANY.secondaryColor!;
  const logoUrl = company?.logoUrl ?? DEFAULT_COMPANY.logoUrl ?? null;

  useEffect(() => {
    const root = document.documentElement;
    const primaryHsl = hexToHsl(primaryColor);
    root.style.setProperty("--primary", primaryHsl);
    root.style.setProperty("--radius", "0.75rem");
  }, [primaryColor]);

  return (
    <BrandContext.Provider value={{ 
      currentCompany: company, 
      companyName,
      primaryColor,
      secondaryColor,
      logoUrl,
      refreshCompany, 
      tenant: tenantConfig 
    }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
}
