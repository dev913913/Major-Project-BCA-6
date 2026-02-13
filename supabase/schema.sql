-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  difficulty text not null default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced'))
);

create table if not exists public.tags (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null
);

create table if not exists public.lessons (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  code_snippets text[] default '{}',
  featured_image text,
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_tags (
  lesson_id uuid references public.lessons(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (lesson_id, tag_id)
);

create table if not exists public.media (
  id uuid primary key default uuid_generate_v4(),
  filename text not null,
  url text not null,
  type text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);


create table if not exists public.lesson_views (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  visitor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Auto-update updated_at field
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_lessons_updated_at on public.lessons;
create trigger trg_lessons_updated_at
before update on public.lessons
for each row execute procedure public.set_updated_at();


create or replace function public.bump_lesson_views_from_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.lessons
  set views_count = coalesce(views_count, 0) + 1
  where id = new.lesson_id
    and status = 'published';

  return new;
end;
$$;

drop trigger if exists trg_lesson_views_bump_counter on public.lesson_views;
create trigger trg_lesson_views_bump_counter
after insert on public.lesson_views
for each row execute procedure public.bump_lesson_views_from_log();



-- RLS and security policies
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_tags enable row level security;
alter table public.media enable row level security;
alter table public.lesson_views enable row level security;

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.profiles where id = user_id and role = 'admin'
  );
$$;

-- Public read policies
create policy "Public can view published lessons" on public.lessons
for select using (status = 'published' or public.is_admin(auth.uid()));

create policy "Public can view categories" on public.categories
for select using (true);

create policy "Public can view tags" on public.tags
for select using (true);

create policy "Public can view lesson tags" on public.lesson_tags
for select using (true);

create policy "Public can view media" on public.media
for select using (true);


create policy "Public can insert lesson views" on public.lesson_views
for insert with check (true);

create policy "Admins can view lesson views" on public.lesson_views
for select using (public.is_admin(auth.uid()));

create policy "Admins manage lesson views" on public.lesson_views
for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "Admins can delete lesson views" on public.lesson_views
for delete using (public.is_admin(auth.uid()));

-- Admin-only write policies
create policy "Admins manage lessons" on public.lessons
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "Admins manage categories" on public.categories
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "Admins manage tags" on public.tags
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "Admins manage lesson tags" on public.lesson_tags
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "Admins manage media" on public.media
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "Users can view own profile" on public.profiles
for select using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "Users update own profile" on public.profiles
for update using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "Allow profile insert on signup" on public.profiles
for insert with check (auth.uid() = id);

-- Optional storage bucket setup (run in SQL editor)
insert into storage.buckets (id, name, public)
values ('lesson-media', 'lesson-media', true)
on conflict (id) do nothing;

create policy "Public read lesson media" on storage.objects
for select using (bucket_id = 'lesson-media');

create policy "Admins upload lesson media" on storage.objects
for insert with check (bucket_id = 'lesson-media' and public.is_admin(auth.uid()));

create policy "Admins update lesson media" on storage.objects
for update using (bucket_id = 'lesson-media' and public.is_admin(auth.uid()));

create policy "Admins delete lesson media" on storage.objects
for delete using (bucket_id = 'lesson-media' and public.is_admin(auth.uid()));
