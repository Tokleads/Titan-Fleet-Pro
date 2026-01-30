/**
 * DVLA API Integration Service
 * 
 * Handles authentication and license verification with the DVLA Driver Data API.
 * 
 * API Documentation: https://developer-portal.driver-vehicle-licensing.api.gov.uk/
 * 
 * Environment Variables Required:
 * - DVLA_API_KEY: Your DVLA API key
 * - DVLA_API_URL: DVLA API base URL (default: https://driver-vehicle-licensing.api.gov.uk)
 * - DVLA_UAT_MODE: Set to 'true' for UAT environment testing
 */

import { db } from "./db";
import { driverLicenses, licenseVerifications, licenseAlerts, users } from "../shared/schema";
import { eq, and, desc } from "drizzle-orm";

// DVLA API Configuration
const DVLA_API_KEY = process.env.DVLA_API_KEY || '';
const DVLA_API_URL = process.env.DVLA_UAT_MODE === 'true' 
  ? 'https://uat.driver-vehicle-licensing.api.gov.uk'
  : 'https://driver-vehicle-licensing.api.gov.uk';

// Mock mode for development (when API key not available)
const MOCK_MODE = !DVLA_API_KEY || DVLA_API_KEY === 'MOCK';

/**
 * DVLA API Response Types
 * Based on official DVLA API documentation
 */

export interface DVLAEntitlement {
  categoryCode: string; // e.g., "C", "C+E", "D"
  validFrom: string; // ISO date
  validTo: string; // ISO date
}

export interface DVLAEndorsement {
  offenceCode: string; // e.g., "SP30"
  offenceLiteral: string; // e.g., "Exceeding statutory speed limit"
  offenceDate: string; // ISO date
  convictionDate?: string; // ISO date
  penaltyPoints: number;
  disqualificationPeriod?: number; // months
}

export interface DVLADisqualification {
  disqualificationDate: string; // ISO date
  disqualificationPeriod: number; // months
  disqualificationEndDate: string; // ISO date
  reason: string;
}

export interface DVLADriverData {
  driver: {
    drivingLicenceNumber: string;
    firstNames: string;
    lastName: string;
    dateOfBirth: string; // ISO date
  };
  licence: {
    type: 'Full' | 'Provisional';
    status: 'Valid' | 'Expired' | 'Suspended' | 'Revoked';
    validFrom: string; // ISO date
    validTo: string; // ISO date
  };
  entitlements: DVLAEntitlement[];
  endorsements?: DVLAEndorsement[];
  disqualifications?: DVLADisqualification[];
  cpc?: {
    certificateNumber: string;
    expiryDate: string; // ISO date
  };
  tachograph?: {
    cardNumber: string;
    expiryDate: string; // ISO date
  };
}

export interface DVLAErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

/**
 * Check if DVLA integration is configured
 */
export function isDVLAConfigured(): boolean {
  return !!DVLA_API_KEY && DVLA_API_KEY !== 'MOCK';
}

/**
 * Get DVLA integration status
 */
export function getDVLAStatus() {
  return {
    configured: isDVLAConfigured(),
    mockMode: MOCK_MODE,
    apiUrl: DVLA_API_URL,
    uatMode: process.env.DVLA_UAT_MODE === 'true'
  };
}

/**
 * Verify a driver's license with DVLA
 * 
 * @param licenseNumber - UK driving license number (16 characters)
 * @returns DVLA driver data or null if not found
 */
export async function verifyLicense(licenseNumber: string): Promise<DVLADriverData | null> {
  // Validate license number format
  if (!isValidLicenseNumber(licenseNumber)) {
    throw new Error('Invalid license number format');
  }

  // Mock mode for development
  if (MOCK_MODE) {
    return generateMockLicenseData(licenseNumber);
  }

  try {
    const response = await fetch(`${DVLA_API_URL}/v1/driver-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': DVLA_API_KEY
      },
      body: JSON.stringify({
        drivingLicenceNumber: licenseNumber
      })
    });

    if (response.status === 404) {
      // License not found
      return null;
    }

    if (!response.ok) {
      const error: DVLAErrorResponse = await response.json();
      throw new Error(`DVLA API Error: ${error.error.message}`);
    }

    const data: DVLADriverData = await response.json();
    return data;

  } catch (error) {
    console.error('DVLA API request failed:', error);
    throw error;
  }
}

/**
 * Validate UK driving license number format
 * Format: 5 letters + 6 digits + 2 letters + 2 digits + 1 letter
 * Example: TCAEU610267NO9EK
 */
function isValidLicenseNumber(licenseNumber: string): boolean {
  const pattern = /^[A-Z]{5}\d{6}[A-Z]{2}\d{2}[A-Z]$/;
  return pattern.test(licenseNumber.toUpperCase());
}

/**
 * Calculate total penalty points from endorsements
 */
function calculateTotalPenaltyPoints(endorsements?: DVLAEndorsement[]): number {
  if (!endorsements || endorsements.length === 0) return 0;
  return endorsements.reduce((total, e) => total + e.penaltyPoints, 0);
}

/**
 * Check if driver is currently disqualified
 */
function isCurrentlyDisqualified(disqualifications?: DVLADisqualification[]): boolean {
  if (!disqualifications || disqualifications.length === 0) return false;
  
  const now = new Date();
  return disqualifications.some(d => {
    const endDate = new Date(d.disqualificationEndDate);
    return endDate > now;
  });
}

/**
 * Store or update driver license data in database
 */
export async function storeLicenseData(
  driverId: number,
  companyId: number,
  dvlaData: DVLADriverData
): Promise<number> {
  const totalPoints = calculateTotalPenaltyPoints(dvlaData.endorsements);
  const isDisqualified = isCurrentlyDisqualified(dvlaData.disqualifications);

  const licenseData = {
    driverId,
    companyId,
    licenseNumber: dvlaData.driver.drivingLicenceNumber,
    firstName: dvlaData.driver.firstNames,
    lastName: dvlaData.driver.lastName,
    dateOfBirth: new Date(dvlaData.driver.dateOfBirth),
    licenseType: dvlaData.licence.type,
    licenseStatus: dvlaData.licence.status,
    issueDate: new Date(dvlaData.licence.validFrom),
    expiryDate: new Date(dvlaData.licence.validTo),
    entitlements: dvlaData.entitlements,
    endorsements: dvlaData.endorsements || [],
    totalPenaltyPoints: totalPoints,
    isDisqualified,
    disqualificationDetails: dvlaData.disqualifications || null,
    cpcNumber: dvlaData.cpc?.certificateNumber || null,
    cpcExpiryDate: dvlaData.cpc ? new Date(dvlaData.cpc.expiryDate) : null,
    tachographCardNumber: dvlaData.tachograph?.cardNumber || null,
    tachographExpiryDate: dvlaData.tachograph ? new Date(dvlaData.tachograph.expiryDate) : null,
    lastVerifiedAt: new Date(),
    lastVerificationStatus: 'success',
    nextVerificationDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    rawDvlaResponse: dvlaData,
    updatedAt: new Date()
  };

  // Check if license record exists
  const existing = await db
    .select()
    .from(driverLicenses)
    .where(eq(driverLicenses.driverId, driverId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing record
    await db
      .update(driverLicenses)
      .set(licenseData)
      .where(eq(driverLicenses.driverId, driverId));
    
    return existing[0].id;
  } else {
    // Insert new record
    const result = await db
      .insert(driverLicenses)
      .values(licenseData)
      .returning({ id: driverLicenses.id });
    
    return result[0].id;
  }
}

/**
 * Log a license verification attempt
 */
export async function logVerification(
  driverId: number,
  companyId: number,
  licenseId: number | null,
  status: 'success' | 'failed' | 'error',
  dvlaData: DVLADriverData | null,
  errorMessage: string | null,
  initiatedBy: number | null,
  verificationType: 'manual' | 'automatic' | 'scheduled' = 'manual'
): Promise<number> {
  const verification = {
    driverId,
    licenseId,
    companyId,
    verificationDate: new Date(),
    verificationType,
    verificationStatus: status,
    licenseValid: dvlaData?.licence.status === 'Valid' || false,
    licenseStatus: dvlaData?.licence.status || null,
    penaltyPoints: dvlaData ? calculateTotalPenaltyPoints(dvlaData.endorsements) : null,
    isDisqualified: dvlaData ? isCurrentlyDisqualified(dvlaData.disqualifications) : false,
    changesDetected: false, // TODO: Implement change detection
    changesSummary: null,
    dvlaResponse: dvlaData,
    errorMessage,
    initiatedBy
  };

  const result = await db
    .insert(licenseVerifications)
    .values(verification)
    .returning({ id: licenseVerifications.id });

  return result[0].id;
}

/**
 * Create license alerts based on verification results
 */
export async function createLicenseAlerts(
  driverId: number,
  companyId: number,
  licenseId: number,
  dvlaData: DVLADriverData,
  verificationId: number
): Promise<void> {
  const alerts: any[] = [];

  // Check license expiry (warn 60 days before)
  const expiryDate = new Date(dvlaData.licence.validTo);
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry <= 60 && daysUntilExpiry > 0) {
    alerts.push({
      driverId,
      licenseId,
      companyId,
      alertType: 'expiry_warning',
      severity: daysUntilExpiry <= 30 ? 'critical' : 'warning',
      title: 'License Expiring Soon',
      message: `Driver license expires in ${daysUntilExpiry} days on ${expiryDate.toLocaleDateString('en-GB')}`,
      status: 'active',
      relatedVerificationId: verificationId,
      expiryDate
    });
  } else if (daysUntilExpiry <= 0) {
    alerts.push({
      driverId,
      licenseId,
      companyId,
      alertType: 'expiry_warning',
      severity: 'critical',
      title: 'License Expired',
      message: `Driver license expired on ${expiryDate.toLocaleDateString('en-GB')}`,
      status: 'active',
      relatedVerificationId: verificationId,
      expiryDate
    });
  }

  // Check penalty points (warn at 9+ points, critical at 12+)
  const totalPoints = calculateTotalPenaltyPoints(dvlaData.endorsements);
  if (totalPoints >= 9) {
    alerts.push({
      driverId,
      licenseId,
      companyId,
      alertType: 'penalty_points',
      severity: totalPoints >= 12 ? 'critical' : 'warning',
      title: `${totalPoints} Penalty Points`,
      message: `Driver has ${totalPoints} penalty points on their license${totalPoints >= 12 ? ' (disqualification threshold reached)' : ''}`,
      status: 'active',
      relatedVerificationId: verificationId,
      penaltyPoints: totalPoints
    });
  }

  // Check disqualification
  if (isCurrentlyDisqualified(dvlaData.disqualifications)) {
    const activeDisqualification = dvlaData.disqualifications!.find(d => 
      new Date(d.disqualificationEndDate) > new Date()
    );
    
    alerts.push({
      driverId,
      licenseId,
      companyId,
      alertType: 'disqualification',
      severity: 'critical',
      title: 'Driver Disqualified',
      message: `Driver is currently disqualified until ${new Date(activeDisqualification!.disqualificationEndDate).toLocaleDateString('en-GB')}. Reason: ${activeDisqualification!.reason}`,
      status: 'active',
      relatedVerificationId: verificationId
    });
  }

  // Check invalid license status
  if (dvlaData.licence.status !== 'Valid') {
    alerts.push({
      driverId,
      licenseId,
      companyId,
      alertType: 'invalid_license',
      severity: 'critical',
      title: 'Invalid License Status',
      message: `Driver license status is ${dvlaData.licence.status}`,
      status: 'active',
      relatedVerificationId: verificationId
    });
  }

  // Insert all alerts
  if (alerts.length > 0) {
    await db.insert(licenseAlerts).values(alerts);
  }
}

/**
 * Perform complete license verification workflow
 * 
 * This is the main function to call for verifying a driver's license.
 * It handles:
 * 1. Calling DVLA API
 * 2. Storing license data
 * 3. Logging verification
 * 4. Creating alerts
 */
export async function performLicenseVerification(
  driverId: number,
  companyId: number,
  licenseNumber: string,
  initiatedBy: number | null = null,
  verificationType: 'manual' | 'automatic' | 'scheduled' = 'manual'
): Promise<{
  success: boolean;
  licenseId: number | null;
  verificationId: number;
  dvlaData: DVLADriverData | null;
  error: string | null;
}> {
  try {
    // Call DVLA API
    const dvlaData = await verifyLicense(licenseNumber);

    if (!dvlaData) {
      // License not found
      const verificationId = await logVerification(
        driverId,
        companyId,
        null,
        'failed',
        null,
        'License not found in DVLA database',
        initiatedBy,
        verificationType
      );

      return {
        success: false,
        licenseId: null,
        verificationId,
        dvlaData: null,
        error: 'License not found in DVLA database'
      };
    }

    // Store license data
    const licenseId = await storeLicenseData(driverId, companyId, dvlaData);

    // Log verification
    const verificationId = await logVerification(
      driverId,
      companyId,
      licenseId,
      'success',
      dvlaData,
      null,
      initiatedBy,
      verificationType
    );

    // Create alerts
    await createLicenseAlerts(driverId, companyId, licenseId, dvlaData, verificationId);

    return {
      success: true,
      licenseId,
      verificationId,
      dvlaData,
      error: null
    };

  } catch (error) {
    // Log error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const verificationId = await logVerification(
      driverId,
      companyId,
      null,
      'error',
      null,
      errorMessage,
      initiatedBy,
      verificationType
    );

    return {
      success: false,
      licenseId: null,
      verificationId,
      dvlaData: null,
      error: errorMessage
    };
  }
}

/**
 * Generate mock license data for development/testing
 */
function generateMockLicenseData(licenseNumber: string): DVLADriverData {
  // Generate deterministic mock data based on license number
  const hash = licenseNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hasEndorsements = hash % 3 === 0;
  const isDisqualified = hash % 10 === 0;
  const penaltyPoints = hasEndorsements ? (hash % 12) : 0;

  return {
    driver: {
      drivingLicenceNumber: licenseNumber,
      firstNames: 'JOHN',
      lastName: 'SMITH',
      dateOfBirth: '1980-05-15'
    },
    licence: {
      type: 'Full',
      status: isDisqualified ? 'Suspended' : 'Valid',
      validFrom: '2000-05-15',
      validTo: '2030-05-15'
    },
    entitlements: [
      { categoryCode: 'B', validFrom: '2000-05-15', validTo: '2030-05-15' },
      { categoryCode: 'C', validFrom: '2005-03-20', validTo: '2030-05-15' },
      { categoryCode: 'C+E', validFrom: '2006-07-10', validTo: '2030-05-15' }
    ],
    endorsements: hasEndorsements ? [
      {
        offenceCode: 'SP30',
        offenceLiteral: 'Exceeding statutory speed limit on a public road',
        offenceDate: '2022-04-28',
        convictionDate: '2022-06-15',
        penaltyPoints: penaltyPoints
      }
    ] : [],
    disqualifications: isDisqualified ? [
      {
        disqualificationDate: '2024-01-01',
        disqualificationPeriod: 6,
        disqualificationEndDate: '2024-07-01',
        reason: 'Totting up (12 or more penalty points)'
      }
    ] : [],
    cpc: {
      certificateNumber: 'CPC123456789',
      expiryDate: '2028-12-31'
    },
    tachograph: {
      cardNumber: 'TACH987654321',
      expiryDate: '2029-06-30'
    }
  };
}

/**
 * Get license data for a driver
 */
export async function getDriverLicense(driverId: number) {
  const result = await db
    .select()
    .from(driverLicenses)
    .where(eq(driverLicenses.driverId, driverId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get verification history for a driver
 */
export async function getVerificationHistory(driverId: number, limit: number = 10) {
  return await db
    .select()
    .from(licenseVerifications)
    .where(eq(licenseVerifications.driverId, driverId))
    .orderBy(desc(licenseVerifications.verificationDate))
    .limit(limit);
}

/**
 * Get active license alerts for a driver
 */
export async function getActiveLicenseAlerts(driverId: number) {
  return await db
    .select()
    .from(licenseAlerts)
    .where(
      and(
        eq(licenseAlerts.driverId, driverId),
        eq(licenseAlerts.status, 'active')
      )
    )
    .orderBy(desc(licenseAlerts.createdAt));
}

/**
 * Get all active license alerts for a company
 */
export async function getCompanyLicenseAlerts(companyId: number) {
  return await db
    .select()
    .from(licenseAlerts)
    .where(
      and(
        eq(licenseAlerts.companyId, companyId),
        eq(licenseAlerts.status, 'active')
      )
    )
    .orderBy(desc(licenseAlerts.createdAt));
}

/**
 * Acknowledge a license alert
 */
export async function acknowledgeLicenseAlert(alertId: number, acknowledgedBy: number) {
  await db
    .update(licenseAlerts)
    .set({
      status: 'acknowledged',
      acknowledgedBy,
      acknowledgedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(licenseAlerts.id, alertId));
}

/**
 * Resolve a license alert
 */
export async function resolveLicenseAlert(alertId: number, resolutionNotes: string) {
  await db
    .update(licenseAlerts)
    .set({
      status: 'resolved',
      resolvedAt: new Date(),
      resolutionNotes,
      updatedAt: new Date()
    })
    .where(eq(licenseAlerts.id, alertId));
}
