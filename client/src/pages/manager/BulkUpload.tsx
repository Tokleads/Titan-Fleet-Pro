import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import Papa from "papaparse";
import {
  Upload,
  Download,
  FileSpreadsheet,
  Users,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ImportResult {
  created: number;
  skipped: number;
  errors: Array<{ row: number; name?: string; vrm?: string; reason: string }>;
  createdDrivers?: any[];
  createdVehicles?: any[];
}

const DRIVER_REQUIRED = ["name", "email"];
const VEHICLE_REQUIRED = ["vrm", "make", "model"];

const HEADER_MAP: Record<string, string> = {
  fleet_number: "fleetNumber",
  fleetnumber: "fleetNumber",
  vehicle_category: "vehicleCategory",
  vehiclecategory: "vehicleCategory",
  license_number: "licenseNumber",
  licensenumber: "licenseNumber",
  licence_number: "licenseNumber",
  licencenumber: "licenseNumber",
  phone_number: "phone",
  phonenumber: "phone",
  mot_due: "motDue",
  motdue: "motDue",
  full_name: "name",
  fullname: "name",
  driver_name: "name",
  drivername: "name",
  driver: "name",
  firstname: "name",
  first_name: "name",
  last_name: "lastName",
  surname: "lastName",
  category: "driverCategory",
  driver_category: "driverCategory",
  email_address: "email",
  emailaddress: "email",
  registration: "vrm",
  reg: "vrm",
  number_plate: "vrm",
  numberplate: "vrm",
  plate: "vrm",
};

function normalizeHeader(raw: string): string {
  const cleaned = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return HEADER_MAP[cleaned] || cleaned;
}

const HIDDEN_COLUMNS = ["hrNumber", "hr_number", "hrnumber"];

function fixPhoneNumber(value: string): string {
  if (!value) return "";
  let trimmed = value.trim();
  if (/[eE]\+/.test(trimmed) || /\.\d*$/.test(trimmed)) {
    try {
      const num = Number(trimmed);
      if (!isNaN(num) && isFinite(num)) {
        trimmed = BigInt(Math.round(num)).toString();
      }
    } catch {}
  }
  trimmed = trimmed.replace(/\.0+$/, "");
  const digitsOnly = trimmed.replace(/[^0-9+]/g, "");
  if (!digitsOnly) return trimmed;
  if (digitsOnly.startsWith("+")) return digitsOnly;
  if (digitsOnly.startsWith("44") && digitsOnly.length >= 12) return "+" + digitsOnly;
  if (digitsOnly.startsWith("0") && digitsOnly.length === 11) return "+44" + digitsOnly.slice(1);
  return digitsOnly;
}

function normalizeRows(rows: Record<string, string>[]): Record<string, string>[] {
  return rows.map((row) => {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      const mapped = normalizeHeader(key);
      if (HIDDEN_COLUMNS.includes(mapped) || HIDDEN_COLUMNS.includes(key.trim().toLowerCase().replace(/[\s-]+/g, "_"))) continue;
      if (mapped === "phone" || mapped === "telephone" || mapped === "mobile") {
        normalized[mapped] = fixPhoneNumber(value);
      } else {
        normalized[mapped] = value?.trim() || "";
      }
    }
    return normalized;
  });
}

function isRowInvalid(row: Record<string, string>, requiredFields: string[]): boolean {
  return requiredFields.some((field) => !row[field]?.trim());
}

function UploadSection({
  type,
  requiredFields,
}: {
  type: "drivers" | "vehicles";
  requiredFields: string[];
}) {
  const company = session.getCompany();
  const user = session.getUser();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const parseFile = useCallback(
    (file: File) => {
      setResult(null);
      setFileName(file.name);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          const normalized = normalizeRows(results.data as Record<string, string>[]);
          if (normalized.length > 0) {
            setHeaders(Object.keys(normalized[0]));
          }
          setRows(normalized);
        },
        error: () => {
          toast.error("Failed to parse CSV file");
        },
      });
    },
    []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) {
        parseFile(file);
      } else {
        toast.error("Please drop a .csv file");
      }
    },
    [parseFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const validRows = rows.filter((r) => !isRowInvalid(r, requiredFields));
  const invalidCount = rows.length - validRows.length;

  const importMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, any> = {
        companyId: company!.id,
        managerId: user!.id,
      };
      body[type] = validRows;

      const response = await fetch(`/api/manager/bulk-upload/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Failed to import ${type}`);
      }
      return response.json() as Promise<ImportResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success(
        `Import complete: ${data.created} created, ${data.skipped} skipped`
      );
      queryClient.invalidateQueries({ queryKey: ["/api/manager/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const downloadTemplate = async () => {
    try {
      const response = await fetch(
        `/api/manager/bulk-upload/templates/${type}`
      );
      if (!response.ok) throw new Error("Failed to download template");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-template.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download template");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={downloadTemplate}
          data-testid={`button-download-template-${type}`}
        >
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div
            data-testid={`dropzone-${type}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragOver
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            {fileName ? (
              <div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-900">
                    {fileName}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {rows.length} rows loaded · Click or drop to replace
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">
                  Drag & drop your CSV file here
                </p>
                <p className="text-xs text-slate-500">
                  or click to browse · .csv files only
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Preview</CardTitle>
                  <CardDescription>
                    {rows.length} rows · {validRows.length} valid ·{" "}
                    {invalidCount > 0 && (
                      <span className="text-red-600">
                        {invalidCount} with errors
                      </span>
                    )}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => importMutation.mutate()}
                  disabled={
                    validRows.length === 0 || importMutation.isPending
                  }
                  data-testid={`button-import-${type}`}
                >
                  {importMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import {validRows.length}{" "}
                      {type === "drivers" ? "Drivers" : "Vehicles"}
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto max-h-[400px]">
                <Table data-testid={`table-preview-${type}`}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      {headers.map((h) => (
                        <TableHead key={h}>
                          <div className="flex items-center gap-1">
                            {h}
                            {requiredFields.includes(h) && (
                              <span className="text-red-500">*</span>
                            )}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="w-20">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => {
                      const invalid = isRowInvalid(row, requiredFields);
                      return (
                        <TableRow
                          key={i}
                          className={invalid ? "bg-red-50" : ""}
                        >
                          <TableCell className="text-slate-500 text-xs">
                            {i + 1}
                          </TableCell>
                          {headers.map((h) => (
                            <TableCell
                              key={h}
                              className={
                                requiredFields.includes(h) && !row[h]?.trim()
                                  ? "text-red-600 font-medium"
                                  : ""
                              }
                            >
                              {row[h] || (
                                <span className="text-red-400 italic text-xs">
                                  missing
                                </span>
                              )}
                            </TableCell>
                          ))}
                          <TableCell>
                            {invalid ? (
                              <Badge variant="destructive" className="text-xs">
                                <XCircle className="h-3 w-3 mr-1" />
                                Error
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-xs text-emerald-700 border-emerald-200 bg-emerald-50"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Valid
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800" data-testid="text-result-created">
                  {result.created} Created
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800" data-testid="text-result-skipped">
                  {result.skipped} Skipped
                </span>
              </div>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Errors:</p>
                <div className="max-h-[200px] overflow-auto space-y-1">
                  {result.errors.map((err, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg"
                    >
                      <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>Row {err.row}: {err.name || err.vrm || 'Unknown'} - {err.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function BulkUpload() {
  const company = session.getCompany();
  const user = session.getUser();

  if (!company || !user) {
    return (
      <ManagerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-slate-500">Please log in to access bulk upload.</p>
        </div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout>
      <div className="space-y-6 titan-page-enter">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bulk Upload</h1>
          <p className="text-slate-500 mt-0.5">
            Import drivers and vehicles from CSV files
          </p>
        </div>

        <Tabs defaultValue="drivers">
          <TabsList>
            <TabsTrigger value="drivers" data-testid="tab-drivers">
              <Users className="h-4 w-4 mr-2" />
              Drivers
            </TabsTrigger>
            <TabsTrigger value="vehicles" data-testid="tab-vehicles">
              <Truck className="h-4 w-4 mr-2" />
              Vehicles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drivers" className="mt-6">
            <UploadSection type="drivers" requiredFields={DRIVER_REQUIRED} />
          </TabsContent>

          <TabsContent value="vehicles" className="mt-6">
            <UploadSection type="vehicles" requiredFields={VEHICLE_REQUIRED} />
          </TabsContent>
        </Tabs>
      </div>
    </ManagerLayout>
  );
}
