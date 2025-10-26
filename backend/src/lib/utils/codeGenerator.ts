/**
 * 4-Digit Table Code Generator
 * Generates unique 4-digit codes for tables
 */

import { Firestore } from 'firebase-admin/firestore';

/**
 * Generate a unique 4-digit table code
 * @param db - Firestore instance
 * @param maxAttempts - Maximum number of attempts to generate unique code
 * @returns Promise<string> - 4-digit code (e.g., "1234")
 * @throws Error if unable to generate unique code after maxAttempts
 */
export async function generateTableCode(
  db: Firestore,
  maxAttempts = 10,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate random 4-digit code (1000-9999)
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Check if code is already in use
    const tableDoc = await db.collection('tables').doc(code).get();

    if (!tableDoc.exists) {
      return code;
    }
  }

  throw new Error(
    `Unable to generate unique table code after ${maxAttempts} attempts`,
  );
}

/**
 * Validate table code format
 * @param code - Code to validate
 * @returns boolean - true if valid 4-digit code
 */
export function isValidTableCode(code: string): boolean {
  return /^\d{4}$/.test(code);
}

/**
 * Check if table code exists
 * @param db - Firestore instance
 * @param code - Table code to check
 * @returns Promise<boolean> - true if code exists
 */
export async function tableCodeExists(
  db: Firestore,
  code: string,
): Promise<boolean> {
  if (!isValidTableCode(code)) {
    return false;
  }

  const tableDoc = await db.collection('tables').doc(code).get();
  return tableDoc.exists;
}
