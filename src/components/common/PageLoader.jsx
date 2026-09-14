export function PageLoader({ label = "Loading…" }) {
  return (
    <div className="flex h-full min-h-[50vh] items-center justify-center text-lg text-gray-300">
      {label}
    </div>
  );
}
