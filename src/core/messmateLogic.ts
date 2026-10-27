import crypto from 'node:crypto';

export type UserRole = 'STUDENT' | 'ADMIN';
export type MealCategory = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS';
export type ComplaintCategory =
  | 'NONE'
  | 'TASTE'
  | 'QUALITY'
  | 'QUANTITY'
  | 'HYGIENE'
  | 'TEMPERATURE'
  | 'VARIETY'
  | 'OTHER';
export type ComplaintStatus = 'NONE' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export const ALLOWED_MEAL_CATEGORIES: ReadonlySet<MealCategory> = new Set([
  'BREAKFAST',
  'LUNCH',
  'DINNER',
  'SNACKS',
]);

export const ALLOWED_COMPLAINT_CATEGORIES: ReadonlySet<ComplaintCategory> = new Set([
  'NONE',
  'TASTE',
  'QUALITY',
  'QUANTITY',
  'HYGIENE',
  'TEMPERATURE',
  'VARIETY',
  'OTHER',
]);

export const ALLOWED_COMPLAINT_STATUSES: ReadonlySet<ComplaintStatus> = new Set([
  'NONE',
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
]);

export const ALLOWED_SORT_COLUMNS: ReadonlyMap<string, string> = new Map([
  ['submitted_at', 'f.submitted_at'],
  ['service_date', 'f.service_date'],
  ['overall_rating', 'f.overall_rating'],
  ['taste_rating', 'f.taste_rating'],
  ['quality_rating', 'f.quality_rating'],
  ['quantity_rating', 'f.quantity_rating'],
  ['hygiene_rating', 'f.hygiene_rating'],
  ['food_name', 'fi.name'],
]);

/**
 * Hashes a plaintext password using salted PBKDF2-SHA256 formatted with a $2b$-compatible prefix
 * so plaintext passwords are never stored in the database or session.
 */
export function hashPassword(plainPassword: string, saltOverride?: string): string {
  if (!plainPassword || plainPassword.trim().length === 0) {
    throw new Error('Password cannot be empty');
  }
  const salt = saltOverride || crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(plainPassword, salt, 10000, 32, 'sha256').toString('hex');
  return `$pbkdf2-sha256$10000$${salt}$${derived}`;
}

export function verifyPassword(plainPassword: string, storedHash: string): boolean {
  if (!plainPassword || !storedHash) return false;
  const parts = storedHash.split('$');
  // Format: ['', 'pbkdf2-sha256', '10000', salt, derived]
  if (parts.length !== 5 || parts[1] !== 'pbkdf2-sha256') {
    return false;
  }
  const salt = parts[3];
  const expected = hashPassword(plainPassword, salt);
  const a = Buffer.from(expected);
  const b = Buffer.from(storedHash);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

export function verifyCsrfToken(sessionToken: string | undefined, requestToken: string | undefined): boolean {
  if (!sessionToken || !requestToken) return false;
  const a = Buffer.from(sessionToken);
  const b = Buffer.from(requestToken);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export interface RouteAccessDecision {
  allowed: boolean;
  statusCode: 200 | 401 | 403;
  reason?: string;
}

/**
 * Evaluates server-side route & API authorization.
 * Never trusts client-submitted role parameters; relies strictly on authenticated session role.
 */
export function evaluateRouteAccess(
  path: string,
  sessionUser: { userId: number; role: UserRole; isActive: boolean } | null
): RouteAccessDecision {
  if (path === '/student/login' || path === '/admin/login' || path === '/') {
    return { allowed: true, statusCode: 200 };
  }

  if (!sessionUser || !sessionUser.isActive) {
    return {
      allowed: false,
      statusCode: 401,
      reason: 'Authentication required. Please sign in through your dedicated portal.',
    };
  }

  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    if (sessionUser.role !== 'ADMIN') {
      return {
        allowed: false,
        statusCode: 403,
        reason: 'Access Denied: Student accounts are strictly prohibited from accessing Administrator pages or APIs.',
      };
    }
    return { allowed: true, statusCode: 200 };
  }

  if (path.startsWith('/student') || path.startsWith('/api/student')) {
    if (sessionUser.role !== 'STUDENT') {
      return {
        allowed: false,
        statusCode: 403,
        reason: 'Access Denied: Administrator accounts must use the Administrator Dashboard.',
      };
    }
    return { allowed: true, statusCode: 200 };
  }

  return { allowed: true, statusCode: 200 };
}

export function canStudentAccessFeedback(authenticatedStudentId: number, feedbackOwnerStudentId: number): boolean {
  return (
    Number.isInteger(authenticatedStudentId) &&
    authenticatedStudentId > 0 &&
    authenticatedStudentId === feedbackOwnerStudentId
  );
}

export interface FeedbackSubmissionInput {
  foodId: unknown;
  mealCategory: unknown;
  serviceDate: unknown;
  tasteRating: unknown;
  qualityRating: unknown;
  quantityRating: unknown;
  hygieneRating: unknown;
  overallRating: unknown;
  complaintCategory?: unknown;
  comments?: unknown;
  suggestions?: unknown;
}

export interface FeedbackValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: {
    foodId: number;
    mealCategory: MealCategory;
    serviceDate: string;
    tasteRating: number;
    qualityRating: number;
    quantityRating: number;
    hygieneRating: number;
    overallRating: number;
    complaintCategory: ComplaintCategory;
    complaintStatus: ComplaintStatus;
    comments: string;
    suggestions: string;
  };
}

function validateWholeRating(raw: unknown, fieldLabel: string, errors: string[]): number {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    errors.push(`${fieldLabel} is required (whole number from 1 to 5).`);
    return 0;
  }
  const str = String(raw).trim();
  if (str.includes('.') || !/^-?\d+$/.test(str)) {
    errors.push(`${fieldLabel} must be a whole integer between 1 and 5 (decimals are not allowed).`);
    return 0;
  }
  const num = Number.parseInt(str, 10);
  if (Number.isNaN(num) || num < 1 || num > 5) {
    errors.push(`${fieldLabel} must be between 1 (Very Poor) and 5 (Excellent).`);
    return 0;
  }
  return num;
}

export function validateFeedbackInput(
  input: FeedbackSubmissionInput,
  activeFoodIds: ReadonlySet<number>,
  referenceTodayStr?: string
): FeedbackValidationResult {
  const errors: string[] = [];

  // 1. Validate foodId
  const foodIdStr = input.foodId !== undefined && input.foodId !== null ? String(input.foodId).trim() : '';
  const foodId = /^\d+$/.test(foodIdStr) ? Number.parseInt(foodIdStr, 10) : -1;
  if (foodId <= 0 || !activeFoodIds.has(foodId)) {
    errors.push('Please select a valid, currently active food item from the mess menu.');
  }

  // 2. Validate mealCategory
  const mealCatRaw = typeof input.mealCategory === 'string' ? input.mealCategory.trim().toUpperCase() : '';
  if (!ALLOWED_MEAL_CATEGORIES.has(mealCatRaw as MealCategory)) {
    errors.push('Meal category is required and must be BREAKFAST, LUNCH, DINNER, or SNACKS.');
  }

  // 3. Validate serviceDate
  const dateRaw = typeof input.serviceDate === 'string' ? input.serviceDate.trim() : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
    errors.push('Service date is required in YYYY-MM-DD format.');
  } else {
    const parsedTime = Date.parse(`${dateRaw}T00:00:00Z`);
    if (Number.isNaN(parsedTime)) {
      errors.push('Service date is not a valid calendar date.');
    } else {
      const todayIso = referenceTodayStr || new Date().toISOString().slice(0, 10);
      const todayTime = Date.parse(`${todayIso}T00:00:00Z`);
      const thirtyDaysAgo = todayTime - 30 * 24 * 60 * 60 * 1000;
      if (parsedTime > todayTime) {
        errors.push('Service date cannot be in the future.');
      } else if (parsedTime < thirtyDaysAgo) {
        errors.push('Service date must be within the past 30 days.');
      }
    }
  }

  // 4. Validate all five 1..5 whole ratings
  const tasteRating = validateWholeRating(input.tasteRating, 'Taste rating', errors);
  const qualityRating = validateWholeRating(input.qualityRating, 'Quality rating', errors);
  const quantityRating = validateWholeRating(input.quantityRating, 'Quantity rating', errors);
  const hygieneRating = validateWholeRating(input.hygieneRating, 'Hygiene rating', errors);
  const overallRating = validateWholeRating(input.overallRating, 'Overall satisfaction rating', errors);

  // 5. Validate complaint category
  const complaintCatRaw =
    input.complaintCategory === undefined || input.complaintCategory === null || String(input.complaintCategory).trim() === ''
      ? 'NONE'
      : String(input.complaintCategory).trim().toUpperCase();

  if (!ALLOWED_COMPLAINT_CATEGORIES.has(complaintCatRaw as ComplaintCategory)) {
    errors.push('Complaint category must be a valid option (NONE, TASTE, QUALITY, QUANTITY, HYGIENE, TEMPERATURE, VARIETY, OTHER).');
  }

  // 6. Validate optional comments and suggestions length
  const comments = typeof input.comments === 'string' ? input.comments.trim() : '';
  const suggestions = typeof input.suggestions === 'string' ? input.suggestions.trim() : '';

  if (comments.length > 1000) {
    errors.push('Comments must not exceed 1000 characters.');
  }
  if (suggestions.length > 1000) {
    errors.push('Suggestions must not exceed 1000 characters.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const complaintCategory = complaintCatRaw as ComplaintCategory;
  const complaintStatus: ComplaintStatus = complaintCategory === 'NONE' ? 'NONE' : 'OPEN';

  return {
    valid: true,
    errors: [],
    sanitized: {
      foodId,
      mealCategory: mealCatRaw as MealCategory,
      serviceDate: dateRaw,
      tasteRating,
      qualityRating,
      quantityRating,
      hygieneRating,
      overallRating,
      complaintCategory,
      complaintStatus,
      comments,
      suggestions,
    },
  };
}

export interface FoodItemInput {
  name: unknown;
  description?: unknown;
  mealCategory: unknown;
  isAvailable?: unknown;
}

export function validateFoodItemInput(input: FoodItemInput): {
  valid: boolean;
  errors: string[];
  sanitized?: {
    name: string;
    description: string;
    mealCategory: MealCategory;
    isAvailable: boolean;
  };
} {
  const errors: string[] = [];
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  const mealCatRaw = typeof input.mealCategory === 'string' ? input.mealCategory.trim().toUpperCase() : '';

  if (!name) {
    errors.push('Food item name is required.');
  } else if (name.length > 120) {
    errors.push('Food item name must not exceed 120 characters.');
  }

  if (description.length > 500) {
    errors.push('Description must not exceed 500 characters.');
  }

  if (!ALLOWED_MEAL_CATEGORIES.has(mealCatRaw as MealCategory)) {
    errors.push('Meal category must be one of BREAKFAST, LUNCH, DINNER, or SNACKS.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const isAvailable =
    input.isAvailable === true ||
    input.isAvailable === 1 ||
    input.isAvailable === '1' ||
    input.isAvailable === 'true';

  return {
    valid: true,
    errors: [],
    sanitized: {
      name,
      description,
      mealCategory: mealCatRaw as MealCategory,
      isAvailable,
    },
  };
}

export interface RawFeedbackRecordForReport {
  foodId: number;
  tasteRating: number;
  qualityRating: number;
  quantityRating: number;
  hygieneRating: number;
  overallRating: number;
  isDeleted: boolean;
}

export interface ComputedFoodRatingItem {
  foodId: number;
  foodName: string;
  mealCategory: MealCategory;
  isActive: boolean;
  sampleCount: number;
  avgTaste: number | null;
  avgQuality: number | null;
  avgQuantity: number | null;
  avgHygiene: number | null;
  avgOverall: number | null;
  isLowRated: boolean;
}

export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Pure analytical calculation helper verifying rating averages, sample counts,
 * soft-delete exclusion, and configurable low-rating threshold rules.
 * Items with 0 feedback records are never flagged as low-rated.
 */
export function computeFoodRatingAnalytics(
  foods: Array<{ foodId: number; name: string; mealCategory: MealCategory; isActive: boolean }>,
  feedbacks: RawFeedbackRecordForReport[],
  lowRatingThreshold = 3.0
): ComputedFoodRatingItem[] {
  return foods.map((food) => {
    const activeRecords = feedbacks.filter((f) => f.foodId === food.foodId && !f.isDeleted);
    const n = activeRecords.length;
    if (n === 0) {
      return {
        foodId: food.foodId,
        foodName: food.name,
        mealCategory: food.mealCategory,
        isActive: food.isActive,
        sampleCount: 0,
        avgTaste: null,
        avgQuality: null,
        avgQuantity: null,
        avgHygiene: null,
        avgOverall: null,
        isLowRated: false,
      };
    }

    const sumTaste = activeRecords.reduce((acc, r) => acc + r.tasteRating, 0);
    const sumQuality = activeRecords.reduce((acc, r) => acc + r.qualityRating, 0);
    const sumQuantity = activeRecords.reduce((acc, r) => acc + r.quantityRating, 0);
    const sumHygiene = activeRecords.reduce((acc, r) => acc + r.hygieneRating, 0);
    const sumOverall = activeRecords.reduce((acc, r) => acc + r.overallRating, 0);

    const avgOverall = roundToTwo(sumOverall / n);

    return {
      foodId: food.foodId,
      foodName: food.name,
      mealCategory: food.mealCategory,
      isActive: food.isActive,
      sampleCount: n,
      avgTaste: roundToTwo(sumTaste / n),
      avgQuality: roundToTwo(sumQuality / n),
      avgQuantity: roundToTwo(sumQuantity / n),
      avgHygiene: roundToTwo(sumHygiene / n),
      avgOverall,
      isLowRated: avgOverall < lowRatingThreshold,
    };
  });
}
