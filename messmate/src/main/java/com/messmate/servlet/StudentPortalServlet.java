package com.messmate.servlet;

import com.messmate.dao.MessMateDao;
import com.messmate.filter.RoleAuthorizationFilter;
import com.messmate.model.Feedback;
import com.messmate.model.FoodItem;
import com.messmate.validation.MessMateValidator;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.Date;
import java.sql.SQLException;
import java.util.List;

/**
 * Student Portal Servlet handling:
 *  - GET  /student/dashboard
 *  - GET  /student/menu
 *  - GET  /student/feedback/new
 *  - POST /student/feedback/new
 *  - GET  /student/feedback/history
 * Reads studentId exclusively from the server-side HttpSession.
 */
@WebServlet(urlPatterns = {
        "/student/dashboard",
        "/student/menu",
        "/student/feedback/new",
        "/student/feedback/history"
})
public class StudentPortalServlet extends HttpServlet {

    private final MessMateDao dao = new MessMateDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        long studentId = (Long) session.getAttribute(RoleAuthorizationFilter.SESSION_USER_ID);
        String path = req.getServletPath();

        try {
            List<FoodItem> menuItems = dao.listActiveStudentMenu();
            req.setAttribute("menuItems", menuItems);

            if ("/student/feedback/history".equals(path)) {
                List<Feedback> history = dao.listFeedbackByStudent(studentId);
                req.setAttribute("feedbackHistory", history);
                req.getRequestDispatcher("/WEB-INF/views/student/history.jsp").forward(req, resp);
            } else if ("/student/feedback/new".equals(path)) {
                req.getRequestDispatcher("/WEB-INF/views/student/feedback-form.jsp").forward(req, resp);
            } else {
                List<Feedback> history = dao.listFeedbackByStudent(studentId);
                req.setAttribute("feedbackHistory", history);
                req.getRequestDispatcher("/WEB-INF/views/student/dashboard.jsp").forward(req, resp);
            }
        } catch (SQLException ex) {
            log("Failed to load student view data", ex);
            resp.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        long authenticatedStudentId = (Long) session.getAttribute(RoleAuthorizationFilter.SESSION_USER_ID);

        String foodIdRaw = req.getParameter("foodId");
        String mealCategory = req.getParameter("mealCategory");
        String serviceDateRaw = req.getParameter("serviceDate");
        String tasteRaw = req.getParameter("tasteRating");
        String qualityRaw = req.getParameter("qualityRating");
        String quantityRaw = req.getParameter("quantityRating");
        String hygieneRaw = req.getParameter("hygieneRating");
        String overallRaw = req.getParameter("overallRating");
        String complaintCat = req.getParameter("complaintCategory");
        String comments = req.getParameter("comments");
        String suggestions = req.getParameter("suggestions");

        List<String> errors = MessMateValidator.validateFeedbackSubmission(
                foodIdRaw, mealCategory, serviceDateRaw,
                tasteRaw, qualityRaw, quantityRaw, hygieneRaw, overallRaw,
                complaintCat, comments, suggestions
        );

        if (!errors.isEmpty()) {
            req.setAttribute("validationErrors", errors);
            doGet(req, resp);
            return;
        }

        Feedback fb = new Feedback();
        fb.setStudentId(authenticatedStudentId);
        fb.setFoodId(Long.parseLong(foodIdRaw.trim()));
        fb.setMealCategory(mealCategory.trim().toUpperCase());
        fb.setServiceDate(Date.valueOf(serviceDateRaw.trim()));
        fb.setTasteRating(Integer.parseInt(tasteRaw.trim()));
        fb.setQualityRating(Integer.parseInt(qualityRaw.trim()));
        fb.setQuantityRating(Integer.parseInt(quantityRaw.trim()));
        fb.setHygieneRating(Integer.parseInt(hygieneRaw.trim()));
        fb.setOverallRating(Integer.parseInt(overallRaw.trim()));
        fb.setComments(comments != null ? comments.trim() : null);
        fb.setSuggestions(suggestions != null ? suggestions.trim() : null);
        fb.setComplaintCategory(
                complaintCat == null || complaintCat.isBlank()
                        ? Feedback.ComplaintCategory.NONE
                        : Feedback.ComplaintCategory.valueOf(complaintCat.trim().toUpperCase())
        );

        try {
            dao.createFeedbackTransactional(fb);
            resp.sendRedirect(req.getContextPath() + "/student/feedback/history?submitted=1");
        } catch (SQLException ex) {
            log("Error saving student feedback", ex);
            req.setAttribute("validationErrors", List.of("Could not save feedback (duplicate submission for this food item and date, or inactive dish)."));
            doGet(req, resp);
        }
    }
}
