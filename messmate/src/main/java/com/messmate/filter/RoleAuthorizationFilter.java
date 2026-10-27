package com.messmate.filter;

import com.messmate.model.User;
import com.messmate.util.SecurityUtil;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

/**
 * Server-side authentication, strict role-based authorization, and CSRF validation filter.
 * Prevents students from accessing /admin/* routes and enforces CSRF tokens on state-changing POST requests.
 */
@WebFilter(urlPatterns = {"/student/*", "/admin/*"})
public class RoleAuthorizationFilter implements Filter {

    public static final String SESSION_USER_ID = "AUTH_USER_ID";
    public static final String SESSION_USERNAME = "AUTH_USERNAME";
    public static final String SESSION_DISPLAY_NAME = "AUTH_DISPLAY_NAME";
    public static final String SESSION_USER_ROLE = "AUTH_USER_ROLE";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;

        String path = req.getRequestURI().substring(req.getContextPath().length());

        // Allow unauthenticated access to dedicated login endpoints
        if ("/student/login".equals(path) || "/admin/login".equals(path)) {
            chain.doFilter(request, response);
            return;
        }

        HttpSession session = req.getSession(false);
        Long userId = session != null ? (Long) session.getAttribute(SESSION_USER_ID) : null;
        String roleStr = session != null ? (String) session.getAttribute(SESSION_USER_ROLE) : null;

        if (userId == null || roleStr == null) {
            if (path.startsWith("/admin/")) {
                resp.sendRedirect(req.getContextPath() + "/admin/login?error=auth_required");
            } else {
                resp.sendRedirect(req.getContextPath() + "/student/login?error=auth_required");
            }
            return;
        }

        // Strict server-side role verification: never trust URL parameters or hidden form fields
        if (path.startsWith("/admin/") && !User.Role.ADMIN.name().equals(roleStr)) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            req.getRequestDispatcher("/access-denied.jsp").forward(req, resp);
            return;
        }

        if (path.startsWith("/student/") && !User.Role.STUDENT.name().equals(roleStr)) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            req.getRequestDispatcher("/access-denied.jsp").forward(req, resp);
            return;
        }

        // Enforce CSRF protection on all state-changing requests
        if ("POST".equalsIgnoreCase(req.getMethod())
                || "PUT".equalsIgnoreCase(req.getMethod())
                || "DELETE".equalsIgnoreCase(req.getMethod())) {
            if (!SecurityUtil.verifyCsrfToken(req)) {
                resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
                req.setAttribute("errorMessage", "Invalid or expired security (CSRF) token. Please reload the form and try again.");
                req.getRequestDispatcher("/access-denied.jsp").forward(req, resp);
                return;
            }
        }

        SecurityUtil.ensureCsrfToken(session);
        chain.doFilter(request, response);
    }
}
