import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  AlertOctagon,
  UtensilsCrossed,
  FileCheck2,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Edit3,
  Plus,
} from 'lucide-react';
import {
  AuthUser,
  FoodItem,
  FeedbackRecord,
  FoodRatingReportItem,
  ComplaintCategorySummary,
  ImprovementActionRecord,
  AuditLogRecord,
  MealCategory,
  ComplaintCategory,
  ComplaintStatus,
} from '../types/messmate';
import { apiFetch } from '../utils/api';

const MEAL_CATEGORIES: MealCategory[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS'];
const COMPLAINT_CATEGORIES: ComplaintCategory[] = [
  'NONE',
  'TASTE',
  'QUALITY',
  'QUANTITY',
  'HYGIENE',
  'TEMPERATURE',
  'VARIETY',
  'OTHER',
];
const COMPLAINT_STATUSES: ComplaintStatus[] = ['NONE', 'OPEN', 'IN_PROGRESS', 'RESOLVED'];

export function AdminLoginView({
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
      setError('Administrator username and password are required.');
      return;
    }
    setSubmitting(true);
    const res = await apiFetch<{
      authenticated?: boolean;
      user?: AuthUser;
      sessionId?: string;
      csrfToken?: string;
      error?: string;
    }>('/api/auth/admin/login', {
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
      <div className="bg-slate-900 text-white border border-slate-800 rounded-lg p-8">
        <div className="mb-6">
          <p className="text-xs font-mono text-slate-400">
            Restricted Operations Portal · /admin/login
          </p>
          <h1 className="text-2xl font-bold text-white mt-1">Administrator Login</h1>
          <p className="text-sm text-slate-300 mt-1">
            Exclusive authentication portal for Mess Wardens and Quality Administrators. Student accounts are rejected at the server level.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-md bg-red-950/80 border border-red-800 text-red-200 text-sm flex items-start gap-2.5"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="admin-username" className="block text-sm font-medium text-slate-200 mb-1">
              Administrator Username
            </label>
            <input
              id="admin-username"
              name="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. mess.warden"
              className="w-full px-3.5 py-2 text-sm bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-slate-200 mb-1">
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter administrator password"
              className="w-full px-3.5 py-2 text-sm bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 text-sm font-semibold text-slate-950 bg-white hover:bg-slate-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Verifying Administrator Role...' : 'Sign In as Administrator'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-300 mb-2">
            Development Demo Admin Accounts (from database/seed.sql)
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setUsername('mess.warden');
                setPassword('Admin@123');
                setError(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Fill Chief Warden (mess.warden)
            </button>
            <button
              type="button"
              onClick={() => {
                setUsername('quality.admin');
                setPassword('Admin@123');
                setError(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Fill Quality Supervisor (quality.admin)
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Looking for the Student Portal?</span>
            <button
              type="button"
              onClick={() => onNavigate('/student/login')}
              className="font-medium text-white hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Go to Student Login →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminPortalWorkspace({
  user,
  activeSubRoute,
  onNavigate,
  onLogout,
}: {
  user: AuthUser;
  activeSubRoute: 'dashboard' | 'feedback' | 'reports' | 'complaints' | 'improvements' | 'menu';
  onNavigate: (route: string) => void;
  onLogout: () => void;
}) {
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dashboard state
  const [dashMetrics, setDashMetrics] = useState<{
    totalSubmissions: number;
    avgOverallSatisfaction: number;
    lowRatedFoodCount: number;
    unresolvedComplaintsCount: number;
    lowRatingThreshold: number;
  }>({
    totalSubmissions: 0,
    avgOverallSatisfaction: 0,
    lowRatedFoodCount: 0,
    unresolvedComplaintsCount: 0,
    lowRatingThreshold: 3.0,
  });
  const [lowRatedItems, setLowRatedItems] = useState<
    Array<{ foodId: number; foodName: string; mealCategory: string; sampleCount: number; avgOverall: number }>
  >([]);
  const [recentFeedback, setRecentFeedback] = useState<FeedbackRecord[]>([]);
  const [complaintBreakdown, setComplaintBreakdown] = useState<ComplaintCategorySummary[]>([]);

  // Feedback management filters & pagination
  const [fbRecords, setFbRecords] = useState<FeedbackRecord[]>([]);
  const [fbPagination, setFbPagination] = useState({ total: 0, page: 1, pageSize: 10, totalPages: 1 });
  const [filterFoodId, setFilterFoodId] = useState('');
  const [filterMeal, setFilterMeal] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMinRating, setFilterMinRating] = useState('');
  const [filterMaxRating, setFilterMaxRating] = useState('');
  const [filterComplaintCat, setFilterComplaintCat] = useState('');
  const [filterComplaintStatus, setFilterComplaintStatus] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [sortBy, setSortBy] = useState('submitted_at');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Reports & Analytics state
  const [reportItems, setReportItems] = useState<FoodRatingReportItem[]>([]);
  const [reportCategory, setReportCategory] = useState('');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportThreshold, setReportThreshold] = useState('3.0');
  const [reportSortOrder, setReportSortOrder] = useState<'asc' | 'desc'>('asc');
  const [keywordCounts, setKeywordCounts] = useState<
    Array<{ label: string; keywords: string[]; matchCount: number }>
  >([]);

  // Complaint resolution & Improvement Action modal state
  const [selectedComplaintForAction, setSelectedComplaintForAction] = useState<FeedbackRecord | null>(null);
  const [newComplaintStatus, setNewComplaintStatus] = useState<'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('IN_PROGRESS');
  const [actionText, setActionText] = useState('');

  // Improvement & Audit History state
  const [improvementHistory, setImprovementHistory] = useState<ImprovementActionRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);

  // Menu Management state
  const [adminMenuItems, setAdminMenuItems] = useState<FoodItem[]>([]);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [dishName, setDishName] = useState('');
  const [dishDesc, setDishDesc] = useState('');
  const [dishCategory, setDishCategory] = useState<MealCategory>('BREAKFAST');
  const [dishAvailable, setDishAvailable] = useState(true);
  const [confirmDeactivateItem, setConfirmDeactivateItem] = useState<FoodItem | null>(null);

  async function loadDashboard() {
    const res = await apiFetch<{
      metrics?: typeof dashMetrics;
      lowRatedItems?: typeof lowRatedItems;
      recentFeedback?: FeedbackRecord[];
      complaintBreakdown?: ComplaintCategorySummary[];
    }>('/api/admin/dashboard');
    if (res.ok && res.data.metrics) {
      setDashMetrics(res.data.metrics);
      setLowRatedItems(res.data.lowRatedItems || []);
      setRecentFeedback(res.data.recentFeedback || []);
      setComplaintBreakdown(res.data.complaintBreakdown || []);
    }
  }

  async function loadFeedbackList(pageOverride?: number) {
    const params = new URLSearchParams();
    if (filterFoodId) params.set('foodId', filterFoodId);
    if (filterMeal) params.set('mealCategory', filterMeal);
    if (filterStartDate) params.set('startDate', filterStartDate);
    if (filterEndDate) params.set('endDate', filterEndDate);
    if (filterMinRating) params.set('minRating', filterMinRating);
    if (filterMaxRating) params.set('maxRating', filterMaxRating);
    if (filterComplaintCat) params.set('complaintCategory', filterComplaintCat);
    if (filterComplaintStatus) params.set('complaintStatus', filterComplaintStatus);
    if (filterSearch.trim()) params.set('search', filterSearch.trim());
    params.set('sortBy', sortBy);
    params.set('sortDir', sortDir);
    params.set('page', String(pageOverride || fbPagination.page));
    params.set('pageSize', '10');

    const res = await apiFetch<{
      records?: FeedbackRecord[];
      pagination?: typeof fbPagination;
    }>(`/api/admin/feedback?${params.toString()}`);
    if (res.ok && res.data.records) {
      setFbRecords(res.data.records);
      if (res.data.pagination) setFbPagination(res.data.pagination);
    }
  }

  async function loadReports() {
    const params = new URLSearchParams();
    if (reportCategory) params.set('mealCategory', reportCategory);
    if (reportStartDate) params.set('startDate', reportStartDate);
    if (reportEndDate) params.set('endDate', reportEndDate);
    params.set('threshold', reportThreshold || '3.0');
    params.set('sortOrder', reportSortOrder);

    const res = await apiFetch<{
      itemReports?: FoodRatingReportItem[];
      complaintCategories?: ComplaintCategorySummary[];
      recurringKeywordCounts?: Array<{ label: string; keywords: string[]; matchCount: number }>;
    }>(`/api/admin/reports?${params.toString()}`);
    if (res.ok && res.data.itemReports) {
      setReportItems(res.data.itemReports);
      setKeywordCounts(res.data.recurringKeywordCounts || []);
      if (res.data.complaintCategories) {
        setComplaintBreakdown(res.data.complaintCategories);
      }
    }
  }

  async function loadImprovementsAndAudit() {
    const res = await apiFetch<{
      actions?: ImprovementActionRecord[];
      auditLogs?: AuditLogRecord[];
    }>('/api/admin/improvements');
    if (res.ok) {
      setImprovementHistory(res.data.actions || []);
      setAuditLogs(res.data.auditLogs || []);
    }
  }

  async function loadAdminMenu() {
    const res = await apiFetch<{ items?: FoodItem[] }>('/api/admin/menu');
    if (res.ok && res.data.items) {
      setAdminMenuItems(res.data.items);
    }
  }

  useEffect(() => {
    loadDashboard();
    loadAdminMenu();
    loadReports();
    loadFeedbackList(1);
    loadImprovementsAndAudit();
  }, []);

  function resetFeedbackFilters() {
    setFilterFoodId('');
    setFilterMeal('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterMinRating('');
    setFilterMaxRating('');
    setFilterComplaintCat('');
    setFilterComplaintStatus('');
    setFilterSearch('');
    setSortBy('submitted_at');
    setSortDir('desc');
    setTimeout(() => loadFeedbackList(1), 0);
  }

  async function handleSoftDeleteFeedback(feedbackId: number) {
    const res = await apiFetch<{ message?: string; error?: string }>(`/api/admin/feedback/${feedbackId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'softDelete' }),
    });
    setConfirmDeleteId(null);
    if (res.ok) {
      setBanner({ type: 'success', text: res.data.message || 'Feedback soft-deleted.' });
      await Promise.all([loadFeedbackList(1), loadDashboard(), loadReports(), loadImprovementsAndAudit()]);
    } else {
      setBanner({ type: 'error', text: res.data.error || 'Could not soft-delete record.' });
    }
  }

  async function handleRecordImprovementAction(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedComplaintForAction) return;
    const res = await apiFetch<{ message?: string; error?: string }>(
      `/api/admin/complaints/${selectedComplaintForAction.feedbackId}/action`,
      {
        method: 'POST',
        body: JSON.stringify({
          newStatus: newComplaintStatus,
          actionText,
        }),
      }
    );
    if (!res.ok) {
      setBanner({ type: 'error', text: res.data.error || 'Failed to record improvement action.' });
      return;
    }
    setBanner({
      type: 'success',
      text: res.data.message || 'Complaint status and improvement action recorded.',
    });
    setSelectedComplaintForAction(null);
    setActionText('');
    await Promise.all([loadDashboard(), loadFeedbackList(1), loadReports(), loadImprovementsAndAudit()]);
  }

  async function handleSaveMenuItem(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);

    const url = editingFood ? `/api/admin/menu/${editingFood.foodId}` : '/api/admin/menu';
    const method = editingFood ? 'PUT' : 'POST';

    const res = await apiFetch<{ message?: string; error?: string }>(url, {
      method,
      body: JSON.stringify({
        name: dishName,
        description: dishDesc,
        mealCategory: dishCategory,
        isAvailable: dishAvailable,
      }),
    });

    if (!res.ok) {
      setBanner({ type: 'error', text: res.data.error || 'Failed to save menu item.' });
      return;
    }

    setBanner({ type: 'success', text: res.data.message || 'Menu item saved.' });
    setEditingFood(null);
    setDishName('');
    setDishDesc('');
    setDishCategory('BREAKFAST');
    setDishAvailable(true);
    await Promise.all([loadAdminMenu(), loadReports(), loadImprovementsAndAudit()]);
  }

  async function handleToggleMenuActiveStatus(item: FoodItem, targetActive: boolean) {
    const res = await apiFetch<{ message?: string; error?: string }>(
      `/api/admin/menu/${item.foodId}/status`,
      {
        method: 'POST',
        body: JSON.stringify({ isActive: targetActive }),
      }
    );
    setConfirmDeactivateItem(null);
    if (res.ok) {
      setBanner({ type: 'success', text: res.data.message || 'Menu status updated.' });
      await Promise.all([loadAdminMenu(), loadReports(), loadImprovementsAndAudit()]);
    } else {
      setBanner({ type: 'error', text: res.data.error || 'Could not update item status.' });
    }
  }

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col lg:flex-row bg-slate-50">
      {/* Dedicated Administrator Sidebar (Visually distinct dark slate console) */}
      <aside className="w-full lg:w-64 bg-slate-900 text-slate-100 p-5 shrink-0 flex flex-col justify-between">
        <div>
          <div className="pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-mono text-sky-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>ADMIN CONSOLE</span>
            </div>
            <p className="text-sm font-bold text-white mt-1 truncate">{user.displayName}</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              @{user.username} · Role: ADMIN
            </p>
          </div>

          <nav aria-label="Administrator Navigation" className="space-y-1">
            {[
              { id: 'dashboard', route: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
              { id: 'feedback', route: '/admin/feedback', label: 'Feedback Management', icon: ClipboardList },
              { id: 'reports', route: '/admin/reports', label: 'Food Rating Analytics', icon: BarChart3 },
              { id: 'complaints', route: '/admin/complaints', label: 'Complaint Tracking', icon: AlertOctagon },
              { id: 'improvements', route: '/admin/improvements', label: 'Improvement & Audit Log', icon: FileCheck2 },
              { id: 'menu', route: '/admin/menu', label: 'Manage Food Menu', icon: UtensilsCrossed },
            ].map((nav) => {
              const Icon = nav.icon;
              const active = activeSubRoute === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => onNavigate(nav.route)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active ? 'bg-white text-slate-950 font-semibold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{nav.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 mt-6 border-t border-slate-800">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-200 bg-red-950/60 hover:bg-red-900/70 border border-red-800/60 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Admin Console</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Viewport */}
      <main className="flex-1 p-6 lg:p-8 max-w-7xl">
        {banner && (
          <div
            role="status"
            className={`mb-6 p-4 rounded-md border flex items-center justify-between ${
              banner.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {banner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
              )}
              <span>{banner.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="text-xs font-semibold underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. ADMIN DASHBOARD */}
        {activeSubRoute === 'dashboard' && (
          <div className="space-y-8">
            <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">
                  MessMate Operations · Authenticated Administrator
                </p>
                <h1 className="text-2xl font-bold text-slate-900 mt-1">
                  Welcome, {user.displayName}
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  All figures below are computed live via SQL aggregate queries against the relational database.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate('/admin/menu')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Manage Food Menu
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/admin/complaints')}
                  className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Review Complaints ({dashMetrics.unresolvedComplaintsCount})
                </button>
              </div>
            </div>

            {/* 4 Key Database Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <p className="text-xs font-medium text-slate-500">Total Feedback Submissions</p>
                <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                  {dashMetrics.totalSubmissions}
                </p>
                <p className="text-xs text-slate-500 mt-1">Active verified student records</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <p className="text-xs font-medium text-slate-500">Average Overall Satisfaction</p>
                <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                  {dashMetrics.avgOverallSatisfaction.toFixed(2)} / 5.00
                </p>
                <p className="text-xs text-slate-500 mt-1">Calculated via SQL AVG(overall_rating)</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <p className="text-xs font-medium text-slate-500">
                  Low-Rated Food Items (&lt; {dashMetrics.lowRatingThreshold.toFixed(1)})
                </p>
                <p
                  className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
                    dashMetrics.lowRatedFoodCount > 0 ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  {dashMetrics.lowRatedFoodCount}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {dashMetrics.lowRatedFoodCount > 0
                    ? 'Attention required — below threshold'
                    : 'All rated dishes meet threshold'}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <p className="text-xs font-medium text-slate-500">Unresolved Complaints</p>
                <p
                  className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
                    dashMetrics.unresolvedComplaintsCount > 0 ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {dashMetrics.unresolvedComplaintsCount}
                </p>
                <p className="text-xs text-slate-500 mt-1">Status OPEN or IN_PROGRESS</p>
              </div>
            </div>

            {/* Low-Rated Dishes Alert Table */}
            <section className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Low-Rated Menu Items Requiring Action
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dishes with at least 1 feedback submission and average overall rating below {dashMetrics.lowRatingThreshold.toFixed(1)} / 5.00
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/admin/reports')}
                  className="text-xs font-semibold text-slate-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Full Rating Analytics →
                </button>
              </div>

              {lowRatedItems.length === 0 ? (
                <p className="py-6 text-sm text-slate-600">
                  No menu items are currently rated below {dashMetrics.lowRatingThreshold.toFixed(1)}.
                </p>
              ) : (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                        <th className="py-2.5 px-3">Food Item</th>
                        <th className="py-2.5 px-3">Meal Category</th>
                        <th className="py-2.5 px-3 text-right">Sample Count (N)</th>
                        <th className="py-2.5 px-3 text-right">Avg Overall Rating</th>
                        <th className="py-2.5 px-3">Quality Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {lowRatedItems.map((item) => (
                        <tr key={item.foodId} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{item.foodName}</td>
                          <td className="py-2.5 px-3 text-xs text-slate-600">{item.mealCategory}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {item.sampleCount}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-red-700 tabular-nums">
                            {Number(item.avgOverall).toFixed(2)} / 5.00
                          </td>
                          <td className="py-2.5 px-3 text-xs font-semibold text-red-700">
                            LOW RATED (Below {dashMetrics.lowRatingThreshold.toFixed(1)})
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Recent Feedback Submissions */}
            <section className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Recent Feedback Submissions</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Student personal details are minimized to anonymized student references in reports
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/admin/feedback')}
                  className="text-xs font-semibold text-slate-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Filter & Search All Feedback →
                </button>
              </div>

              {recentFeedback.length === 0 ? (
                <p className="py-6 text-sm text-slate-600">No feedback submissions recorded yet.</p>
              ) : (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                        <th className="py-2.5 px-3">Date Served</th>
                        <th className="py-2.5 px-3">Food Item & Meal</th>
                        <th className="py-2.5 px-3 text-right">Ratings (T/Q/Qty/H/All)</th>
                        <th className="py-2.5 px-3">Comments & Suggestions</th>
                        <th className="py-2.5 px-3">Complaint</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {recentFeedback.map((fb) => (
                        <tr key={fb.feedbackId} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                            <div>{fb.serviceDate}</div>
                            <div className="text-slate-400">{fb.studentAnonRef}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{fb.foodName}</div>
                            <div className="text-xs text-slate-500">{fb.mealCategory}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-xs tabular-nums whitespace-nowrap">
                            {fb.tasteRating} · {fb.qualityRating} · {fb.quantityRating} · {fb.hygieneRating} ·{' '}
                            <strong className={fb.overallRating < 3 ? 'text-red-700' : 'text-slate-900'}>
                              {fb.overallRating}/5
                            </strong>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-slate-700 max-w-sm">
                            {fb.comments || '—'}
                            {fb.suggestions && (
                              <div className="text-slate-500 mt-0.5">Suggestion: {fb.suggestions}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-xs whitespace-nowrap">
                            {fb.complaintCategory === 'NONE' ? (
                              <span className="text-slate-500">None</span>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* 2. ADMIN FEEDBACK MANAGEMENT (FILTERS, SEARCH, SORT ALLOWLIST, PAGINATION) */}
        {activeSubRoute === 'feedback' && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  All Student Feedback & Complaint Records
                </h1>
                <p className="text-sm text-slate-600 mt-0.5">
                  Parameterized SQL filtering by dish, meal category, service date range, rating range, complaint status, and allowlisted sorting.
                </p>
              </div>
              <button
                type="button"
                onClick={resetFeedbackFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-md border border-slate-200">
              <div>
                <label htmlFor="flt-food" className="block text-xs font-medium text-slate-700 mb-1">
                  Food Item
                </label>
                <select
                  id="flt-food"
                  value={filterFoodId}
                  onChange={(e) => setFilterFoodId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
                >
                  <option value="">All Food Items</option>
                  {adminMenuItems.map((item) => (
                    <option key={item.foodId} value={item.foodId}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="flt-meal" className="block text-xs font-medium text-slate-700 mb-1">
                  Meal Category
                </label>
                <select
                  id="flt-meal"
                  value={filterMeal}
                  onChange={(e) => setFilterMeal(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
                >
                  <option value="">All Categories</option>
                  {MEAL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="flt-complaint-cat" className="block text-xs font-medium text-slate-700 mb-1">
                  Complaint Category
                </label>
                <select
                  id="flt-complaint-cat"
                  value={filterComplaintCat}
                  onChange={(e) => setFilterComplaintCat(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
                >
                  <option value="">All Complaint Types</option>
                  {COMPLAINT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="flt-complaint-status" className="block text-xs font-medium text-slate-700 mb-1">
                  Complaint Status
                </label>
                <select
                  id="flt-complaint-status"
                  value={filterComplaintStatus}
                  onChange={(e) => setFilterComplaintStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
                >
                  <option value="">All Statuses</option>
                  {COMPLAINT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="flt-start" className="block text-xs font-medium text-slate-700 mb-1">
                  From Service Date
                </label>
                <input
                  id="flt-start"
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900 font-mono"
                />
              </div>

              <div>
                <label htmlFor="flt-end" className="block text-xs font-medium text-slate-700 mb-1">
                  To Service Date
                </label>
                <input
                  id="flt-end"
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900 font-mono"
                />
              </div>

              <div>
                <label htmlFor="flt-min-rating" className="block text-xs font-medium text-slate-700 mb-1">
                  Overall Rating Range (Min / Max)
                </label>
                <div className="flex items-center gap-2">
                  <select
                    id="flt-min-rating"
                    aria-label="Minimum overall rating"
                    value={filterMinRating}
                    onChange={(e) => setFilterMinRating(e.target.value)}
                    className="w-1/2 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
                  >
                    <option value="">Min (1)</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        Min {n}
                      </option>
                    ))}
                  </select>
                  <select
                    id="flt-max-rating"
                    aria-label="Maximum overall rating"
                    value={filterMaxRating}
                    onChange={(e) => setFilterMaxRating(e.target.value)}
                    className="w-1/2 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
                  >
                    <option value="">Max (5)</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        Max {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="flt-sort" className="block text-xs font-medium text-slate-700 mb-1">
                  Sort Column & Order
                </label>
                <div className="flex items-center gap-2">
                  <select
                    id="flt-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-2/3 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
                  >
                    <option value="submitted_at">Submitted Time</option>
                    <option value="service_date">Service Date</option>
                    <option value="overall_rating">Overall Rating</option>
                    <option value="taste_rating">Taste Rating</option>
                    <option value="hygiene_rating">Hygiene Rating</option>
                    <option value="food_name">Food Name</option>
                  </select>
                  <select
                    aria-label="Sort direction"
                    value={sortDir}
                    onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
                    className="w-1/3 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
                  >
                    <option value="desc">DESC</option>
                    <option value="asc">ASC</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label htmlFor="flt-search" className="block text-xs font-medium text-slate-700 mb-1">
                  Search Dish Name, Comments, or Suggestions
                </label>
                <input
                  id="flt-search"
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Type keyword (e.g. salty, cold, dosa, tables)..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => loadFeedbackList(1)}
                  className="w-full py-1.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                >
                  Apply Server Filters
                </button>
              </div>
            </div>

            {fbRecords.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-semibold text-slate-800">
                  No feedback records match the current filter criteria.
                </p>
                <button
                  type="button"
                  onClick={resetFeedbackFilters}
                  className="mt-2 text-xs font-semibold text-slate-900 underline cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                        <th className="py-2.5 px-3">ID / Date</th>
                        <th className="py-2.5 px-3">Food Item</th>
                        <th className="py-2.5 px-3 text-right">T / Q / Qty / H / Overall</th>
                        <th className="py-2.5 px-3">Comments & Suggestions</th>
                        <th className="py-2.5 px-3">Complaint Status</th>
                        <th className="py-2.5 px-3 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {fbRecords.map((fb) => (
                        <tr key={fb.feedbackId} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                            <div>#{fb.feedbackId} · {fb.serviceDate}</div>
                            <div className="text-slate-400">{fb.studentAnonRef}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">{fb.foodName}</div>
                            <div className="text-xs text-slate-500">{fb.mealCategory}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-xs tabular-nums whitespace-nowrap">
                            {fb.tasteRating} · {fb.qualityRating} · {fb.quantityRating} · {fb.hygieneRating} ·{' '}
                            <strong className={fb.overallRating < 3 ? 'text-red-700' : 'text-slate-900'}>
                              {fb.overallRating}/5
                            </strong>
                          </td>
                          <td className="py-3 px-3 text-xs text-slate-700 max-w-xs">
                            <p>{fb.comments || 'No comment'}</p>
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
                          <td className="py-3 px-3 text-right whitespace-nowrap space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedComplaintForAction(fb);
                                setNewComplaintStatus(
                                  fb.complaintStatus === 'RESOLVED' ? 'RESOLVED' : 'IN_PROGRESS'
                                );
                                setActionText('');
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                            >
                              Update Status / Action
                            </button>
                            {confirmDeleteId === fb.feedbackId ? (
                              <button
                                type="button"
                                onClick={() => handleSoftDeleteFeedback(fb.feedbackId)}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer"
                              >
                                Confirm Soft-Delete
                              </button>
                            ) : (
                              <button
                                type="button"
                                aria-label={`Soft delete feedback ${fb.feedbackId}`}
                                onClick={() => setConfirmDeleteId(fb.feedbackId)}
                                className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 inline" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Server-Side Pagination Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-600">
                  <span className="font-mono tabular-nums">
                    Showing page {fbPagination.page} of {fbPagination.totalPages} ({fbPagination.total} total records)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={fbPagination.page <= 1}
                      onClick={() => loadFeedbackList(fbPagination.page - 1)}
                      className="px-3 py-1 font-medium bg-slate-100 hover:bg-slate-200 rounded disabled:opacity-40 cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={fbPagination.page >= fbPagination.totalPages}
                      onClick={() => loadFeedbackList(fbPagination.page + 1)}
                      className="px-3 py-1 font-medium bg-slate-100 hover:bg-slate-200 rounded disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 3. ADMIN FOOD RATING REPORTS & ANALYTICS */}
        {activeSubRoute === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    Food Rating Reports & Low-Rating Detection
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Methodology: SQL AVG() across non-deleted submissions rounded to 2 decimal places. Items with 0 feedback are never flagged as low-rated.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-md border border-slate-200">
                <div>
                  <label htmlFor="rep-cat" className="block text-xs font-medium text-slate-700 mb-1">
                    Meal Category
                  </label>
                  <select
                    id="rep-cat"
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  >
                    <option value="">All Categories</option>
                    {MEAL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="rep-start" className="block text-xs font-medium text-slate-700 mb-1">
                    Start Service Date
                  </label>
                  <input
                    id="rep-start"
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="rep-end" className="block text-xs font-medium text-slate-700 mb-1">
                    End Service Date
                  </label>
                  <input
                    id="rep-end"
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="rep-threshold" className="block text-xs font-medium text-slate-700 mb-1">
                    Low-Rating Threshold (1.0–5.0)
                  </label>
                  <input
                    id="rep-threshold"
                    type="number"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    value={reportThreshold}
                    onChange={(e) => setReportThreshold(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="rep-sort" className="block text-xs font-medium text-slate-700 mb-1">
                    Sort By Rating
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="rep-sort"
                      value={reportSortOrder}
                      onChange={(e) => setReportSortOrder(e.target.value as 'asc' | 'desc')}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded"
                    >
                      <option value="asc">Lowest Rated First</option>
                      <option value="desc">Highest Rated First</option>
                    </select>
                    <button
                      type="button"
                      onClick={loadReports}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded cursor-pointer whitespace-nowrap"
                    >
                      Run Report
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-2.5 px-3">Food Item</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Samples (N)</th>
                      <th className="py-2.5 px-3 text-right">Avg Taste</th>
                      <th className="py-2.5 px-3 text-right">Avg Quality</th>
                      <th className="py-2.5 px-3 text-right">Avg Quantity</th>
                      <th className="py-2.5 px-3 text-right">Avg Hygiene</th>
                      <th className="py-2.5 px-3 text-right">Avg Overall</th>
                      <th className="py-2.5 px-3">Threshold Evaluation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {reportItems.map((r) => (
                      <tr key={r.foodId} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900">{r.foodName}</span>
                          {!r.isActive && (
                            <span className="ml-2 text-xs text-slate-500">(Deactivated)</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-600">{r.mealCategory}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {r.sampleCount}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {r.avgTaste !== null ? Number(r.avgTaste).toFixed(2) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {r.avgQuality !== null ? Number(r.avgQuality).toFixed(2) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {r.avgQuantity !== null ? Number(r.avgQuantity).toFixed(2) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {r.avgHygiene !== null ? Number(r.avgHygiene).toFixed(2) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums">
                          {r.avgOverall !== null ? `${Number(r.avgOverall).toFixed(2)} / 5.00` : 'No Data'}
                        </td>
                        <td className="py-2.5 px-3 text-xs font-semibold">
                          {r.sampleCount === 0 ? (
                            <span className="text-slate-400">No Ratings (Not Flagged)</span>
                          ) : r.isLowRated ? (
                            <span className="text-red-700">
                              LOW RATED (&lt; {Number(reportThreshold || 3.0).toFixed(1)})
                            </span>
                          ) : (
                            <span className="text-emerald-700">Nominal</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. ADMIN COMPLAINT FREQUENCY & IMPROVEMENT TRACKING */}
        {activeSubRoute === 'complaints' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Complaint Counts by Category */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Complaint Frequency by Category
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  SQL GROUP BY complaint_category counts across active feedback submissions
                </p>
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3 text-right">Total</th>
                        <th className="py-2 px-3 text-right">OPEN</th>
                        <th className="py-2 px-3 text-right">IN_PROGRESS</th>
                        <th className="py-2 px-3 text-right">RESOLVED</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm font-mono tabular-nums">
                      {complaintBreakdown.map((c) => (
                        <tr key={c.category}>
                          <td className="py-2 px-3 font-sans font-semibold text-slate-900">
                            {c.category}
                          </td>
                          <td className="py-2 px-3 text-right">{c.count ?? c.totalCount ?? 0}</td>
                          <td className="py-2 px-3 text-right text-red-700 font-semibold">
                            {c.openCount}
                          </td>
                          <td className="py-2 px-3 text-right text-amber-700 font-semibold">
                            {c.inProgressCount}
                          </td>
                          <td className="py-2 px-3 text-right text-emerald-700 font-semibold">
                            {c.resolvedCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Explainable Keyword Pattern Counts */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Recurring Problem Keyword Matching
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Deterministic, explainable keyword matching on student comments and suggestions (not black-box AI)
                </p>
                <div className="space-y-3 mt-4">
                  {keywordCounts.map((kw) => (
                    <div
                      key={kw.label}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{kw.label}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          Matched terms: {kw.keywords.join(', ')}
                        </p>
                      </div>
                      <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
                        {kw.matchCount} {kw.matchCount === 1 ? 'record' : 'records'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Complaints Table with Direct Status & Improvement Action Recording */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Complaint Queue & Mess Team Improvement Actions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complaints are never marked resolved automatically. Select any complaint below to update its status and record the corrective action taken.
              </p>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-2.5 px-3">Feedback ID</th>
                      <th className="py-2.5 px-3">Dish & Service Date</th>
                      <th className="py-2.5 px-3">Category & Status</th>
                      <th className="py-2.5 px-3">Original Student Complaint & Suggestion</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {fbRecords
                      .filter((f) => f.complaintCategory !== 'NONE')
                      .map((fb) => (
                        <tr key={fb.feedbackId} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-mono text-xs tabular-nums">
                            #{fb.feedbackId}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">{fb.foodName}</div>
                            <div className="text-xs text-slate-500 font-mono">
                              {fb.mealCategory} · {fb.serviceDate} · Overall {fb.overallRating}/5
                            </div>
                          </td>
                          <td className="py-3 px-3 text-xs font-semibold whitespace-nowrap">
                            <span
                              className={
                                fb.complaintStatus === 'RESOLVED'
                                  ? 'text-emerald-700'
                                  : fb.complaintStatus === 'IN_PROGRESS'
                                  ? 'text-amber-700'
                                  : 'text-red-700'
                              }
                            >
                              {fb.complaintCategory} · {fb.complaintStatus}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-xs text-slate-700 max-w-md">
                            <p>{fb.comments}</p>
                            {fb.suggestions && (
                              <p className="text-slate-500 mt-1">Suggestion: {fb.suggestions}</p>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedComplaintForAction(fb);
                                setNewComplaintStatus(
                                  fb.complaintStatus === 'OPEN' ? 'IN_PROGRESS' : 'RESOLVED'
                                );
                                setActionText('');
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded cursor-pointer"
                            >
                              Record Improvement Action
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. ADMIN IMPROVEMENT ACTION HISTORY & AUDIT LOGS */}
        {activeSubRoute === 'improvements' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h1 className="text-xl font-bold text-slate-900">
                Mess Team Improvement Action History
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Every status change and corrective kitchen action is attributed to the responsible administrator with a UTC timestamp.
              </p>

              {improvementHistory.length === 0 ? (
                <p className="py-6 text-sm text-slate-600">No improvement actions logged yet.</p>
              ) : (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Feedback / Dish</th>
                        <th className="py-2.5 px-3">Status Transition</th>
                        <th className="py-2.5 px-3">Corrective Action Taken</th>
                        <th className="py-2.5 px-3">Responsible Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {improvementHistory.map((act) => (
                        <tr key={act.actionId} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                            {act.createdAt}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">
                              #{act.feedbackId} · {act.foodName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {act.mealCategory} · {act.complaintCategory}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs whitespace-nowrap">
                            {act.previousStatus} → <strong>{act.newStatus}</strong>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-slate-800 max-w-md">
                            {act.actionText}
                          </td>
                          <td className="py-2.5 px-3 text-xs text-slate-600 whitespace-nowrap">
                            {act.adminDisplayName}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-slate-900">Administrative Security Audit Logs</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Immutable audit trail of menu modifications, complaint status updates, and soft deletions
              </p>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-2.5 px-3">Audit ID / Time</th>
                      <th className="py-2.5 px-3">Action Type</th>
                      <th className="py-2.5 px-3">Entity</th>
                      <th className="py-2.5 px-3">Summary</th>
                      <th className="py-2.5 px-3">Administrator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {auditLogs.map((log) => (
                      <tr key={log.auditId} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                          #{log.auditId} · {log.createdAt}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs font-semibold text-slate-800 whitespace-nowrap">
                          {log.actionType}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                          {log.entityType} #{log.entityId}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-700">{log.summary}</td>
                        <td className="py-2.5 px-3 text-xs text-slate-600 whitespace-nowrap">
                          {log.adminDisplayName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. ADMIN FOOD MENU MANAGEMENT */}
        {activeSubRoute === 'menu' && (
          <div className="space-y-6">
            {/* Add / Edit Food Item Form */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    {editingFood ? `Edit Menu Item #${editingFood.foodId}` : 'Add New Dish to Mess Menu'}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Changes are persisted in the relational database first and immediately reflected on the Student Menu.
                  </p>
                </div>
                {editingFood && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFood(null);
                      setDishName('');
                      setDishDesc('');
                      setDishCategory('BREAKFAST');
                      setDishAvailable(true);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveMenuItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="menu-dish-name" className="block text-xs font-semibold text-slate-800 mb-1">
                    Food Item Name (Max 120 chars) *
                  </label>
                  <input
                    id="menu-dish-name"
                    type="text"
                    required
                    maxLength={120}
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    placeholder="e.g. Ragi Dosa with Peanut Chutney"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label htmlFor="menu-meal-category" className="block text-xs font-semibold text-slate-800 mb-1">
                    Meal Category *
                  </label>
                  <select
                    id="menu-meal-category"
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value as MealCategory)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md"
                  >
                    {MEAL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dishAvailable}
                      onChange={(e) => setDishAvailable(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <span>Available for Service Today</span>
                  </label>
                </div>

                <div className="md:col-span-3">
                  <label htmlFor="menu-dish-desc" className="block text-xs font-semibold text-slate-800 mb-1">
                    Description (Max 500 chars)
                  </label>
                  <input
                    id="menu-dish-desc"
                    type="text"
                    maxLength={500}
                    value={dishDesc}
                    onChange={(e) => setDishDesc(e.target.value)}
                    placeholder="Describe ingredients, accompaniments, and preparation style..."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingFood ? 'Save Menu Changes' : 'Add Dish to Menu'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Complete Menu Management Table */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Active & Archived Food Menu Catalog ({adminMenuItems.length} items)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Deactivating a dish hides it from the Student Menu and prevents new feedback while preserving all historical ratings and reports.
              </p>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-2.5 px-3">ID / Dish Name</th>
                      <th className="py-2.5 px-3">Meal Category</th>
                      <th className="py-2.5 px-3">Availability</th>
                      <th className="py-2.5 px-3">Menu Status</th>
                      <th className="py-2.5 px-3 text-right">Feedback Count</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {adminMenuItems.map((item) => {
                      const active = Boolean(item.isActive);
                      const avail = Boolean(item.isAvailable);
                      return (
                        <tr key={item.foodId} className="hover:bg-slate-50">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">
                              #{item.foodId} · {item.name}
                            </div>
                            {item.description && (
                              <div className="text-xs text-slate-500 max-w-md">{item.description}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-xs font-mono text-slate-700">
                            {item.mealCategory}
                          </td>
                          <td className="py-3 px-3 text-xs font-semibold">
                            {avail ? (
                              <span className="text-emerald-700">Available</span>
                            ) : (
                              <span className="text-amber-700">Unavailable</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-xs font-semibold">
                            {active ? (
                              <span className="text-emerald-700">Active on Student Menu</span>
                            ) : (
                              <span className="text-slate-500">Deactivated (Archived)</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-xs tabular-nums">
                            {item.feedbackCount || 0}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingFood(item);
                                setDishName(item.name);
                                setDishDesc(item.description || '');
                                setDishCategory(item.mealCategory);
                                setDishAvailable(Boolean(item.isAvailable));
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            {active ? (
                              <button
                                type="button"
                                onClick={() => setConfirmDeactivateItem(item)}
                                className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded cursor-pointer"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleMenuActiveStatus(item, true)}
                                className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded cursor-pointer"
                              >
                                Reactivate
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Confirmation Modal before Deactivating a Menu Item */}
            {confirmDeactivateItem && (
              <div
                role="dialog"
                aria-modal="true"
                className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
              >
                <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    Confirm Menu Item Deactivation
                  </h3>
                  <p className="text-sm text-slate-600">
                    Are you sure you want to deactivate <strong>{confirmDeactivateItem.name}</strong>?
                  </p>
                  <p className="text-xs text-slate-500">
                    Deactivating removes the item from the active Student Menu and prevents new feedback submissions while preserving all {confirmDeactivateItem.feedbackCount || 0} historical feedback records.
                  </p>
                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setConfirmDeactivateItem(null)}
                      className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleMenuActiveStatus(confirmDeactivateItem, false)}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer"
                    >
                      Confirm Deactivation
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal for Updating Complaint Status & Recording Improvement Action */}
        {selectedComplaintForAction && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          >
            <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">
                Update Complaint & Record Improvement Action (#{selectedComplaintForAction.feedbackId})
              </h3>
              <p className="text-xs text-slate-600">
                Dish: <strong>{selectedComplaintForAction.foodName}</strong> ({selectedComplaintForAction.mealCategory}) · Current Status:{' '}
                <strong className="font-mono">{selectedComplaintForAction.complaintStatus}</strong>
              </p>
              <form onSubmit={handleRecordImprovementAction} className="space-y-4">
                <div>
                  <label htmlFor="modal-new-status" className="block text-xs font-semibold text-slate-800 mb-1">
                    New Complaint Status *
                  </label>
                  <select
                    id="modal-new-status"
                    value={newComplaintStatus}
                    onChange={(e) =>
                      setNewComplaintStatus(e.target.value as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED')
                    }
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-action-text" className="block text-xs font-semibold text-slate-800 mb-1">
                    Corrective Improvement Action Taken by Mess Team *
                  </label>
                  <textarea
                    id="modal-action-text"
                    required
                    minLength={5}
                    maxLength={1000}
                    rows={3}
                    value={actionText}
                    onChange={(e) => setActionText(e.target.value)}
                    placeholder="Describe the concrete action taken (e.g. Adjusted oil temperature, added second serving line, sanitized bay 3)..."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedComplaintForAction(null)}
                    className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded cursor-pointer"
                  >
                    Save Status & Log Action
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
