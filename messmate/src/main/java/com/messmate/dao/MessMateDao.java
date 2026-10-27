package com.messmate.dao;

import com.messmate.config.DatabaseConfig;
import com.messmate.model.Feedback;
import com.messmate.model.FoodItem;
import com.messmate.model.FoodRatingReport;
import com.messmate.model.User;
import com.messmate.validation.MessMateValidator;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * JDBC Data Access Object encapsulating all parameterized SQL queries and transactions
 * for Users, Food Items, Student Feedback, Rating Analytics, Complaints, and Audit Logs.
 * Uses try-with-resources and PreparedStatement exclusively to prevent SQL injection.
 */
public class MessMateDao {

    public Optional<User> findUserByUsername(String username) throws SQLException {
        String sql = "SELECT user_id, username, password_hash, display_name, role, is_active, created_at, updated_at "
                   + "FROM users WHERE username = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username.trim());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    User u = new User();
                    u.setUserId(rs.getLong("user_id"));
                    u.setUsername(rs.getString("username"));
                    u.setPasswordHash(rs.getString("password_hash"));
                    u.setDisplayName(rs.getString("display_name"));
                    u.setRole(User.Role.valueOf(rs.getString("role")));
                    u.setActive(rs.getBoolean("is_active"));
                    u.setCreatedAt(rs.getTimestamp("created_at"));
                    u.setUpdatedAt(rs.getTimestamp("updated_at"));
                    return Optional.of(u);
                }
            }
        }
        return Optional.empty();
    }

    public List<FoodItem> listActiveStudentMenu() throws SQLException {
        String sql = "SELECT food_id, name, description, meal_category, is_available, is_active, updated_at "
                   + "FROM food_items WHERE is_active = 1 "
                   + "ORDER BY FIELD(meal_category, 'BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS'), name ASC";
        List<FoodItem> items = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                FoodItem item = new FoodItem();
                item.setFoodId(rs.getLong("food_id"));
                item.setName(rs.getString("name"));
                item.setDescription(rs.getString("description"));
                item.setMealCategory(FoodItem.MealCategory.valueOf(rs.getString("meal_category")));
                item.setAvailable(rs.getBoolean("is_available"));
                item.setActive(rs.getBoolean("is_active"));
                item.setUpdatedAt(rs.getTimestamp("updated_at"));
                items.add(item);
            }
        }
        return items;
    }

    public long createFeedbackTransactional(Feedback feedback) throws SQLException {
        String verifyFoodSql = "SELECT food_id, is_active FROM food_items WHERE food_id = ? FOR SHARE";
        String insertSql = "INSERT INTO feedback (student_id, food_id, meal_category, service_date, "
                         + "taste_rating, quality_rating, quantity_rating, hygiene_rating, overall_rating, "
                         + "comments, suggestions, complaint_category, complaint_status, is_deleted) "
                         + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)";

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement verifyPs = conn.prepareStatement(verifyFoodSql)) {
                    verifyPs.setLong(1, feedback.getFoodId());
                    try (ResultSet rs = verifyPs.executeQuery()) {
                        if (!rs.next() || !rs.getBoolean("is_active")) {
                            throw new SQLException("Selected food item does not exist or is no longer active.");
                        }
                    }
                }

                try (PreparedStatement insertPs = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
                    insertPs.setLong(1, feedback.getStudentId());
                    insertPs.setLong(2, feedback.getFoodId());
                    insertPs.setString(3, feedback.getMealCategory());
                    insertPs.setDate(4, feedback.getServiceDate());
                    insertPs.setInt(5, feedback.getTasteRating());
                    insertPs.setInt(6, feedback.getQualityRating());
                    insertPs.setInt(7, feedback.getQuantityRating());
                    insertPs.setInt(8, feedback.getHygieneRating());
                    insertPs.setInt(9, feedback.getOverallRating());
                    insertPs.setString(10, feedback.getComments());
                    insertPs.setString(11, feedback.getSuggestions());
                    insertPs.setString(12, feedback.getComplaintCategory().name());
                    String initialStatus = feedback.getComplaintCategory() == Feedback.ComplaintCategory.NONE
                            ? "NONE" : "OPEN";
                    insertPs.setString(13, initialStatus);
                    insertPs.executeUpdate();

                    try (ResultSet keys = insertPs.getGeneratedKeys()) {
                        if (keys.next()) {
                            long generatedId = keys.getLong(1);
                            conn.commit();
                            return generatedId;
                        }
                    }
                }
                conn.rollback();
                throw new SQLException("Failed to retrieve generated feedback ID.");
            } catch (SQLException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    public List<Feedback> listFeedbackByStudent(long authenticatedStudentId) throws SQLException {
        String sql = "SELECT f.feedback_id, f.student_id, f.food_id, fi.name AS food_name, f.meal_category, "
                   + "f.service_date, f.taste_rating, f.quality_rating, f.quantity_rating, f.hygiene_rating, "
                   + "f.overall_rating, f.comments, f.suggestions, f.complaint_category, f.complaint_status, "
                   + "f.submitted_at "
                   + "FROM feedback f "
                   + "INNER JOIN food_items fi ON f.food_id = fi.food_id "
                   + "WHERE f.student_id = ? AND f.is_deleted = 0 "
                   + "ORDER BY f.submitted_at DESC";
        List<Feedback> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, authenticatedStudentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Feedback fb = new Feedback();
                    fb.setFeedbackId(rs.getLong("feedback_id"));
                    fb.setStudentId(rs.getLong("student_id"));
                    fb.setFoodId(rs.getLong("food_id"));
                    fb.setFoodName(rs.getString("food_name"));
                    fb.setMealCategory(rs.getString("meal_category"));
                    fb.setServiceDate(rs.getDate("service_date"));
                    fb.setTasteRating(rs.getInt("taste_rating"));
                    fb.setQualityRating(rs.getInt("quality_rating"));
                    fb.setQuantityRating(rs.getInt("quantity_rating"));
                    fb.setHygieneRating(rs.getInt("hygiene_rating"));
                    fb.setOverallRating(rs.getInt("overall_rating"));
                    fb.setComments(rs.getString("comments"));
                    fb.setSuggestions(rs.getString("suggestions"));
                    fb.setComplaintCategory(Feedback.ComplaintCategory.valueOf(rs.getString("complaint_category")));
                    fb.setComplaintStatus(Feedback.ComplaintStatus.valueOf(rs.getString("complaint_status")));
                    fb.setSubmittedAt(rs.getTimestamp("submitted_at"));
                    list.add(fb);
                }
            }
        }
        return list;
    }

    public List<FoodRatingReport> calculateFoodRatingReports(
            String mealCategoryFilter,
            String startDate,
            String endDate,
            double lowRatingThreshold,
            boolean sortAscending
    ) throws SQLException {
        StringBuilder sql = new StringBuilder(
                "SELECT fi.food_id, fi.name AS food_name, fi.meal_category, fi.is_active, "
              + "COUNT(f.feedback_id) AS sample_count, "
              + "ROUND(AVG(f.taste_rating), 2) AS avg_taste, "
              + "ROUND(AVG(f.quality_rating), 2) AS avg_quality, "
              + "ROUND(AVG(f.quantity_rating), 2) AS avg_quantity, "
              + "ROUND(AVG(f.hygiene_rating), 2) AS avg_hygiene, "
              + "ROUND(AVG(f.overall_rating), 2) AS avg_overall "
              + "FROM food_items fi "
              + "LEFT JOIN feedback f ON fi.food_id = f.food_id AND f.is_deleted = 0 "
        );

        List<Object> params = new ArrayList<>();
        if (startDate != null && !startDate.isBlank()) {
            sql.append("AND f.service_date >= ? ");
            params.add(java.sql.Date.valueOf(startDate.trim()));
        }
        if (endDate != null && !endDate.isBlank()) {
            sql.append("AND f.service_date <= ? ");
            params.add(java.sql.Date.valueOf(endDate.trim()));
        }
        sql.append("WHERE 1=1 ");
        if (mealCategoryFilter != null && MessMateValidator.ALLOWED_MEAL_CATEGORIES.contains(mealCategoryFilter)) {
            sql.append("AND fi.meal_category = ? ");
            params.add(mealCategoryFilter);
        }
        sql.append("GROUP BY fi.food_id, fi.name, fi.meal_category, fi.is_active ");
        sql.append("ORDER BY CASE WHEN COUNT(f.feedback_id) = 0 THEN 1 ELSE 0 END ASC, ");
        sql.append(sortAscending ? "avg_overall ASC, fi.name ASC" : "avg_overall DESC, fi.name ASC");

        List<FoodRatingReport> reports = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    FoodRatingReport r = new FoodRatingReport();
                    r.setFoodId(rs.getLong("food_id"));
                    r.setFoodName(rs.getString("food_name"));
                    r.setMealCategory(rs.getString("meal_category"));
                    r.setActive(rs.getBoolean("is_active"));
                    int count = rs.getInt("sample_count");
                    r.setSampleCount(count);
                    r.setAvgTaste(rs.getDouble("avg_taste"));
                    r.setAvgQuality(rs.getDouble("avg_quality"));
                    r.setAvgQuantity(rs.getDouble("avg_quantity"));
                    r.setAvgHygiene(rs.getDouble("avg_hygiene"));
                    double overall = rs.getDouble("avg_overall");
                    r.setAvgOverall(overall);
                    // Only flag items with at least 1 feedback submission and avgOverall < threshold
                    r.setLowRated(count > 0 && overall < lowRatingThreshold);
                    reports.add(r);
                }
            }
        }
        return reports;
    }

    public void updateComplaintAndRecordActionTransactional(
            long feedbackId,
            long adminId,
            String newStatus,
            String actionText
    ) throws SQLException {
        String selectSql = "SELECT complaint_status FROM feedback WHERE feedback_id = ? AND is_deleted = 0 FOR UPDATE";
        String updateSql = "UPDATE feedback SET complaint_status = ?, updated_at = CURRENT_TIMESTAMP WHERE feedback_id = ?";
        String insertActionSql = "INSERT INTO improvement_actions (feedback_id, admin_id, previous_status, new_status, action_text) VALUES (?, ?, ?, ?, ?)";
        String insertAuditSql = "INSERT INTO audit_logs (admin_id, action_type, entity_type, entity_id, summary) VALUES (?, 'UPDATE_COMPLAINT_STATUS', 'FEEDBACK', ?, ?)";

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                String prevStatus;
                try (PreparedStatement ps = conn.prepareStatement(selectSql)) {
                    ps.setLong(1, feedbackId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next()) {
                            throw new SQLException("Feedback record not found.");
                        }
                        prevStatus = rs.getString("complaint_status");
                    }
                }

                try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                    ps.setString(1, newStatus);
                    ps.setLong(2, feedbackId);
                    ps.executeUpdate();
                }

                try (PreparedStatement ps = conn.prepareStatement(insertActionSql)) {
                    ps.setLong(1, feedbackId);
                    ps.setLong(2, adminId);
                    ps.setString(3, prevStatus);
                    ps.setString(4, newStatus);
                    ps.setString(5, actionText.trim());
                    ps.executeUpdate();
                }

                try (PreparedStatement ps = conn.prepareStatement(insertAuditSql)) {
                    ps.setLong(1, adminId);
                    ps.setLong(2, feedbackId);
                    ps.setString(3, "Updated complaint status from " + prevStatus + " to " + newStatus);
                    ps.executeUpdate();
                }

                conn.commit();
            } catch (SQLException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }
}
