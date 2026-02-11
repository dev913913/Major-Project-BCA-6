# ProgLearn CMS

ProgLearn CMS is a full-stack lessons platform for programming content built with React, Tailwind CSS, Supabase Auth/Database/Storage, and Prism.js highlighting.

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
- `/` → lists all published lessons.
- `/lesson/:id` → lesson detail page with Markdown + Prism code highlighting.

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
- `categories`: lesson grouping and difficulty
- `tags`, `lesson_tags`: taxonomy
- `media`: uploaded assets metadata
