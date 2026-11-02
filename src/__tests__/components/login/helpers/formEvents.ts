import { vi } from "vitest";
import { act } from "@testing-library/react";
import type { ChangeEvent, FormEvent } from "react";

export const changeEvent = (name: string, value: string) =>
  ({ target: { name, value } }) as unknown as ChangeEvent<HTMLInputElement>;

export const submitEvent = () => ({ preventDefault: vi.fn() }) as unknown as FormEvent;

type HandlerGetter = () => (event: FormEvent) => unknown;

export function startSubmit(getHandler: HandlerGetter): Promise<void> {
  let pending!: Promise<void>;
  act(() => {
    pending = getHandler()(submitEvent()) as Promise<void>;
  });
  return pending;
}

export async function submitTwiceWhilePending(getHandler: HandlerGetter, release: () => void) {
  await act(async () => {
    const first = getHandler()(submitEvent());
    const second = getHandler()(submitEvent());
    release();
    await Promise.all([first, second]);
  });
}