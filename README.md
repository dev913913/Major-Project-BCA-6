# Codev CMS

Codev CMS is a full-stack lessons platform for programming content built with React, Tailwind CSS, Supabase Auth/Database/Storage, and Prism.js highlighting. I, Dev Kumar, developed this project as my BCA 6th semester major project submission.

## Project context and motivation

This repository represents my **major project for submission as a BCA 6th semester student**. The idea came from my own teaching experience before pursuing BCA. At that time, I used to teach students and, whenever I took tests, I would upload question papers online and share a webpage link with them. I mainly used Blogger for that workflow.

While using Blogger, I wanted to create a more useful webpage that could ask MCQ questions, automatically verify answers, save test data, and share results with both me and my students. I could not build that system back then, but that limitation created a strong desire to learn web development. This became one of the primary reasons I chose to pursue BCA, and Codev CMS is a practical step toward that long-term goal of building better educational web applications.

## Current status

- Public learning pages are implemented for home, lessons, lesson details, and categories.
- Admin-only CMS pages are implemented for dashboard analytics, lessons, categories, and media.
- Supabase authentication, PostgreSQL tables, storage bucket policies, and lesson view tracking are documented in `supabase/schema.sql`.
- The current version focuses on lesson publishing and content management. Quiz/MCQ auto-evaluation, student result sharing, and student progress tracking are planned future enhancements rather than current features.

---

## 1) Use it directly in GitHub Codespaces (online)

If you want to use this project fully online (no local setup), do this:

1. Push this repository to your GitHub account.
2. Open the repo on GitHub.
3. Click **Code** → **Codespaces** → **Create codespace on main**.
4. Wait for container setup (`npm install` runs automatically from `.devcontainer/devcontainer.json`).
5. In the Codespace terminal, copy env file:
   ```bash
   cp .env.example .env
   ```
6. Add your Supabase values in `.env`:
   ```bash
   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```
7. Start app:
   ```bash
   npm run dev
   ```
8. Open forwarded port `5173` from the **Ports** panel.

---

## 2) Use it locally (optional)

### Prerequisites
- Node.js 18+
- A Supabase project

### Clone and install
```bash
git clone <your-github-repo-url>
cd Major-Project-BCA-6
npm install
```

### Configure environment
```bash
cp .env.example .env
```
Set values in `.env`:
```bash
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## 3) Supabase setup (required)

### Initialize schema
1. Open Supabase Dashboard → SQL Editor.
2. Run the full SQL from:
   - `supabase/schema.sql`
3. This schema now seeds a full **12-lesson JavaScript beginner course** (published), so it appears on the site immediately after execution.

### Create your first admin
1. Supabase Dashboard → Authentication → Users → **Add user**.
2. Copy the new user UUID.
3. In Table Editor → `profiles`, insert:
   - `id` = auth user UUID
   - `name` = your name
   - `email` = same as auth email
   - `role` = `admin`

---

## 4) How to use the app

### Public side
- `/` → home page with hero section, highlights, popular lessons, categories preview, and platform stats.
- `/lessons` → searchable/filterable lesson catalog with category URL filters, result count, sorting, and clear action.
- `/lesson/:id` → lesson detail page with Markdown + Prism code highlighting, reading-time estimate, code-copy support, related lessons, and automatic view tracking.
- `/categories` → category cards with difficulty, lesson count, and deep links to filtered lessons.

### Admin side
- `/login` → sign in using your Supabase auth credentials.
- `/admin` → dashboard.
- `/admin/lessons` → create/edit/delete lessons.
- `/admin/categories` → create/edit/delete categories.
- `/admin/media` → upload/delete media files in Supabase Storage bucket `lesson-media`.

> Only users with `profiles.role = 'admin'` can access admin routes or modify CMS data.

---

## 5) GitHub workflow (easy control)

### Daily workflow
```bash
git pull origin <your-branch>
# make changes
npm run lint
npm run build
git add .
git commit -m "feat: your change"
git push origin <your-branch>
```

### Recommended branch strategy
- `main` → production-ready only
- `dev` → integration branch
- feature branches: `feat/<name>`, `fix/<name>`

### Open PRs
- Push feature branch
- Create Pull Request into `dev` (or `main` for small projects)
- Merge only after checks pass (`lint` + `build`)

---

## 6) Scripts

- `npm run dev` - start local development server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint

---

## 7) Deploy

### Vercel (Frontend)
1. Import the GitHub repo in Vercel.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Keep `vercel.json` in repo so all routes rewrite to `index.html` (prevents 404 on refresh for `/lessons`, `/categories`, `/lesson/:id`, `/admin/*`).

### Supabase (Backend)
- Keep Row Level Security enabled.
- Never expose service role key in frontend.
- Keep `anon` key in frontend only.

---

## 8) Project Structure

```bash
src/
  admin/
  components/
  context/
  pages/
  services/
  styles/
supabase/
  schema.sql
.devcontainer/
  devcontainer.json
```

## 9) Data model

- `profiles`: user identity + role
- `lessons`: markdown lesson content, snippets, status, category, views
- `categories`: lesson grouping, difficulty, and active lesson counts
- `tags`, `lesson_tags`: taxonomy tables for future tag expansion
- `media`: uploaded assets metadata
- `increment_lesson_views`: RPC function used by lesson detail pages to update view counts
