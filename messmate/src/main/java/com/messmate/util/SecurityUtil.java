package com.messmate.util;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.mindrot.jbcrypt.BCrypt;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * Security utilities for BCrypt password hashing, CSRF token generation/verification,
 * and HTML output escaping to prevent XSS.
 */
public final class SecurityUtil {

    private static final String CSRF_SESSION_KEY = "MESSMATE_CSRF_TOKEN";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private SecurityUtil() {
    }

    public static String hashPassword(String plainPassword) {
        if (plainPassword == null || plainPassword.isBlank()) {
            throw new IllegalArgumentException("Password must not be blank.");
        }
        return BCrypt.hashpw(plainPassword, BCrypt.gensalt(10));
    }

    public static boolean verifyPassword(String plainPassword, String bcryptHash) {
        if (plainPassword == null || bcryptHash == null || bcryptHash.isBlank()) {
            return false;
        }
        try {
            return BCrypt.checkpw(plainPassword, bcryptHash);
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    public static String ensureCsrfToken(HttpSession session) {
        String token = (String) session.getAttribute(CSRF_SESSION_KEY);
        if (token == null || token.isBlank()) {
            byte[] bytes = new byte[32];
            SECURE_RANDOM.nextBytes(bytes);
            token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            session.setAttribute(CSRF_SESSION_KEY, token);
        }
        return token;
    }

    public static boolean verifyCsrfToken(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return false;
        }
        String expected = (String) session.getAttribute(CSRF_SESSION_KEY);
        String actual = request.getParameter("_csrf");
        if (actual == null || actual.isBlank()) {
            actual = request.getHeader("X-CSRF-Token");
        }
        return expected != null && actual != null && expected.equals(actual);
    }

    public static String escapeHtml(String input) {
        if (input == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder(input.length() + 16);
        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            switch (c) {
                case '&' -> sb.append("&amp;");
                case '<' -> sb.append("&lt;");
                case '>' -> sb.append("&gt;");
                case '"' -> sb.append("&quot;");
                case '\'' -> sb.append("&#x27;");
                default -> sb.append(c);
            }
        }
        return sb.toString();
    }
}
