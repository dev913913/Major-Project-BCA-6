# 1. Project Title

**Codev CMS: A Role-Based Programming Learning and Content Management Platform Using React and Supabase**

---

# 2. Abstract

Codev CMS is a full-stack web application developed to deliver structured programming lessons and to simplify educational content management through a secure admin panel. The platform addresses a common challenge in digital learning systems: presenting course content in a student-friendly format while giving administrators efficient tools to create, organize, and maintain lessons. On the public side, users can browse published lessons, read detailed markdown-based tutorials, explore categories, and discover related content. On the admin side, authorized users can manage lessons, categories, media assets, and monitor basic analytics through a dashboard.

The system is built with React and Vite for a fast single-page frontend, Tailwind CSS for modern responsive design, and Supabase for authentication, PostgreSQL database operations, and media storage. Features such as role-based route protection, markdown rendering with syntax-highlighted code blocks, lesson view tracking, SEO metadata handling, and category-wise organization are fully implemented. The project demonstrates practical integration of frontend and backend services for real-world educational applications, making it suitable for BCA major project submission and future production-scale enhancement.

---

# 3. Introduction

## Background of the Problem
Many beginner learners struggle to find programming platforms that combine quality technical lessons with a clean, modern interface. On the other side, educators and content creators often face difficulties maintaining lessons manually across static pages or multiple tools. Traditional systems either focus only on content publishing or only on learning delivery, resulting in poor user experience and limited administration capability.

## Why This Project is Needed
Codev CMS is designed to solve both needs in one integrated solution:
- It provides students with an organized lesson experience (home highlights, searchable lessons, category browsing, lesson detail pages).
- It provides administrators with a controlled backend for content publishing, categorization, media handling, and quick status updates.
- It enforces role-based access so only admin users can modify data.
- It supports markdown-based lesson authoring with code highlighting, which is ideal for programming education.

This makes the project directly relevant for modern e-learning use cases and suitable for scalable academic and practical implementation.

---

# 4. Objectives

1. To build a responsive web-based learning platform for programming lessons.
2. To implement secure authentication and admin-only authorization for CMS operations.
3. To provide CRUD operations for lessons, categories, and media resources.
4. To enable markdown-based lesson content with syntax-highlighted code blocks.
5. To organize lessons by categories and support quick search/filter interactions.
6. To track lesson engagement through view count increment logic.
7. To provide an analytics-oriented admin dashboard for operational insights.
8. To design the system with maintainable modular React components and service layers.

---

# 5. Scope of the Project

## What the System Does
- Displays published programming lessons to public users.
- Provides detailed lesson pages with markdown rendering and code snippet sections.
- Shows category listings and lesson counts.
- Offers admin login and protected admin routes.
- Allows admin users to create, edit, publish/unpublish, archive, and delete lessons.
- Allows admin users to create/update/delete categories.
- Allows admin users to upload and delete media files from storage.
- Shows dashboard metrics like lesson counts, views, status breakdown, category distribution, and recent activity.

## Boundaries of the System
- No student registration/profile workflow is implemented on frontend (admin login focus).
- No quiz, exam, certificate, or payment module is implemented.
- No advanced recommendation engine or AI personalization is present.
- Real-time notifications/chat/forum features are not implemented.
- Analytics are operational and aggregate-based, not deep BI/reporting.

---

# 6. Technologies Used

## 6.1 React (Frontend Library)
- **Purpose:** Builds all UI pages, components, and state-driven interactions.
- **Why chosen:** Component reusability, ecosystem maturity, and easy integration with router and Supabase.

## 6.2 Vite (Build Tool)
- **Purpose:** Development server and production build pipeline.
- **Why chosen:** Fast startup/HMR and modern React project workflow.

## 6.3 React Router DOM
- **Purpose:** Client-side routing (`/`, `/lessons`, `/lesson/:id`, `/admin/*`).
- **Why chosen:** Reliable routing for SPA and nested route support for admin layout.

## 6.4 Tailwind CSS
- **Purpose:** Styling and responsive UI utility classes.
- **Why chosen:** Rapid UI development, consistency, and maintainable utility-first design.

## 6.5 Supabase
- **Purpose:** Backend-as-a-service for authentication, PostgreSQL database, and storage.
- **Why chosen:** Unified backend platform with secure row-level policies and simple JS SDK.

## 6.6 PostgreSQL (via Supabase)
- **Purpose:** Stores lessons, categories, users/profiles, tags, media metadata, and relations.
- **Why chosen:** Relational integrity, SQL support, and robust schema control.

## 6.7 Prism.js + React Markdown + Remark GFM
- **Purpose:** Render markdown lesson content and highlight code blocks.
- **Why chosen:** Suitable for technical educational content and GitHub-flavored markdown support.

## 6.8 ESLint
- **Purpose:** Code quality and linting checks.
- **Why chosen:** Standardized development quality control.

---

# 7. System Architecture

## 7.1 Overall Architecture
The project follows a **frontend-service-backend** structure:

1. **Frontend (React SPA):**
   - Pages and components render UI.
   - Context API handles authentication state.
   - Service files isolate data operations.

2. **Backend Services (Supabase):**
   - Auth module validates admin credentials.
   - PostgreSQL tables store structured academic content.
   - Storage bucket stores uploaded media files.

3. **Security Layer:**
   - Row Level Security (RLS) policies allow public read on selected data and admin-only write operations.
   - ProtectedRoute ensures only authenticated admin role accesses `/admin`.

## 7.2 Data Flow (Simple)
1. User opens page in browser.
2. React page calls corresponding service function.
3. Service function sends request to Supabase table/RPC/storage.
4. Supabase applies RLS policy and returns data/error.
5. UI state updates and renders cards/tables/forms.
6. In lesson detail, view count is incremented using RPC (`increment_lesson_views`).

---

# 8. Module Description (Very Important)

## 8.1 Authentication Module
### What it does
- Manages login/logout, session state, profile loading, and role detection.
- Restricts admin routes using role-based checks.

### Internal working
- `AuthContext` fetches session on app load and subscribes to auth state changes.
- On session availability, it loads profile data from `profiles` table.
- `isAdmin` is derived from `profile.role === 'admin'`.
- `ProtectedRoute` blocks unauthorized access and redirects to `/login`.

## 8.2 Public UI Module
### What it does
- Displays homepage, lessons listing, categories list, and lesson detail.
- Provides search, category filtering, content cards, and responsive navigation.

### Internal working
- `HomePage` fetches published lessons + categories using `Promise.all`, computes popular lessons and aggregate stats.
- `LessonsPage` supports keyword search and dynamic category filter chips from fetched data.
- `LessonPage` loads one lesson by ID, increments view count, computes reading time, normalizes code snippets, and fetches related lessons by category.
- Markdown content is rendered via `MarkdownRenderer`, with copy-enabled code blocks and Prism highlighting.

## 8.3 SEO & Metadata Module
### What it does
- Improves discoverability via dynamic page metadata and structured data.

### Internal working
- `useSeo` updates title, description, Open Graph, Twitter card, canonical URL meta tags.
- `JsonLd` injects structured schema scripts (`WebSite`, `Article`) per page.

## 8.4 Lesson Management Module (Admin)
### What it does
- Full lesson CRUD with status control, search, filtering, and pagination.

### Internal working
- Admin form captures markdown content, category, image URL, status, and code snippets.
- Code snippets are transformed between textarea format and array format using split marker (`---`).
- Table supports edit, delete, and quick publish/unpublish action.
- Pagination handled client-side with configurable page size.

## 8.5 Category Management Module (Admin)
### What it does
- Create, edit, delete lesson categories and display lesson counts.

### Internal working
- Uses category services for CRUD.
- Lessons count is derived from relational count query (`lessons(count)`) and mapped to `lesson_count`.

## 8.6 Media Management Module (Admin)
### What it does
- Uploads and deletes media assets for lessons.

### Internal working
- File selected from input is renamed safely (`timestamp + sanitized-name`).
- File uploaded to Supabase storage bucket `lesson-media`.
- Public URL stored in `media` table with MIME type and uploader ID.
- Admin can preview image/file and delete both storage object and database record.

## 8.7 Dashboard Analytics Module (Admin)
### What it does
- Presents summary metrics and visual analytics cards.

### Internal working
- Loads all lessons and categories, then derives:
  - status distribution (published/draft/archived),
  - total views,
  - most popular lesson,
  - category distribution,
  - top viewed lessons,
  - pseudo trend line for recent 30-day timeline based on update/create dates,
  - recent published activity.
- Includes manual refresh and relative timestamp formatting.

## 8.8 Data Service Module
### What it does
- Encapsulates all Supabase DB/storage interactions.

### Internal working
- `lessonService`: fetch public/admin lessons, fetch by ID, create/update/delete, increment views RPC.
- `categoryService`: fetch and manage categories.
- `mediaService`: upload/list/delete media records and storage objects.
- `supabaseClient`: initializes Supabase client using environment variables.

---

# 9. Features of the System

1. Responsive modern UI with mobile-friendly navigation.
2. Home page with hero section, highlights, popular lessons, and aggregate stats.
3. Lessons page with search and category filtering.
4. Detailed lesson pages with markdown rendering and syntax-highlighted code blocks.
5. “Copy code” interaction for code blocks.
6. Reading-time estimation for lessons.
7. Related lesson recommendations based on category.
8. Automatic lesson view counter increment via backend RPC.
9. Category listing with difficulty level and lesson count.
10. Admin login with Supabase authentication.
11. Role-based protected admin routes.
12. Admin dashboard with multiple visual data summaries.
13. Lesson CRUD and quick publish/unpublish workflow.
14. Category CRUD operations.
15. Media upload, public URL retrieval, and deletion.
16. SEO metadata and JSON-LD support.
17. Error handling with user-friendly messages.

---

# 10. Database Design

The system uses PostgreSQL tables (Supabase public schema):

## 10.1 `profiles`
- `id (uuid, PK, references auth.users)` – user identity
- `name (text)` – display name
- `email (text, unique)` – user email
- `role (text: student/admin)` – authorization role
- `created_at (timestamptz)` – profile creation time

## 10.2 `categories`
- `id (uuid, PK)` – category id
- `name (text, unique)` – category title
- `difficulty (text: beginner/intermediate/advanced)` – level

## 10.3 `tags`
- `id (uuid, PK)` – tag id
- `name (text, unique)` – tag label

## 10.4 `lessons`
- `id (uuid, PK)` – lesson id
- `title (text)` – lesson title
- `content (text)` – markdown lesson content
- `code_snippets (text[])` – snippets array
- `featured_image (text)` – optional image URL
- `category_id (uuid, FK categories)` – category mapping
- `status (text: draft/published/archived)` – publication state
- `views_count (integer)` – engagement metric
- `created_at`, `updated_at` – timestamps

## 10.5 `lesson_tags` (junction table)
- `lesson_id (uuid, FK lessons)`
- `tag_id (uuid, FK tags)`
- composite primary key for many-to-many relation

## 10.6 `media`
- `id (uuid, PK)` – media id
- `filename (text)` – storage object name
- `url (text)` – public URL
- `type (text)` – MIME type
- `uploaded_by (uuid, FK profiles)` – uploader
- `created_at (timestamptz)` – upload time

## 10.7 Key Functions & Policies
- Trigger function updates `updated_at` before lesson update.
- RPC function `increment_lesson_views(lesson_id)` increments published lesson view count.
- RLS policies allow public read for selected content and admin-only write operations.

---

# 11. Code Structure Explanation

## 11.1 Folder Structure

- `src/main.jsx` – React entry point with router + auth provider.
- `src/App.jsx` – global layout and route definitions.
- `src/components/` – reusable UI and utility components (Header, Footer, LessonCard, MarkdownRenderer, ProtectedRoute, SEO).
- `src/pages/` – public pages (Home, Lessons, Lesson Detail, Categories, Login).
- `src/admin/` – admin layout and management pages (Dashboard, Lessons Manager, Categories Manager, Media Manager).
- `src/context/` – auth context and session/profile logic.
- `src/services/` – Supabase interaction layer for lessons/categories/media and client config.
- `src/utils/` – shared error helper functions.
- `src/styles/` – Tailwind and base CSS.
- `supabase/schema.sql` – complete database schema, policies, functions, and seed data.

## 11.2 Key File Roles
- `AuthContext.jsx`: central auth state + admin role resolution.
- `lessonService.js`: core content retrieval and mutation APIs.
- `LessonsManagerPage.jsx`: highest business-logic admin module (CRUD + filters + pagination).
- `DashboardPage.jsx`: analytics derivation and visual summaries.
- `LessonPage.jsx`: detailed reading experience and related content flow.

---

# 12. Algorithms / Logic Used

1. **Reading Time Estimation**
   - Word count / 200 words-per-minute, minimum 1 minute.

2. **Lesson Popularity Ranking**
   - Sort lessons descending by `views_count`; select top records.

3. **Related Lessons Selection**
   - Fetch published lessons and filter by same category, excluding current lesson.

4. **Search and Filter Logic**
   - Case-insensitive title match + category/status conditions.

5. **Client-side Pagination**
   - Start index = `(page - 1) * PAGE_SIZE`; slice filtered list.

6. **Code Snippet Transformation**
   - Admin textarea split on `---` delimiters into array; reverse mapping while editing.

7. **Status Analytics Aggregation**
   - Reduce lesson list into published/draft/archived counters.

8. **Category Distribution Calculation**
   - Bucket lessons by category and calculate percentages for visual bars.

9. **Relative Time Formatting**
   - Convert timestamp to “just now / minutes ago / hours ago / days ago”.

10. **Scroll Progress Tracking (Lesson Page)**
   - Progress = `(scrollY / (documentHeight - viewportHeight)) * 100`.

---

# 13. User Interface Description

## Public Screens
1. **Home Page (`/`)**
   - Hero banner, value cards, popular lesson cards, platform stats, CTA section, about section.

2. **Lessons Page (`/lessons`)**
   - Search box, category filter chips, lesson card grid, loading skeletons, empty-state UI.

3. **Lesson Detail Page (`/lesson/:id`)**
   - Back link, featured header, metadata strip, markdown content, code snippet section, scroll progress bar, related lessons section.

4. **Categories Page (`/categories`)**
   - Category cards with difficulty and lesson count; browse link.

5. **Login Page (`/login`)**
   - Admin login form with email/password and error display.

## Shared UI
- Sticky responsive header with conditional Admin link and login/logout behavior.
- Footer with navigation and social links.

## Admin Screens
6. **Admin Overview (`/admin`)**
   - KPI cards, trend and distribution charts, recent activity, refresh button.

7. **Lessons Manager (`/admin/lessons`)**
   - Lesson form + lesson table with edit/publish/delete + pagination.

8. **Categories Manager (`/admin/categories`)**
   - Category form + category table with edit/delete.

9. **Media Manager (`/admin/media`)**
   - Upload button + media card grid + open/delete actions.

---

# 14. Advantages of the System

1. Clean separation between public learning and admin management.
2. Secure role-based access with database-level policy controls.
3. Markdown + syntax highlighting is ideal for programming education.
4. Scalable relational schema with proper normalization.
5. Integrated media workflow for content-rich lessons.
6. Reusable component and service-oriented code design.
7. Responsive UI suitable for desktop and mobile devices.
8. Easy deployment model (Vercel + Supabase).

---

# 15. Limitations of the System

1. No dedicated student signup/profile learning dashboard.
2. No quiz/assessment/certification functionality.
3. No bookmarking, comments, or community discussion features.
4. Search/filter is client-side and may not scale for very large datasets.
5. Analytics are basic and not event-level/time-series accurate.
6. No automated testing suite (unit/integration/e2e) included.
7. Category-to-lessons deep-linking is currently generic (`/lessons` only).

---

# 16. Future Enhancements

1. Add student account features with progress tracking and bookmarks.
2. Implement quizzes, assignments, and auto-evaluation.
3. Add lesson completion checkpoints and certificates.
4. Introduce advanced server-side filtering, sorting, and pagination.
5. Add tags management in admin UI and tag-based lesson exploration.
6. Add rich text editor with markdown preview for lesson authoring.
7. Build advanced analytics dashboard with charts backed by actual event logs.
8. Add comments/discussion/Q&A module for peer learning.
9. Add internationalization and accessibility improvements.
10. Add automated testing and CI quality gates.

---

# 17. Conclusion

Codev CMS successfully demonstrates a practical and academically strong implementation of a modern web-based learning platform. The project combines instructional content delivery and robust admin content management within a secure role-based architecture. Through React-based modular UI, Supabase-powered backend services, markdown learning content, media storage, and analytics visualization, the system addresses core needs of programming education platforms.

From a BCA project perspective, this work shows competency in frontend engineering, backend integration, relational database design, authentication/authorization, and maintainable code architecture. While the current version focuses on core learning and CMS workflows, the existing foundation is strong enough to support advanced educational features in future iterations. Overall, the project meets its objectives and provides a scalable baseline for a production-ready e-learning CMS.

---

# 18. References

1. React Documentation – https://react.dev/
2. Vite Documentation – https://vitejs.dev/
3. React Router Documentation – https://reactrouter.com/
4. Tailwind CSS Documentation – https://tailwindcss.com/
5. Supabase Documentation – https://supabase.com/docs
6. PostgreSQL Documentation – https://www.postgresql.org/docs/
7. Prism.js Documentation – https://prismjs.com/
8. React Markdown Documentation – https://github.com/remarkjs/react-markdown
9. Remark GFM Documentation – https://github.com/remarkjs/remark-gfm
10. ESLint Documentation – https://eslint.org/docs/latest/

---

# EXTRA TASK: Exact Screenshots to Take (Page by Page)

## A. Public Module Screenshots
1. **Homepage Hero Section** (`/`)
   - **Caption:** “Homepage showing Codev hero section and primary call-to-action.”

2. **Homepage Popular Lessons Section** (`/`)
   - **Caption:** “Popular lessons cards with quick overview and platform statistics.”

3. **Lessons Listing with Search** (`/lessons`)
   - **Caption:** “Lessons page showing searchable and filterable lesson catalog.”

4. **Lessons Page with Category Filter Applied** (`/lessons`)
   - **Caption:** “Lessons page after applying category-based filter chips.”

5. **Lesson Detail Top Section** (`/lesson/:id`)
   - **Caption:** “Lesson detail header with metadata, category, and reading indicators.”

6. **Lesson Detail Content + Code Snippet Section** (`/lesson/:id` scroll)
   - **Caption:** “Markdown lesson content rendered with syntax-highlighted code blocks.”

7. **Categories Page** (`/categories`)
   - **Caption:** “Category-wise learning paths with difficulty level and lesson count.”

8. **Admin Login Page** (`/login`)
   - **Caption:** “Admin authentication interface for secure CMS access.”

## B. Admin Module Screenshots
9. **Admin Dashboard Overview** (`/admin`)
   - **Caption:** “Admin dashboard displaying key metrics and content analytics.”

10. **Admin Dashboard Charts Area** (`/admin` scroll)
    - **Caption:** “Analytics visualizations for views trend, status distribution, and category insights.”

11. **Lessons Manager – Create/Edit Form** (`/admin/lessons` top)
    - **Caption:** “Lesson management form for markdown content, status, and category assignment.”

12. **Lessons Manager – Lesson Table** (`/admin/lessons` bottom)
    - **Caption:** “Admin lesson listing with edit, publish/unpublish, delete, and pagination controls.”

13. **Categories Manager Page** (`/admin/categories`)
    - **Caption:** “Category management interface with add, update, and delete actions.”

14. **Media Manager Page** (`/admin/media`)
    - **Caption:** “Media library interface for uploading and managing lesson assets.”

## C. Shared Layout Screenshots
15. **Header Navigation (Logged out)**
    - **Caption:** “Responsive public navigation header with login entry.”

16. **Header Navigation (Admin logged in)**
    - **Caption:** “Role-based navigation showing admin route access after authentication.”

17. **Footer Section**
    - **Caption:** “Global footer with navigation and developer branding information.”

