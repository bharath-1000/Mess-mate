<%@ page contentType="text/html;charset=UTF-8" language="java" isErrorPage="true" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>System Error — MessMate</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/messmate.css">
</head>
<body>
    <main class="container">
        <section class="card">
            <h1>An unexpected error occurred</h1>
            <p>The server encountered an issue while processing your request. Technical details have been logged securely without exposing sensitive database information.</p>
            <div style="margin-top: 1rem;">
                <a class="btn" href="${pageContext.request.contextPath}/index.jsp">Return to Home</a>
            </div>
        </section>
    </main>
</body>
</html>
