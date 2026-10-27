import React, { useState, useEffect } from 'react';
import {
  Utensils,
  MessageSquarePlus,
  History,
  CheckCircle2,
  AlertTriangle,
  Lock,
  LogOut,
  Eye,
  X,
} from 'lucide-react';
import {
  AuthUser,
  FoodItem,
  FeedbackRecord,
  MealCategory,
  ComplaintCategory,
} from '../types/messmate';
import { apiFetch } from '../utils/api';

const MEAL_CATEGORIES: MealCategory[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS'];
const RATING_SCALE = [
  { value: 1, label: '1 · Very Poor' },
  { value: 2, label: '2 · Poor' },
  { value: 3, label: '3 · Fair' },
  { value: 4, label: '4 · Good' },
  { value: 5, label: '5 · Excellent' },
];

export function StudentLoginView({
  onLoginSuccess,
  onNavigate,
}: {
  onLoginSuccess: (user: AuthUser, sessionId: string, csrfToken: string) => void;
  onNavigate: (route: string) => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('Please enter both your student username and password.');
      return;
    }
    setSubmitting(true);
    const res = await apiFetch<{
      authenticated?: boolean;
      user?: AuthUser;
      sessionId?: string;
      csrfToken?: string;
      error?: string;
    }>('/api/auth/student/login', {
      method: 'POST',
      body: JSON.stringify({ username: username.trim(), password }),
    });
    setSubmitting(false);

    if (!res.ok || !res.data.authenticated || !res.data.user) {
      setError(res.data.error || 'Invalid username or password.');
      return;
    }
    onLoginSuccess(res.data.user, res.data.sessionId || '', res.data.csrfToken || '');
  }

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="bg-white border border-slate-200 rounded-lg p-8">
        <div className="mb-6">
          <p className="text-xs font-medium text-slate-500">
            Student Authentication Portal · /student/login
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Student Login</h1>
          <p className="text-sm text-slate-600 mt-1">
            Sign in with your active Student account to view today&apos;s mess menu, submit meal ratings, and review your personal feedback history.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="student-username" className="block text-sm font-medium text-slate-800 mb-1">
              Student Username
            </label>
            <input
              id="student-username"
              name="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. aravind.k"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label htmlFor="student-password" className="block text-sm font-medium text-slate-800 mb-1">
              Password
            </label>
            <input
              id="student-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Verifying Student Credentials...' : 'Sign In to Student Portal'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-700 mb-2">
            Development Demo Student Accounts (from database/seed.sql)
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setUsername('aravind.k');
                setPassword('Student@123');
                setError(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Fill Aravind (aravind.k)
            </button>
            <button
              type="button"
              onClick={() => {
                setUsername('priya.s');
                setPassword('Student@123');
                setError(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Fill Priya (priya.s)
            </button>
            <button
              type="button"
              onClick={() => {
                setUsername('rohan.m');
                setPassword('Student@123');
                setError(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Fill Rohan (rohan.m)
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Are you a Mess Warden or Supervisor?</span>
            <button
              type="button"
              onClick={() => onNavigate('/admin/login')}
              className="font-medium text-slate-800 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Go to Administrator Login →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudentPortalWorkspace({
  user,
  activeSubRoute,
  onNavigate,
  onLogout,
}: {
  user: AuthUser;
  activeSubRoute: 'dashboard' | 'menu' | 'feedback-new' | 'feedback-history';
  onNavigate: (route: string) => void;
  onLogout: () => void;
}) {
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [myFeedback, setMyFeedback] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'ALL' | MealCategory>('ALL');
  const [detailRecord, setDetailRecord] = useState<FeedbackRecord | null>(null);

  // Feedback Form State (preserved across recoverable validation errors)
  const [foodId, setFoodId] = useState<string>('');
  const [mealCategory, setMealCategory] = useState<MealCategory>('BREAKFAST');
  const [serviceDate, setServiceDate] = useState<string>('2026-10-26');
  const [tasteRating, setTasteRating] = useState<number>(5);
  const [qualityRating, setQualityRating] = useState<number>(4);
  const [quantityRating, setQuantityRating] = useState<number>(4);
  const [hygieneRating, setHygieneRating] = useState<number>(5);
  const [overallRating, setOverallRating] = useState<number>(5);
  const [complaintCategory, setComplaintCategory] = useState<ComplaintCategory>('NONE');
  const [comments, setComments] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  async function loadStudentData() {
    setLoading(true);
    const res = await apiFetch<{
      menuItems?: FoodItem[];
      myFeedback?: FeedbackRecord[];
      error?: string;
    }>('/api/student/dashboard');
    setLoading(false);
    if (res.ok && res.data.menuItems) {
      setMenuItems(res.data.menuItems);
      setMyFeedback(res.data.myFeedback || []);
      if (!foodId && res.data.menuItems.length > 0) {
        const firstAvail = res.data.menuItems[0];
        setFoodId(String(firstAvail.foodId));
        setMealCategory(firstAvail.mealCategory);
      }
    }
  }

  useEffect(() => {
    loadStudentData();
  }, []);

  function handleSelectFoodForFeedback(item: FoodItem) {
    setFoodId(String(item.foodId));
    setMealCategory(item.mealCategory);
    setValidationErrors([]);
    onNavigate('/student/feedback/new');
  }

  async function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault();
    setValidationErrors([]);
    setBannerMessage(null);
    setSubmittingFeedback(true);

    const res = await apiFetch<{
      message?: string;
      error?: string;
      errors?: string[];
      feedbackId?: number;
    }>('/api/student/feedback', {
      method: 'POST',
      body: JSON.stringify({
        foodId: Number(foodId),
        mealCategory,
        serviceDate,
        tasteRating,
        qualityRating,
        quantityRating,
        hygieneRating,
        overallRating,
        complaintCategory,
        comments,
        suggestions,
      }),
    });
    setSubmittingFeedback(false);

    if (!res.ok) {
      setValidationErrors(
        res.data.errors && res.data.errors.length > 0
          ? res.data.errors
          : [res.data.error || 'Please correct the highlighted fields and try again.']
      );
      return;
    }

    setComments('');
    setSuggestions('');
    setComplaintCategory('NONE');
    setBannerMessage({
      type: 'success',
      text: res.data.message || 'Feedback saved to MySQL/SQL database.',
    });
    await loadStudentData();
    onNavigate('/student/feedback/history');
  }

  async function handleOpenFeedbackDetail(feedbackId: number) {
    const res = await apiFetch<{ feedback?: FeedbackRecord; error?: string }>(
      `/api/student/feedback/${feedbackId}`
    );
    if (res.ok && res.data.feedback) {
      setDetailRecord(res.data.feedback);
    } else {
      setBannerMessage({
        type: 'error',
        text: res.data.error || 'Could not load feedback detail.',
      });
    }
  }

  const groupedMenu: Record<MealCategory, FoodItem[]> = {
    BREAKFAST: menuItems.filter((m) => m.mealCategory === 'BREAKFAST'),
    LUNCH: menuItems.filter((m) => m.mealCategory === 'LUNCH'),
    DINNER: menuItems.filter((m) => m.mealCategory === 'DINNER'),
    SNACKS: menuItems.filter((m) => m.mealCategory === 'SNACKS'),
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col lg:flex-row bg-slate-50">
      {/* Dedicated Student Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-5 shrink-0 flex flex-col justify-between">
        <div>
          <div className="pb-4 mb-4 border-b border-slate-200">
            <p className="text-xs font-medium text-slate-500">Authenticated Student</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{user.displayName}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              @{user.username} · Role: STUDENT
            </p>
          </div>

          <nav aria-label="Student Portal Navigation" className="space-y-1">
            <button
              type="button"
              onClick={() => onNavigate('/student/dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSubRoute === 'dashboard'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Utensils className="w-4 h-4 shrink-0" />
              <span>Student Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/student/menu')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSubRoute === 'menu'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Utensils className="w-4 h-4 shrink-0" />
              <span>View Food Menu</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/student/feedback/new')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSubRoute === 'feedback-new'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <MessageSquarePlus className="w-4 h-4 shrink-0" />
              <span>Submit Feedback</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/student/feedback/history')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSubRoute === 'feedback-history'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span>My Feedback History ({myFeedback.length})</span>
            </button>
          </nav>
        </div>

        <div className="pt-4 mt-6 border-t border-slate-200 space-y-2">
          <button
            type="button"
            onClick={() => onNavigate('/admin/dashboard')}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Test Direct Admin URL (403 Guard)</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Student Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Student Content Viewport */}
      <main className="flex-1 p-6 lg:p-8 max-w-6xl">
        {bannerMessage && (
          <div
            role="status"
            className={`mb-6 p-4 rounded-md border flex items-center justify-between ${
              bannerMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center gap-2.5 text-sm font-medium">
              {bannerMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
              )}
              <span>{bannerMessage.text}</span>
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setBannerMessage(null)}
              className="text-xs font-semibold underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* VIEW 1: STUDENT DASHBOARD */}
        {activeSubRoute === 'dashboard' && (
          <div className="space-y-8">
            <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">
                  Student Portal · Personal Mess Workspace
                </p>
                <h1 className="text-2xl font-bold text-slate-900 mt-1">
                  Welcome back, {user.displayName}
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Browse today&apos;s live mess menu by meal category, rate dishes you were served, and track your personal submissions.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate('/student/feedback/new')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Submit Feedback
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/student/feedback/history')}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  My History ({myFeedback.length})
                </button>
              </div>
            </div>

            {/* Quick Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <p className="text-xs font-medium text-slate-500">Active Menu Dishes</p>
                <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                  {menuItems.length}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Available Today: {menuItems.filter((i) => Boolean(i.isAvailable)).length} dishes
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <p className="text-xs font-medium text-slate-500">My Submitted Feedback</p>
                <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                  {myFeedback.length}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Private to your student account
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <p className="text-xs font-medium text-slate-500">My Tracked Complaints</p>
                <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                  {myFeedback.filter((f) => f.complaintCategory !== 'NONE').length}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Resolved: {myFeedback.filter((f) => f.complaintStatus === 'RESOLVED').length}
                </p>
              </div>
            </div>

            {/* Live Food Menu Section on Dashboard */}
            <section aria-labelledby="student-menu-heading" className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h2 id="student-menu-heading" className="text-lg font-bold text-slate-900">
                    Current Mess Food Menu
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Loaded live from the relational database · Inactive or retired items are automatically hidden
                  </p>
                </div>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
                  {(['ALL', ...MEAL_CATEGORIES] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        selectedCategoryFilter === cat
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat === 'ALL' ? 'All Meals' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <p className="py-8 text-sm text-slate-500">Loading active mess menu...</p>
              ) : menuItems.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    No active menu items are currently available.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Please check back after the mess administrator updates today&apos;s menu.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 mt-5">
                  {MEAL_CATEGORIES.filter(
                    (cat) => selectedCategoryFilter === 'ALL' || selectedCategoryFilter === cat
                  ).map((category) => {
                    const items = groupedMenu[category];
                    return (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <h3 className="text-sm font-bold text-slate-800">{category}</h3>
                          <span className="text-xs text-slate-500 font-mono tabular-nums">
                            {items.length} {items.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        {items.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-2">
                            No available items in {category.toLowerCase()} right now.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {items.map((item) => {
                              const available = Boolean(item.isAvailable);
                              return (
                                <div
                                  key={item.foodId}
                                  className="p-4 rounded-md border border-slate-200 flex flex-col justify-between gap-3"
                                >
                                  <div>
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className="text-sm font-semibold text-slate-900">
                                        {item.name}
                                      </h4>
                                      <span
                                        className={`text-xs font-medium whitespace-nowrap shrink-0 ${
                                          available ? 'text-emerald-700' : 'text-amber-700'
                                        }`}
                                      >
                                        {available ? 'Available Today' : 'Out of Stock'}
                                      </span>
                                    </div>
                                    {item.description && (
                                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <span className="text-xs text-slate-500 font-mono">
                                      {item.mealCategory} · Dish #{item.foodId}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleSelectFoodForFeedback(item)}
                                      className="text-xs font-semibold text-slate-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                                    >
                                      Rate This Dish →
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Student's Recent Personal Feedback Preview */}
            <section aria-labelledby="student-recent-history" className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <h2 id="student-recent-history" className="text-lg font-bold text-slate-900">
                    My Recent Feedback Submissions
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Showing only feedback submitted by your account ({user.displayName})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/student/feedback/history')}
                  className="text-xs font-semibold text-slate-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Open Full History →
                </button>
              </div>

              {myFeedback.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-600">You have not submitted any food feedback yet.</p>
                  <button
                    type="button"
                    onClick={() => onNavigate('/student/feedback/new')}
                    className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md cursor-pointer"
                  >
                    Submit Your First Meal Rating
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                        <th className="py-2.5 px-3">Service Date</th>
                        <th className="py-2.5 px-3">Food Item</th>
                        <th className="py-2.5 px-3">Meal</th>
                        <th className="py-2.5 px-3 text-right">Overall Rating</th>
                        <th className="py-2.5 px-3">Complaint Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {myFeedback.slice(0, 4).map((fb) => (
                        <tr key={fb.feedbackId} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono text-xs text-slate-600 tabular-nums">
                            {fb.serviceDate}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">{fb.foodName}</td>
                          <td className="py-2.5 px-3 text-xs text-slate-600">{fb.mealCategory}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums">
                            {fb.overallRating} / 5
                          </td>
                          <td className="py-2.5 px-3 text-xs text-slate-700">
                            {fb.complaintCategory === 'NONE'
                              ? 'No Complaint'
                              : `${fb.complaintCategory} · ${fb.complaintStatus}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* VIEW 2: DEDICATED STUDENT FOOD MENU PAGE */}
        {activeSubRoute === 'menu' && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Live College Mess Food Menu
                </h1>
                <p className="text-sm text-slate-600 mt-0.5">
                  Grouped by Breakfast, Lunch, Dinner, and Snacks. Click any dish to submit a verified rating.
                </p>
              </div>
              <button
                type="button"
                onClick={loadStudentData}
                className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Refresh Menu from Database
              </button>
            </div>

            {MEAL_CATEGORIES.map((category) => {
              const items = groupedMenu[category];
              return (
                <section key={category} className="space-y-3">
                  <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                    {category} ({items.length})
                  </h2>
                  {items.length === 0 ? (
                    <p className="text-sm text-slate-500 py-3">
                      No active dishes are currently listed for {category.toLowerCase()}.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map((item) => {
                        const available = Boolean(item.isAvailable);
                        return (
                          <div
                            key={item.foodId}
                            className="p-4 border border-slate-200 rounded-md flex flex-col justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                                <span
                                  className={`text-xs font-semibold whitespace-nowrap shrink-0 ${
                                    available ? 'text-emerald-700' : 'text-amber-700'
                                  }`}
                                >
                                  {available ? 'Available' : 'Unavailable Today'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">
                                {item.description || 'No description provided.'}
                              </p>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <span className="text-xs text-slate-500 font-mono">
                                Category: {item.mealCategory}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSelectFoodForFeedback(item)}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                Rate Dish
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* VIEW 3: STUDENT FOOD FEEDBACK FORM */}
        {activeSubRoute === 'feedback-new' && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-3xl">
            <div className="pb-4 mb-6 border-b border-slate-200">
              <h1 className="text-xl font-bold text-slate-900">Submit Meal Feedback</h1>
              <p className="text-sm text-slate-600 mt-1">
                All ratings use whole numbers from <strong>1 (Very Poor)</strong> to <strong>5 (Excellent)</strong>. Your student identity ({user.displayName}) is read securely from your server session.
              </p>
            </div>

            {validationErrors.length > 0 && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-red-900 text-sm"
              >
                <div className="flex items-center gap-2 font-semibold mb-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
                  <span>Please resolve the following validation errors:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmitFeedback} className="space-y-6" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label htmlFor="fb-food-item" className="block text-sm font-medium text-slate-800 mb-1">
                    Food Item (Active Menu) *
                  </label>
                  <select
                    id="fb-food-item"
                    name="foodId"
                    required
                    value={foodId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFoodId(val);
                      const found = menuItems.find((m) => String(m.foodId) === val);
                      if (found) setMealCategory(found.mealCategory);
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">-- Select Dish --</option>
                    {menuItems.map((item) => (
                      <option key={item.foodId} value={item.foodId}>
                        {item.name} ({item.mealCategory})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="fb-meal-category" className="block text-sm font-medium text-slate-800 mb-1">
                    Meal Category *
                  </label>
                  <select
                    id="fb-meal-category"
                    name="mealCategory"
                    required
                    value={mealCategory}
                    onChange={(e) => setMealCategory(e.target.value as MealCategory)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {MEAL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="fb-service-date" className="block text-sm font-medium text-slate-800 mb-1">
                    Date Served *
                  </label>
                  <input
                    id="fb-service-date"
                    name="serviceDate"
                    type="date"
                    required
                    max="2026-10-26"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Accessible Keyboard-Friendly Radio Rating Controls (1 = Very Poor to 5 = Excellent) */}
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-600">
                  Rate all five dimensions below (1 = Very Poor, 2 = Poor, 3 = Fair, 4 = Good, 5 = Excellent):
                </p>

                {[
                  { id: 'taste', label: 'Taste Rating *', value: tasteRating, setter: setTasteRating },
                  { id: 'quality', label: 'Food Quality Rating *', value: qualityRating, setter: setQualityRating },
                  { id: 'quantity', label: 'Portion Quantity Rating *', value: quantityRating, setter: setQuantityRating },
                  { id: 'hygiene', label: 'Counter & Dining Hygiene Rating *', value: hygieneRating, setter: setHygieneRating },
                  { id: 'overall', label: 'Overall Satisfaction Rating *', value: overallRating, setter: setOverallRating },
                ].map((dim) => (
                  <fieldset key={dim.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
                    <legend className="text-sm font-semibold text-slate-900 px-1">
                      {dim.label}
                    </legend>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                      {RATING_SCALE.map((scale) => (
                        <label
                          key={scale.value}
                          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded border cursor-pointer transition-colors ${
                            dim.value === scale.value
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`${dim.id}Rating`}
                            value={scale.value}
                            checked={dim.value === scale.value}
                            onChange={() => dim.setter(scale.value)}
                            className="sr-only"
                          />
                          <span className="font-mono">{scale.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>

              {/* Complaint Category */}
              <div>
                <label htmlFor="fb-complaint-category" className="block text-sm font-medium text-slate-800 mb-1">
                  Complaint Category (Select &quot;No Complaint&quot; if satisfied)
                </label>
                <select
                  id="fb-complaint-category"
                  name="complaintCategory"
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value as ComplaintCategory)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="NONE">No Complaint</option>
                  <option value="TASTE">Taste Issue (Bland, salty, burnt, undercooked)</option>
                  <option value="QUALITY">Quality Issue (Stale ingredients, excess oil)</option>
                  <option value="QUANTITY">Quantity Issue (Small portion, items ran out early)</option>
                  <option value="HYGIENE">Hygiene Issue (Unclean plates, tables, or serving bay)</option>
                  <option value="TEMPERATURE">Temperature Issue (Food served cold)</option>
                  <option value="VARIETY">Menu Variety Issue (Repetitive dishes)</option>
                  <option value="OTHER">Other Issue</option>
                </select>
              </div>

              {/* Optional Comments & Suggestions with Character Guidance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="fb-comments" className="text-sm font-medium text-slate-800">
                      Comments (Optional)
                    </label>
                    <span className="text-xs font-mono text-slate-500 tabular-nums">
                      {comments.length} / 1000
                    </span>
                  </div>
                  <textarea
                    id="fb-comments"
                    name="comments"
                    rows={3}
                    maxLength={1000}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Share specific observations about taste, freshness, or serving conditions..."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="fb-suggestions" className="text-sm font-medium text-slate-800">
                      Suggestions for Improvement (Optional)
                    </label>
                    <span className="text-xs font-mono text-slate-500 tabular-nums">
                      {suggestions.length} / 1000
                    </span>
                  </div>
                  <textarea
                    id="fb-suggestions"
                    name="suggestions"
                    rows={3}
                    maxLength={1000}
                    value={suggestions}
                    onChange={(e) => setSuggestions(e.target.value)}
                    placeholder="What concrete change should the mess kitchen team make?"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => onNavigate('/student/dashboard')}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {submittingFeedback ? 'Saving to Database...' : 'Submit Verified Feedback'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 4: STUDENT FEEDBACK HISTORY (OWNERSHIP PROTECTED) */}
        {activeSubRoute === 'feedback-history' && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">My Feedback History</h1>
                <p className="text-sm text-slate-600 mt-0.5">
                  Displaying records owned exclusively by <strong>{user.displayName}</strong>. Other students&apos; feedback is never exposed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/student/feedback/new')}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                + Submit New Feedback
              </button>
            </div>

            {myFeedback.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-base font-semibold text-slate-800">
                  No feedback submissions found for your account.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Rate any dish from today&apos;s menu to build your feedback history.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-3">Service Date</th>
                      <th className="py-3 px-3">Food Item & Meal</th>
                      <th className="py-3 px-3 text-right">Ratings (T/Qual/Quant/Hyg/All)</th>
                      <th className="py-3 px-3">Comments & Suggestions</th>
                      <th className="py-3 px-3">Complaint Tracking</th>
                      <th className="py-3 px-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {myFeedback.map((fb) => (
                      <tr key={fb.feedbackId} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                          <div>{fb.serviceDate}</div>
                          <div className="text-slate-400">{fb.submittedAt.slice(0, 16)}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{fb.foodName}</div>
                          <div className="text-xs text-slate-500">{fb.mealCategory}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs tabular-nums whitespace-nowrap">
                          {fb.tasteRating} · {fb.qualityRating} · {fb.quantityRating} · {fb.hygieneRating} ·{' '}
                          <strong className="text-slate-900">{fb.overallRating}/5</strong>
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-700 max-w-xs">
                          {fb.comments ? <p>{fb.comments}</p> : <span className="text-slate-400">No comment</span>}
                          {fb.suggestions && (
                            <p className="text-slate-500 mt-1">Suggestion: {fb.suggestions}</p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-xs whitespace-nowrap">
                          {fb.complaintCategory === 'NONE' ? (
                            <span className="text-slate-500">No Complaint</span>
                          ) : (
                            <span
                              className={`font-semibold ${
                                fb.complaintStatus === 'RESOLVED'
                                  ? 'text-emerald-700'
                                  : fb.complaintStatus === 'IN_PROGRESS'
                                  ? 'text-amber-700'
                                  : 'text-red-700'
                              }`}
                            >
                              {fb.complaintCategory} · {fb.complaintStatus}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenFeedbackDetail(fb.feedbackId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {detailRecord && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="feedback-detail-modal-title"
                className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
              >
                <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 space-y-4">
                  <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                    <div>
                      <p className="text-xs text-slate-500 font-mono">
                        Ownership Verified · Feedback #{detailRecord.feedbackId}
                      </p>
                      <h2 id="feedback-detail-modal-title" className="text-lg font-bold text-slate-900">
                        {detailRecord.foodName}
                      </h2>
                    </div>
                    <button
                      type="button"
                      aria-label="Close detail dialog"
                      onClick={() => setDetailRecord(null)}
                      className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-xs text-slate-600 space-y-2 font-mono">
                    <p>
                      Meal: {detailRecord.mealCategory} · Service Date: {detailRecord.serviceDate}
                    </p>
                    <p>
                      Ratings — Taste: {detailRecord.tasteRating}/5 · Quality: {detailRecord.qualityRating}/5 · Quantity:{' '}
                      {detailRecord.quantityRating}/5 · Hygiene: {detailRecord.hygieneRating}/5 · Overall:{' '}
                      {detailRecord.overallRating}/5
                    </p>
                    <p>
                      Complaint: {detailRecord.complaintCategory} · Status: {detailRecord.complaintStatus}
                    </p>
                  </div>
                  <div className="text-sm text-slate-800 space-y-2 pt-2 border-t border-slate-100">
                    <p>
                      <strong>Comments:</strong> {detailRecord.comments || 'None provided'}
                    </p>
                    <p>
                      <strong>Suggestions:</strong> {detailRecord.suggestions || 'None provided'}
                    </p>
                  </div>
                  <div className="flex justify-end pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDetailRecord(null)}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
