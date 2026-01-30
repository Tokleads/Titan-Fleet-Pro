/**
 * Fleet Document Storage Service
 * 
 * Wrapper around Google Cloud Storage for fleet document uploads
 */

import { objectStorageClient } from './objectStorage.js';
import { randomUUID } from 'crypto';

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

class FleetDocumentStorage {
  private privateObjectDir: string;
  
  constructor() {
    this.privateObjectDir = process.env.PRIVATE_OBJECT_DIR || '';
    if (!this.privateObjectDir) {
      throw new Error('PRIVATE_OBJECT_DIR not set');
    }
  }
  
  /**
   * Upload a file to Google Cloud Storage
   */
  async put(filename: string, buffer: Buffer, contentType: string): Promise<{ url: string; key: string }> {
    const fullPath = `${this.privateObjectDir}/${filename}`;
    const { bucketName, objectName } = this.parseObjectPath(fullPath);
    
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    await file.save(buffer, {
      contentType,
      metadata: {
        contentType
      }
    });
    
    // Generate public URL
    const url = `https://storage.googleapis.com/${bucketName}/${objectName}`;
    
    return {
      url,
      key: filename
    };
  }
  
  /**
   * Delete a file from Google Cloud Storage
   */
  async delete(fileKey: string): Promise<void> {
    const fullPath = `${this.privateObjectDir}/${fileKey}`;
    const { bucketName, objectName } = this.parseObjectPath(fullPath);
    
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    await file.delete();
  }
  
  /**
   * Get a signed URL for downloading a file
   */
  async getSignedUrl(fileKey: string, expiresInSeconds: number): Promise<string> {
    const fullPath = `${this.privateObjectDir}/${fileKey}`;
    const { bucketName, objectName } = this.parseObjectPath(fullPath);
    
    return await this.signObjectURL({
      bucketName,
      objectName,
      method: 'GET',
      ttlSec: expiresInSeconds
    });
  }
  
  private parseObjectPath(path: string): { bucketName: string; objectName: string } {
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }
    const pathParts = path.split("/");
    if (pathParts.length < 3) {
      throw new Error("Invalid path: must contain at least a bucket name");
    }
    const bucketName = pathParts[1];
    const objectName = pathParts.slice(2).join("/");
    return { bucketName, objectName };
  }
  
  private async signObjectURL({
    bucketName,
    objectName,
    method,
    ttlSec,
  }: {
    bucketName: string;
    objectName: string;
    method: "GET" | "PUT" | "DELETE" | "HEAD";
    ttlSec: number;
  }): Promise<string> {
    const request = {
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    };
    const response = await fetch(
      `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      }
    );
    if (!response.ok) {
      throw new Error(
        `Failed to sign object URL, errorcode: ${response.status}`
      );
    }
    const { signed_url: signedURL } = await response.json();
    return signedURL;
  }
}

export const storage = new FleetDocumentStorage();
