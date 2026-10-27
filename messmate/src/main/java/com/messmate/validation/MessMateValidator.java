package com.messmate.validation;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Reusable server-side validator for student feedback submissions and admin menu items.
 * Enforces whole-number ratings 1..5, allowlists for meal & complaint categories,
 * service date rules, and maximum text field lengths.
 */
public final class MessMateValidator {

    public static final Set<String> ALLOWED_MEAL_CATEGORIES = Set.of(
            "BREAKFAST", "LUNCH", "DINNER", "SNACKS"
    );

    public static final Set<String> ALLOWED_COMPLAINT_CATEGORIES = Set.of(
            "NONE", "TASTE", "QUALITY", "QUANTITY", "HYGIENE", "TEMPERATURE", "VARIETY", "OTHER"
    );

    public static final Set<String> ALLOWED_COMPLAINT_STATUSES = Set.of(
            "NONE", "OPEN", "IN_PROGRESS", "RESOLVED"
    );

    public static final Set<String> ALLOWED_SORT_COLUMNS = Set.of(
            "submitted_at", "service_date", "overall_rating", "taste_rating", "quality_rating", "hygiene_rating", "food_name"
    );

    private MessMateValidator() {
    }

    public static List<String> validateFeedbackSubmission(
            String foodIdRaw,
            String mealCategory,
            String serviceDateRaw,
            String tasteRaw,
            String qualityRaw,
            String quantityRaw,
            String hygieneRaw,
            String overallRaw,
            String complaintCategory,
            String comments,
            String suggestions
    ) {
        List<String> errors = new ArrayList<>();

        long foodId = parsePositiveId(foodIdRaw);
        if (foodId <= 0) {
            errors.add("Please select a valid active food item.");
        }

        if (mealCategory == null || !ALLOWED_MEAL_CATEGORIES.contains(mealCategory.trim().toUpperCase())) {
            errors.add("Meal category must be one of BREAKFAST, LUNCH, DINNER, or SNACKS.");
        }

        if (serviceDateRaw == null || serviceDateRaw.isBlank()) {
            errors.add("Service date is required.");
        } else {
            try {
                LocalDate parsedDate = LocalDate.parse(serviceDateRaw.trim());
                LocalDate today = LocalDate.now();
                if (parsedDate.isAfter(today)) {
                    errors.add("Service date cannot be in the future.");
                }
                if (parsedDate.isBefore(today.minusDays(30))) {
                    errors.add("Service date must be within the last 30 days.");
                }
            } catch (DateTimeParseException ex) {
                errors.add("Service date must be in YYYY-MM-DD format.");
            }
        }

        validateRating(tasteRaw, "Taste rating", errors);
        validateRating(qualityRaw, "Quality rating", errors);
        validateRating(quantityRaw, "Quantity rating", errors);
        validateRating(hygieneRaw, "Hygiene rating", errors);
        validateRating(overallRaw, "Overall satisfaction rating", errors);

        if (complaintCategory != null && !complaintCategory.isBlank()) {
            if (!ALLOWED_COMPLAINT_CATEGORIES.contains(complaintCategory.trim().toUpperCase())) {
                errors.add("Invalid complaint category selected.");
            }
        }

        if (comments != null && comments.trim().length() > 1000) {
            errors.add("Comments must not exceed 1000 characters.");
        }

        if (suggestions != null && suggestions.trim().length() > 1000) {
            errors.add("Suggestions must not exceed 1000 characters.");
        }

        return errors;
    }

    public static List<String> validateFoodItemInput(String name, String description, String mealCategory) {
        List<String> errors = new ArrayList<>();
        if (name == null || name.trim().isEmpty()) {
            errors.add("Food item name is required.");
        } else if (name.trim().length() > 120) {
            errors.add("Food item name must not exceed 120 characters.");
        }

        if (description != null && description.trim().length() > 500) {
            errors.add("Food description must not exceed 500 characters.");
        }

        if (mealCategory == null || !ALLOWED_MEAL_CATEGORIES.contains(mealCategory.trim().toUpperCase())) {
            errors.add("Meal category must be one of BREAKFAST, LUNCH, DINNER, or SNACKS.");
        }
        return errors;
    }

    public static void validateRating(String rawRating, String label, List<String> errors) {
        if (rawRating == null || rawRating.trim().isEmpty()) {
            errors.add(label + " is required (whole number from 1 to 5).");
            return;
        }
        String trimmed = rawRating.trim();
        if (trimmed.contains(".")) {
            errors.add(label + " must be a whole number between 1 and 5 (decimals are not permitted).");
            return;
        }
        try {
            int val = Integer.parseInt(trimmed);
            if (val < 1 || val > 5) {
                errors.add(label + " must be between 1 (Very Poor) and 5 (Excellent).");
            }
        } catch (NumberFormatException ex) {
            errors.add(label + " must be a valid integer between 1 and 5.");
        }
    }

    public static long parsePositiveId(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return -1L;
        }
        try {
            long id = Long.parseLong(raw.trim());
            return id > 0 ? id : -1L;
        } catch (NumberFormatException ex) {
            return -1L;
        }
    }
}
