export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertProductionConfig } = await import("@/lib/config");
    assertProductionConfig();
  }
}
