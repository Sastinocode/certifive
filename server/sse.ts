// @ts-nocheck
/**
 * CERTIFIVE — Server-Sent Events manager
 *
 * Maintains a fan-out map of userId → active Response connections.
 * Designed for Replit: sends a heartbeat comment every 25 s to prevent
 * the platform's idle connection timeout from dropping the stream.
 *
 * Usage:
 *   // In route handler:
 *   subscribe(req.userId, res);
 *
 *   // Anywhere on the server:
 *   publish(userId, "notification", payload);
 */

import type { Response } from "express";

// ── Connection registry ───────────────────────────────────────────────────────

/** Map<userId, Set<Response>> */
const connections = new Map<number, Set<Response>>();

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Subscribe a new SSE client.
 * Sets the required headers, adds to the registry, starts the heartbeat,
 * and wires cleanup on close/error.
 *
 * Returns the cleanup function (called automatically on close).
 */
export function subscribe(userId: number, res: Response): void {
  // Standard SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  // Disable nginx / Replit proxy buffering so events flush immediately
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Register connection
  if (!connections.has(userId)) connections.set(userId, new Set());
  connections.get(userId)!.add(res);

  // Heartbeat comment every 25 s — keeps the TCP connection alive through
  // Replit's idle timeout and browser keep-alive limits.
  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      cleanup();
    }
  }, 25_000);

  // Announce successful connection
  _send(res, "connected", { ts: Date.now() });

  function cleanup() {
    clearInterval(heartbeat);
    const set = connections.get(userId);
    if (set) {
      set.delete(res);
      if (set.size === 0) connections.delete(userId);
    }
  }

  res.on("close", cleanup);
  res.on("error", cleanup);
}

/**
 * Publish an event to all active connections for a given user.
 * Silently ignores users with no connected clients.
 */
export function publish(userId: number, type: string, data: unknown): void {
  const clients = connections.get(userId);
  if (!clients || clients.size === 0) return;

  for (const res of clients) {
    try {
      _send(res, type, data);
    } catch {
      clients.delete(res);
    }
  }
  if (clients.size === 0) connections.delete(userId);
}

/** Returns the number of active SSE connections (for diagnostics). */
export function connectionCount(): number {
  let total = 0;
  for (const set of connections.values()) total += set.size;
  return total;
}

// ── Internal ──────────────────────────────────────────────────────────────────

function _send(res: Response, type: string, data: unknown): void {
  res.write(`event: ${type}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}
