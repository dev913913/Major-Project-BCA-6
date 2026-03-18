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


create or replace function public.increment_lesson_views(lesson_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.lessons
  set views_count = coalesce(views_count, 0) + 1
  where id = lesson_id
    and status = 'published';
$$;

grant execute on function public.increment_lesson_views(uuid) to anon, authenticated;

-- RLS and security policies
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_tags enable row level security;
alter table public.media enable row level security;

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
drop policy if exists "Public can view published lessons" on public.lessons;
create policy "Public can view published lessons" on public.lessons
for select using (status = 'published' or public.is_admin(auth.uid()));

drop policy if exists "Public can view categories" on public.categories;
create policy "Public can view categories" on public.categories
for select using (true);

drop policy if exists "Public can view tags" on public.tags;
create policy "Public can view tags" on public.tags
for select using (true);

drop policy if exists "Public can view lesson tags" on public.lesson_tags;
create policy "Public can view lesson tags" on public.lesson_tags
for select using (true);

drop policy if exists "Public can view media" on public.media;
create policy "Public can view media" on public.media
for select using (true);

-- Admin-only write policies
drop policy if exists "Admins manage lessons" on public.lessons;
create policy "Admins manage lessons" on public.lessons
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Admins manage tags" on public.tags;
create policy "Admins manage tags" on public.tags
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Admins manage lesson tags" on public.lesson_tags;
create policy "Admins manage lesson tags" on public.lesson_tags
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Admins manage media" on public.media;
create policy "Admins manage media" on public.media
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
for select using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
for update using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "Allow profile insert on signup" on public.profiles;
create policy "Allow profile insert on signup" on public.profiles
for insert with check (auth.uid() = id);

-- Optional storage bucket setup (run in SQL editor)
insert into storage.buckets (id, name, public)
values ('lesson-media', 'lesson-media', true)
on conflict (id) do nothing;

drop policy if exists "Public read lesson media" on storage.objects;
create policy "Public read lesson media" on storage.objects
for select using (bucket_id = 'lesson-media');

drop policy if exists "Admins upload lesson media" on storage.objects;
create policy "Admins upload lesson media" on storage.objects
for insert with check (bucket_id = 'lesson-media' and public.is_admin(auth.uid()));

drop policy if exists "Admins update lesson media" on storage.objects;
create policy "Admins update lesson media" on storage.objects
for update using (bucket_id = 'lesson-media' and public.is_admin(auth.uid()));

drop policy if exists "Admins delete lesson media" on storage.objects;
create policy "Admins delete lesson media" on storage.objects
for delete using (bucket_id = 'lesson-media' and public.is_admin(auth.uid()));

-- ------------------------------------------------------------
-- Seed: Complete JavaScript beginner course (idempotent)
-- ------------------------------------------------------------
insert into public.categories (name, difficulty)
values ('JavaScript', 'beginner')
on conflict (name) do update set difficulty = excluded.difficulty;

insert into public.tags (name)
values
  ('javascript'),
  ('beginner'),
  ('web-development'),
  ('course')
on conflict (name) do nothing;

with js_category as (
  select id from public.categories where name = 'JavaScript' limit 1
)
insert into public.lessons (title, content, code_snippets, category_id, status)
select
  'JavaScript 01: What JavaScript Is and How to Run It',
  $lesson$
# Lesson 1: What JavaScript Is and How to Run It

Welcome to your JavaScript beginner course. In this lesson, you will understand what JavaScript is and where your code can run.

## Learning goals
- Understand what JavaScript does in websites and apps.
- Know the difference between browser JavaScript and Node.js.
- Run your first JavaScript statement.

## What is JavaScript?
JavaScript is a programming language used to add behavior to web pages. HTML gives structure, CSS gives style, and JavaScript gives logic.

## Where JavaScript runs
1. **In the browser** (Chrome, Firefox, Edge) for front-end interactivity.
2. **In Node.js** for scripts, tools, and backend services.

## First line of JavaScript
Write this line in the browser console:

```js
console.log('Hello, JavaScript!');
```

If you see the output, your environment works.

## Practice
- Open DevTools in your browser.
- Run 3 different `console.log()` lines.
- Print your name and learning goal.

## Summary
You learned what JavaScript is and how to run a first command. Next: variables and data types.
  $lesson$,
  array[
    'console.log("Hello, JavaScript!");',
    'console.log("I will complete this course.");'
  ],
  (select id from js_category),
  'published'
where not exists (
  select 1 from public.lessons where title = 'JavaScript 01: What JavaScript Is and How to Run It'
);

with js_category as (
  select id from public.categories where name = 'JavaScript' limit 1
)
insert into public.lessons (title, content, code_snippets, category_id, status)
select
  'JavaScript 02: Variables and Data Types',
  $lesson$
# Lesson 2: Variables and Data Types

Variables store values so your program can reuse them.

## Learning goals
- Use `let` and `const` correctly.
- Understand primitive data types.
- Inspect value types with `typeof`.

## Declaring variables
- Use `const` when value should not be reassigned.
- Use `let` when reassignment is needed.

```js
const courseName = 'JavaScript Beginner Course';
let lessonNumber = 2;
lessonNumber = 3;
```

## Core data types
- `string` → text
- `number` → integers and decimals
- `boolean` → true/false
- `null` → intentional empty value
- `undefined` → value not set yet

```js
const language = 'JavaScript';
const year = 2026;
const isFun = true;

console.log(typeof language); // string
console.log(typeof year); // number
console.log(typeof isFun); // boolean
```

## Practice
Create 5 variables about yourself and print each with `typeof`.

## Summary
Variables hold data, and data types describe what kind of value each variable contains.
  $lesson$,
  array[
    'const age = 18;\nconsole.log(typeof age);',
    'let score = 10;\nscore = 11;'
  ],
  (select id from js_category),
  'published'
where not exists (
  select 1 from public.lessons where title = 'JavaScript 02: Variables and Data Types'
);

with js_category as (
  select id from public.categories where name = 'JavaScript' limit 1
)
insert into public.lessons (title, content, code_snippets, category_id, status)
select
  'JavaScript 03: Operators and Expressions',
  $lesson$
# Lesson 3: Operators and Expressions

Operators combine values and produce new results.

## Learning goals
- Use arithmetic, comparison, and logical operators.
- Predict expression results.

## Arithmetic
```js
const a = 10;
const b = 3;
console.log(a + b); // 13
console.log(a - b); // 7
console.log(a * b); // 30
console.log(a / b); // 3.333...
console.log(a % b); // 1
```

## Comparison
```js
console.log(5 > 2);   // true
console.log(5 === '5'); // false
console.log(5 == '5');  // true (avoid in most cases)
```

Prefer strict equality (`===`) to avoid surprising type coercion.

## Logical
```js
const hasAccount = true;
const isLoggedIn = false;
console.log(hasAccount && isLoggedIn); // false
console.log(hasAccount || isLoggedIn); // true
console.log(!isLoggedIn); // true
```

## Practice
Build a small eligibility check using comparison + logical operators.
  $lesson$,
  array[
    'const isAdult = age >= 18;',
    'const canAccess = isMember && hasTicket;'
  ],
  (select id from js_category),
  'published'
where not exists (
  select 1 from public.lessons where title = 'JavaScript 03: Operators and Expressions'
);

with js_category as (
  select id from public.categories where name = 'JavaScript' limit 1
)
insert into public.lessons (title, content, code_snippets, category_id, status)
select
  'JavaScript 04: Conditionals (if, else, switch)',
  $lesson$
# Lesson 4: Conditionals

Conditionals let your program choose between paths.

## `if` and `else`
```js
const score = 78;
if (score >= 90) {
  console.log('A grade');
} else if (score >= 75) {
  console.log('B grade');
} else {
  console.log('Keep practicing');
}
```

## `switch`
```js
const role = 'admin';
switch (role) {
  case 'admin':
    console.log('Full access');
    break;
  case 'student':
    console.log('Course access');
    break;
  default:
    console.log('Guest access');
}
```

## Practice
- Create a weather message based on temperature.
- Use `switch` for weekday to task mapping.
  $lesson$,
  array[
    'if (isRaining) {\n  takeUmbrella();\n} else {\n  enjoySun();\n}',
    'switch (day) {\n  case "Mon":\n    task = "Plan";\n    break;\n  default:\n    task = "Learn";\n}'
  ],
  (select id from js_category),
  'published'
where not exists (
  select 1 from public.lessons where title = 'JavaScript 04: Conditionals (if, else, switch)'
);

with js_category as (
  select id from public.categories where name = 'JavaScript' limit 1
)
insert into public.lessons (title, content, code_snippets, category_id, status)
select
  'JavaScript 05: Loops (for, while, for...of)',
  $lesson$
# Lesson 5: Loops

Loops repeat code without copying lines.

## `for` loop
```js
for (let i = 1; i <= 5; i++) {
  console.log('Count:', i);
}
```

## `while` loop
```js
let n = 3;
while (n > 0) {
  console.log(n);
  n--;
}
```

## `for...of`
```js
const topics = ['variables', 'loops', 'functions'];
for (const topic of topics) {
  console.log(topic);
}
```

## Practice
Print only even numbers from 1 to 20.
  $lesson$,
  array[
    'for (let i = 2; i <= 20; i += 2) {\n  console.log(i);\n}',
    'for (const item of ["a", "b"]) {\n  console.log(item);\n}'
  ],
  (select id from js_category),
  'published'
where not exists (
  select 1 from public.lessons where title = 'JavaScript 05: Loops (for, while, for...of)'
);

with js_category as (
  select id from public.categories where name = 'JavaScript' limit 1
)
insert into public.lessons (title, content, code_snippets, category_id, status)
select
  'JavaScript 06: Functions and Scope',
  $lesson$
# Lesson 6: Functions and Scope

Functions package logic into reusable units.

## Function declaration
```js
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet('Aisha'));
```

## Arrow function
```js
const add = (x, y) => x + y;
console.log(add(4, 5));
```

## Scope basics
Variables declared inside a function are not accessible outside it.

```js
function testScope() {
  const secret = 'inside';
  console.log(secret);
}
```

## Practice
Create a function `isEven(number)` returning `true` for even values.
  $lesson$,
  array[
    'const isEven = (n) => n % 2 === 0;',
    'function square(n) {\n  return n * n;\n}'
  ],
  (select id from js_category),
  'published'
where not exists (
  select 1 from public.lessons where title = 'JavaScript 06: Functions and Scope'
);

with js_category as (
  select id from public.categories where name = 'JavaScript' limit 1
)
insert into public.lessons (title, content, code_snippets, category_id, status)
select
  'JavaScript 07: Arrays and Common Methods',
  $lesson$
# Lesson 7: Arrays and Common Methods

Arrays store ordered collections.

## Create and access
```js
const fruits = ['apple', 'banana', 'mango'];
console.log(fruits[0]); // apple
```

## Useful methods
- `push()` add to end
- `pop()` remove last
- `map()` transform items
- `filter()` keep matching items

```js
const prices = [100, 250, 80];
const discounted = prices.map((price) => price * 0.9);
const expensive = prices.filter((price) => price > 100);
```

## Practice
From `[1,2,3,4,5]`, create a new array with squares of only even numbers.
  $lesson$,
  array[
    'const result = [1,2,3,4,5].filter(n => n % 2 === 0).map(n => n * n);',
    'const names = ["A", "B"];\nnames.push("C");'
  ],
  (select id from js_category),
  'published'
where not exists (
  select 1 from public.lessons where title = 'JavaScript 07: Arrays and Common Methods'
);

with js_category as (
  select id from public.categories where name = 'JavaScript' limit 1
)
insert into public.lessons (title, content, code_snippets, category_id, status)
select
  'JavaScript 08: Objects and JSON Basics',
  $lesson$
# Lesson 8: Objects and JSON Basics

Objects store key-value pairs.

## Object syntax
```js
const student = {
  name: 'Riya',
  level: 'beginner',
  completedLessons: 8,
};

console.log(student.name);
student.completedLessons += 1;
```

## JSON basics
JSON is text format for data exchange.

```js
const jsonText = JSON.stringify(student);
const parsed = JSON.parse(jsonText);
console.log(parsed.level);
```

## Practice
Create a `course` object and print all keys using `Object.keys(course)`.
  $lesson$,
  array[
    'const keys = Object.keys({ a: 1, b: 2 });',
    'const text = JSON.stringify({ ok: true });'
  ],
  (select id from js_category),
  'published'
where not exists (
  select 1 from public.lessons where title = 'JavaScript 08: Objects and JSON Basics'
);

with js_category as (
  select id from public.categories where name = 'JavaScript' limit 1
)
insert into public.lessons (title, content, code_snippets, category_id, status)
select
  'JavaScript 09: DOM Manipulation and Events',
  $lesson$
# Lesson 9: DOM Manipulation and Events

The DOM lets JavaScript update page content.

## Select and change elements
```js
const title = document.querySelector('h1');
title.textContent = 'JavaScript DOM Updated';
```

## Event listeners
```js
const button = document.querySelector('#enrollBtn');
button.addEventListener('click', () => {
  alert('You enrolled!');
});
```

## Practice
Create a button that increments a counter shown in a paragraph.
  $lesson$,
  array[
    'document.querySelector("#btn").addEventListener("click", () => console.log("clicked"));',
    'document.querySelector("#count").textContent = "1";'
  ],
  (select id from js_category),
  'published'
where not exists (
  select 1 from public.lessons where title = 'JavaScript 09: DOM Manipulation and Events'
);

with js_category as (
  select id from public.categories where name = 'JavaScript' limit 1
)
insert into public.lessons (title, content, code_snippets, category_id, status)
select
  'JavaScript 10: Async JavaScript (Promises and async/await)',
  $lesson$
# Lesson 10: Async JavaScript

Async code handles operations that take time, like API requests.

## Promises
```js
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

delay(1000).then(() => console.log('1 second passed'));
```

## async/await
```js
async function run() {
  await delay(1000);
  console.log('Done waiting');
}

run();
```

## Practice
Write an async function that waits 2 seconds and returns `'Ready!'`.
  $lesson$,
  array[
    'const fetchUser = async () => {\n  const response = await fetch("/api/user");\n  return response.json();\n};',
    'Promise.resolve(42).then(console.log);'
  ],
  (select id from js_category),
  'published'
where not exists (
  select 1 from public.lessons where title = 'JavaScript 10: Async JavaScript (Promises and async/await)'
);

with js_category as (
  select id from public.categories where name = 'JavaScript' limit 1
)
insert into public.lessons (title, content, code_snippets, category_id, status)
select
  'JavaScript 11: Error Handling and Debugging',
  $lesson$
# Lesson 11: Error Handling and Debugging

As a developer, you need to detect and fix failures quickly.

## try...catch
```js
try {
  JSON.parse('{ invalid json }');
} catch (error) {
  console.error('Parsing failed:', error.message);
}
```

## Debugging tips
- Use `console.log` for checkpoints.
- Read stack traces from top to bottom.
- Reproduce bugs with smallest possible example.

## Practice
Create a safe parser function that returns `null` if parsing fails.
  $lesson$,
  array[
    'function safeParse(text) {\n  try { return JSON.parse(text); } catch { return null; }\n}',
    'console.error("Something went wrong");'
  ],
  (select id from js_category),
  'published'
where not exists (
  select 1 from public.lessons where title = 'JavaScript 11: Error Handling and Debugging'
);

with js_category as (
  select id from public.categories where name = 'JavaScript' limit 1
)
insert into public.lessons (title, content, code_snippets, category_id, status)
select
  'JavaScript 12: Final Mini Project and Next Steps',
  $lesson$
# Lesson 12: Final Mini Project and Next Steps

Great progress! Build a mini app to combine everything.

## Project: To-Do List App
Features:
1. Add task
2. Mark task complete
3. Delete task
4. Save tasks in `localStorage`

## Suggested structure
- `index.html` for layout
- `style.css` for styling
- `app.js` for logic

## Stretch goals
- Add filters: all / active / completed.
- Add due dates.
- Add light/dark theme toggle.

## Graduation checklist
- You can read and write JavaScript confidently.
- You understand DOM, arrays, objects, and async code.
- You built at least one complete mini project.

Congratulations on completing the JavaScript beginner course.
  $lesson$,
  array[
    'localStorage.setItem("tasks", JSON.stringify(tasks));',
    'const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");'
  ],
  (select id from js_category),
  'published'
where not exists (
  select 1 from public.lessons where title = 'JavaScript 12: Final Mini Project and Next Steps'
);

with js_tag as (
  select id from public.tags where name = 'javascript' limit 1
),
beginner_tag as (
  select id from public.tags where name = 'beginner' limit 1
),
web_tag as (
  select id from public.tags where name = 'web-development' limit 1
),
course_tag as (
  select id from public.tags where name = 'course' limit 1
),
course_lessons as (
  select id from public.lessons where title like 'JavaScript %'
)
insert into public.lesson_tags (lesson_id, tag_id)
select cl.id, t.id
from course_lessons cl
cross join (
  select id from js_tag
  union all
  select id from beginner_tag
  union all
  select id from web_tag
  union all
  select id from course_tag
) t
on conflict do nothing;
