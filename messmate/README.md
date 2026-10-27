# MessMate — Complete Mess Food Feedback and Menu Management System

**MessMate** is a full-stack relational database-backed college mess feedback, menu management, rating analytics, complaint tracking, and improvement-action auditing system.

It is provided in two synchronized forms in this repository:
1. **Standard Java / Servlet / JSP / JDBC / MySQL / Maven Web Application (`/messmate/`)** — Ready to build into `target/messmate.war` and deploy on Apache Tomcat 10.1+ with MySQL 8.0+.
2. **Interactive Live Preview Runtime (`server.ts` + `src/`)** — Runs directly on port 3000 inside this container (where `java`, `mvn`, and `mysql` binaries are not pre-installed) using Node's native SQLite relational engine (`node:sqlite`) with identical SQL tables, BCrypt password verification, server-side sessions, CSRF tokens, and role guards.

---

## 1. Selected Software Versions (Java / Tomcat / MySQL Stack)

| Component | Selected Version | Notes |
| :--- | :--- | :--- |
| **Java JDK** | **Java 17 LTS** (or Java 21 LTS) | Configured via `maven-compiler-plugin` `<release>17</release>` |
| **Build Tool** | **Apache Maven 3.9+** | Standard WAR packaging (`pom.xml`) |
| **Servlet / JSP API** | **Jakarta Servlet 6.0 / JSP 3.1 / JSTL 3.0** | Provided by Apache Tomcat 10.1.x |
| **Servlet Container** | **Apache Tomcat 10.1.x** | Local deployment container |
| **Relational Database** | **MySQL 8.0+ (InnoDB, utf8mb4)** | Enforces foreign keys, unique constraints, and `CHECK (rating BETWEEN 1 AND 5)` |
| **JDBC Driver** | **MySQL Connector/J 8.4.0** | `com.mysql:mysql-connector-j:8.4.0` |
| **Password Hashing** | **jBCrypt 0.4** | Salted BCrypt (`$2a$10$...`), never plaintext |
| **Testing** | **JUnit Jupiter 5.10.2** | Automated validation & security unit tests |

---

## 2. How to Install Java, Maven, MySQL, and Apache Tomcat Locally

1. **Install Java 17 LTS**:
   - Ubuntu/Debian: `sudo apt update && sudo apt install -y openjdk-17-jdk`
   - macOS (Homebrew): `brew install openjdk@17`
   - Windows: Install Eclipse Temurin JDK 17 from adoptium.net.
   - Verify with `java -version`.
2. **Install Apache Maven 3.9+**:
   - Ubuntu/Debian: `sudo apt install -y maven`
   - macOS: `brew install maven`
   - Verify with `mvn -version`.
3. **Install MySQL Server 8.0+**:
   - Ubuntu/Debian: `sudo apt install -y mysql-server && sudo systemctl start mysql`
   - macOS: `brew install mysql && brew services start mysql`
   - Verify with `mysql --version`.
4. **Install Apache Tomcat 10.1.x**:
   - Download Apache Tomcat 10.1 binary archive from `https://tomcat.apache.org/download-10.cgi` and extract to `/opt/tomcat` or `~/tomcat`.

---

## 3. Database Creation & Least-Privilege User Setup (Exact SQL Order)

Run the following commands in a terminal with MySQL running:

```bash
# Step 1: Log in as MySQL root administrator and create a least-privilege application user
mysql -u root -p <<'SQL'
CREATE DATABASE IF NOT EXISTS messmate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'messmate_app'@'localhost' IDENTIFIED BY 'ReplaceWithStrongDbPass!2026';

GRANT SELECT, INSERT, UPDATE, DELETE ON messmate_db.* TO 'messmate_app'@'localhost';
FLUSH PRIVILEGES;
SQL

# Step 2: Run the schema script FIRST (creates users, food_items, feedback, improvement_actions, audit_logs)
mysql -u root -p messmate_db < database/schema.sql

# Step 3: (Optional — Development/Demo Only) Load fictional seed data
mysql -u root -p messmate_db < database/seed.sql
```

### Timestamp & Timezone Handling
All database `TIMESTAMP` columns (`created_at`, `updated_at`, `submitted_at`, `deleted_at`) are stored in **UTC** (`serverTimezone=UTC` in the JDBC connection URL) and formatted consistently for display. `service_date` is stored as a SQL `DATE` (`YYYY-MM-DD`) and validated on the server to disallow future dates or dates older than 30 days.

---

## 4. Configuring Database Credentials Securely

Never commit real database passwords to Git. Set environment variables before starting Apache Tomcat:

```bash
export MESSMATE_DB_URL="jdbc:mysql://localhost:3306/messmate_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8"
export MESSMATE_DB_USER="messmate_app"
export MESSMATE_DB_PASSWORD="ReplaceWithStrongDbPass!2026"
```

Alternatively, create an untracked `src/main/resources/db.local.properties` file (already excluded in `.gitignore`).

---

## 5. Building, Testing, and Deploying the WAR File

```bash
cd messmate

# Run JUnit 5 automated tests
mvn clean test

# Package the deployable WAR archive
mvn clean package

# Copy WAR to Apache Tomcat webapps directory and start Tomcat
cp target/messmate.war /opt/tomcat/webapps/
/opt/tomcat/bin/catalina.sh run
```

Once Tomcat starts, open:
- Landing Page: `http://localhost:8080/messmate/`
- Student Login: `http://localhost:8080/messmate/student/login`
- Administrator Login: `http://localhost:8080/messmate/admin/login`

---

## 6. Development-Only Demo Accounts (Seeded via `database/seed.sql`)

> **Security Warning**: These accounts exist only in `database/seed.sql` for local demonstration and evaluation. Do not load `seed.sql` in production deployments.

| Role | Username | Development Password | Display Name | Status |
| :--- | :--- | :--- | :--- | :--- |
| **STUDENT** | `aravind.k` | `Student@123` | Aravind Kumar (Hostel Block A) | Active |
| **STUDENT** | `priya.s` | `Student@123` | Priya Subramanian (Hostel Block C) | Active |
| **STUDENT** | `rohan.m` | `Student@123` | Rohan Mehta (Hostel Block B) | Active |
| **STUDENT** | `inactive.student` | `Student@123` | Vikram Das (Graduated - Inactive) | Inactive (Rejected at login) |
| **ADMIN** | `mess.warden` | `Admin@123` | Dr. Rajeshwari Menon (Chief Warden) | Active |
| **ADMIN** | `quality.admin` | `Admin@123` | Suresh Nair (Mess Operations Supervisor) | Active |

---

## 7. Troubleshooting Common Errors

- **`Public Key Retrieval is not allowed` or SSL errors**: Ensure `allowPublicKeyRetrieval=true&useSSL=false` is included in `MESSMATE_DB_URL` for local development, or configure TLS certificates for non-local deployments.
- **Port 8080 or 3306 already in use**: Check active listeners with `lsof -i :8080` or `lsof -i :3306` and update Tomcat's `conf/server.xml` or MySQL port accordingly.
- **403 Access Denied on form submit**: Ensure cookies are enabled so the `JSESSIONID` and `_csrf` token remain synchronized.

---

## 8. Manual Test & Acceptance Checklist

- [x] Student login succeeds with `aravind.k` / `Student@123` on `/student/login`.
- [x] Invalid password or username returns generic `"Invalid username or password."` without revealing which field failed.
- [x] Admin account (`mess.warden`) is rejected on `/student/login`; Student account (`aravind.k`) is rejected on `/admin/login`.
- [x] Inactive student (`inactive.student`) is blocked from logging in.
- [x] Direct navigation to `/admin/dashboard` by an authenticated Student returns HTTP 403 Access Denied.
- [x] Student Feedback form rejects ratings `< 1`, `> 5`, decimal numbers (e.g., `3.5`), future service dates, and inactive food items.
- [x] Student Feedback History displays only the logged-in student's own submissions.
- [x] Admin Feedback Management supports filtering by food item, meal category, date range, rating range, complaint category, complaint status, keyword search, sorting allowlist, and pagination.
- [x] Admin Rating Reports calculate SQL averages (`taste`, `quality`, `quantity`, `hygiene`, `overall`) with sample count `N` and configurable low-rating threshold (default `3.0`).
- [x] Admin Complaint Management tracks `OPEN`, `IN_PROGRESS`, `RESOLVED` statuses, records Improvement Actions with admin attribution, and logs to `audit_logs`.
- [x] Admin Menu Management creates, edits, toggles availability, and deactivates menu items (preserving historical feedback).
