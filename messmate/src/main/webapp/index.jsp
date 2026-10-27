<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MessMate — Campus Mess Feedback & Menu Portal</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/messmate.css">
</head>
<body>
    <header class="topbar">
        <strong>MessMate</strong>
        <nav>
            <a href="${pageContext.request.contextPath}/student/login" class="btn">Student Login</a>
            <a href="${pageContext.request.contextPath}/admin/login" class="btn">Administrator Login</a>
        </nav>
    </header>
    <main class="container">
        <section class="card">
            <h1>MessMate — Mess Food Feedback and Menu Management System</h1>
            <p>Select your dedicated portal below. Students and Administrators use strictly separated authentication flows.</p>
            <div style="margin-top: 1.25rem; display: flex; gap: 1rem; flex-wrap: wrap;">
                <a class="btn" href="${pageContext.request.contextPath}/student/login">Open Student Portal (/student/login)</a>
                <a class="btn" href="${pageContext.request.contextPath}/admin/login">Open Administrator Portal (/admin/login)</a>
            </div>
        </section>
    </main>
</body>
</html>
