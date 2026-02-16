import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "./AdminLayout";
import { TitanButton } from "@/components/titan-ui/Button";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Building2, 
  Plus, 
  Search, 
  Pencil, 
  Power, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  Zap,
  Crown,
  Loader2,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: number;
  companyCode: string;
  name: string;
  contactEmail: string | null;
  licenseTier: string;
  isActive: boolean | null;
  userCount: number;
  vehicleCount: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TIER_CONFIG: Record<string, { label: string; price: number; icon: React.ElementType; color: string; bgColor: string }> = {
  core: { label: "Starter", price: 49, icon: Shield, color: "text-slate-400", bgColor: "bg-slate-500/10" },
  pro: { label: "Pro", price: 149, icon: Zap, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  operator: { label: "Enterprise", price: 349, icon: Crown, color: "text-amber-400", bgColor: "bg-amber-500/10" },
  lifetime: { label: "Lifetime", price: 0, icon: Star, color: "text-emerald-400", bgColor: "bg-emerald-500/10" }
};

function generateCompanyCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function Companies() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    companyCode: "",
    contactEmail: "",
    licenseTier: "core"
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCompanies = async (page = 1) => {
    const token = localStorage.getItem("titan_admin_token");
    if (!token) {
      setLocation("/admin/login");
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20"
      });
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }
      
      const response = await fetch(`/api/admin/companies?${params}`, {
        headers: { "x-admin-token": token },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("titan_admin_token");
          localStorage.removeItem("titan_admin_authenticated");
          setLocation("/admin/login");
          return;
        }
        throw new Error("Failed to fetch companies");
      }

      const data = await response.json();
      setCompanies(data.companies);
      setPagination(data.pagination);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(1);
  }, [debouncedSearch]);

  const openAddDialog = () => {
    setFormData({
      name: "",
      companyCode: generateCompanyCode(),
      contactEmail: "",
      licenseTier: "core"
    });
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      companyCode: company.companyCode,
      contactEmail: company.contactEmail || "",
      licenseTier: company.licenseTier
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateCompany = async () => {
    const token = localStorage.getItem("titan_admin_token");
    if (!token) return;

    if (!formData.name.trim() || !formData.companyCode.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and company code are required",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create company");
      }

      toast({
        title: "Success",
        description: "Company created successfully"
      });
      setIsAddDialogOpen(false);
      fetchCompanies(pagination.page);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create company",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCompany = async () => {
    const token = localStorage.getItem("titan_admin_token");
    if (!token || !selectedCompany) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/companies/${selectedCompany.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update company");
      }

      toast({
        title: "Success",
        description: "Company updated successfully"
      });
      setIsEditDialogOpen(false);
      setSelectedCompany(null);
      fetchCompanies(pagination.page);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update company",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (company: Company) => {
    const token = localStorage.getItem("titan_admin_token");
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/companies/${company.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ isActive: !company.isActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to update company status");
      }

      toast({
        title: "Success",
        description: `Company ${company.isActive ? "deactivated" : "activated"} successfully`
      });
      fetchCompanies(pagination.page);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update company status",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Company Management</h1>
            <p className="text-slate-400 mt-1">Manage all companies on the platform</p>
          </div>
          <TitanButton 
            onClick={openAddDialog}
            className="bg-amber-600 hover:bg-amber-700 text-white" 
            data-testid="button-add-company"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </TitanButton>
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.14 }} className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                data-testid="input-search-companies"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No companies found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">Company Name</TableHead>
                      <TableHead className="text-slate-400">Code</TableHead>
                      <TableHead className="text-slate-400">Subscription</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400 text-center">Users</TableHead>
                      <TableHead className="text-slate-400 text-center">Vehicles</TableHead>
                      <TableHead className="text-slate-400">Created</TableHead>
                      <TableHead className="text-slate-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company, index) => {
                      const tierConfig = TIER_CONFIG[company.licenseTier] || TIER_CONFIG.core;
                      const TierIcon = tierConfig.icon;
                      
                      return (
                        <motion.tr
                          key={company.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-slate-800 hover:bg-slate-800/50"
                          data-testid={`row-company-${company.id}`}
                        >
                          <TableCell className="font-medium text-white">{company.name}</TableCell>
                          <TableCell>
                            <code className="px-2 py-1 rounded bg-slate-800 text-amber-400 text-sm font-mono">
                              {company.companyCode}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`h-7 w-7 rounded-lg ${tierConfig.bgColor} flex items-center justify-center`}>
                                <TierIcon className={`h-4 w-4 ${tierConfig.color}`} />
                              </div>
                              <div>
                                <span className={`text-sm font-medium ${tierConfig.color}`}>{tierConfig.label}</span>
                                <span className="text-xs text-slate-500 block">£{tierConfig.price}/mo</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={company.isActive !== false 
                                ? "bg-green-500/10 text-green-400 border-green-500/20" 
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                              }
                            >
                              {company.isActive !== false ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-slate-300">{company.userCount}</TableCell>
                          <TableCell className="text-center text-slate-300">{company.vehicleCount}</TableCell>
                          <TableCell className="text-slate-400">{formatDate(company.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditDialog(company)}
                                className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                                data-testid={`button-edit-company-${company.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(company)}
                                className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                                  company.isActive !== false
                                    ? "bg-red-500/10 hover:bg-red-500/20 text-red-400"
                                    : "bg-green-500/10 hover:bg-green-500/20 text-green-400"
                                }`}
                                data-testid={`button-toggle-company-${company.id}`}
                              >
                                <Power className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                  <p className="text-sm text-slate-400">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} companies
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchCompanies(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-slate-400 px-2">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => fetchCompanies(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New Company</DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a new company account on the platform.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Company Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter company name"
                className="bg-slate-800 border-slate-700 text-white"
                data-testid="input-company-name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Company Code</label>
              <div className="flex gap-2">
                <Input
                  value={formData.companyCode}
                  onChange={(e) => setFormData({ ...formData, companyCode: e.target.value.toUpperCase() })}
                  placeholder="e.g., APEX"
                  className="bg-slate-800 border-slate-700 text-white font-mono"
                  maxLength={10}
                  data-testid="input-company-code"
                />
                <TitanButton
                  type="button"
                  onClick={() => setFormData({ ...formData, companyCode: generateCompanyCode() })}
                  className="bg-slate-700 hover:bg-slate-600 text-white"
                  data-testid="button-generate-code"
                >
                  Generate
                </TitanButton>
              </div>
              <p className="text-xs text-slate-500 mt-1">This code is used for login identification</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Contact Email</label>
              <Input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="admin@company.com"
                className="bg-slate-800 border-slate-700 text-white"
                data-testid="input-contact-email"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Subscription Tier</label>
              <Select
                value={formData.licenseTier}
                onValueChange={(value) => setFormData({ ...formData, licenseTier: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white" data-testid="select-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="core" className="text-white hover:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-slate-400" />
                      <span>Starter - £49/mo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pro" className="text-white hover:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-400" />
                      <span>Pro - £149/mo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="operator" className="text-white hover:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-400" />
                      <span>Enterprise - £349/mo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="lifetime" className="text-white hover:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-emerald-400" />
                      <span>Lifetime - Free</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <TitanButton
              onClick={() => setIsAddDialogOpen(false)}
              className="bg-slate-700 hover:bg-slate-600 text-white"
              data-testid="button-cancel-add"
            >
              Cancel
            </TitanButton>
            <TitanButton
              onClick={handleCreateCompany}
              disabled={isSaving}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              data-testid="button-save-company"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Company
            </TitanButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Company</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update company details and subscription.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Company Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter company name"
                className="bg-slate-800 border-slate-700 text-white"
                data-testid="input-edit-company-name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Company Code</label>
              <Input
                value={formData.companyCode}
                onChange={(e) => setFormData({ ...formData, companyCode: e.target.value.toUpperCase() })}
                placeholder="e.g., APEX"
                className="bg-slate-800 border-slate-700 text-white font-mono"
                maxLength={10}
                data-testid="input-edit-company-code"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Contact Email</label>
              <Input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="admin@company.com"
                className="bg-slate-800 border-slate-700 text-white"
                data-testid="input-edit-contact-email"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Subscription Tier</label>
              <Select
                value={formData.licenseTier}
                onValueChange={(value) => setFormData({ ...formData, licenseTier: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white" data-testid="select-edit-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="core" className="text-white hover:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-slate-400" />
                      <span>Starter - £49/mo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pro" className="text-white hover:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-400" />
                      <span>Pro - £149/mo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="operator" className="text-white hover:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-400" />
                      <span>Enterprise - £349/mo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="lifetime" className="text-white hover:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-emerald-400" />
                      <span>Lifetime - Free</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedCompany && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div>
                  <p className="text-sm font-medium text-slate-300">Company Status</p>
                  <p className="text-xs text-slate-500">Toggle active/inactive</p>
                </div>
                <Badge 
                  className={selectedCompany.isActive !== false 
                    ? "bg-green-500/10 text-green-400 border-green-500/20" 
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                  }
                >
                  {selectedCompany.isActive !== false ? "Active" : "Inactive"}
                </Badge>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <TitanButton
              onClick={() => setIsEditDialogOpen(false)}
              className="bg-slate-700 hover:bg-slate-600 text-white"
              data-testid="button-cancel-edit"
            >
              Cancel
            </TitanButton>
            <TitanButton
              onClick={handleUpdateCompany}
              disabled={isSaving}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              data-testid="button-update-company"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </TitanButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
