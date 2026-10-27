# MessMate — Complete Mess Food Feedback and Menu Management System
## Master Development Prompt (200+ Lines)

**Role:** You are a senior Java web developer, database architect, security engineer, UI/UX designer, and QA engineer. Build a complete, runnable application—not a static mockup.

**Project name:** MessMate  
**Purpose:** Collect student food feedback, give administrators exclusive access to all feedback and reports, and let administrators manage the food menu.

---

## A. Core Objectives

1. Build a web application named MessMate.
2. Use Java for backend logic.
3. Use JDBC for database access.
4. Use MySQL for persistent data storage.
5. Use HTML for page structure.
6. Use CSS for responsive styling.
7. Use Java Servlets and JSP for web request handling and views.
8. Use Maven for dependency management and builds.
9. Deploy locally using Apache Tomcat.
10. Do not use Spring Boot, Hibernate, JPA, Firebase, or another database.
11. Build actual working backend functionality.
12. Do not create a UI-only prototype.
13. Do not use hardcoded feedback or menu data to fake database functionality.
14. Keep the project beginner-friendly to run and demonstrate.
15. Document any assumptions and limitations clearly.

## B. Mandatory User Roles

16. Support exactly two application roles: `STUDENT` and `ADMIN`.
17. Students and admins must have separate login pages.
18. Students must use the Student Login page.
19. Admins must use the Admin Login page.
20. Authenticate both roles against the MySQL users table.
21. Never trust a role submitted through a form or URL.
22. Read the user's role from the authenticated server-side session or database.
23. Students must not open admin pages by typing their URLs.
24. Students must not access admin APIs or servlet actions directly.
25. Admin pages and operations must verify both authentication and admin role on the server.
26. Display a clear access-denied page for unauthorized access.
27. Keep student and admin dashboards visually and functionally separate.
28. Provide a logout option on every authenticated dashboard.
29. Invalidate the session on logout.
30. Use session timeouts and safe session handling.

## C. Student Login and Authentication

31. Create a dedicated `/student/login` page.
32. Include username and password fields.
33. Include a login button and clear validation messages.
34. Validate required fields on the server.
35. Verify the account is active before allowing login.
36. Ensure the account has the `STUDENT` role.
37. Reject an admin account from the student-only login flow or redirect it to the correct admin login.
38. Display a generic error for invalid credentials.
39. Do not reveal whether the username or password was incorrect.
40. Regenerate the session ID after successful login.
41. Store only the minimum user details and role in the session.
42. Never store plaintext passwords in the session.
43. Never print passwords or password hashes in logs.
44. Hash passwords using BCrypt or another appropriate password-hashing algorithm.
45. Never store plaintext passwords in MySQL.
46. Do not create a public registration form that lets users choose the ADMIN role.
47. If student registration is implemented, assign the STUDENT role on the server only.
48. If registration is not implemented, document how an admin or setup script creates student accounts.
49. Add a safe development-account setup process without production default credentials.
50. Include a working logout action.

## D. Admin Login and Authentication

51. Create a dedicated `/admin/login` page.
52. Use a separate visual design or clear heading: “Administrator Login”.
53. Include username and password fields.
54. Authenticate using the same secure password-verification mechanism.
55. Allow entry only when the account is active and has the ADMIN role.
56. Reject student accounts from the admin login.
57. Regenerate the session ID after successful admin login.
58. Redirect successful admin login to `/admin/dashboard`.
59. Never allow an admin role to be set using a hidden field or query parameter.
60. Protect all admin routes with a server-side authorization filter.
61. Require CSRF protection for admin state-changing operations.
62. Provide a clear unauthorized-access response.
63. Log important admin actions without recording passwords or unnecessary personal data.
64. Provide a safe logout action that invalidates the session.
65. Do not reveal sensitive server or SQL details on login failures.

## E. Student Dashboard

66. Build a dedicated student dashboard.
67. Show the authenticated student's display name.
68. Show a welcome message and current menu.
69. Add a “View Food Menu” section.
70. Add a “Submit Feedback” action.
71. Add a “My Feedback History” section.
72. Show the student's own feedback only.
73. Never display another student's feedback to a student.
74. Never display all complaints to students.
75. Never show admin reports, analytics, or administrative actions.
76. Do not show menu-edit controls to students.
77. Show food availability and meal categories.
78. Show a friendly empty state when no menu items are available.
79. Show success and error messages after form submissions.
80. Make the student dashboard responsive on mobile and desktop.

## F. Food Menu Display for Students

81. Load the menu from the MySQL database.
82. Do not hardcode menu items into JSP or HTML.
83. Group menu items by meal category.
84. Support breakfast, lunch, dinner, and snacks.
85. Display food name and description when available.
86. Display whether each item is available.
87. Hide inactive or removed items from the current student menu.
88. Refresh the menu from database data after an administrator changes it.
89. Make the menu easy to scan on a phone.
90. Provide a clear message if a meal category has no available items.

## G. Student Food Feedback Form

91. Create a feedback form accessible only to authenticated students.
92. Populate the food selector using active food items from MySQL.
93. Include the meal category.
94. Include the date the food was served.
95. Add a taste rating from 1 to 5.
96. Add a quality rating from 1 to 5.
97. Add a quantity rating from 1 to 5.
98. Add a hygiene rating from 1 to 5.
99. Add an overall satisfaction rating from 1 to 5.
100. Explain that 1 means very poor and 5 means excellent.
101. Use accessible radio buttons or another keyboard-friendly rating control.
102. Add an optional comments field.
103. Add an optional suggestions field.
104. Add an optional complaint category.
105. Include categories such as taste, quality, quantity, hygiene, temperature, variety, and other.
106. Allow “No complaint” when applicable.
107. Limit comments and suggestions to a sensible maximum length.
108. Display helpful character-count guidance.
109. Require the food item, meal category, service date, and all five ratings.
110. Validate all form values on the server.
111. Reject ratings below 1 or above 5.
112. Reject decimal ratings if whole numbers are required.
113. Reject missing or malformed IDs.
114. Verify that the selected food item exists and is active.
115. Validate the service date according to documented application rules.
116. Obtain the student ID from the authenticated session, never from a hidden form field.
117. Do not allow students to submit feedback as another user.
118. Use a clear duplicate-submission policy.
119. If duplicate feedback is restricted, enforce the rule in the database where practical.
120. Save feedback through JDBC using a transaction when multiple records must be saved together.
121. Show a confirmation message only after the database operation succeeds.
122. Preserve entered values after recoverable validation errors.
123. Ensure a failed insert does not leave partial data.

## H. Student Feedback History

124. Create a “My Feedback History” page.
125. Retrieve records using the authenticated student's ID.
126. Display food name, meal category, service date, rating summary, and submission time.
127. Display the student's comments and suggestions only to that student.
128. Show complaint status only when it is appropriate to expose.
129. Never trust a student ID supplied by the browser to determine ownership.
130. Apply ownership checks on every detail request.
131. Show a clear empty state if the student has not submitted feedback.
132. Do not let students edit or delete admin-managed feedback unless a separate, explicitly authorized policy is implemented.
133. Make the history page responsive and readable.

## I. Admin Dashboard

134. Create a dedicated admin dashboard.
135. Display a welcome message for the authenticated admin.
136. Provide links to feedback management.
137. Provide links to food rating reports.
138. Provide links to complaint management.
139. Provide links to food menu management.
140. Provide links to improvement-action history.
141. Show the total number of feedback submissions.
142. Show the average overall satisfaction rating.
143. Show the number of low-rated food items.
144. Show the number of unresolved complaints.
145. Show recent feedback submissions.
146. Load all dashboard figures from MySQL.
147. Do not use hardcoded figures.
148. Provide clear navigation between admin sections.
149. Ensure every admin page checks the ADMIN role on the server.
150. Show useful empty states when no feedback exists.

## J. Admin-Only Feedback and Complaint Access

151. Allow admins to view all submitted feedback.
152. Allow admins to view comments, suggestions, and complaints.
153. Allow admins to view the food item and meal category associated with feedback.
154. Allow admins to view the five ratings.
155. Allow admins to view service date and submission timestamp.
156. Minimize exposure of student personal information when it is not needed.
157. Allow filtering by food item.
158. Allow filtering by meal category.
159. Allow filtering by service-date range.
160. Allow filtering by rating range.
161. Allow filtering by complaint category.
162. Allow filtering by complaint status.
163. Provide a search feature for permitted fields.
164. Validate all search and filter values on the server.
165. Use server-side pagination.
166. Use a fixed allowlist for sortable column names.
167. Use parameterized SQL for filter values.
168. Display a useful message when no records match.
169. Provide a reset-filters action.
170. Keep this section inaccessible to students, including through direct servlet requests.

## K. Food Rating Reports and Analytics

171. Calculate the average taste rating for each food item.
172. Calculate the average quality rating for each food item.
173. Calculate the average quantity rating for each food item.
174. Calculate the average hygiene rating for each food item.
175. Calculate the average overall satisfaction rating for each food item.
176. Display the number of feedback records supporting each average.
177. Round averages consistently, such as to two decimal places.
178. Do not count missing ratings as zero.
179. Exclude soft-deleted feedback from normal reports.
180. Allow admins to filter reports by date range.
181. Allow admins to filter reports by meal category.
182. Allow sorting from highest-rated to lowest-rated.
183. Allow sorting from lowest-rated to highest-rated.
184. Mark food items with an average overall rating below 3.0 as low-rated by default.
185. Make the low-rating threshold configurable.
186. Do not flag items with no feedback as low-rated.
187. Display sample counts beside ratings for context.
188. Explain how ratings and thresholds are calculated.
189. Ensure all report calculations are based on database queries.
190. Restrict reports to admins only.

## L. Complaint Frequency and Improvement Tracking

191. Count complaints by category.
192. Identify recurring problems such as poor taste, low quality, insufficient quantity, and hygiene concerns.
193. Use clear, explainable category counts or keyword matching for the first version.
194. Do not claim simple keyword matching is advanced AI.
195. Preserve original complaint text for authorized review.
196. Allow admins to open the feedback records behind a complaint count.
197. Show frequent complaint categories for a selected date range.
198. Show complaints linked to low-rated food items.
199. Track complaint status as OPEN, IN_PROGRESS, or RESOLVED.
200. Allow admins to update complaint status.
201. Record improvement actions taken by the mess team.
202. Store the responsible admin ID.
203. Record the action timestamp.
204. Display unresolved complaints prominently.
205. Maintain an audit history of status changes and improvement actions.
206. Do not automatically mark complaints resolved without an explicit admin action.
207. Restrict complaint management and improvement reports to admins.
208. Provide clear confirmation messages after changes.

## M. Admin Food Menu Management

209. Create an admin-only “Manage Food Menu” page.
210. Allow admins to add new food items.
211. Allow admins to edit food names.
212. Allow admins to edit descriptions.
213. Allow admins to assign meal categories.
214. Allow admins to set food availability.
215. Allow admins to deactivate or remove items from the active menu.
216. Validate required food names.
217. Trim whitespace and enforce maximum field lengths.
218. Validate meal categories against an allowlist.
219. Prevent duplicate food entries where appropriate.
220. Use prepared statements for all insert, update, and delete operations.
221. Show a confirmation step before deactivating or removing an item.
222. Prefer deactivation over permanent deletion when feedback already references the food item.
223. Preserve historical feedback when a menu item becomes inactive.
224. Ensure inactive food items cannot be selected for new feedback.
225. Ensure students see the updated menu after an admin saves a change.
226. Display clear success and failure messages.
227. Record the admin responsible for menu changes.
228. Record timestamps for menu changes.
229. Keep all menu-management routes inaccessible to students.
230. Update the database first and render the current saved state afterward.

## N. MySQL Database Schema

231. Create a database named `messmate_db`.
232. Use MySQL with InnoDB tables and foreign-key constraints.
233. Create a `users` table.
234. Include user ID, username, password hash, display name, role, active status, and timestamps.
235. Enforce unique usernames.
236. Create a `food_items` table.
237. Include food ID, name, description, meal category, availability, active status, created time, and updated time.
238. Create a `feedback` table.
239. Include feedback ID, student ID, food ID, meal category, service date, five ratings, comments, suggestions, complaint category, complaint status, submission time, update time, and soft-delete fields.
240. Use integer columns and constraints to enforce ratings from 1 to 5 where supported.
241. Add foreign keys between feedback, users, and food items.
242. Create an `improvement_actions` table.
243. Include feedback ID, admin ID, action text, status, and timestamps.
244. Create an `audit_logs` table.
245. Record important administrative changes and deletions.
246. Add indexes for common date, food, student, category, and status filters.
247. Prevent orphaned feedback records.
248. Choose appropriate data types and consistent naming conventions.
249. Document timestamp and timezone handling.
250. Provide `database/schema.sql`.
251. Provide optional `database/seed.sql` with fictional development data.
252. Never include real student personal information in seed data.
253. Include a documented schema migration strategy.
254. Document the exact order for running SQL setup scripts.

## O. Java, JDBC, and Application Architecture

255. Use a conventional Maven web application structure.
256. Separate model, DAO, service, servlet, filter, validation, and configuration packages.
257. Create a database connection utility or configured connection pool.
258. Read credentials from environment variables or an untracked local configuration file.
259. Use try-with-resources to close JDBC resources.
260. Use `PreparedStatement` for all user-supplied values.
261. Use transactions for related multi-table changes.
262. Roll back transactions on failure.
263. Keep SQL queries in DAO classes.
264. Keep business rules in service classes.
265. Keep validation logic in reusable validators.
266. Use servlets to process requests and JSP files to render views.
267. Put protected JSP files under `WEB-INF`.
268. Use filters for authentication and role authorization.
269. Use CSRF tokens for state-changing forms.
270. Do not put SQL statements in JSP pages.
271. Do not put the entire application in one Java class.
272. Use efficient SQL aggregate queries for analytics.
273. Handle database connection errors gracefully.
274. Log technical errors without exposing stack traces to users.
275. Use dependency versions compatible with the selected Java and Tomcat versions.
276. Document the selected Java, Servlet API, Tomcat, MySQL, and Connector/J versions.

## P. Recommended Project Structure

277. Use a structure similar to this:

```text
messmate/
├── pom.xml
├── README.md
├── .gitignore
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── migrations/
└── src/
    ├── main/
    │   ├── java/com/messmate/
    │   │   ├── config/
    │   │   ├── filter/
    │   │   ├── model/
    │   │   ├── dao/
    │   │   ├── service/
    │   │   ├── servlet/
    │   │   ├── validation/
    │   │   └── util/
    │   ├── resources/
    │   └── webapp/
    │       ├── assets/css/
    │       ├── assets/images/
    │       ├── WEB-INF/views/
    │       ├── index.jsp
    │       ├── student-login.jsp
    │       ├── admin-login.jsp
    │       └── error.jsp
    └── test/
        └── java/
```

278. Ensure servlet mappings and form action URLs match the actual project.
279. Ensure JSP form field names match the servlet parameters.
280. Ensure model fields match database column mappings.
281. Ensure the project builds as a WAR file suitable for Tomcat.
282. Do not commit build output, credentials, or private local configuration.

## Q. Required Pages

283. Landing page with separate Student Login and Admin Login options.
284. Student Login page.
285. Admin Login page.
286. Student dashboard.
287. Student food menu page.
288. Student feedback form.
289. Student feedback-history page.
290. Admin dashboard.
291. Admin feedback management page.
292. Admin feedback details and edit page.
293. Admin rating analytics page.
294. Admin complaint management page.
295. Admin improvement-action history page.
296. Admin food menu management page.
297. Access-denied page.
298. Not-found page.
299. General error page.
300. Every protected page must be guarded server-side, not just hidden from navigation.

## R. UI and Accessibility

301. Create a polished, modern interface suitable for a college mess.
302. Use a consistent color palette and typography.
303. Separate student and admin visual navigation clearly.
304. Use responsive CSS for mobile, tablet, and desktop.
305. Use semantic HTML and labels for every input.
306. Ensure keyboard-accessible rating controls.
307. Provide visible focus states and readable contrast.
308. Do not rely on color alone to communicate low ratings or errors.
309. Use clear success, warning, error, and empty states.
310. Make tables usable on narrow screens.
311. Avoid unnecessary animations and visual clutter.
312. Keep CSS in separate files.
313. Do not rely on remote resources for core functionality.
314. Ensure all buttons and links perform real actions.
315. Ensure the application is usable on a typical student mobile phone.

## S. Security and Privacy

316. Use least-privilege MySQL credentials.
317. Use password hashing rather than plaintext storage.
318. Prevent SQL injection through prepared statements.
319. Escape user-generated content when rendering HTML.
320. Protect state-changing operations against CSRF.
321. Enforce role checks and ownership checks on the server.
322. Use secure session handling and sensible timeouts.
323. Use HTTPS for non-local deployments.
324. Exclude secrets and real user data from Git.
325. Avoid exposing SQL messages, stack traces, and credentials.
326. Do not log passwords or password hashes.
327. Audit important admin edits, deletions, and menu changes.
328. Minimize student personal information in reports.
329. Document backup, access-control, and deployment-hardening needs.
330. Do not claim the application is completely secure without a formal security review.

## T. Testing and Acceptance Criteria

331. Test student login with valid credentials.
332. Test student login with invalid credentials.
333. Test admin login with valid credentials.
334. Test that a student cannot log in through the admin flow.
335. Test that an admin cannot be downgraded by a submitted form value.
336. Test direct URL access to protected admin pages.
337. Test that students can view only their own feedback.
338. Test rejection of ratings outside 1–5.
339. Test rejection of missing required fields.
340. Test SQL injection attempts in text and login inputs.
341. Test feedback insertion and verify it in MySQL.
342. Test menu creation, editing, and deactivation.
343. Test that menu changes appear on the student dashboard.
344. Test rating averages against known sample data.
345. Test low-rating detection and complaint frequency.
346. Test complaint status and improvement-action history.
347. Test authorized feedback editing and soft deletion.
348. Test audit records after administrative changes.
349. Test database failure handling and rollback.
350. Test logout and session invalidation.
351. Test responsive layout and empty states.
352. Run Maven tests and build the WAR.
353. Report actual test results; never claim tests passed if they were not run.

## U. Deliverables

354. Provide every Java source file needed to run the application.
355. Provide all JSP, HTML, and CSS files.
356. Provide the `pom.xml`.
357. Provide SQL schema, seed data, and migrations if used.
358. Provide `.gitignore`.
359. Provide a sample environment configuration file with placeholders only.
360. Provide a complete `README.md`.
361. Explain how to install compatible Java, Maven, MySQL, and Tomcat versions.
362. Explain how to create the database and application database user.
363. Explain how to configure database credentials securely.
364. Explain how to build and deploy the WAR.
365. Explain how to start and access the application locally.
366. Provide troubleshooting steps for common SQL, port, and deployment errors.
367. Provide development-only demo accounts only if safely configured.
368. Include a manual test checklist.
369. List any incomplete requirements honestly.
370. Do not provide only code snippets when complete files are requested.

## V. Required Implementation Workflow

371. Inspect the environment and select compatible versions.
372. Show the proposed architecture and file tree.
373. Create the Maven project and dependencies.
374. Create the database schema, indexes, constraints, and seed script.
375. Implement configuration and JDBC connection management.
376. Implement model classes and DAO classes.
377. Implement service and validation layers.
378. Implement password hashing and the two separate login routes.
379. Implement session handling, logout, CSRF protection, and authorization filters.
380. Implement the student dashboard and live menu display.
381. Implement feedback submission and server-side validation.
382. Implement student feedback history with ownership checks.
383. Implement admin feedback management, search, filters, and pagination.
384. Implement admin rating reports and complaint analysis.
385. Implement menu creation, editing, and deactivation.
386. Implement improvement actions and audit logging.
387. Build all responsive pages and CSS.
388. Add automated tests for key business rules and access control.
389. Build the WAR and resolve compile errors.
390. Test against a real local MySQL instance when available.
391. Verify every route, form, and button.
392. Follow the README instructions from a clean setup if possible.
393. Fix source files when errors are discovered.
394. Keep SQL columns, Java properties, JSP names, and servlet mappings consistent.
395. Finish with run instructions, feature checklist, test results, and known limitations.

## W. Final Instructions to the Coding Agent

396. Implement the project in small, verifiable stages.
397. Do not stop after creating login screens or a static dashboard.
398. Do not use hardcoded reports as a substitute for SQL analytics.
399. Do not allow students to access all feedback, complaints, reports, or menu editing.
400. Keep the student login and admin login clearly separate.
401. Ensure only admins can view all feedback and reports.
402. Ensure only admins can create, edit, or deactivate food menu items.
403. Ensure menu changes persist in MySQL and appear to students.
404. Ensure authorized feedback changes refresh the relevant reports.
405. Ensure all forms are validated on the server.
406. Ensure errors are handled without exposing secrets.
407. Ask a question only when a critical requirement blocks implementation; otherwise document reasonable defaults.
408. If a tool cannot run Tomcat or MySQL, still create the complete project and give exact verification commands.
409. Do not invent successful build or test results.
410. The final result must be a complete, maintainable, database-backed Java web application suitable for a college project demonstration.
