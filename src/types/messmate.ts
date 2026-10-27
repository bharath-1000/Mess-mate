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

export interface AuthUser {
  userId: number;
  username: string;
  displayName: string;
  role: UserRole;
}

export interface FoodItem {
  foodId: number;
  name: string;
  description: string | null;
  mealCategory: MealCategory;
  isAvailable: boolean | number;
  isActive?: boolean | number;
  updatedAt?: string;
  updatedByAdminName?: string | null;
  feedbackCount?: number;
}

export interface FeedbackRecord {
  feedbackId: number;
  studentId?: number;
  studentAnonRef?: string;
  foodId: number;
  foodName: string;
  mealCategory: MealCategory;
  serviceDate: string;
  tasteRating: number;
  qualityRating: number;
  quantityRating: number;
  hygieneRating: number;
  overallRating: number;
  comments: string | null;
  suggestions: string | null;
  complaintCategory: ComplaintCategory;
  complaintStatus: ComplaintStatus;
  submittedAt: string;
  updatedAt?: string;
}

export interface FoodRatingReportItem {
  foodId: number;
  foodName: string;
  mealCategory: MealCategory;
  isActive: boolean;
  isAvailable: boolean;
  sampleCount: number;
  avgTaste: number | null;
  avgQuality: number | null;
  avgQuantity: number | null;
  avgHygiene: number | null;
  avgOverall: number | null;
  complaintCount: number;
  unresolvedCount: number;
  isLowRated: boolean;
}

export interface ComplaintCategorySummary {
  category: ComplaintCategory;
  count?: number;
  totalCount?: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
}

export interface ImprovementActionRecord {
  actionId: number;
  feedbackId: number;
  foodName: string;
  mealCategory: MealCategory;
  serviceDate: string;
  complaintCategory: ComplaintCategory;
  previousStatus: ComplaintStatus;
  newStatus: ComplaintStatus;
  actionText: string;
  createdAt: string;
  adminDisplayName: string;
}

export interface AuditLogRecord {
  auditId: number;
  actionType: string;
  entityType: string;
  entityId: number;
  summary: string;
  createdAt: string;
  adminDisplayName: string;
}

export interface DeliverableFile {
  path: string;
  category: string;
  size: number;
  content: string;
}

export interface SocialStudioResponse {
  idea: string;
  tone: string;
  imageSize: '1K' | '2K' | '4K';
  textModel: string;
  imageModel: string;
  posts: {
    linkedin: {
      headline: string;
      body: string;
      callToAction: string;
      imagePrompt: string;
      aspectRatio: string;
      imageUrl: string;
    };
    twitter: {
      headline: string;
      body: string;
      hashtags: string[];
      imagePrompt: string;
      aspectRatio: string;
      imageUrl: string;
    };
    instagram: {
      headline: string;
      body: string;
      hashtags: string[];
      imagePrompt: string;
      aspectRatio: string;
      imageUrl: string;
    };
  };
}
