<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Administrator Dashboard & Rating Analytics — MessMate</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/messmate.css">
</head>
<body>
    <header class="topbar">
        <strong>MessMate · Administrator Console</strong>
        <nav style="display:flex; gap:1rem; align-items:center;">
            <span>Signed in as: <c:out value="${sessionScope.AUTH_DISPLAY_NAME}"/></span>
            <form method="post" action="${pageContext.request.contextPath}/logout" style="display:inline;">
                <input type="hidden" name="_csrf" value="${sessionScope.MESSMATE_CSRF_TOKEN}">
                <button type="submit" class="btn">Logout</button>
            </form>
        </nav>
    </header>
    <main class="container">
        <section class="card">
            <h1>Food Rating Analytics & Low-Rating Detection</h1>
            <p>Low-rating threshold: overall satisfaction below <strong><c:out value="${lowRatingThreshold}"/> / 5.00</strong> (items with 0 submissions are not flagged).</p>
            <div class="table-responsive" style="margin-top: 1rem;">
                <table>
                    <thead>
                        <tr>
                            <th>Food Item</th>
                            <th>Category</th>
                            <th>Samples (N)</th>
                            <th>Avg Taste</th>
                            <th>Avg Quality</th>
                            <th>Avg Quantity</th>
                            <th>Avg Hygiene</th>
                            <th>Avg Overall</th>
                            <th>Quality Flag</th>
                        </tr>
                    </thead>
                    <tbody>
                        <c:forEach var="r" items="${ratingReports}">
                            <tr>
                                <td><strong><c:out value="${r.foodName}"/></strong></td>
                                <td><c:out value="${r.mealCategory}"/></td>
                                <td><c:out value="${r.sampleCount}"/></td>
                                <td><c:out value="${r.avgTaste}"/></td>
                                <td><c:out value="${r.avgQuality}"/></td>
                                <td><c:out value="${r.avgQuantity}"/></td>
                                <td><c:out value="${r.avgHygiene}"/></td>
                                <td><strong><c:out value="${r.avgOverall}"/></strong></td>
                                <td>
                                    <c:choose>
                                        <c:when test="${r.sampleCount == 0}">No Ratings Yet</c:when>
                                        <c:when test="${r.lowRated}">LOW RATED (Needs Action)</c:when>
                                        <c:otherwise>Nominal</c:otherwise>
                                    </c:choose>
                                </td>
                            </tr>
                        </c:forEach>
                    </tbody>
                </table>
            </div>
        </section>
    </main>
</body>
</html>
