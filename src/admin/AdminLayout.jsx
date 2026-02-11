import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/lessons', label: 'Lessons' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/media', label: 'Media' },
];

function AdminLayout() {
  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Admin</h2>
        <nav className="space-y-2 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded px-3 py-2 ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section>
        <Outlet />
      </section>
    </div>
  );
}

export default AdminLayout;
