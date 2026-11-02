import { vi, expect } from "vitest";

const CONSOLE_METHODS = ["log", "info", "warn", "error", "debug", "trace"] as const;

export type ConsoleSpies = ReturnType<typeof silenceConsole>;

export const silenceConsole = () =>
  CONSOLE_METHODS.map((method) => vi.spyOn(console, method).mockImplementation(() => {}));

const asText = (call: readonly unknown[]) =>
  JSON.stringify(call, (_key, value) => (value instanceof Error ? value.message : value));

export function expectNeverLogged(secret: string, spies: ConsoleSpies) {
  for (const spy of spies) {
    for (const call of spy.mock.calls) expect(asText(call)).not.toContain(secret);
  }
}