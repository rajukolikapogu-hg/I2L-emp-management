import { validateConfig } from "@/lib/config";

/** Node runtime only: exits the process instead of serving with an invalid configuration. */
export function validateConfigOrExit(): void {
  try {
    validateConfig();
  } catch (error) {
    console.error(`Refusing to start: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
