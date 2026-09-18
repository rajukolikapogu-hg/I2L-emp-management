"use client";

// Shown when a page fails to load, e.g. the database file is locked or missing.
// Never exposes stack traces to the user.
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-slate-600">
        The data could not be loaded right now. Please try again in a moment.
      </p>
      <button type="button" className="btn mt-6" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
