<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Access Denied (403) — MessMate</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/messmate.css">
</head>
<body>
    <main class="container">
        <section class="card">
            <h1>403 — Access Denied</h1>
            <p>You do not have permission to view this resource. Role-based authorization is enforced on the server.</p>
            <c:if test="${not empty errorMessage}">
                <p style="color:#dc2626; margin-top:0.5rem;"><c:out value="${errorMessage}"/></p>
            </c:if>
            <div style="margin-top: 1rem;">
                <a class="btn" href="${pageContext.request.contextPath}/index.jsp">Return to Home</a>
            </div>
        </section>
    </main>
</body>
</html>
