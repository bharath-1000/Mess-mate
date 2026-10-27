package com.messmate.model;

/**
 * Aggregated food rating report model calculated via SQL AVG() and COUNT().
 */
public class FoodRatingReport {
    private long foodId;
    private String foodName;
    private String mealCategory;
    private boolean active;
    private int sampleCount;
    private double avgTaste;
    private double avgQuality;
    private double avgQuantity;
    private double avgHygiene;
    private double avgOverall;
    private boolean lowRated;

    public long getFoodId() { return foodId; }
    public void setFoodId(long foodId) { this.foodId = foodId; }

    public String getFoodName() { return foodName; }
    public void setFoodName(String foodName) { this.foodName = foodName; }

    public String getMealCategory() { return mealCategory; }
    public void setMealCategory(String mealCategory) { this.mealCategory = mealCategory; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public int getSampleCount() { return sampleCount; }
    public void setSampleCount(int sampleCount) { this.sampleCount = sampleCount; }

    public double getAvgTaste() { return avgTaste; }
    public void setAvgTaste(double avgTaste) { this.avgTaste = avgTaste; }

    public double getAvgQuality() { return avgQuality; }
    public void setAvgQuality(double avgQuality) { this.avgQuality = avgQuality; }

    public double getAvgQuantity() { return avgQuantity; }
    public void setAvgQuantity(double avgQuantity) { this.avgQuantity = avgQuantity; }

    public double getAvgHygiene() { return avgHygiene; }
    public void setAvgHygiene(double avgHygiene) { this.avgHygiene = avgHygiene; }

    public double getAvgOverall() { return avgOverall; }
    public void setAvgOverall(double avgOverall) { this.avgOverall = avgOverall; }

    public boolean isLowRated() { return lowRated; }
    public void setLowRated(boolean lowRated) { this.lowRated = lowRated; }
}
