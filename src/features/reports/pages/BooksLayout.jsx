import { NavLink, Outlet, useLocation } from "react-router-dom";

const BOOKS = [
  { to: "transactions", label: "Day book" },
  { to: "ledger", label: "Ledger" },
  { to: "trial-balance", label: "Trial balance" },
];

export default function BooksLayout() {
  const { search } = useLocation();
  return (
    <div>
      <nav aria-label="Books" className="flex gap-4 border-b border-border px-4 pt-4 md:px-6">
        {BOOKS.map((b) => (
          <NavLink
            key={b.to}
            to={{ pathname: b.to, search }}
            className={({ isActive }) => `-mb-px border-b-2 pb-2 text-sm font-bold ${isActive ? "border-rani text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {b.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
