// Runs once when the server starts: refuse to serve with an invalid configuration.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateConfigOrExit } = await import("./instrumentation-node");
    validateConfigOrExit();
  }
}
