import { useState, useRef } from "react";
import { TitanButton } from "@/components/titan-ui/Button";
import { Upload, X, Loader2, Image } from "lucide-react";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface LogoUploaderProps {
  currentLogoUrl?: string;
  companyId: number;
  onUploadComplete: (logoPath: string) => void;
}

export function LogoUploader({ currentLogoUrl, companyId, onUploadComplete }: LogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be less than 2MB");
      return;
    }

    setError(null);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const uploadRes = await fetch(`/api/manager/company/${companyId}/logo/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
      });
      
      if (!uploadRes.ok) {
        throw new Error("Failed to get upload URL");
      }
      
      const { uploadURL } = await uploadRes.json();

      const uploadToStorage = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadToStorage.ok) {
        throw new Error("Failed to upload file");
      }

      const saveRes = await fetch(`/api/manager/company/${companyId}/logo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ logoURL: uploadURL }),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to save logo");
      }

      const data = await saveRes.json();
      onUploadComplete(data.logoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const displayUrl = previewUrl || currentLogoUrl;

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-muted-foreground ml-1 block">Company Logo</label>
      
      <div className="flex items-center gap-4">
        <div 
          className="h-20 w-20 rounded-xl border-2 border-dashed border-border bg-secondary/30 flex items-center justify-center overflow-hidden"
          data-testid="logo-preview-container"
        >
          {displayUrl ? (
            <img 
              src={displayUrl} 
              alt="Company logo" 
              className="h-full w-full object-contain p-2"
              data-testid="img-company-logo"
            />
          ) : (
            <Image className="h-8 w-8 text-muted-foreground/50" />
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-logo-file"
          />
          
          <TitanButton
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            data-testid="button-upload-logo"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {displayUrl ? "Change Logo" : "Upload Logo"}
              </>
            )}
          </TitanButton>
          
          <p className="text-xs text-muted-foreground">
            PNG, JPG, SVG or WebP. Max 2MB.
          </p>
        </div>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <X className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
