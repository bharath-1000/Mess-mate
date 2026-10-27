<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Submit Food Feedback — MessMate</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/messmate.css">
</head>
<body>
    <main class="container">
        <section class="card">
            <h1>Submit Meal Feedback</h1>
            <p>Rating scale: <strong>1 = Very Poor</strong> to <strong>5 = Excellent</strong> (whole numbers only).</p>
            <c:if test="${not empty validationErrors}">
                <div role="alert" style="color:#dc2626; margin: 1rem 0;">
                    <ul>
                        <c:forEach var="err" items="${validationErrors}">
                            <li><c:out value="${err}"/></li>
                        </c:forEach>
                    </ul>
                </div>
            </c:if>
            <form method="post" action="${pageContext.request.contextPath}/student/feedback/new">
                <input type="hidden" name="_csrf" value="${sessionScope.MESSMATE_CSRF_TOKEN}">
                <div style="margin-top: 1rem;">
                    <label for="foodId">Food Item (Active Menu Only)</label>
                    <select id="foodId" name="foodId" required>
                        <c:forEach var="item" items="${menuItems}">
                            <option value="${item.foodId}"><c:out value="${item.name}"/> (<c:out value="${item.mealCategory}"/>)</option>
                        </c:forEach>
                    </select>
                </div>
                <div style="margin-top: 1rem;">
                    <label for="mealCategory">Meal Category</label>
                    <select id="mealCategory" name="mealCategory" required>
                        <option value="BREAKFAST">Breakfast</option>
                        <option value="LUNCH">Lunch</option>
                        <option value="DINNER">Dinner</option>
                        <option value="SNACKS">Snacks</option>
                    </select>
                </div>
                <div style="margin-top: 1rem;">
                    <label for="serviceDate">Date Served</label>
                    <input id="serviceDate" name="serviceDate" type="date" required>
                </div>
                <fieldset style="margin-top: 1rem; padding: 0.75rem;">
                    <legend>Ratings (1 = Very Poor, 5 = Excellent)</legend>
                    <label for="tasteRating">Taste (1-5)</label>
                    <input id="tasteRating" name="tasteRating" type="number" min="1" max="5" step="1" required>
                    <label for="qualityRating">Quality (1-5)</label>
                    <input id="qualityRating" name="qualityRating" type="number" min="1" max="5" step="1" required>
                    <label for="quantityRating">Quantity (1-5)</label>
                    <input id="quantityRating" name="quantityRating" type="number" min="1" max="5" step="1" required>
                    <label for="hygieneRating">Hygiene (1-5)</label>
                    <input id="hygieneRating" name="hygieneRating" type="number" min="1" max="5" step="1" required>
                    <label for="overallRating">Overall Satisfaction (1-5)</label>
                    <input id="overallRating" name="overallRating" type="number" min="1" max="5" step="1" required>
                </fieldset>
                <div style="margin-top: 1rem;">
                    <label for="complaintCategory">Complaint Category</label>
                    <select id="complaintCategory" name="complaintCategory">
                        <option value="NONE">No Complaint</option>
                        <option value="TASTE">Taste</option>
                        <option value="QUALITY">Quality</option>
                        <option value="QUANTITY">Quantity</option>
                        <option value="HYGIENE">Hygiene</option>
                        <option value="TEMPERATURE">Temperature</option>
                        <option value="VARIETY">Variety</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>
                <div style="margin-top: 1rem;">
                    <label for="comments">Comments (Max 1000 chars)</label>
                    <textarea id="comments" name="comments" maxlength="1000" rows="3" style="width:100%;"></textarea>
                </div>
                <div style="margin-top: 1rem;">
                    <label for="suggestions">Suggestions for Improvement (Max 1000 chars)</label>
                    <textarea id="suggestions" name="suggestions" maxlength="1000" rows="3" style="width:100%;"></textarea>
                </div>
                <div style="margin-top: 1.25rem;">
                    <button type="submit" class="btn">Submit Verified Feedback</button>
                </div>
            </form>
        </section>
    </main>
</body>
</html>
