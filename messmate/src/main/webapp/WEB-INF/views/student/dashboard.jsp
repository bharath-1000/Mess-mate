<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Dashboard — MessMate</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/messmate.css">
</head>
<body>
    <header class="topbar">
        <strong>MessMate · Student Portal</strong>
        <nav style="display:flex; gap:1rem; align-items:center;">
            <span>Welcome, <c:out value="${sessionScope.AUTH_DISPLAY_NAME}"/></span>
            <a href="${pageContext.request.contextPath}/student/feedback/new" class="btn">Submit Feedback</a>
            <a href="${pageContext.request.contextPath}/student/feedback/history" class="btn">My Feedback History</a>
            <form method="post" action="${pageContext.request.contextPath}/logout" style="display:inline;">
                <input type="hidden" name="_csrf" value="${sessionScope.MESSMATE_CSRF_TOKEN}">
                <button type="submit" class="btn">Logout</button>
            </form>
        </nav>
    </header>
    <main class="container">
        <section class="card">
            <h1>Current Mess Food Menu</h1>
            <c:choose>
                <c:when test="${empty menuItems}">
                    <p>No active menu items are currently available. Please check back later.</p>
                </c:when>
                <c:otherwise>
                    <div class="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Meal Category</th>
                                    <th>Dish Name</th>
                                    <th>Description</th>
                                    <th>Availability</th>
                                </tr>
                            </thead>
                            <tbody>
                                <c:forEach var="item" items="${menuItems}">
                                    <tr>
                                        <td><c:out value="${item.mealCategory}"/></td>
                                        <td><strong><c:out value="${item.name}"/></strong></td>
                                        <td><c:out value="${item.description}"/></td>
                                        <td>
                                            <c:choose>
                                                <c:when test="${item.available}">Available Today</c:when>
                                                <c:otherwise>Temporarily Out of Stock</c:otherwise>
                                            </c:choose>
                                        </td>
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
