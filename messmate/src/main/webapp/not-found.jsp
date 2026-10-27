<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>404 Not Found — MessMate</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/messmate.css">
</head>
<body>
    <main class="container">
        <section class="card">
            <h1>404 — Page Not Found</h1>
            <p>The page you requested does not exist in MessMate.</p>
            <div style="margin-top: 1rem;">
                <a class="btn" href="${pageContext.request.contextPath}/index.jsp">Return to Home</a>
            </div>
        </section>
    </main>
</body>
</html>
