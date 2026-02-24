import type { Company, User } from "@shared/schema";

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export const session = {
  setUser(user: User) {
    localStorage.setItem("fleetcheck_user", JSON.stringify(user));
    localStorage.setItem("fleetcheck_session_created_at", String(Date.now()));
  },

  getUser(): User | null {
    if (this.isExpired()) {
      this.clear();
      return null;
    }
    const data = localStorage.getItem("fleetcheck_user");
    return data ? JSON.parse(data) : null;
  },

  setCompany(company: Company) {
    localStorage.setItem("fleetcheck_company", JSON.stringify(company));
  },

  getCompany(): Company | null {
    if (this.isExpired()) {
      this.clear();
      return null;
    }
    const data = localStorage.getItem("fleetcheck_company");
    return data ? JSON.parse(data) : null;
  },

  isExpired(): boolean {
    const createdAt = localStorage.getItem("fleetcheck_session_created_at");
    if (!createdAt) return false;
    return Date.now() - Number(createdAt) > SESSION_DURATION_MS;
  },

  touch() {
    localStorage.setItem("fleetcheck_session_created_at", String(Date.now()));
  },

  setToken(token: string) {
    localStorage.setItem("fleetcheck_token", token);
  },

  getToken(): string | null {
    if (this.isExpired()) {
      this.clear();
      return null;
    }
    return localStorage.getItem("fleetcheck_token");
  },

  clear() {
    localStorage.removeItem("fleetcheck_user");
    localStorage.removeItem("fleetcheck_company");
    localStorage.removeItem("titanfleet_last_role");
    localStorage.removeItem("fleetcheck_session_created_at");
    localStorage.removeItem("fleetcheck_token");
  },
};
