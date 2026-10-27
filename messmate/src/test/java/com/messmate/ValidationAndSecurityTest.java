package com.messmate;

import com.messmate.validation.MessMateValidator;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Automated JUnit 5 test suite verifying MessMate validation rules, rating bounds,
 * decimal rejection, and allowlist enforcement.
 */
public class ValidationAndSecurityTest {

    @Test
    void validFeedbackSubmissionPassesAllChecks() {
        List<String> errors = MessMateValidator.validateFeedbackSubmission(
                "1",
                "BREAKFAST",
                LocalDate.now().toString(),
                "5", "4", "4", "5", "5",
                "NONE",
                "Crisp dosa and warm sambar.",
                "Add extra chutney counter."
        );
        assertTrue(errors.isEmpty(), "Expected valid submission to produce zero validation errors");
    }

    @Test
    void ratingsOutsideOneToFiveAndDecimalsAreRejected() {
        List<String> errors = MessMateValidator.validateFeedbackSubmission(
                "1",
                "LUNCH",
                LocalDate.now().toString(),
                "0", "6", "3.5", "-1", "abc",
                "TASTE",
                "Test comment",
                ""
        );
        assertEquals(5, errors.size(), "All five invalid ratings must be rejected");
    }

    @Test
    void sqlInjectionInMealCategoryIsRejectedByAllowlist() {
        List<String> errors = MessMateValidator.validateFoodItemInput(
                "Masala Dosa",
                "South Indian crepe",
                "BREAKFAST' OR '1'='1"
        );
        assertFalse(errors.isEmpty(), "SQL injection string in mealCategory must be rejected by allowlist");
    }
}
