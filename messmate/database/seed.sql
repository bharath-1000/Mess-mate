-- ============================================================================
-- MessMate — Development Seed Data (database/seed.sql)
-- NOTE: Fictional development accounts only. No real student personal data.
-- Development Passwords (hashed with BCrypt cost=10):
--   Students (aravind.k, priya.s, rohan.m): Student@123
--   Admins   (mess.warden, quality.admin): Admin@123
-- ============================================================================

USE messmate_db;

INSERT INTO users (user_id, username, password_hash, display_name, role, is_active) VALUES
  (1, 'mess.warden', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQbLg5xN9B4/X2H0tT6.y9z8E7rC2G', 'Dr. Rajeshwari Menon (Chief Warden)', 'ADMIN', 1),
  (2, 'quality.admin', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQbLg5xN9B4/X2H0tT6.y9z8E7rC2G', 'Suresh Nair (Mess Operations Supervisor)', 'ADMIN', 1),
  (3, 'aravind.k', '$2a$10$5O9x/e2fM3NYOJhpFEGsxPgNRcMh6yO0C5/Y3I1uU7.z0A9F8sD3H', 'Aravind Kumar (Hostel Block A)', 'STUDENT', 1),
  (4, 'priya.s', '$2a$10$5O9x/e2fM3NYOJhpFEGsxPgNRcMh6yO0C5/Y3I1uU7.z0A9F8sD3H', 'Priya Subramanian (Hostel Block C)', 'STUDENT', 1),
  (5, 'rohan.m', '$2a$10$5O9x/e2fM3NYOJhpFEGsxPgNRcMh6yO0C5/Y3I1uU7.z0A9F8sD3H', 'Rohan Mehta (Hostel Block B)', 'STUDENT', 1),
  (6, 'inactive.student', '$2a$10$5O9x/e2fM3NYOJhpFEGsxPgNRcMh6yO0C5/Y3I1uU7.z0A9F8sD3H', 'Vikram Das (Graduated - Inactive)', 'STUDENT', 0);

INSERT INTO food_items (food_id, name, description, meal_category, is_available, is_active, created_by_admin_id, updated_by_admin_id) VALUES
  (1, 'Masala Dosa with Coconut Chutney & Sambar', 'Crisp fermented rice and lentil crepe stuffed with spiced potato mash, served hot with fresh coconut chutney and arachuvitta sambar.', 'BREAKFAST', 1, 1, 1, 1),
  (2, 'Steamed Idli & Medu Vada Platter', 'Three soft steamed idlis paired with one crispy lentil medu vada, sambar, and tomato-mint chutney.', 'BREAKFAST', 1, 1, 1, 1),
  (3, 'Poha with Roasted Peanuts & Sev', 'Flattened rice tempered with mustard seeds, curry leaves, turmeric, green chilies, and crunchy peanuts.', 'BREAKFAST', 0, 1, 1, 2),
  (4, 'South Indian Vegetarian Meals Thali', 'Steamed ponni rice, paruppu dal with ghee, vegetable kootu, poriyal, rasam, buttermilk, and papad.', 'LUNCH', 1, 1, 1, 1),
  (5, 'Paneer Butter Masala & Whole Wheat Phulka', 'Cottage cheese cubes simmered in rich tomato-cashew gravy served with three warm whole-wheat phulkas and jeera rice.', 'LUNCH', 1, 1, 1, 1),
  (6, 'Rajma Chawal Bowl with Boondi Raita', 'Slow-cooked red kidney beans in spiced onion-tomato gravy served with steamed basmati rice and chilled boondi raita.', 'LUNCH', 1, 1, 2, 2),
  (7, 'Vegetable Dum Biryani & Mirchi Ka Salan', 'Fragrant basmati rice layered with seasonal vegetables, saffron, and whole spices, served with peanut-sesame salan.', 'DINNER', 1, 1, 1, 1),
  (8, 'Chole Bhature & Pickled Onions', 'Spiced chickpea curry cooked with amchur and roasted cumin, paired with two puffed bhature.', 'DINNER', 1, 1, 1, 2),
  (9, 'Dal Tadka, Methi Roti & Aloo Gobi', 'Yellow lentil dal tempered with garlic and cumin, served with fenugreek rotis and dry cauliflower-potato stir fry.', 'DINNER', 1, 1, 2, 2),
  (10, 'Samosa Chaat & Masala Chai', 'Crushed Punjabi samosa topped with white pea curry, tamarind chutney, yogurt, and freshly brewed cardamom tea.', 'SNACKS', 1, 1, 1, 1),
  (11, 'Sweet Corn & Sprouted Moong Salad', 'Steamed sweet corn kernels tossed with green gram sprouts, cucumber, lemon juice, and chaat masala.', 'SNACKS', 1, 1, 2, 2),
  (12, 'Fried Bread Pakora (Archived Menu Item)', 'Deep-fried gram-flour battered bread slices; retired from active menu in favor of lighter steamed snacks.', 'SNACKS', 0, 0, 1, 1);

INSERT INTO feedback (
    feedback_id, student_id, food_id, meal_category, service_date,
    taste_rating, quality_rating, quantity_rating, hygiene_rating, overall_rating,
    comments, suggestions, complaint_category, complaint_status, is_deleted
) VALUES
  (1, 3, 1, 'BREAKFAST', '2026-10-25', 5, 5, 4, 5, 5,
   'The Masala Dosa was crisp and served piping hot. Coconut chutney was fresh.',
   'Adding a second ladle of sambar at the counter would speed up the queue.',
   'NONE', 'NONE', 0),
  (2, 3, 8, 'DINNER', '2026-10-24', 2, 2, 3, 3, 2,
   'The bhature were overly oily and cold by 8:15 PM, and the chole was excessively salty.',
   'Please drain excess oil and keep the chole warm in covered bain-marie trays.',
   'QUALITY', 'IN_PROGRESS', 0),
  (3, 4, 8, 'DINNER', '2026-10-25', 2, 2, 2, 3, 2,
   'Second time this week the Chole Bhature batch had undercooked chickpeas and cold bread.',
   'Reduce batch size so fresh bhature are fried as students arrive.',
   'TASTE', 'OPEN', 0),
  (4, 4, 4, 'LUNCH', '2026-10-25', 4, 5, 5, 5, 4,
   'Very clean serving area and wholesome South Indian thali. Rasam was spot on.',
   'Include curd on all weekdays.',
   'NONE', 'NONE', 0),
  (5, 5, 9, 'DINNER', '2026-10-24', 2, 3, 2, 2, 2,
   'Tables near bay 3 were not wiped between batches and the rotis ran out 20 minutes early.',
   'Assign dedicated cleaning staff during peak 8:00 PM dinner rush and prepare extra roti dough.',
   'HYGIENE', 'OPEN', 0),
  (6, 5, 5, 'LUNCH', '2026-10-26', 5, 4, 4, 5, 5,
   'Paneer was soft and fresh, and the phulkas were warm without excess oil.',
   'Keep this on the Wednesday and Sunday rotation.',
   'NONE', 'NONE', 0),
  (7, 3, 10, 'SNACKS', '2026-10-26', 4, 4, 3, 4, 4,
   'Cardamom tea was great, though samosa portion size could be slightly larger.',
   'Serve two mini samosas per plate.',
   'QUANTITY', 'RESOLVED', 0);

INSERT INTO improvement_actions (action_id, feedback_id, admin_id, previous_status, new_status, action_text) VALUES
  (1, 2, 1, 'OPEN', 'IN_PROGRESS', 'Instructed evening kitchen supervisor to replace frying oil before dinner service and verify salt ratios in chole batch.'),
  (2, 7, 2, 'OPEN', 'RESOLVED', 'Standardized snack portion to two 60g samosas per student starting this week.');

INSERT INTO audit_logs (audit_id, admin_id, action_type, entity_type, entity_id, summary) VALUES
  (1, 1, 'DEACTIVATE_MENU_ITEM', 'FOOD_ITEM', 12, 'Deactivated Fried Bread Pakora from active student menu while preserving historical records.'),
  (2, 1, 'UPDATE_COMPLAINT_STATUS', 'FEEDBACK', 2, 'Changed complaint status from OPEN to IN_PROGRESS and logged kitchen oil & seasoning corrective action.'),
  (3, 2, 'UPDATE_COMPLAINT_STATUS', 'FEEDBACK', 7, 'Changed complaint status from OPEN to RESOLVED after standardizing snack portion weight.');
