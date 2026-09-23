/** Playground deploys isolate each visitor without a durable product database. */

export const PLAYGROUND_TTL_SECONDS = 24 * 60 * 60;

export function isPlaygroundMode(): boolean {
  const value = process.env.PLAYGROUND;
  return value === "1" || value === "true";
}
