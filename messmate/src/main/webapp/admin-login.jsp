<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Administrator Login — MessMate</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/messmate.css">
</head>
<body>
    <main class="container">
        <section class="card" style="max-width: 460px; margin: 3rem auto;">
            <h1>Administrator Login</h1>
            <p>Restricted portal for Mess Wardens and Quality Administrators.</p>
            <c:if test="${not empty loginError}">
                <div role="alert" style="color: #dc2626; margin: 0.75rem 0; font-weight: 600;">
                    <c:out value="${loginError}"/>
                </div>
            </c:if>
            <form method="post" action="${pageContext.request.contextPath}/admin/login">
                <div style="margin-top: 1rem;">
                    <label for="admin-username">Administrator Username</label>
                    <input id="admin-username" name="username" type="text" required autocomplete="username" style="width:100%; padding:0.5rem; margin-top:0.25rem;">
                </div>
                <div style="margin-top: 1rem;">
                    <label for="admin-password">Password</label>
                    <input id="admin-password" name="password" type="password" required autocomplete="current-password" style="width:100%; padding:0.5rem; margin-top:0.25rem;">
                </div>
                <div style="margin-top: 1.25rem;">
                    <button type="submit" class="btn" style="width: 100%;">Sign In as Administrator</button>
                </div>
            </form>
        </section>
    </main>
</body>
</html>
