import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  generateCsrfToken,
  verifyCsrfToken,
  evaluateRouteAccess,
  canStudentAccessFeedback,
  validateFeedbackInput,
  validateFoodItemInput,
  computeFoodRatingAnalytics,
} from './messmateLogic';

test('password hashing and verification works and rejects wrong passwords', () => {
  const hash = hashPassword('Student@123');
  assert.ok(!hash.includes('Student@123'), 'Hash must never contain plaintext password');
  assert.equal(verifyPassword('Student@123', hash), true);
  assert.equal(verifyPassword('WrongPassword', hash), false);
  assert.equal(verifyPassword('', hash), false);
});

test('CSRF token generation and constant-time verification', () => {
  const token = generateCsrfToken();
  assert.ok(token.length >= 24);
  assert.equal(verifyCsrfToken(token, token), true);
  assert.equal(verifyCsrfToken(token, 'tampered_token'), false);
  assert.equal(verifyCsrfToken(token, undefined), false);
});

test('role-based access control blocks students from admin routes and unauthenticated users from protected pages', () => {
  const unauthDecision = evaluateRouteAccess('/admin/dashboard', null);
  assert.equal(unauthDecision.allowed, false);
  assert.equal(unauthDecision.statusCode, 401);

  const studentSession = { userId: 3, role: 'STUDENT' as const, isActive: true };
  const studentAdminAttempt = evaluateRouteAccess('/admin/dashboard', studentSession);
  assert.equal(studentAdminAttempt.allowed, false);
  assert.equal(studentAdminAttempt.statusCode, 403);

  const studentApiAttempt = evaluateRouteAccess('/api/admin/menu', studentSession);
  assert.equal(studentApiAttempt.allowed, false);
  assert.equal(studentApiAttempt.statusCode, 403);

  const studentOwnRoute = evaluateRouteAccess('/student/dashboard', studentSession);
  assert.equal(studentOwnRoute.allowed, true);
  assert.equal(studentOwnRoute.statusCode, 200);

  const adminSession = { userId: 1, role: 'ADMIN' as const, isActive: true };
  const adminRoute = evaluateRouteAccess('/admin/reports', adminSession);
  assert.equal(adminRoute.allowed, true);
  assert.equal(adminRoute.statusCode, 200);
});

test('student ownership check allows only the owning student', () => {
  assert.equal(canStudentAccessFeedback(3, 3), true);
  assert.equal(canStudentAccessFeedback(3, 4), false);
  assert.equal(canStudentAccessFeedback(-1, -1), false);
});

test('validateFeedbackInput accepts valid ratings 1..5 and rejects decimals, out-of-range ratings, future dates, and inactive food items', () => {
  const activeFoods = new Set([1, 2, 4, 5]);
  const validResult = validateFeedbackInput(
    {
      foodId: 1,
      mealCategory: 'BREAKFAST',
      serviceDate: '2026-10-25',
      tasteRating: 5,
      qualityRating: 4,
      quantityRating: 4,
      hygieneRating: 5,
      overallRating: 5,
      complaintCategory: 'NONE',
      comments: 'Fresh and hot dosa!',
      suggestions: 'Keep coconut chutney chilled.',
    },
    activeFoods,
    '2026-10-26'
  );
  assert.equal(validResult.valid, true);
  assert.equal(validResult.errors.length, 0);
  assert.equal(validResult.sanitized?.complaintStatus, 'NONE');

  // Test rejection of ratings outside 1..5, decimal ratings, and inactive food ID 12
  const invalidResult = validateFeedbackInput(
    {
      foodId: 12, // inactive
      mealCategory: 'DINNER',
      serviceDate: '2026-10-29', // future date relative to 2026-10-26
      tasteRating: 0,
      qualityRating: 6,
      quantityRating: '3.5',
      hygieneRating: -2,
      overallRating: 'five',
      complaintCategory: 'TASTE',
    },
    activeFoods,
    '2026-10-26'
  );
  assert.equal(invalidResult.valid, false);
  assert.ok(invalidResult.errors.length >= 6);
});

test('validateFoodItemInput enforces allowlist and trims whitespace', () => {
  const ok = validateFoodItemInput({
    name: '  Masala Dosa  ',
    description: '  Crisp rice crepe  ',
    mealCategory: 'breakfast',
    isAvailable: true,
  });
  assert.equal(ok.valid, true);
  assert.equal(ok.sanitized?.name, 'Masala Dosa');
  assert.equal(ok.sanitized?.mealCategory, 'BREAKFAST');

  const sqlInjectionAttempt = validateFoodItemInput({
    name: 'Dosa',
    description: 'Test',
    mealCategory: "BREAKFAST' OR '1'='1",
  });
  assert.equal(sqlInjectionAttempt.valid, false);
});

test('computeFoodRatingAnalytics excludes soft-deleted feedback and never flags 0-sample items as low-rated', () => {
  const foods = [
    { foodId: 1, name: 'Masala Dosa', mealCategory: 'BREAKFAST' as const, isActive: true },
    { foodId: 2, name: 'Chole Bhature', mealCategory: 'DINNER' as const, isActive: true },
    { foodId: 3, name: 'New Unrated Dish', mealCategory: 'SNACKS' as const, isActive: true },
  ];
  const feedbacks = [
    { foodId: 1, tasteRating: 5, qualityRating: 5, quantityRating: 4, hygieneRating: 5, overallRating: 5, isDeleted: false },
    { foodId: 1, tasteRating: 1, qualityRating: 1, quantityRating: 1, hygieneRating: 1, overallRating: 1, isDeleted: true }, // soft-deleted!
    { foodId: 2, tasteRating: 2, qualityRating: 2, quantityRating: 3, hygieneRating: 3, overallRating: 2, isDeleted: false },
    { foodId: 2, tasteRating: 2, qualityRating: 3, quantityRating: 2, hygieneRating: 3, overallRating: 2, isDeleted: false },
  ];

  const report = computeFoodRatingAnalytics(foods, feedbacks, 3.0);
  const dosaReport = report.find((r) => r.foodId === 1)!;
  assert.equal(dosaReport.sampleCount, 1, 'Soft-deleted record must be excluded');
  assert.equal(dosaReport.avgOverall, 5);
  assert.equal(dosaReport.isLowRated, false);

  const choleReport = report.find((r) => r.foodId === 2)!;
  assert.equal(choleReport.sampleCount, 2);
  assert.equal(choleReport.avgOverall, 2);
  assert.equal(choleReport.isLowRated, true);

  const unratedReport = report.find((r) => r.foodId === 3)!;
  assert.equal(unratedReport.sampleCount, 0);
  assert.equal(unratedReport.avgOverall, null);
  assert.equal(unratedReport.isLowRated, false, 'Items with 0 feedback must not be flagged as low-rated');
});
