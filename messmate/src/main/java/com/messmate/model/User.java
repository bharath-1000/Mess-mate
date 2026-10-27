package com.messmate.model;

import java.sql.Timestamp;

/**
 * Domain model representing an authenticated or stored MessMate user.
 * Supports strictly two roles: STUDENT and ADMIN.
 */
public class User {
    public enum Role {
        STUDENT, ADMIN
    }

    private long userId;
    private String username;
    private String passwordHash;
    private String displayName;
    private Role role;
    private boolean active;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    public User() {
    }

    public User(long userId, String username, String displayName, Role role, boolean active) {
        this.userId = userId;
        this.username = username;
        this.displayName = displayName;
        this.role = role;
        this.active = active;
    }

    public long getUserId() { return userId; }
    public void setUserId(long userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }
}
