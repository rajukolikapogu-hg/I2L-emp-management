import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Link href="/monthly" className="btn mt-6">
        Back to monthly view
      </Link>
    </main>
  );
}
