import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-center py-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          One Place
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-6 pb-16 sm:items-center">
        {children}
      </main>
    </div>
  );
}
