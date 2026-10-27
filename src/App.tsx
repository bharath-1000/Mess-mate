import React, { useState, useEffect } from 'react';
import { AuthUser, FoodItem } from './types/messmate';
import { apiFetch, setAuthTokens } from './utils/api';
import { StudentLoginView, StudentPortalWorkspace } from './components/StudentViews';
import { AdminLoginView, AdminPortalWorkspace } from './components/AdminViews';
import {
  DeliverablesExplorerView,
  SocialCampaignStudioView,
  AccessDeniedView,
  NotFoundView,
} from './components/DeliverablesAndSocialViews';

export default function App() {
  const [route, setRoute] = useState<string>(() => window.location.pathname || '/');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [publicMenu, setPublicMenu] = useState<FoodItem[]>([]);

  function navigate(nextRoute: string) {
    window.history.pushState({}, '', nextRoute);
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    const onPopState = () => setRoute(window.location.pathname || '/');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    apiFetch<{
      authenticated: boolean;
      user: AuthUser | null;
      sessionId?: string;
      csrfToken?: string | null;
    }>('/api/auth/session').then((res) => {
      if (res.ok && res.data.authenticated && res.data.user) {
        setUser(res.data.user);
        setAuthTokens(res.data.sessionId || null, res.data.csrfToken || null);
      }
      setAuthChecked(true);
    });

    apiFetch<{ items?: FoodItem[] }>('/api/public/menu-summary').then((res) => {
      if (res.ok && res.data.items) {
        setPublicMenu(res.data.items);
      }
    });
  }, []);

  function handleLoginSuccess(loggedInUser: AuthUser, sessionId: string, csrfToken: string) {
    setAuthTokens(sessionId, csrfToken);
    setUser(loggedInUser);
    if (loggedInUser.role === 'ADMIN') {
      navigate('/admin/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  }

  async function handleLogout() {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setAuthTokens(null, null);
    setUser(null);
    navigate('/');
  }

  function renderMainContent() {
    if (!authChecked) {
      return (
        <div className="max-w-7xl mx-auto px-6 py-12 text-sm text-slate-600">
          Verifying session state...
        </div>
      );
    }

    if (route === '/student/login') {
      return <StudentLoginView onLoginSuccess={handleLoginSuccess} onNavigate={navigate} />;
    }

    if (route === '/admin/login') {
      return <AdminLoginView onLoginSuccess={handleLoginSuccess} onNavigate={navigate} />;
    }

    if (route === '/deliverables') {
      return <DeliverablesExplorerView />;
    }

    if (route === '/social-studio') {
      return <SocialCampaignStudioView />;
    }

    if (route === '/access-denied') {
      return <AccessDeniedView onNavigate={navigate} />;
    }

    // Protected Student Routes (/student/*)
    if (route.startsWith('/student/')) {
      if (!user) {
        return <StudentLoginView onLoginSuccess={handleLoginSuccess} onNavigate={navigate} />;
      }
      if (user.role !== 'STUDENT') {
        return (
          <AccessDeniedView
            reason="Administrator accounts are not permitted inside the Student feedback submission portal. Please use the Administrator Console (/admin/dashboard)."
            onNavigate={navigate}
          />
        );
      }
      const subMap: Record<string, 'dashboard' | 'menu' | 'feedback-new' | 'feedback-history'> = {
        '/student/dashboard': 'dashboard',
        '/student/menu': 'menu',
        '/student/feedback/new': 'feedback-new',
        '/student/feedback/history': 'feedback-history',
      };
      const sub = subMap[route] || 'dashboard';
      return (
        <StudentPortalWorkspace
          user={user}
          activeSubRoute={sub}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      );
    }

    // Protected Admin Routes (/admin/*)
    if (route.startsWith('/admin/')) {
      if (!user) {
        return <AdminLoginView onLoginSuccess={handleLoginSuccess} onNavigate={navigate} />;
      }
      if (user.role !== 'ADMIN') {
        return (
          <AccessDeniedView
            reason="Access Denied (HTTP 403): Student accounts are strictly prohibited from opening Administrator pages, reports, complaint queues, or menu management controls."
            onNavigate={navigate}
          />
        );
      }
      const subMap: Record<
        string,
        'dashboard' | 'feedback' | 'reports' | 'complaints' | 'improvements' | 'menu'
      > = {
        '/admin/dashboard': 'dashboard',
        '/admin/feedback': 'feedback',
        '/admin/reports': 'reports',
        '/admin/complaints': 'complaints',
        '/admin/improvements': 'improvements',
        '/admin/menu': 'menu',
      };
      const sub = subMap[route] || 'dashboard';
      return (
        <AdminPortalWorkspace
          user={user}
          activeSubRoute={sub}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      );
    }

    if (route !== '/') {
      return <NotFoundView onNavigate={navigate} />;
    }

    // Landing Page (/) with Strictly Separated Student Login & Admin Login Portals
    return (
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        {/* Hero Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <p className="text-xs font-mono text-slate-500">
                College Mess Food Feedback, Analytics &amp; Menu Governance System
              </p>
              <h1
                className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                Transparent Campus Dining Powered by Verified Student Feedback
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                MessMate connects hostel residents and mess operations through role-isolated portals. Students rate daily meals across taste, quality, quantity, and hygiene, while Administrators monitor SQL-aggregated satisfaction scores, resolve complaints, and manage the live mess menu.
              </p>
            </div>

            <div className="pt-8 mt-8 border-t border-slate-200 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/student/login')}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Student Portal Login
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="px-5 py-2.5 text-sm font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Administrator Login
              </button>
              <button
                type="button"
                onClick={() => navigate('/deliverables')}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Inspect Java / Servlet / MySQL Source →
              </button>
            </div>
          </div>

          {/* Role Portal Comparison Card */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs font-mono text-slate-500">Role 01 · STUDENT (/student/login)</p>
                <h2 className="text-lg font-bold text-slate-900 mt-1">Student Dining Portal</h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  View live Breakfast, Lunch, Dinner, and Snacks menus, submit 1–5 ratings with comments and suggestions, and track your own personal feedback history.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-500">Demo: aravind.k / Student@123</span>
                <button
                  type="button"
                  onClick={() => navigate('/student/login')}
                  className="font-semibold text-slate-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Open Student Login →
                </button>
              </div>
            </div>

            <div className="bg-slate-900 text-white border border-slate-800 rounded-lg p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs font-mono text-sky-400">Role 02 · ADMIN (/admin/login)</p>
                <h2 className="text-lg font-bold text-white mt-1">Administrator Operations Console</h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Exclusive access to all student feedback, multi-criteria SQL filtering, low-rating detection (&lt; 3.0), complaint resolution tracking, audit logs, and live menu editing.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400">Demo: mess.warden / Admin@123</span>
                <button
                  type="button"
                  onClick={() => navigate('/admin/login')}
                  className="font-semibold text-white hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Open Admin Login →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Live Active Menu Snapshot */}
        <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Today&apos;s Active Mess Menu (Live Database Snapshot)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Loaded dynamically from the food_items table · Sign in as a Student to rate any dish or as an Admin to edit the menu
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {publicMenu.length} active dishes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS'] as const).map((cat) => {
              const catItems = publicMenu.filter((i) => i.mealCategory === cat);
              return (
                <div key={cat} className="border border-slate-200 rounded-md p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <h3 className="text-xs font-bold text-slate-900 font-mono">{cat}</h3>
                    <span className="text-xs text-slate-500 font-mono tabular-nums">
                      {catItems.length}
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs">
                    {catItems.map((item) => (
                      <li key={item.foodId} className="flex items-start justify-between gap-2">
                        <span className="font-medium text-slate-800">{item.name}</span>
                        <span
                          className={`font-mono text-[11px] shrink-0 ${
                            item.isAvailable ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {item.isAvailable ? 'Avail' : 'Out'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: Strictly 3 zones separated by gap-8 */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 bg-white border-b border-slate-200">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          MessMate
        </a>

        {/* Zone 2: 4–5 single-line text navigation links */}
        <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a
            href="/student/login"
            onClick={(e) => {
              e.preventDefault();
              navigate(user?.role === 'STUDENT' ? '/student/dashboard' : '/student/login');
            }}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Student Portal
          </a>
          <a
            href="/admin/login"
            onClick={(e) => {
              e.preventDefault();
              navigate(user?.role === 'ADMIN' ? '/admin/dashboard' : '/admin/login');
            }}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Admin Console
          </a>
          <a
            href="/deliverables"
            onClick={(e) => {
              e.preventDefault();
              navigate('/deliverables');
            }}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Java &amp; SQL Source
          </a>
          <a
            href="/social-studio"
            onClick={(e) => {
              e.preventDefault();
              navigate('/social-studio');
            }}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Social Studio
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <button
              type="button"
              onClick={() =>
                navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard')
              }
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {user.role === 'ADMIN' ? 'Admin Dashboard' : 'Student Dashboard'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/student/login')}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Student Sign In
            </button>
          )}
        </div>
      </header>

      <div className="flex-1">{renderMainContent()}</div>
    </div>
  );
}
