package com.messmate.servlet;

import com.messmate.dao.MessMateDao;
import com.messmate.filter.RoleAuthorizationFilter;
import com.messmate.model.User;
import com.messmate.util.SecurityUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;
import java.util.Optional;

/**
 * Dedicated authentication servlet for /student/login and /admin/login.
 * Enforces separate login flows, BCrypt hash verification, active status checks,
 * session ID regeneration, and generic invalid-credential messages.
 */
@WebServlet(urlPatterns = {"/student/login", "/admin/login", "/logout"})
public class AuthServlet extends HttpServlet {

    private final MessMateDao dao = new MessMateDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getServletPath();
        if ("/admin/login".equals(path)) {
            req.getRequestDispatcher("/admin-login.jsp").forward(req, resp);
        } else {
            req.getRequestDispatcher("/student-login.jsp").forward(req, resp);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getServletPath();
        if ("/logout".equals(path)) {
            HttpSession session = req.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            resp.sendRedirect(req.getContextPath() + "/index.jsp?loggedOut=1");
            return;
        }

        boolean isAdminLoginFlow = "/admin/login".equals(path);
        String username = req.getParameter("username");
        String password = req.getParameter("password");

        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            req.setAttribute("loginError", "Username and password are required.");
            req.getRequestDispatcher(isAdminLoginFlow ? "/admin-login.jsp" : "/student-login.jsp").forward(req, resp);
            return;
        }

        try {
            Optional<User> userOpt = dao.findUserByUsername(username.trim());
            if (userOpt.isEmpty() || !SecurityUtil.verifyPassword(password, userOpt.get().getPasswordHash())) {
                req.setAttribute("loginError", "Invalid username or password.");
                req.getRequestDispatcher(isAdminLoginFlow ? "/admin-login.jsp" : "/student-login.jsp").forward(req, resp);
                return;
            }

            User user = userOpt.get();
            if (!user.isActive()) {
                req.setAttribute("loginError", "This account is currently inactive. Please contact the Mess Administration office.");
                req.getRequestDispatcher(isAdminLoginFlow ? "/admin-login.jsp" : "/student-login.jsp").forward(req, resp);
                return;
            }

            // Enforce role separation between Student Login and Admin Login
            if (isAdminLoginFlow && user.getRole() != User.Role.ADMIN) {
                req.setAttribute("loginError", "Student accounts are not permitted on the Administrator Login page.");
                req.getRequestDispatcher("/admin-login.jsp").forward(req, resp);
                return;
            }
            if (!isAdminLoginFlow && user.getRole() != User.Role.STUDENT) {
                req.setAttribute("loginError", "Administrator accounts must sign in via the dedicated Administrator Login portal.");
                req.getRequestDispatcher("/student-login.jsp").forward(req, resp);
                return;
            }

            // Regenerate session ID upon authentication to prevent session fixation
            HttpSession oldSession = req.getSession(false);
            if (oldSession != null) {
                oldSession.invalidate();
            }
            HttpSession newSession = req.getSession(true);
            newSession.setMaxInactiveInterval(30 * 60); // 30-minute timeout
            newSession.setAttribute(RoleAuthorizationFilter.SESSION_USER_ID, user.getUserId());
            newSession.setAttribute(RoleAuthorizationFilter.SESSION_USERNAME, user.getUsername());
            newSession.setAttribute(RoleAuthorizationFilter.SESSION_DISPLAY_NAME, user.getDisplayName());
            newSession.setAttribute(RoleAuthorizationFilter.SESSION_USER_ROLE, user.getRole().name());
            SecurityUtil.ensureCsrfToken(newSession);

            if (isAdminLoginFlow) {
                resp.sendRedirect(req.getContextPath() + "/admin/dashboard");
            } else {
                resp.sendRedirect(req.getContextPath() + "/student/dashboard");
            }
        } catch (SQLException ex) {
            log("Database error during authentication", ex);
            req.setAttribute("loginError", "Unable to process sign-in right now. Please try again later.");
            req.getRequestDispatcher(isAdminLoginFlow ? "/admin-login.jsp" : "/student-login.jsp").forward(req, resp);
        }
    }
}
