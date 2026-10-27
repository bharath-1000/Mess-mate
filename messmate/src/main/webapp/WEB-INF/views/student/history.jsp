<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Feedback History — MessMate</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/messmate.css">
</head>
<body>
    <main class="container">
        <section class="card">
            <h1>My Feedback History</h1>
            <p>Showing records submitted exclusively by your student account (<c:out value="${sessionScope.AUTH_DISPLAY_NAME}"/>).</p>
            <c:choose>
                <c:when test="${empty feedbackHistory}">
                    <p style="margin-top:1rem;">You have not submitted any food feedback yet.</p>
                </c:when>
                <c:otherwise>
                    <div class="table-responsive" style="margin-top:1rem;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Service Date</th>
                                    <th>Dish</th>
                                    <th>Category</th>
                                    <th>Ratings (T/Qual/Quant/Hyg/Overall)</th>
                                    <th>Comments & Suggestions</th>
                                    <th>Complaint Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <c:forEach var="fb" items="${feedbackHistory}">
                                    <tr>
                                        <td><c:out value="${fb.serviceDate}"/></td>
                                        <td><strong><c:out value="${fb.foodName}"/></strong></td>
                                        <td><c:out value="${fb.mealCategory}"/></td>
                                        <td>
                                            <c:out value="${fb.tasteRating}"/> /
                                            <c:out value="${fb.qualityRating}"/> /
                                            <c:out value="${fb.quantityRating}"/> /
                                            <c:out value="${fb.hygieneRating}"/> /
                                            <strong><c:out value="${fb.overallRating}"/></strong>
                                        </td>
                                        <td>
                                            <div><c:out value="${fb.comments}"/></div>
                                            <small><c:out value="${fb.suggestions}"/></small>
                                        </td>
                                        <td><c:out value="${fb.complaintStatus}"/></td>
                                    </tr>
                                </c:forEach>
                            </tbody>
                        </table>
                    </div>
                </c:otherwise>
            </c:choose>
        </section>
    </main>
</body>
</html>
