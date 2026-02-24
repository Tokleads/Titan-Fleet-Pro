import { useState } from "react";
import { Plus, Pencil, Trash2, Building2, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type Category = {
  id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
};

type CostCentre = {
  id: number;
  code: string;
  name: string;
  description?: string;
  location?: string;
  managerName?: string;
  managerEmail?: string;
};

type Department = {
  id: number;
  name: string;
  description?: string;
  headOfDepartment?: string;
  budgetCode?: string;
};

export default function FleetHierarchy() {
  const { toast } = useToast();
  const companyId = 1; // TODO: Get from auth context
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [costCentres, setCostCentres] = useState<CostCentre[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [costCentreDialog, setCostCentreDialog] = useState(false);
  const [departmentDialog, setDepartmentDialog] = useState(false);
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingCostCentre, setEditingCostCentre] = useState<CostCentre | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  
  // Load data
  const loadCategories = async () => {
    try {
      const res = await fetch(`/api/manager/hierarchy/categories?companyId=${companyId}`, { headers: authHeaders() });
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };
  
  const loadCostCentres = async () => {
    try {
      const res = await fetch(`/api/manager/hierarchy/cost-centres?companyId=${companyId}`, { headers: authHeaders() });
      const data = await res.json();
      setCostCentres(data);
    } catch (error) {
      console.error("Error loading cost centres:", error);
    }
  };
  
  const loadDepartments = async () => {
    try {
      const res = await fetch(`/api/manager/hierarchy/departments?companyId=${companyId}`, { headers: authHeaders() });
      const data = await res.json();
      setDepartments(data);
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  };
  
  // Category handlers
  const handleSaveCategory = async (data: Partial<Category>) => {
    try {
      const url = editingCategory
        ? `/api/manager/hierarchy/categories/${editingCategory.id}`
        : `/api/manager/hierarchy/categories`;
      const method = editingCategory ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ ...data, companyId })
      });
      
      if (res.ok) {
        toast({ title: `Category ${editingCategory ? "updated" : "created"}` });
        setCategoryDialog(false);
        setEditingCategory(null);
        loadCategories();
      }
    } catch (error) {
      toast({ title: "Error saving category", variant: "destructive" });
    }
  };
  
  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    try {
      const res = await fetch(`/api/manager/hierarchy/categories/${id}`, { method: "DELETE", headers: authHeaders() });
      if (res.ok) {
        toast({ title: "Category deleted" });
        loadCategories();
      }
    } catch (error) {
      toast({ title: "Error deleting category", variant: "destructive" });
    }
  };
  
  // Cost Centre handlers
  const handleSaveCostCentre = async (data: Partial<CostCentre>) => {
    try {
      const url = editingCostCentre
        ? `/api/manager/hierarchy/cost-centres/${editingCostCentre.id}`
        : `/api/manager/hierarchy/cost-centres`;
      const method = editingCostCentre ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ ...data, companyId })
      });
      
      if (res.ok) {
        toast({ title: `Cost centre ${editingCostCentre ? "updated" : "created"}` });
        setCostCentreDialog(false);
        setEditingCostCentre(null);
        loadCostCentres();
      }
    } catch (error) {
      toast({ title: "Error saving cost centre", variant: "destructive" });
    }
  };
  
  const handleDeleteCostCentre = async (id: number) => {
    if (!confirm("Delete this cost centre?")) return;
    try {
      const res = await fetch(`/api/manager/hierarchy/cost-centres/${id}`, { method: "DELETE", headers: authHeaders() });
      if (res.ok) {
        toast({ title: "Cost centre deleted" });
        loadCostCentres();
      }
    } catch (error) {
      toast({ title: "Error deleting cost centre", variant: "destructive" });
    }
  };
  
  // Department handlers
  const handleSaveDepartment = async (data: Partial<Department>) => {
    try {
      const url = editingDepartment
        ? `/api/manager/hierarchy/departments/${editingDepartment.id}`
        : `/api/manager/hierarchy/departments`;
      const method = editingDepartment ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ ...data, companyId })
      });
      
      if (res.ok) {
        toast({ title: `Department ${editingDepartment ? "updated" : "created"}` });
        setDepartmentDialog(false);
        setEditingDepartment(null);
        loadDepartments();
      }
    } catch (error) {
      toast({ title: "Error saving department", variant: "destructive" });
    }
  };
  
  const handleDeleteDepartment = async (id: number) => {
    if (!confirm("Delete this department?")) return;
    try {
      const res = await fetch(`/api/manager/hierarchy/departments/${id}`, { method: "DELETE", headers: authHeaders() });
      if (res.ok) {
        toast({ title: "Department deleted" });
        loadDepartments();
      }
    } catch (error) {
      toast({ title: "Error deleting department", variant: "destructive" });
    }
  };
  
  // Load data on mount
  useState(() => {
    loadCategories();
    loadCostCentres();
    loadDepartments();
  });
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Fleet Hierarchy</h1>
        <p className="text-muted-foreground">Organize your fleet with categories, cost centres, and departments</p>
      </div>
      
      {/* Vehicle Categories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <div>
                <CardTitle>Vehicle Categories</CardTitle>
                <CardDescription>Classify vehicles by type (HGV, LGV, Van, Car, etc.)</CardDescription>
              </div>
            </div>
            <Button onClick={() => { setEditingCategory(null); setCategoryDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditingCategory(category); setCategoryDialog(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Cost Centres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <div>
                <CardTitle>Cost Centres</CardTitle>
                <CardDescription>Manage locations, depots, and operational centres</CardDescription>
              </div>
            </div>
            <Button onClick={() => { setEditingCostCentre(null); setCostCentreDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Cost Centre
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {costCentres.map((costCentre) => (
              <Card key={costCentre.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{costCentre.code}</span>
                    </div>
                    <h3 className="font-semibold mt-2">{costCentre.name}</h3>
                    {costCentre.location && (
                      <p className="text-sm text-muted-foreground mt-1">{costCentre.location}</p>
                    )}
                    {costCentre.managerName && (
                      <p className="text-sm text-muted-foreground mt-1">Manager: {costCentre.managerName}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditingCostCentre(costCentre); setCostCentreDialog(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCostCentre(costCentre.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Departments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <div>
                <CardTitle>Departments</CardTitle>
                <CardDescription>Organize vehicles by business unit or function</CardDescription>
              </div>
            </div>
            <Button onClick={() => { setEditingDepartment(null); setDepartmentDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((department) => (
              <Card key={department.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{department.name}</h3>
                    {department.description && (
                      <p className="text-sm text-muted-foreground mt-1">{department.description}</p>
                    )}
                    {department.headOfDepartment && (
                      <p className="text-sm text-muted-foreground mt-1">Head: {department.headOfDepartment}</p>
                    )}
                    {department.budgetCode && (
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded mt-2 inline-block">
                        {department.budgetCode}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditingDepartment(department); setDepartmentDialog(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDepartment(department.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Category Dialog */}
      <CategoryDialog
        open={categoryDialog}
        onOpenChange={setCategoryDialog}
        category={editingCategory}
        onSave={handleSaveCategory}
      />
      
      {/* Cost Centre Dialog */}
      <CostCentreDialog
        open={costCentreDialog}
        onOpenChange={setCostCentreDialog}
        costCentre={editingCostCentre}
        onSave={handleSaveCostCentre}
      />
      
      {/* Department Dialog */}
      <DepartmentDialog
        open={departmentDialog}
        onOpenChange={setDepartmentDialog}
        department={editingDepartment}
        onSave={handleSaveDepartment}
      />
    </div>
  );
}

// Category Dialog Component
function CategoryDialog({ open, onOpenChange, category, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSave: (data: Partial<Category>) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  useState(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || "");
    } else {
      setName("");
      setDescription("");
    }
  });
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Edit" : "Add"} Vehicle Category</DialogTitle>
          <DialogDescription>
            Create a category to classify your vehicles
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., HGV, LGV, Van"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave({ name, description })}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Cost Centre Dialog Component
function CostCentreDialog({ open, onOpenChange, costCentre, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costCentre: CostCentre | null;
  onSave: (data: Partial<CostCentre>) => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  
  useState(() => {
    if (costCentre) {
      setCode(costCentre.code);
      setName(costCentre.name);
      setDescription(costCentre.description || "");
      setLocation(costCentre.location || "");
      setManagerName(costCentre.managerName || "");
      setManagerEmail(costCentre.managerEmail || "");
    } else {
      setCode("");
      setName("");
      setDescription("");
      setLocation("");
      setManagerName("");
      setManagerEmail("");
    }
  });
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{costCentre ? "Edit" : "Add"} Cost Centre</DialogTitle>
          <DialogDescription>
            Manage a location, depot, or operational centre
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g., LON-001"
              />
            </div>
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., London Depot"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Address or location"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="managerName">Manager Name</Label>
              <Input
                id="managerName"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="Manager name"
              />
            </div>
            <div>
              <Label htmlFor="managerEmail">Manager Email</Label>
              <Input
                id="managerEmail"
                type="email"
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
                placeholder="manager@example.com"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave({ code, name, description, location, managerName, managerEmail })}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Department Dialog Component
function DepartmentDialog({ open, onOpenChange, department, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  onSave: (data: Partial<Department>) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [headOfDepartment, setHeadOfDepartment] = useState("");
  const [budgetCode, setBudgetCode] = useState("");
  
  useState(() => {
    if (department) {
      setName(department.name);
      setDescription(department.description || "");
      setHeadOfDepartment(department.headOfDepartment || "");
      setBudgetCode(department.budgetCode || "");
    } else {
      setName("");
      setDescription("");
      setHeadOfDepartment("");
      setBudgetCode("");
    }
  });
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{department ? "Edit" : "Add"} Department</DialogTitle>
          <DialogDescription>
            Organize vehicles by business unit or function
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sales, Delivery"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div>
            <Label htmlFor="headOfDepartment">Head of Department</Label>
            <Input
              id="headOfDepartment"
              value={headOfDepartment}
              onChange={(e) => setHeadOfDepartment(e.target.value)}
              placeholder="Department head name"
            />
          </div>
          <div>
            <Label htmlFor="budgetCode">Budget Code</Label>
            <Input
              id="budgetCode"
              value={budgetCode}
              onChange={(e) => setBudgetCode(e.target.value)}
              placeholder="e.g., DEPT-001"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave({ name, description, headOfDepartment, budgetCode })}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
