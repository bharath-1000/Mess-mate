package com.messmate.model;

import java.sql.Date;
import java.sql.Timestamp;

/**
 * Domain model representing a student food feedback submission,
 * ratings (1-5), optional comments/suggestions, and complaint status.
 */
public class Feedback {
    public enum ComplaintCategory {
        NONE, TASTE, QUALITY, QUANTITY, HYGIENE, TEMPERATURE, VARIETY, OTHER
    }

    public enum ComplaintStatus {
        NONE, OPEN, IN_PROGRESS, RESOLVED
    }

    private long feedbackId;
    private long studentId;
    private String studentDisplayName;
    private long foodId;
    private String foodName;
    private String mealCategory;
    private Date serviceDate;
    private int tasteRating;
    private int qualityRating;
    private int quantityRating;
    private int hygieneRating;
    private int overallRating;
    private String comments;
    private String suggestions;
    private ComplaintCategory complaintCategory;
    private ComplaintStatus complaintStatus;
    private Timestamp submittedAt;
    private Timestamp updatedAt;
    private boolean deleted;

    public long getFeedbackId() { return feedbackId; }
    public void setFeedbackId(long feedbackId) { this.feedbackId = feedbackId; }

    public long getStudentId() { return studentId; }
    public void setStudentId(long studentId) { this.studentId = studentId; }

    public String getStudentDisplayName() { return studentDisplayName; }
    public void setStudentDisplayName(String studentDisplayName) { this.studentDisplayName = studentDisplayName; }

    public long getFoodId() { return foodId; }
    public void setFoodId(long foodId) { this.foodId = foodId; }

    public String getFoodName() { return foodName; }
    public void setFoodName(String foodName) { this.foodName = foodName; }

    public String getMealCategory() { return mealCategory; }
    public void setMealCategory(String mealCategory) { this.mealCategory = mealCategory; }

    public Date getServiceDate() { return serviceDate; }
    public void setServiceDate(Date serviceDate) { this.serviceDate = serviceDate; }

    public int getTasteRating() { return tasteRating; }
    public void setTasteRating(int tasteRating) { this.tasteRating = tasteRating; }

    public int getQualityRating() { return qualityRating; }
    public void setQualityRating(int qualityRating) { this.qualityRating = qualityRating; }

    public int getQuantityRating() { return quantityRating; }
    public void setQuantityRating(int quantityRating) { this.quantityRating = quantityRating; }

    public int getHygieneRating() { return hygieneRating; }
    public void setHygieneRating(int hygieneRating) { this.hygieneRating = hygieneRating; }

    public int getOverallRating() { return overallRating; }
    public void setOverallRating(int overallRating) { this.overallRating = overallRating; }

    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }

    public String getSuggestions() { return suggestions; }
    public void setSuggestions(String suggestions) { this.suggestions = suggestions; }

    public ComplaintCategory getComplaintCategory() { return complaintCategory; }
    public void setComplaintCategory(ComplaintCategory complaintCategory) { this.complaintCategory = complaintCategory; }

    public ComplaintStatus getComplaintStatus() { return complaintStatus; }
    public void setComplaintStatus(ComplaintStatus complaintStatus) { this.complaintStatus = complaintStatus; }

    public Timestamp getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Timestamp submittedAt) { this.submittedAt = submittedAt; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }

    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
