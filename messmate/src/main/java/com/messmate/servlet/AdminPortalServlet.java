package com.messmate.servlet;

import com.messmate.dao.MessMateDao;
import com.messmate.filter.RoleAuthorizationFilter;
import com.messmate.model.FoodRatingReport;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;

/**
 * Admin Portal Servlet guarding /admin/* endpoints:
 *  - /admin/dashboard
 *  - /admin/feedback
 *  - /admin/reports
 *  - /admin/complaints
 *  - /admin/improvements
 *  - /admin/menu
 */
@WebServlet(urlPatterns = {
        "/admin/dashboard",
        "/admin/feedback",
        "/admin/reports",
        "/admin/complaints",
        "/admin/improvements",
        "/admin/menu"
})
public class AdminPortalServlet extends HttpServlet {

    private final MessMateDao dao = new MessMateDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        if (session == null || !"ADMIN".equals(session.getAttribute(RoleAuthorizationFilter.SESSION_USER_ROLE))) {
            resp.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        String mealCategory = req.getParameter("mealCategory");
        String startDate = req.getParameter("startDate");
        String endDate = req.getParameter("endDate");
        String thresholdRaw = req.getParameter("threshold");
        boolean sortAsc = "asc".equalsIgnoreCase(req.getParameter("sort"));

        double threshold = 3.0;
        if (thresholdRaw != null && !thresholdRaw.isBlank()) {
            try {
                double parsed = Double.parseDouble(thresholdRaw);
                if (parsed >= 1.0 && parsed <= 5.0) {
                    threshold = parsed;
                }
            } catch (NumberFormatException ignored) {
            }
        }

        try {
            List<FoodRatingReport> reports = dao.calculateFoodRatingReports(
                    mealCategory, startDate, endDate, threshold, sortAsc
            );
            req.setAttribute("ratingReports", reports);
            req.setAttribute("lowRatingThreshold", threshold);
            req.getRequestDispatcher("/WEB-INF/views/admin/dashboard.jsp").forward(req, resp);
        } catch (SQLException ex) {
            log("Failed to load admin reports", ex);
            resp.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        if (session == null || !"ADMIN".equals(session.getAttribute(RoleAuthorizationFilter.SESSION_USER_ROLE))) {
            resp.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }
        long adminId = (Long) session.getAttribute(RoleAuthorizationFilter.SESSION_USER_ID);
        String action = req.getParameter("action");

        try {
            if ("updateComplaint".equals(action)) {
                long feedbackId = Long.parseLong(req.getParameter("feedbackId"));
                String newStatus = req.getParameter("newStatus");
                String actionText = req.getParameter("actionText");
                dao.updateComplaintAndRecordActionTransactional(feedbackId, adminId, newStatus, actionText);
                resp.sendRedirect(req.getContextPath() + "/admin/complaints?updated=1");
                return;
            }
            resp.sendRedirect(req.getContextPath() + "/admin/dashboard");
        } catch (SQLException | NumberFormatException ex) {
            log("Admin action failed", ex);
            resp.sendRedirect(req.getContextPath() + "/admin/dashboard?error=operation_failed");
        }
    }
}
