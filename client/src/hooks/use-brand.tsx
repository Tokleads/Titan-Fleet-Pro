import React, { createContext, useContext, useEffect, useState } from "react";
import { Company, MOCK_COMPANIES } from "@/lib/mockData";
import tenantConfig from "@/config/tenant";

type BrandContextType = {
  currentCompany: Company;
  setCompanyId: (id: string) => void;
  tenant: typeof tenantConfig;
};

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [companyId, setCompanyId] = useState<string>(MOCK_COMPANIES[0].id);
  const currentCompany = MOCK_COMPANIES.find((c: Company) => c.id === companyId) || MOCK_COMPANIES[0];

  useEffect(() => {
    const root = document.documentElement;

    // Apply tenant brand colors to CSS variables
    root.style.setProperty("--primary", tenantConfig.colors.primaryHsl);
    root.style.setProperty("--radius", "0.75rem");
  }, [companyId, currentCompany]);

  return (
    <BrandContext.Provider value={{ currentCompany, setCompanyId, tenant: tenantConfig }}>
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
