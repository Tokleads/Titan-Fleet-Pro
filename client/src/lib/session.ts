import type { Company, User } from "@shared/schema";

// Simple session management (localStorage-based for prototype)
export const session = {
  setUser(user: User) {
    localStorage.setItem("fleetcheck_user", JSON.stringify(user));
  },

  getUser(): User | null {
    const data = localStorage.getItem("fleetcheck_user");
    return data ? JSON.parse(data) : null;
  },

  setCompany(company: Company) {
    localStorage.setItem("fleetcheck_company", JSON.stringify(company));
  },

  getCompany(): Company | null {
    const data = localStorage.getItem("fleetcheck_company");
    return data ? JSON.parse(data) : null;
  },

  clear() {
    localStorage.removeItem("fleetcheck_user");
    localStorage.removeItem("fleetcheck_company");
    localStorage.removeItem("titanfleet_last_role");
  },
};
