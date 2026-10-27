import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  UserRole,
  MealCategory,
  ComplaintCategory,
  ComplaintStatus,
  ALLOWED_MEAL_CATEGORIES,
  ALLOWED_COMPLAINT_CATEGORIES,
  ALLOWED_COMPLAINT_STATUSES,
  ALLOWED_SORT_COLUMNS,
  hashPassword,
  verifyPassword,
  generateCsrfToken,
  verifyCsrfToken,
  evaluateRouteAccess,
  canStudentAccessFeedback,
  validateFeedbackInput,
  validateFoodItemInput,
} from './src/core/messmateLogic.ts';

dotenv.config();

const PORT = 3000;
const DB_PATH = path.resolve(process.cwd(), 'messmate_db.sqlite');
const db = new DatabaseSync(DB_PATH);

// Enable foreign keys and WAL mode for transactional integrity
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('STUDENT', 'ADMIN')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_role_active ON users (role, is_active);

    CREATE TABLE IF NOT EXISTS food_items (
      food_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      meal_category TEXT NOT NULL CHECK (meal_category IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS')),
      is_available INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_by_admin_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
      updated_by_admin_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (name, meal_category)
    );

    CREATE INDEX IF NOT EXISTS idx_food_category_active_avail ON food_items (meal_category, is_active, is_available);

    CREATE TABLE IF NOT EXISTS feedback (
      feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
      food_id INTEGER NOT NULL REFERENCES food_items(food_id) ON DELETE RESTRICT,
      meal_category TEXT NOT NULL CHECK (meal_category IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS')),
      service_date TEXT NOT NULL,
      taste_rating INTEGER NOT NULL CHECK (taste_rating BETWEEN 1 AND 5),
      quality_rating INTEGER NOT NULL CHECK (quality_rating BETWEEN 1 AND 5),
      quantity_rating INTEGER NOT NULL CHECK (quantity_rating BETWEEN 1 AND 5),
      hygiene_rating INTEGER NOT NULL CHECK (hygiene_rating BETWEEN 1 AND 5),
      overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
      comments TEXT,
      suggestions TEXT,
      complaint_category TEXT NOT NULL DEFAULT 'NONE' CHECK (complaint_category IN ('NONE', 'TASTE', 'QUALITY', 'QUANTITY', 'HYGIENE', 'TEMPERATURE', 'VARIETY', 'OTHER')),
      complaint_status TEXT NOT NULL DEFAULT 'NONE' CHECK (complaint_status IN ('NONE', 'OPEN', 'IN_PROGRESS', 'RESOLVED')),
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_deleted INTEGER NOT NULL DEFAULT 0,
      deleted_by_admin_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
      deleted_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_feedback_student_date ON feedback (student_id, is_deleted, submitted_at DESC);
    CREATE INDEX IF NOT EXISTS idx_feedback_food_deleted ON feedback (food_id, is_deleted);
    CREATE INDEX IF NOT EXISTS idx_feedback_service_date ON feedback (service_date, is_deleted);
    CREATE INDEX IF NOT EXISTS idx_feedback_complaint ON feedback (complaint_category, complaint_status, is_deleted);

    CREATE TABLE IF NOT EXISTS improvement_actions (
      action_id INTEGER PRIMARY KEY AUTOINCREMENT,
      feedback_id INTEGER NOT NULL REFERENCES feedback(feedback_id) ON DELETE RESTRICT,
      admin_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
      previous_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      action_text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_improvement_feedback ON improvement_actions (feedback_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS audit_logs (
      audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
      action_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs (created_at DESC);
  `);

  const userCountRow = db.prepare('SELECT COUNT(*) AS cnt FROM users').get() as { cnt: number };
  if (userCountRow.cnt === 0) {
    const adminHash = hashPassword('Admin@123', 'a1b2c3d4e5f60718293a4b5c6d7e8f90');
    const studentHash = hashPassword('Student@123', 'f0e1d2c3b4a5968778695a4b3c2d1e0f');

    const insertUser = db.prepare(`
      INSERT INTO users (user_id, username, password_hash, display_name, role, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(1, 'mess.warden', adminHash, 'Dr. Rajeshwari Menon (Chief Warden)', 'ADMIN', 1, '2026-10-01 08:00:00');
    insertUser.run(2, 'quality.admin', adminHash, 'Suresh Nair (Mess Operations Supervisor)', 'ADMIN', 1, '2026-10-01 08:15:00');
    insertUser.run(3, 'aravind.k', studentHash, 'Aravind Kumar (Hostel Block A)', 'STUDENT', 1, '2026-10-02 09:00:00');
    insertUser.run(4, 'priya.s', studentHash, 'Priya Subramanian (Hostel Block C)', 'STUDENT', 1, '2026-10-02 09:10:00');
    insertUser.run(5, 'rohan.m', studentHash, 'Rohan Mehta (Hostel Block B)', 'STUDENT', 1, '2026-10-02 09:20:00');
    insertUser.run(6, 'inactive.student', studentHash, 'Vikram Das (Graduated - Inactive)', 'STUDENT', 0, '2026-09-15 10:00:00');

    const insertFood = db.prepare(`
      INSERT INTO food_items (food_id, name, description, meal_category, is_available, is_active, created_by_admin_id, updated_by_admin_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertFood.run(1, 'Masala Dosa with Coconut Chutney & Sambar', 'Crisp fermented rice and lentil crepe stuffed with spiced potato mash, served hot with fresh coconut chutney and arachuvitta sambar.', 'BREAKFAST', 1, 1, 1, 1, '2026-10-10 07:00:00', '2026-10-25 07:00:00');
    insertFood.run(2, 'Steamed Idli & Medu Vada Platter', 'Three soft steamed idlis paired with one crispy lentil medu vada, sambar, and tomato-mint chutney.', 'BREAKFAST', 1, 1, 1, 1, '2026-10-10 07:05:00', '2026-10-25 07:05:00');
    insertFood.run(3, 'Poha with Roasted Peanuts & Sev', 'Flattened rice tempered with mustard seeds, curry leaves, turmeric, green chilies, and crunchy peanuts.', 'BREAKFAST', 0, 1, 1, 2, '2026-10-10 07:10:00', '2026-10-25 07:10:00');
    insertFood.run(4, 'South Indian Vegetarian Meals Thali', 'Steamed ponni rice, paruppu dal with ghee, vegetable kootu, poriyal, rasam, buttermilk, and papad.', 'LUNCH', 1, 1, 1, 1, '2026-10-10 12:00:00', '2026-10-25 12:00:00');
    insertFood.run(5, 'Paneer Butter Masala & Whole Wheat Phulka', 'Cottage cheese cubes simmered in rich tomato-cashew gravy served with three warm whole-wheat phulkas and jeera rice.', 'LUNCH', 1, 1, 1, 1, '2026-10-10 12:05:00', '2026-10-25 12:05:00');
    insertFood.run(6, 'Rajma Chawal Bowl with Boondi Raita', 'Slow-cooked red kidney beans in spiced onion-tomato gravy served with steamed basmati rice and chilled boondi raita.', 'LUNCH', 1, 1, 2, 2, '2026-10-10 12:10:00', '2026-10-25 12:10:00');
    insertFood.run(7, 'Vegetable Dum Biryani & Mirchi Ka Salan', 'Fragrant basmati rice layered with seasonal vegetables, saffron, and whole spices, served with peanut-sesame salan.', 'DINNER', 1, 1, 1, 1, '2026-10-10 19:00:00', '2026-10-25 19:00:00');
    insertFood.run(8, 'Chole Bhature & Pickled Onions', 'Spiced chickpea curry cooked with amchur and roasted cumin, paired with two puffed bhature.', 'DINNER', 1, 1, 1, 2, '2026-10-10 19:05:00', '2026-10-25 19:05:00');
    insertFood.run(9, 'Dal Tadka, Methi Roti & Aloo Gobi', 'Yellow lentil dal tempered with garlic and cumin, served with fenugreek rotis and dry cauliflower-potato stir fry.', 'DINNER', 1, 1, 2, 2, '2026-10-10 19:10:00', '2026-10-25 19:10:00');
    insertFood.run(10, 'Samosa Chaat & Masala Chai', 'Crushed Punjabi samosa topped with white pea curry, tamarind chutney, yogurt, and freshly brewed cardamom tea.', 'SNACKS', 1, 1, 1, 1, '2026-10-10 16:30:00', '2026-10-25 16:30:00');
    insertFood.run(11, 'Sweet Corn & Sprouted Moong Salad', 'Steamed sweet corn kernels tossed with green gram sprouts, cucumber, lemon juice, and chaat masala.', 'SNACKS', 1, 1, 2, 2, '2026-10-10 16:35:00', '2026-10-25 16:35:00');
    insertFood.run(12, 'Fried Bread Pakora (Archived Menu Item)', 'Deep-fried gram-flour battered bread slices; retired from active menu in favor of lighter steamed snacks.', 'SNACKS', 0, 0, 1, 1, '2026-10-05 16:00:00', '2026-10-20 16:00:00');

    const insertFeedback = db.prepare(`
      INSERT INTO feedback (
        feedback_id, student_id, food_id, meal_category, service_date,
        taste_rating, quality_rating, quantity_rating, hygiene_rating, overall_rating,
        comments, suggestions, complaint_category, complaint_status, submitted_at, updated_at, is_deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    insertFeedback.run(
      1, 3, 1, 'BREAKFAST', '2026-10-25',
      5, 5, 4, 5, 5,
      'The Masala Dosa was crisp and served piping hot. Coconut chutney was fresh.',
      'Adding a second ladle of sambar at the counter would speed up the queue.',
      'NONE', 'NONE', '2026-10-25 08:42:00', '2026-10-25 08:42:00'
    );
    insertFeedback.run(
      2, 3, 8, 'DINNER', '2026-10-24',
      2, 2, 3, 3, 2,
      'The bhature were overly oily and cold by 8:15 PM, and the chole was excessively salty.',
      'Please drain excess oil and keep the chole warm in covered bain-marie trays.',
      'QUALITY', 'IN_PROGRESS', '2026-10-24 20:30:00', '2026-10-25 10:15:00'
    );
    insertFeedback.run(
      3, 4, 8, 'DINNER', '2026-10-25',
      2, 2, 2, 3, 2,
      'Second time this week the Chole Bhature batch had undercooked chickpeas and cold bread.',
      'Reduce batch size so fresh bhature are fried as students arrive.',
      'TASTE', 'OPEN', '2026-10-25 20:55:00', '2026-10-25 20:55:00'
    );
    insertFeedback.run(
      4, 4, 4, 'LUNCH', '2026-10-25',
      4, 5, 5, 5, 4,
      'Very clean serving area and wholesome South Indian thali. Rasam was spot on.',
      'Include curd on all weekdays.',
      'NONE', 'NONE', '2026-10-25 13:20:00', '2026-10-25 13:20:00'
    );
    insertFeedback.run(
      5, 5, 9, 'DINNER', '2026-10-24',
      2, 3, 2, 2, 2,
      'Tables near bay 3 were not wiped between batches and the rotis ran out 20 minutes early.',
      'Assign dedicated cleaning staff during peak 8:00 PM dinner rush and prepare extra roti dough.',
      'HYGIENE', 'OPEN', '2026-10-24 21:05:00', '2026-10-24 21:05:00'
    );
    insertFeedback.run(
      6, 5, 5, 'LUNCH', '2026-10-26',
      5, 4, 4, 5, 5,
      'Paneer was soft and fresh, and the phulkas were warm without excess oil.',
      'Keep this on the Wednesday and Sunday rotation.',
      'NONE', 'NONE', '2026-10-26 13:10:00', '2026-10-26 13:10:00'
    );
    insertFeedback.run(
      7, 3, 10, 'SNACKS', '2026-10-26',
      4, 4, 3, 4, 4,
      'Cardamom tea was great, though samosa portion size could be slightly larger.',
      'Serve two mini samosas per plate.',
      'QUANTITY', 'RESOLVED', '2026-10-26 17:15:00', '2026-10-26 18:00:00'
    );

    const insertAction = db.prepare(`
      INSERT INTO improvement_actions (action_id, feedback_id, admin_id, previous_status, new_status, action_text, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertAction.run(
      1, 2, 1, 'OPEN', 'IN_PROGRESS',
      'Instructed evening kitchen supervisor to replace frying oil before dinner service and verify salt ratios in chole batch.',
      '2026-10-25 10:15:00'
    );
    insertAction.run(
      2, 7, 2, 'OPEN', 'RESOLVED',
      'Standardized snack portion to two 60g samosas per student starting this week.',
      '2026-10-26 18:00:00'
    );

    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (audit_id, admin_id, action_type, entity_type, entity_id, summary, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertAudit.run(
      1, 1, 'DEACTIVATE_MENU_ITEM', 'FOOD_ITEM', 12,
      'Deactivated Fried Bread Pakora from active student menu while preserving historical records.',
      '2026-10-20 16:00:00'
    );
    insertAudit.run(
      2, 1, 'UPDATE_COMPLAINT_STATUS', 'FEEDBACK', 2,
      'Changed complaint status from OPEN to IN_PROGRESS and logged kitchen oil & seasoning corrective action.',
      '2026-10-25 10:15:00'
    );
    insertAudit.run(
      3, 2, 'UPDATE_COMPLAINT_STATUS', 'FEEDBACK', 7,
      'Changed complaint status from OPEN to RESOLVED after standardizing snack portion weight.',
      '2026-10-26 18:00:00'
    );
  }
}

initializeDatabase();

// Server-side Session Store (30-minute timeout, regenerated on login)
interface ServerSession {
  sessionId: string;
  userId: number;
  username: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  csrfToken: string;
  expiresAt: number;
}

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const sessions = new Map<string, ServerSession>();

function parseCookies(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = decodeURIComponent(part.slice(idx + 1).trim());
      result[k] = v;
    }
  }
  return result;
}

function getActiveSession(req: Request): ServerSession | null {
  const cookies = parseCookies(req.headers.cookie);
  const headerSessionId = req.headers['x-messmate-session'] as string | undefined;
  const sessionId = headerSessionId || cookies['MESSMATE_SID'];
  if (!sessionId) return null;

  const session = sessions.get(sessionId);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }

  // Verify user is still active in DB
  const dbUser = db
    .prepare('SELECT user_id, username, display_name, role, is_active FROM users WHERE user_id = ?')
    .get(session.userId) as
    | { user_id: number; username: string; display_name: string; role: UserRole; is_active: number }
    | undefined;

  if (!dbUser || dbUser.is_active !== 1) {
    sessions.delete(sessionId);
    return null;
  }

  session.role = dbUser.role;
  session.displayName = dbUser.display_name;
  session.expiresAt = Date.now() + SESSION_TIMEOUT_MS;
  return session;
}

function createAuthenticatedSession(user: {
  user_id: number;
  username: string;
  display_name: string;
  role: UserRole;
  is_active: number;
}): ServerSession {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const csrfToken = generateCsrfToken();
  const session: ServerSession = {
    sessionId,
    userId: user.user_id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    isActive: user.is_active === 1,
    csrfToken,
    expiresAt: Date.now() + SESSION_TIMEOUT_MS,
  };
  sessions.set(sessionId, session);
  return session;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // ============================================================================
  // 1. AUTHENTICATION ENDPOINTS (Separate Student & Admin Login Flows)
  // ============================================================================

  app.get('/api/auth/session', (req: Request, res: Response) => {
    const session = getActiveSession(req);
    if (!session) {
      res.json({ authenticated: false, user: null, csrfToken: null });
      return;
    }
    res.json({
      authenticated: true,
      user: {
        userId: session.userId,
        username: session.username,
        displayName: session.displayName,
        role: session.role,
      },
      csrfToken: session.csrfToken,
      sessionId: session.sessionId,
    });
  });

  function handleRoleLogin(expectedRole: UserRole) {
    return (req: Request, res: Response) => {
      const usernameRaw = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
      const passwordRaw = typeof req.body?.password === 'string' ? req.body.password : '';

      if (!usernameRaw || !passwordRaw) {
        res.status(400).json({
          error: 'Username and password are required.',
        });
        return;
      }

      const userRow = db
        .prepare(
          'SELECT user_id, username, password_hash, display_name, role, is_active FROM users WHERE username = ?'
        )
        .get(usernameRaw) as
        | {
            user_id: number;
            username: string;
            password_hash: string;
            display_name: string;
            role: UserRole;
            is_active: number;
          }
        | undefined;

      // Generic error message so we never reveal whether username or password was wrong
      if (!userRow || !verifyPassword(passwordRaw, userRow.password_hash)) {
        res.status(401).json({
          error: 'Invalid username or password.',
        });
        return;
      }

      if (userRow.is_active !== 1) {
        res.status(403).json({
          error: 'This account is inactive. Please contact the Mess Administration office.',
        });
        return;
      }

      if (userRow.role !== expectedRole) {
        if (expectedRole === 'ADMIN') {
          res.status(403).json({
            error: 'Student accounts are not permitted on the Administrator Login portal. Please use Student Login (/student/login).',
          });
        } else {
          res.status(403).json({
            error: 'Administrator accounts must sign in through the dedicated Administrator Login portal (/admin/login).',
          });
        }
        return;
      }

      // Invalidate any previous session ID before regenerating
      const existing = getActiveSession(req);
      if (existing) {
        sessions.delete(existing.sessionId);
      }

      const newSession = createAuthenticatedSession(userRow);
      res.setHeader(
        'Set-Cookie',
        `MESSMATE_SID=${newSession.sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1800`
      );

      res.json({
        authenticated: true,
        sessionId: newSession.sessionId,
        csrfToken: newSession.csrfToken,
        user: {
          userId: newSession.userId,
          username: newSession.username,
          displayName: newSession.displayName,
          role: newSession.role,
        },
      });
    };
  }

  app.post('/api/auth/student/login', handleRoleLogin('STUDENT'));
  app.post('/api/auth/admin/login', handleRoleLogin('ADMIN'));

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const existing = getActiveSession(req);
    if (existing) {
      sessions.delete(existing.sessionId);
    }
    res.setHeader('Set-Cookie', 'MESSMATE_SID=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    res.json({ loggedOut: true });
  });

  // ============================================================================
  // 2. SERVER-SIDE ROLE AUTHORIZATION & CSRF MIDDLEWARE
  // ============================================================================

  function requireRole(requiredRole: UserRole) {
    return (req: Request, res: Response, next: NextFunction) => {
      const session = getActiveSession(req);
      const decision = evaluateRouteAccess(
        requiredRole === 'ADMIN' ? '/api/admin' : '/api/student',
        session ? { userId: session.userId, role: session.role, isActive: session.isActive } : null
      );

      if (!decision.allowed || !session) {
        res.status(decision.statusCode).json({
          error: decision.reason || 'Unauthorized access.',
          code: decision.statusCode === 403 ? 'ACCESS_DENIED' : 'AUTH_REQUIRED',
        });
        return;
      }

      // Enforce CSRF token validation on state-changing operations
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase())) {
        const clientCsrf =
          (req.headers['x-csrf-token'] as string | undefined) ||
          (typeof req.body?._csrf === 'string' ? req.body._csrf : undefined);
        if (!verifyCsrfToken(session.csrfToken, clientCsrf)) {
          res.status(403).json({
            error: 'Security (CSRF) token verification failed. Please refresh and try again.',
            code: 'CSRF_INVALID',
          });
          return;
        }
      }

      (req as Request & { authSession: ServerSession }).authSession = session;
      next();
    };
  }

  // Public read-only menu preview for landing page overview (only active items)
  app.get('/api/public/menu-summary', (_req: Request, res: Response) => {
    const items = db
      .prepare(
        `SELECT food_id AS foodId, name, description, meal_category AS mealCategory, is_available AS isAvailable
         FROM food_items
         WHERE is_active = 1
         ORDER BY CASE meal_category
           WHEN 'BREAKFAST' THEN 1
           WHEN 'LUNCH' THEN 2
           WHEN 'DINNER' THEN 3
           WHEN 'SNACKS' THEN 4
         END, name ASC`
      )
      .all();
    res.json({ items });
  });

  // ============================================================================
  // 3. STUDENT PORTAL ROUTES (/api/student/*)
  // ============================================================================

  app.get('/api/student/dashboard', requireRole('STUDENT'), (req: Request, res: Response) => {
    const session = (req as Request & { authSession: ServerSession }).authSession;

    const menuItems = db
      .prepare(
        `SELECT food_id AS foodId, name, description, meal_category AS mealCategory,
                is_available AS isAvailable, is_active AS isActive, updated_at AS updatedAt
         FROM food_items
         WHERE is_active = 1
         ORDER BY CASE meal_category
           WHEN 'BREAKFAST' THEN 1
           WHEN 'LUNCH' THEN 2
           WHEN 'DINNER' THEN 3
           WHEN 'SNACKS' THEN 4
         END, name ASC`
      )
      .all();

    // Retrieve ONLY the authenticated student's own non-deleted feedback
    const myFeedback = db
      .prepare(
        `SELECT f.feedback_id AS feedbackId, f.student_id AS studentId, f.food_id AS foodId,
                fi.name AS foodName, f.meal_category AS mealCategory, f.service_date AS serviceDate,
                f.taste_rating AS tasteRating, f.quality_rating AS qualityRating,
                f.quantity_rating AS quantityRating, f.hygiene_rating AS hygieneRating,
                f.overall_rating AS overallRating, f.comments, f.suggestions,
                f.complaint_category AS complaintCategory, f.complaint_status AS complaintStatus,
                f.submitted_at AS submittedAt, f.updated_at AS updatedAt
         FROM feedback f
         INNER JOIN food_items fi ON f.food_id = fi.food_id
         WHERE f.student_id = ? AND f.is_deleted = 0
         ORDER BY f.submitted_at DESC, f.feedback_id DESC`
      )
      .all(session.userId);

    res.json({
      student: {
        userId: session.userId,
        displayName: session.displayName,
        username: session.username,
      },
      menuItems,
      myFeedback,
    });
  });

  app.get('/api/student/feedback/:id', requireRole('STUDENT'), (req: Request, res: Response) => {
    const session = (req as Request & { authSession: ServerSession }).authSession;
    const feedbackId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
      res.status(400).json({ error: 'Invalid feedback ID.' });
      return;
    }

    const row = db
      .prepare(
        `SELECT f.feedback_id AS feedbackId, f.student_id AS studentId, f.food_id AS foodId,
                fi.name AS foodName, f.meal_category AS mealCategory, f.service_date AS serviceDate,
                f.taste_rating AS tasteRating, f.quality_rating AS qualityRating,
                f.quantity_rating AS quantityRating, f.hygiene_rating AS hygieneRating,
                f.overall_rating AS overallRating, f.comments, f.suggestions,
                f.complaint_category AS complaintCategory, f.complaint_status AS complaintStatus,
                f.submitted_at AS submittedAt
         FROM feedback f
         INNER JOIN food_items fi ON f.food_id = fi.food_id
         WHERE f.feedback_id = ? AND f.is_deleted = 0`
      )
      .get(feedbackId) as { studentId: number; [k: string]: unknown } | undefined;

    if (!row) {
      res.status(404).json({ error: 'Feedback record not found.' });
      return;
    }

    // Strict ownership check on every detail request
    if (!canStudentAccessFeedback(session.userId, row.studentId)) {
      res.status(403).json({
        error: 'Access Denied: You may only view your own submitted feedback records.',
      });
      return;
    }

    res.json({ feedback: row });
  });

  app.post('/api/student/feedback', requireRole('STUDENT'), (req: Request, res: Response) => {
    const session = (req as Request & { authSession: ServerSession }).authSession;

    // Load active food IDs from DB for server-side verification
    const activeFoodRows = db
      .prepare('SELECT food_id FROM food_items WHERE is_active = 1')
      .all() as Array<{ food_id: number }>;
    const activeFoodIds = new Set(activeFoodRows.map((r) => r.food_id));

    const validation = validateFeedbackInput(req.body || {}, activeFoodIds);
    if (!validation.valid || !validation.sanitized) {
      res.status(400).json({
        error: validation.errors[0],
        errors: validation.errors,
      });
      return;
    }

    const s = validation.sanitized;

    try {
      db.exec('BEGIN IMMEDIATE TRANSACTION');

      // Check duplicate submission policy: same student, food item, and service date (non-deleted)
      const duplicate = db
        .prepare(
          `SELECT feedback_id FROM feedback
           WHERE student_id = ? AND food_id = ? AND service_date = ? AND is_deleted = 0`
        )
        .get(session.userId, s.foodId, s.serviceDate) as { feedback_id: number } | undefined;

      if (duplicate) {
        db.exec('ROLLBACK');
        res.status(409).json({
          error:
            'Duplicate submission policy: You have already submitted feedback for this dish on the selected service date.',
          errors: [
            'You have already submitted feedback for this dish on the selected service date.',
          ],
        });
        return;
      }

      // Obtain student_id strictly from authenticated server session
      const insertStmt = db.prepare(`
        INSERT INTO feedback (
          student_id, food_id, meal_category, service_date,
          taste_rating, quality_rating, quantity_rating, hygiene_rating, overall_rating,
          comments, suggestions, complaint_category, complaint_status,
          submitted_at, updated_at, is_deleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 0)
      `);

      const result = insertStmt.run(
        session.userId,
        s.foodId,
        s.mealCategory,
        s.serviceDate,
        s.tasteRating,
        s.qualityRating,
        s.quantityRating,
        s.hygieneRating,
        s.overallRating,
        s.comments || null,
        s.suggestions || null,
        s.complaintCategory,
        s.complaintStatus
      );

      db.exec('COMMIT');

      res.status(201).json({
        message: 'Your meal feedback has been verified and saved to the database.',
        feedbackId: Number(result.lastInsertRowid),
      });
    } catch (err) {
      try {
        db.exec('ROLLBACK');
      } catch {
        // ignore rollback error
      }
      console.error('Transaction failed during feedback insert:', err);
      res.status(500).json({
        error: 'Database error while saving feedback. Transaction was rolled back cleanly.',
      });
    }
  });

  // ============================================================================
  // 4. ADMIN PORTAL ROUTES (/api/admin/*)
  // ============================================================================

  app.get('/api/admin/dashboard', requireRole('ADMIN'), (req: Request, res: Response) => {
    const thresholdRaw = Number.parseFloat(String(req.query.threshold || '3.0'));
    const lowRatingThreshold =
      !Number.isNaN(thresholdRaw) && thresholdRaw >= 1.0 && thresholdRaw <= 5.0 ? thresholdRaw : 3.0;

    const summaryRow = db
      .prepare(
        `SELECT COUNT(*) AS totalSubmissions,
                ROUND(AVG(overall_rating), 2) AS avgOverallSatisfaction,
                SUM(CASE WHEN complaint_category != 'NONE' AND complaint_status IN ('OPEN', 'IN_PROGRESS') THEN 1 ELSE 0 END) AS unresolvedComplaintsCount
         FROM feedback
         WHERE is_deleted = 0`
      )
      .get() as {
      totalSubmissions: number;
      avgOverallSatisfaction: number | null;
      unresolvedComplaintsCount: number | null;
    };

    const lowRatedItems = db
      .prepare(
        `SELECT fi.food_id AS foodId, fi.name AS foodName, fi.meal_category AS mealCategory,
                COUNT(f.feedback_id) AS sampleCount,
                ROUND(AVG(f.overall_rating), 2) AS avgOverall
         FROM food_items fi
         INNER JOIN feedback f ON fi.food_id = f.food_id AND f.is_deleted = 0
         GROUP BY fi.food_id, fi.name, fi.meal_category
         HAVING COUNT(f.feedback_id) > 0 AND AVG(f.overall_rating) < ?
         ORDER BY avgOverall ASC`
      )
      .all(lowRatingThreshold);

    const recentFeedback = db
      .prepare(
        `SELECT f.feedback_id AS feedbackId, f.food_id AS foodId, fi.name AS foodName,
                f.meal_category AS mealCategory, f.service_date AS serviceDate,
                f.taste_rating AS tasteRating, f.quality_rating AS qualityRating,
                f.quantity_rating AS quantityRating, f.hygiene_rating AS hygieneRating,
                f.overall_rating AS overallRating, f.comments, f.suggestions,
                f.complaint_category AS complaintCategory, f.complaint_status AS complaintStatus,
                f.submitted_at AS submittedAt,
                'Student #' || f.student_id AS studentAnonRef
         FROM feedback f
         INNER JOIN food_items fi ON f.food_id = fi.food_id
         WHERE f.is_deleted = 0
         ORDER BY f.submitted_at DESC, f.feedback_id DESC
         LIMIT 8`
      )
      .all();

    const complaintBreakdown = db
      .prepare(
        `SELECT complaint_category AS category,
                COUNT(*) AS totalCount,
                SUM(CASE WHEN complaint_status = 'OPEN' THEN 1 ELSE 0 END) AS openCount,
                SUM(CASE WHEN complaint_status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS inProgressCount,
                SUM(CASE WHEN complaint_status = 'RESOLVED' THEN 1 ELSE 0 END) AS resolvedCount
         FROM feedback
         WHERE is_deleted = 0 AND complaint_category != 'NONE'
         GROUP BY complaint_category
         ORDER BY totalCount DESC`
      )
      .all();

    res.json({
      metrics: {
        totalSubmissions: summaryRow.totalSubmissions || 0,
        avgOverallSatisfaction: summaryRow.avgOverallSatisfaction ?? 0,
        lowRatedFoodCount: lowRatedItems.length,
        unresolvedComplaintsCount: summaryRow.unresolvedComplaintsCount || 0,
        lowRatingThreshold,
      },
      lowRatedItems,
      recentFeedback,
      complaintBreakdown,
    });
  });

  // Admin Feedback Management with Server-Side Filters, Search, Sort Allowlist, and Pagination
  app.get('/api/admin/feedback', requireRole('ADMIN'), (req: Request, res: Response) => {
    const foodId = req.query.foodId ? Number.parseInt(String(req.query.foodId), 10) : null;
    const mealCategory = req.query.mealCategory ? String(req.query.mealCategory).toUpperCase() : null;
    const startDate = req.query.startDate ? String(req.query.startDate).trim() : null;
    const endDate = req.query.endDate ? String(req.query.endDate).trim() : null;
    const minRating = req.query.minRating ? Number.parseInt(String(req.query.minRating), 10) : null;
    const maxRating = req.query.maxRating ? Number.parseInt(String(req.query.maxRating), 10) : null;
    const complaintCategory = req.query.complaintCategory
      ? String(req.query.complaintCategory).toUpperCase()
      : null;
    const complaintStatus = req.query.complaintStatus
      ? String(req.query.complaintStatus).toUpperCase()
      : null;
    const search = req.query.search ? String(req.query.search).trim() : null;

    const sortByKey = req.query.sortBy ? String(req.query.sortBy) : 'submitted_at';
    const sortColumn = ALLOWED_SORT_COLUMNS.get(sortByKey) || 'f.submitted_at';
    const sortDir = String(req.query.sortDir || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const page = Math.max(1, Number.parseInt(String(req.query.page || '1'), 10) || 1);
    const pageSize = Math.min(50, Math.max(5, Number.parseInt(String(req.query.pageSize || '10'), 10) || 10));
    const offset = (page - 1) * pageSize;

    const whereClauses: string[] = ['f.is_deleted = 0'];
    const params: Array<string | number> = [];

    if (foodId && Number.isInteger(foodId) && foodId > 0) {
      whereClauses.push('f.food_id = ?');
      params.push(foodId);
    }
    if (mealCategory && ALLOWED_MEAL_CATEGORIES.has(mealCategory as MealCategory)) {
      whereClauses.push('f.meal_category = ?');
      params.push(mealCategory);
    }
    if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      whereClauses.push('f.service_date >= ?');
      params.push(startDate);
    }
    if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      whereClauses.push('f.service_date <= ?');
      params.push(endDate);
    }
    if (minRating && minRating >= 1 && minRating <= 5) {
      whereClauses.push('f.overall_rating >= ?');
      params.push(minRating);
    }
    if (maxRating && maxRating >= 1 && maxRating <= 5) {
      whereClauses.push('f.overall_rating <= ?');
      params.push(maxRating);
    }
    if (complaintCategory && ALLOWED_COMPLAINT_CATEGORIES.has(complaintCategory as ComplaintCategory)) {
      whereClauses.push('f.complaint_category = ?');
      params.push(complaintCategory);
    }
    if (complaintStatus && ALLOWED_COMPLAINT_STATUSES.has(complaintStatus as ComplaintStatus)) {
      whereClauses.push('f.complaint_status = ?');
      params.push(complaintStatus);
    }
    if (search) {
      whereClauses.push('(fi.name LIKE ? OR f.comments LIKE ? OR f.suggestions LIKE ?)');
      const likeTerm = `%${search}%`;
      params.push(likeTerm, likeTerm, likeTerm);
    }

    const whereSql = whereClauses.join(' AND ');

    const countRow = db
      .prepare(
        `SELECT COUNT(*) AS total
         FROM feedback f
         INNER JOIN food_items fi ON f.food_id = fi.food_id
         WHERE ${whereSql}`
      )
      .get(...params) as { total: number };

    const records = db
      .prepare(
        `SELECT f.feedback_id AS feedbackId, f.food_id AS foodId, fi.name AS foodName,
                f.meal_category AS mealCategory, f.service_date AS serviceDate,
                f.taste_rating AS tasteRating, f.quality_rating AS qualityRating,
                f.quantity_rating AS quantityRating, f.hygiene_rating AS hygieneRating,
                f.overall_rating AS overallRating, f.comments, f.suggestions,
                f.complaint_category AS complaintCategory, f.complaint_status AS complaintStatus,
                f.submitted_at AS submittedAt, f.updated_at AS updatedAt,
                'Student #' || f.student_id AS studentAnonRef
         FROM feedback f
         INNER JOIN food_items fi ON f.food_id = fi.food_id
         WHERE ${whereSql}
         ORDER BY ${sortColumn} ${sortDir}, f.feedback_id DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, pageSize, offset);

    res.json({
      records,
      pagination: {
        total: countRow.total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(countRow.total / pageSize)),
      },
    });
  });

  // Admin Feedback Authorized Edit / Soft-Delete with Audit Logging
  app.patch('/api/admin/feedback/:id', requireRole('ADMIN'), (req: Request, res: Response) => {
    const session = (req as Request & { authSession: ServerSession }).authSession;
    const feedbackId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
      res.status(400).json({ error: 'Invalid feedback ID.' });
      return;
    }

    const existing = db
      .prepare('SELECT feedback_id, complaint_category, complaint_status, is_deleted FROM feedback WHERE feedback_id = ?')
      .get(feedbackId) as
      | { feedback_id: number; complaint_category: string; complaint_status: string; is_deleted: number }
      | undefined;

    if (!existing || existing.is_deleted === 1) {
      res.status(404).json({ error: 'Feedback record not found.' });
      return;
    }

    const action = req.body?.action;
    try {
      db.exec('BEGIN IMMEDIATE TRANSACTION');

      if (action === 'softDelete') {
        db.prepare(
          `UPDATE feedback
           SET is_deleted = 1, deleted_by_admin_id = ?, deleted_at = datetime('now'), updated_at = datetime('now')
           WHERE feedback_id = ?`
        ).run(session.userId, feedbackId);

        db.prepare(
          `INSERT INTO audit_logs (admin_id, action_type, entity_type, entity_id, summary, created_at)
           VALUES (?, 'SOFT_DELETE_FEEDBACK', 'FEEDBACK', ?, ?, datetime('now'))`
        ).run(
          session.userId,
          feedbackId,
          `Soft-deleted feedback record #${feedbackId} from analytics and normal reports.`
        );

        db.exec('COMMIT');
        res.json({ message: `Feedback #${feedbackId} has been soft-deleted and logged in the audit trail.` });
        return;
      }

      // Authorized update of complaint category or status
      const newCategory = req.body?.complaintCategory
        ? String(req.body.complaintCategory).toUpperCase()
        : existing.complaint_category;
      const newStatus = req.body?.complaintStatus
        ? String(req.body.complaintStatus).toUpperCase()
        : existing.complaint_status;

      if (
        !ALLOWED_COMPLAINT_CATEGORIES.has(newCategory as ComplaintCategory) ||
        !ALLOWED_COMPLAINT_STATUSES.has(newStatus as ComplaintStatus)
      ) {
        db.exec('ROLLBACK');
        res.status(400).json({ error: 'Invalid complaint category or status.' });
        return;
      }

      db.prepare(
        `UPDATE feedback
         SET complaint_category = ?, complaint_status = ?, updated_at = datetime('now')
         WHERE feedback_id = ?`
      ).run(newCategory, newStatus, feedbackId);

      db.prepare(
        `INSERT INTO audit_logs (admin_id, action_type, entity_type, entity_id, summary, created_at)
         VALUES (?, 'EDIT_FEEDBACK_CLASSIFICATION', 'FEEDBACK', ?, ?, datetime('now'))`
      ).run(
        session.userId,
        feedbackId,
        `Updated feedback #${feedbackId} classification (${existing.complaint_category}/${existing.complaint_status} -> ${newCategory}/${newStatus}).`
      );

      db.exec('COMMIT');
      res.json({ message: `Feedback #${feedbackId} updated and recorded in audit logs.` });
    } catch (err) {
      try {
        db.exec('ROLLBACK');
      } catch {
        // ignore
      }
      console.error('Failed to update feedback:', err);
      res.status(500).json({ error: 'Database error while updating feedback.' });
    }
  });

  // Admin Food Rating Reports & Complaint Frequency Analytics
  app.get('/api/admin/reports', requireRole('ADMIN'), (req: Request, res: Response) => {
    const mealCategory = req.query.mealCategory ? String(req.query.mealCategory).toUpperCase() : null;
    const startDate = req.query.startDate ? String(req.query.startDate).trim() : null;
    const endDate = req.query.endDate ? String(req.query.endDate).trim() : null;
    const sortOrder = String(req.query.sortOrder || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const thresholdRaw = Number.parseFloat(String(req.query.threshold || '3.0'));
    const lowRatingThreshold =
      !Number.isNaN(thresholdRaw) && thresholdRaw >= 1.0 && thresholdRaw <= 5.0 ? thresholdRaw : 3.0;

    const joinConditions: string[] = ['f.is_deleted = 0'];
    const joinParams: Array<string | number> = [];

    if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      joinConditions.push('f.service_date >= ?');
      joinParams.push(startDate);
    }
    if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      joinConditions.push('f.service_date <= ?');
      joinParams.push(endDate);
    }

    const whereConditions: string[] = ['1=1'];
    const whereParams: Array<string | number> = [];
    if (mealCategory && ALLOWED_MEAL_CATEGORIES.has(mealCategory as MealCategory)) {
      whereConditions.push('fi.meal_category = ?');
      whereParams.push(mealCategory);
    }

    const rows = db
      .prepare(
        `SELECT fi.food_id AS foodId, fi.name AS foodName, fi.meal_category AS mealCategory,
                fi.is_active AS isActive, fi.is_available AS isAvailable,
                COUNT(f.feedback_id) AS sampleCount,
                ROUND(AVG(f.taste_rating), 2) AS avgTaste,
                ROUND(AVG(f.quality_rating), 2) AS avgQuality,
                ROUND(AVG(f.quantity_rating), 2) AS avgQuantity,
                ROUND(AVG(f.hygiene_rating), 2) AS avgHygiene,
                ROUND(AVG(f.overall_rating), 2) AS avgOverall,
                SUM(CASE WHEN f.complaint_category != 'NONE' THEN 1 ELSE 0 END) AS complaintCount,
                SUM(CASE WHEN f.complaint_status IN ('OPEN', 'IN_PROGRESS') THEN 1 ELSE 0 END) AS unresolvedCount
         FROM food_items fi
         LEFT JOIN feedback f ON fi.food_id = f.food_id AND ${joinConditions.join(' AND ')}
         WHERE ${whereConditions.join(' AND ')}
         GROUP BY fi.food_id, fi.name, fi.meal_category, fi.is_active, fi.is_available
         ORDER BY CASE WHEN COUNT(f.feedback_id) = 0 THEN 1 ELSE 0 END ASC,
                  avgOverall ${sortOrder}, fi.name ASC`
      )
      .all(...joinParams, ...whereParams) as Array<{
      foodId: number;
      foodName: string;
      mealCategory: MealCategory;
      isActive: number;
      isAvailable: number;
      sampleCount: number;
      avgTaste: number | null;
      avgQuality: number | null;
      avgQuantity: number | null;
      avgHygiene: number | null;
      avgOverall: number | null;
      complaintCount: number | null;
      unresolvedCount: number | null;
    }>;

    const itemReports = rows.map((r) => ({
      ...r,
      isActive: r.isActive === 1,
      isAvailable: r.isAvailable === 1,
      complaintCount: r.complaintCount || 0,
      unresolvedCount: r.unresolvedCount || 0,
      // Do not flag items with 0 feedback as low-rated
      isLowRated: r.sampleCount > 0 && r.avgOverall !== null && r.avgOverall < lowRatingThreshold,
    }));

    // Complaint frequency & explainable keyword pattern count
    const complaintFilterClauses = ["f.is_deleted = 0", "f.complaint_category != 'NONE'"];
    const complaintParams: Array<string | number> = [];
    if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      complaintFilterClauses.push('f.service_date >= ?');
      complaintParams.push(startDate);
    }
    if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      complaintFilterClauses.push('f.service_date <= ?');
      complaintParams.push(endDate);
    }
    if (mealCategory && ALLOWED_MEAL_CATEGORIES.has(mealCategory as MealCategory)) {
      complaintFilterClauses.push('f.meal_category = ?');
      complaintParams.push(mealCategory);
    }

    const complaintCategories = db
      .prepare(
        `SELECT f.complaint_category AS category,
                COUNT(*) AS count,
                SUM(CASE WHEN f.complaint_status = 'OPEN' THEN 1 ELSE 0 END) AS openCount,
                SUM(CASE WHEN f.complaint_status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS inProgressCount,
                SUM(CASE WHEN f.complaint_status = 'RESOLVED' THEN 1 ELSE 0 END) AS resolvedCount
         FROM feedback f
         WHERE ${complaintFilterClauses.join(' AND ')}
         GROUP BY f.complaint_category
         ORDER BY count DESC`
      )
      .all(...complaintParams);

    // Explainable keyword frequency matching on comment/suggestion text
    const commentRows = db
      .prepare(
        `SELECT comments, suggestions FROM feedback f WHERE ${complaintFilterClauses.join(' AND ')}`
      )
      .all(...complaintParams) as Array<{ comments: string | null; suggestions: string | null }>;

    const keywordPatterns = [
      { label: 'Cold / Temperature Issue', keywords: ['cold', 'lukewarm', 'warm', 'bain-marie'] },
      { label: 'Excess Oil / Greasy Preparation', keywords: ['oily', 'oil', 'greasy', 'fried'] },
      { label: 'Seasoning / Salt Imbalance', keywords: ['salty', 'salt', 'bland', 'spicy', 'undercooked'] },
      { label: 'Portion / Queue Shortage', keywords: ['ran out', 'portion', 'smaller', 'queue', 'extra'] },
      { label: 'Table & Counter Hygiene', keywords: ['wiped', 'clean', 'hygiene', 'tables', 'tray'] },
    ];

    const recurringKeywordCounts = keywordPatterns.map((pat) => {
      let matchCount = 0;
      for (const row of commentRows) {
        const combined = `${row.comments || ''} ${row.suggestions || ''}`.toLowerCase();
        if (pat.keywords.some((kw) => combined.includes(kw))) {
          matchCount++;
        }
      }
      return {
        label: pat.label,
        keywords: pat.keywords,
        matchCount,
      };
    });

    res.json({
      lowRatingThreshold,
      itemReports,
      complaintCategories,
      recurringKeywordCounts,
    });
  });

  // Admin Complaint Status Update & Improvement Action Recording
  app.post('/api/admin/complaints/:feedbackId/action', requireRole('ADMIN'), (req: Request, res: Response) => {
    const session = (req as Request & { authSession: ServerSession }).authSession;
    const feedbackId = Number.parseInt(req.params.feedbackId, 10);
    const newStatus = typeof req.body?.newStatus === 'string' ? req.body.newStatus.trim().toUpperCase() : '';
    const actionText = typeof req.body?.actionText === 'string' ? req.body.actionText.trim() : '';

    if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
      res.status(400).json({ error: 'Invalid feedback ID.' });
      return;
    }
    if (!['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(newStatus)) {
      res.status(400).json({ error: 'Complaint status must be OPEN, IN_PROGRESS, or RESOLVED.' });
      return;
    }
    if (!actionText || actionText.length < 5 || actionText.length > 1000) {
      res.status(400).json({
        error: 'Please enter a descriptive improvement action taken by the mess team (5 to 1000 characters).',
      });
      return;
    }

    const fb = db
      .prepare('SELECT feedback_id, complaint_status, is_deleted FROM feedback WHERE feedback_id = ?')
      .get(feedbackId) as { feedback_id: number; complaint_status: string; is_deleted: number } | undefined;

    if (!fb || fb.is_deleted === 1) {
      res.status(404).json({ error: 'Feedback record not found.' });
      return;
    }

    try {
      db.exec('BEGIN IMMEDIATE TRANSACTION');

      db.prepare(
        `UPDATE feedback SET complaint_status = ?, updated_at = datetime('now') WHERE feedback_id = ?`
      ).run(newStatus, feedbackId);

      db.prepare(
        `INSERT INTO improvement_actions (feedback_id, admin_id, previous_status, new_status, action_text, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`
      ).run(feedbackId, session.userId, fb.complaint_status, newStatus, actionText);

      db.prepare(
        `INSERT INTO audit_logs (admin_id, action_type, entity_type, entity_id, summary, created_at)
         VALUES (?, 'UPDATE_COMPLAINT_STATUS', 'FEEDBACK', ?, ?, datetime('now'))`
      ).run(
        session.userId,
        feedbackId,
        `Updated complaint #${feedbackId} from ${fb.complaint_status} to ${newStatus}: ${actionText.slice(0, 120)}`
      );

      db.exec('COMMIT');
      res.json({
        message: `Complaint #${feedbackId} updated to ${newStatus} and improvement action logged.`,
      });
    } catch (err) {
      try {
        db.exec('ROLLBACK');
      } catch {
        // ignore
      }
      console.error('Error recording improvement action:', err);
      res.status(500).json({ error: 'Database transaction failed while updating complaint.' });
    }
  });

  // Admin Improvement Action History & Audit Trail
  app.get('/api/admin/improvements', requireRole('ADMIN'), (_req: Request, res: Response) => {
    const actions = db
      .prepare(
        `SELECT ia.action_id AS actionId, ia.feedback_id AS feedbackId,
                fi.name AS foodName, f.meal_category AS mealCategory,
                f.service_date AS serviceDate, f.complaint_category AS complaintCategory,
                ia.previous_status AS previousStatus, ia.new_status AS newStatus,
                ia.action_text AS actionText, ia.created_at AS createdAt,
                u.display_name AS adminDisplayName
         FROM improvement_actions ia
         INNER JOIN feedback f ON ia.feedback_id = f.feedback_id
         INNER JOIN food_items fi ON f.food_id = fi.food_id
         INNER JOIN users u ON ia.admin_id = u.user_id
         ORDER BY ia.created_at DESC, ia.action_id DESC`
      )
      .all();

    const auditLogs = db
      .prepare(
        `SELECT al.audit_id AS auditId, al.action_type AS actionType,
                al.entity_type AS entityType, al.entity_id AS entityId,
                al.summary, al.created_at AS createdAt,
                u.display_name AS adminDisplayName
         FROM audit_logs al
         INNER JOIN users u ON al.admin_id = u.user_id
         ORDER BY al.created_at DESC, al.audit_id DESC
         LIMIT 50`
      )
      .all();

    res.json({ actions, auditLogs });
  });

  // Admin Food Menu Management (List All, Add, Edit, Toggle Availability, Deactivate/Reactivate)
  app.get('/api/admin/menu', requireRole('ADMIN'), (_req: Request, res: Response) => {
    const items = db
      .prepare(
        `SELECT fi.food_id AS foodId, fi.name, fi.description, fi.meal_category AS mealCategory,
                fi.is_available AS isAvailable, fi.is_active AS isActive,
                fi.created_at AS createdAt, fi.updated_at AS updatedAt,
                u.display_name AS updatedByAdminName,
                (SELECT COUNT(*) FROM feedback f WHERE f.food_id = fi.food_id AND f.is_deleted = 0) AS feedbackCount
         FROM food_items fi
         LEFT JOIN users u ON fi.updated_by_admin_id = u.user_id
         ORDER BY fi.is_active DESC,
                  CASE fi.meal_category
                    WHEN 'BREAKFAST' THEN 1
                    WHEN 'LUNCH' THEN 2
                    WHEN 'DINNER' THEN 3
                    WHEN 'SNACKS' THEN 4
                  END, fi.name ASC`
      )
      .all() as Array<Record<string, unknown>>;

    res.json({
      items: items.map((item) => ({
        ...item,
        isAvailable: item.isAvailable === 1,
        isActive: item.isActive === 1,
      })),
    });
  });

  app.post('/api/admin/menu', requireRole('ADMIN'), (req: Request, res: Response) => {
    const session = (req as Request & { authSession: ServerSession }).authSession;
    const validation = validateFoodItemInput(req.body || {});
    if (!validation.valid || !validation.sanitized) {
      res.status(400).json({ error: validation.errors[0], errors: validation.errors });
      return;
    }

    const s = validation.sanitized;

    const duplicate = db
      .prepare('SELECT food_id FROM food_items WHERE LOWER(name) = LOWER(?) AND meal_category = ?')
      .get(s.name, s.mealCategory) as { food_id: number } | undefined;

    if (duplicate) {
      res.status(409).json({
        error: `A food item named "${s.name}" already exists in ${s.mealCategory}.`,
      });
      return;
    }

    try {
      db.exec('BEGIN IMMEDIATE TRANSACTION');
      const result = db
        .prepare(
          `INSERT INTO food_items (name, description, meal_category, is_available, is_active, created_by_admin_id, updated_by_admin_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, ?, ?, datetime('now'), datetime('now'))`
        )
        .run(s.name, s.description || null, s.mealCategory, s.isAvailable ? 1 : 0, session.userId, session.userId);

      const newFoodId = Number(result.lastInsertRowid);
      db.prepare(
        `INSERT INTO audit_logs (admin_id, action_type, entity_type, entity_id, summary, created_at)
         VALUES (?, 'CREATE_MENU_ITEM', 'FOOD_ITEM', ?, ?, datetime('now'))`
      ).run(session.userId, newFoodId, `Added "${s.name}" (${s.mealCategory}) to the mess menu.`);

      db.exec('COMMIT');
      res.status(201).json({
        message: `"${s.name}" has been added to the active ${s.mealCategory} menu.`,
        foodId: newFoodId,
      });
    } catch (err) {
      try {
        db.exec('ROLLBACK');
      } catch {
        // ignore
      }
      console.error('Error creating food item:', err);
      res.status(500).json({ error: 'Database error while adding menu item.' });
    }
  });

  app.put('/api/admin/menu/:foodId', requireRole('ADMIN'), (req: Request, res: Response) => {
    const session = (req as Request & { authSession: ServerSession }).authSession;
    const foodId = Number.parseInt(req.params.foodId, 10);
    if (!Number.isInteger(foodId) || foodId <= 0) {
      res.status(400).json({ error: 'Invalid food item ID.' });
      return;
    }

    const validation = validateFoodItemInput(req.body || {});
    if (!validation.valid || !validation.sanitized) {
      res.status(400).json({ error: validation.errors[0], errors: validation.errors });
      return;
    }
    const s = validation.sanitized;

    const existing = db
      .prepare('SELECT food_id, name FROM food_items WHERE food_id = ?')
      .get(foodId) as { food_id: number; name: string } | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Food item not found.' });
      return;
    }

    const duplicate = db
      .prepare(
        'SELECT food_id FROM food_items WHERE LOWER(name) = LOWER(?) AND meal_category = ? AND food_id != ?'
      )
      .get(s.name, s.mealCategory, foodId) as { food_id: number } | undefined;

    if (duplicate) {
      res.status(409).json({
        error: `Another food item named "${s.name}" already exists in ${s.mealCategory}.`,
      });
      return;
    }

    try {
      db.exec('BEGIN IMMEDIATE TRANSACTION');
      db.prepare(
        `UPDATE food_items
         SET name = ?, description = ?, meal_category = ?, is_available = ?,
             updated_by_admin_id = ?, updated_at = datetime('now')
         WHERE food_id = ?`
      ).run(s.name, s.description || null, s.mealCategory, s.isAvailable ? 1 : 0, session.userId, foodId);

      db.prepare(
        `INSERT INTO audit_logs (admin_id, action_type, entity_type, entity_id, summary, created_at)
         VALUES (?, 'UPDATE_MENU_ITEM', 'FOOD_ITEM', ?, ?, datetime('now'))`
      ).run(
        session.userId,
        foodId,
        `Updated menu item #${foodId} ("${s.name}", ${s.mealCategory}, available=${s.isAvailable}).`
      );

      db.exec('COMMIT');
      res.json({ message: `"${s.name}" updated successfully.` });
    } catch (err) {
      try {
        db.exec('ROLLBACK');
      } catch {
        // ignore
      }
      console.error('Error updating food item:', err);
      res.status(500).json({ error: 'Database error while updating menu item.' });
    }
  });

  app.post('/api/admin/menu/:foodId/status', requireRole('ADMIN'), (req: Request, res: Response) => {
    const session = (req as Request & { authSession: ServerSession }).authSession;
    const foodId = Number.parseInt(req.params.foodId, 10);
    const isActive = Boolean(req.body?.isActive);

    const existing = db
      .prepare('SELECT food_id, name, is_active FROM food_items WHERE food_id = ?')
      .get(foodId) as { food_id: number; name: string; is_active: number } | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Food item not found.' });
      return;
    }

    try {
      db.exec('BEGIN IMMEDIATE TRANSACTION');
      db.prepare(
        `UPDATE food_items
         SET is_active = ?, is_available = CASE WHEN ? = 0 THEN 0 ELSE is_available END,
             updated_by_admin_id = ?, updated_at = datetime('now')
         WHERE food_id = ?`
      ).run(isActive ? 1 : 0, isActive ? 1 : 0, session.userId, foodId);

      db.prepare(
        `INSERT INTO audit_logs (admin_id, action_type, entity_type, entity_id, summary, created_at)
         VALUES (?, ?, 'FOOD_ITEM', ?, ?, datetime('now'))`
      ).run(
        session.userId,
        isActive ? 'REACTIVATE_MENU_ITEM' : 'DEACTIVATE_MENU_ITEM',
        foodId,
        `${isActive ? 'Reactivated' : 'Deactivated'} "${existing.name}" (${isActive ? 'visible on student menu' : 'hidden from student menu; historical feedback preserved'}).`
      );

      db.exec('COMMIT');
      res.json({
        message: isActive
          ? `"${existing.name}" has been restored to the active student menu.`
          : `"${existing.name}" has been deactivated from the student menu while preserving all historical feedback.`,
      });
    } catch (err) {
      try {
        db.exec('ROLLBACK');
      } catch {
        // ignore
      }
      res.status(500).json({ error: 'Database error while changing menu item status.' });
    }
  });

  // ============================================================================
  // 5. JAVA / MAVEN / MYSQL PROJECT DELIVERABLES EXPLORER ENDPOINT
  // ============================================================================

  app.get('/api/deliverables', (_req: Request, res: Response) => {
    const messmateRoot = path.resolve(process.cwd(), 'messmate');
    const files: Array<{ path: string; category: string; size: number; content: string }> = [];

    function walk(dir: string) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else {
          const relPath = path.relative(messmateRoot, fullPath).replace(/\\/g, '/');
          const content = fs.readFileSync(fullPath, 'utf-8');
          let category = 'Configuration & Docs';
          if (relPath.startsWith('database/')) category = 'MySQL Schema & Seed SQL';
          else if (relPath.includes('/java/')) category = 'Java Servlets, DAOs, Filters & Models';
          else if (relPath.endsWith('.jsp') || relPath.endsWith('.css') || relPath.endsWith('web.xml'))
            category = 'JSP Views, CSS & web.xml';
          files.push({
            path: `messmate/${relPath}`,
            category,
            size: Buffer.byteLength(content, 'utf-8'),
            content,
          });
        }
      }
    }

    walk(messmateRoot);
    res.json({ files });
  });

  // ============================================================================
  // 6. CROSS-PLATFORM SOCIAL MEDIA CONTENT & VISUAL STUDIO (GEMINI API)
  // ============================================================================

  function createSvgSocialArtwork(
    platform: 'linkedin' | 'twitter' | 'instagram',
    idea: string,
    tone: string,
    aspectRatio: string,
    resolution: string
  ): string {
    const ratioMap: Record<string, [number, number]> = {
      '1:1': [1080, 1080],
      '16:9': [1280, 720],
      '9:16': [720, 1280],
      '4:3': [1200, 900],
      '3:4': [900, 1200],
      '3:2': [1200, 800],
      '2:3': [800, 1200],
      '21:9': [1470, 630],
    };
    const [w, h] = ratioMap[aspectRatio] || [1200, 675];
    const palettes = {
      linkedin: { bg1: '#0F172A', bg2: '#1E293B', accent: '#38BDF8', label: 'LINKEDIN EDITORIAL' },
      twitter: { bg1: '#090D16', bg2: '#111827', accent: '#F59E0B', label: 'X / TWITTER DISPATCH' },
      instagram: { bg1: '#18181B', bg2: '#27272A', accent: '#10B981', label: 'INSTAGRAM VISUAL STORY' },
    };
    const pal = palettes[platform];
    const cleanTitle = idea
      .replace(/[&<>'"]/g, '')
      .slice(0, 56)
      .trim();

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${pal.bg1}"/>
          <stop offset="100%" stop-color="${pal.bg2}"/>
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#bg)"/>
      <circle cx="${Math.round(w * 0.82)}" cy="${Math.round(h * 0.22)}" r="${Math.round(Math.min(w, h) * 0.28)}" fill="${pal.accent}" fill-opacity="0.12"/>
      <rect x="${Math.round(w * 0.08)}" y="${Math.round(h * 0.14)}" width="${Math.round(w * 0.84)}" height="${Math.round(h * 0.72)}" rx="20" fill="#ffffff" fill-opacity="0.04" stroke="#ffffff" stroke-opacity="0.14" stroke-width="2"/>
      <text x="${Math.round(w * 0.13)}" y="${Math.round(h * 0.28)}" fill="${pal.accent}" font-family="Plus Jakarta Sans, sans-serif" font-size="${Math.round(Math.min(w, h) * 0.032)}" font-weight="700" letter-spacing="2">${pal.label} · ${tone.toUpperCase()} · ${aspectRatio} (${resolution})</text>
      <text x="${Math.round(w * 0.13)}" y="${Math.round(h * 0.48)}" fill="#F8FAFC" font-family="Plus Jakarta Sans, sans-serif" font-size="${Math.round(Math.min(w, h) * 0.052)}" font-weight="700">${cleanTitle}</text>
      <text x="${Math.round(w * 0.13)}" y="${Math.round(h * 0.62)}" fill="#94A3B8" font-family="Public Sans, sans-serif" font-size="${Math.round(Math.min(w, h) * 0.028)}">MessMate Campus Communications &amp; Cross-Platform Studio</text>
    </svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf-8').toString('base64')}`;
  }

  app.post('/api/social/generate', async (req: Request, res: Response) => {
    const idea = typeof req.body?.idea === 'string' ? req.body.idea.trim() : '';
    const tone = typeof req.body?.tone === 'string' ? req.body.tone.trim().toLowerCase() : 'professional';
    const imageSize = ['1K', '2K', '4K'].includes(req.body?.imageSize) ? req.body.imageSize : '1K';
    const linkedinRatio = req.body?.linkedinRatio || '16:9';
    const twitterRatio = req.body?.twitterRatio || '16:9';
    const instagramRatio = req.body?.instagramRatio || '1:1';
    const textModelChoice =
      req.body?.textModel === 'gemini-4-argon' || req.body?.textModel === 'gemini-3.1-flash-lite'
        ? req.body.textModel
        : 'gemini-3.8-flash';
    const imageModelChoice =
      req.body?.imageModel === 'gemini-nano-banana-2.1'
        ? 'gemini-nano-banana-2.1'
        : 'gemini-3-pro-image-preview';

    if (!idea) {
      res.status(400).json({ error: 'Please enter a content idea or announcement topic.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const hasRealKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10);

    let posts = {
      linkedin: {
        headline: `Strategic Perspective: ${idea}`,
        body: `Here is how we are elevating operational standards around "${idea}" with measurable transparency:\n\n1. Listening directly to real stakeholder feedback and acting on data rather than assumptions.\n2. Tracking quality, hygiene, and satisfaction metrics across every daily batch.\n3. Closing the loop with documented improvement actions so every suggestion drives visible progress.\n\nWhen teams combine structured feedback loops with disciplined execution, community trust compounds rapidly.\n\nHow is your organization turning daily feedback into operational excellence?`,
        callToAction: 'Share your thoughts in the comments below.',
        imagePrompt: `Editorial architectural photography illustrating ${idea}, warm natural daylight, clean composition`,
        aspectRatio: linkedinRatio,
        imageUrl: createSvgSocialArtwork('linkedin', idea, tone, linkedinRatio, imageSize),
      },
      twitter: {
        headline: `Quick Take (${tone})`,
        body: `${idea} — built on real feedback, transparent quality scores, and fast turnaround. Zero guesswork, 100% accountability. What should we ship next?`,
        hashtags: ['#CampusLife', '#OperationalExcellence', '#MessMate'],
        imagePrompt: `High-contrast graphic visual representing ${idea}, crisp studio lighting`,
        aspectRatio: twitterRatio,
        imageUrl: createSvgSocialArtwork('twitter', idea, tone, twitterRatio, imageSize),
      },
      instagram: {
        headline: `Visual Story: ${idea}`,
        body: `Freshly crafted around what matters most: ${idea}.\n\nSwipe through to see how daily ratings, chef craftsmanship, and community suggestions shape every plate we serve.`,
        hashtags: [
          '#CampusDining',
          '#FoodQuality',
          '#CommunityFirst',
          '#FreshMenu',
          '#StudentVoice',
          '#DailyCraft',
        ],
        imagePrompt: `Overhead studio food & lifestyle photography of ${idea}, natural window light, travertine surface`,
        aspectRatio: instagramRatio,
        imageUrl: createSvgSocialArtwork('instagram', idea, tone, instagramRatio, imageSize),
      },
    };

    if (hasRealKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const textResp = await ai.models.generateContent({
          model: textModelChoice,
          contents: `Generate simultaneous cross-platform social media drafts for the following idea: "${idea}".
Desired tone: ${tone.toUpperCase()}.
Return JSON with:
1) linkedin: long-form structured post (headline, body with 3 key takeaways, callToAction, imagePrompt)
2) twitter: short & punchy post under 260 characters (headline, body, hashtags array, imagePrompt)
3) instagram: visual-focused caption with engaging hook and 6 relevant hashtags (headline, body, hashtags array, imagePrompt)`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                linkedin: {
                  type: Type.OBJECT,
                  properties: {
                    headline: { type: Type.STRING },
                    body: { type: Type.STRING },
                    callToAction: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING },
                  },
                  required: ['headline', 'body', 'callToAction', 'imagePrompt'],
                },
                twitter: {
                  type: Type.OBJECT,
                  properties: {
                    headline: { type: Type.STRING },
                    body: { type: Type.STRING },
                    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    imagePrompt: { type: Type.STRING },
                  },
                  required: ['headline', 'body', 'hashtags', 'imagePrompt'],
                },
                instagram: {
                  type: Type.OBJECT,
                  properties: {
                    headline: { type: Type.STRING },
                    body: { type: Type.STRING },
                    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    imagePrompt: { type: Type.STRING },
                  },
                  required: ['headline', 'body', 'hashtags', 'imagePrompt'],
                },
              },
              required: ['linkedin', 'twitter', 'instagram'],
            },
          },
        });

        if (textResp.text) {
          const parsed = JSON.parse(textResp.text.trim());
          posts = {
            linkedin: {
              ...posts.linkedin,
              ...parsed.linkedin,
              aspectRatio: linkedinRatio,
            },
            twitter: {
              ...posts.twitter,
              ...parsed.twitter,
              aspectRatio: twitterRatio,
            },
            instagram: {
              ...posts.instagram,
              ...parsed.instagram,
              aspectRatio: instagramRatio,
            },
          };
        }

        // Attempt parallel image generation for each platform's optimal aspect ratio & size
        const platforms = [
          { key: 'linkedin' as const, ratio: linkedinRatio, prompt: posts.linkedin.imagePrompt },
          { key: 'twitter' as const, ratio: twitterRatio, prompt: posts.twitter.imagePrompt },
          { key: 'instagram' as const, ratio: instagramRatio, prompt: posts.instagram.imagePrompt },
        ];

        await Promise.all(
          platforms.map(async (p) => {
            try {
              const supportedRatio = ['1:1', '3:4', '4:3', '9:16', '16:9'].includes(p.ratio)
                ? p.ratio
                : '16:9';
              const imgResp = await ai.models.generateContent({
                model: imageModelChoice,
                contents: {
                  parts: [{ text: `${p.prompt}. Tone: ${tone}. High-resolution studio photography.` }],
                },
                config: {
                  imageConfig: {
                    aspectRatio: supportedRatio,
                    imageSize,
                  },
                },
              });
              const parts = imgResp.candidates?.[0]?.content?.parts || [];
              for (const part of parts) {
                if (part.inlineData?.data) {
                  posts[p.key].imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                  break;
                }
              }
            } catch {
              // Keep deterministic high-contrast SVG visual fallback if image model call fails
            }
          })
        );
      } catch {
        // Keep deterministic tailored drafts if API key is not configured for paid model
      }
    }

    res.json({
      idea,
      tone,
      imageSize,
      textModel: textModelChoice,
      imageModel: imageModelChoice,
      posts,
    });
  });

  // Mount Vite middleware in development or serve static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MessMate Server running on http://localhost:${PORT}`);
  });
}

startServer();
