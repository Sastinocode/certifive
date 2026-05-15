export function securityLog(event: string, details: Record<string, string>): void {
  const ts = new Date().toISOString();
  const parts = Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(" | ");
  console.log(`[SECURITY] ${ts} | EVENT: ${event} | ${parts}`);
}
