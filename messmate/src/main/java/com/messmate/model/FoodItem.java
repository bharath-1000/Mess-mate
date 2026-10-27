package com.messmate.model;

import java.sql.Timestamp;

/**
 * Domain model representing a food item on the college mess menu.
 */
public class FoodItem {
    public enum MealCategory {
        BREAKFAST, LUNCH, DINNER, SNACKS
    }

    private long foodId;
    private String name;
    private String description;
    private MealCategory mealCategory;
    private boolean available;
    private boolean active;
    private Long createdByAdminId;
    private Long updatedByAdminId;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    public long getFoodId() { return foodId; }
    public void setFoodId(long foodId) { this.foodId = foodId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public MealCategory getMealCategory() { return mealCategory; }
    public void setMealCategory(MealCategory mealCategory) { this.mealCategory = mealCategory; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Long getCreatedByAdminId() { return createdByAdminId; }
    public void setCreatedByAdminId(Long createdByAdminId) { this.createdByAdminId = createdByAdminId; }

    public Long getUpdatedByAdminId() { return updatedByAdminId; }
    public void setUpdatedByAdminId(Long updatedByAdminId) { this.updatedByAdminId = updatedByAdminId; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }
}
