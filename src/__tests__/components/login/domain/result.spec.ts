import { describe, it, expect, expectTypeOf } from "vitest";
import { ok, err, type Result } from "../../../../components/login/domain/result";

describe("G2 — Result", () => {
  it("ok(v) → {ok:true, value:v}", () => expect(ok(5)).toEqual({ ok: true, value: 5 }));
  it("err(e) → {ok:false, error:e}", () => expect(err("X")).toEqual({ ok: false, error: "X" }));

  it("narrowing por ok discrimina value/error", () => {
    const failing = (): Result<number, "E"> => err("E");
    const r = failing();
    if (r.ok) expectTypeOf(r.value).toEqualTypeOf<number>();
    else expectTypeOf(r.error).toEqualTypeOf<"E">();
    expect(r.ok).toBe(false);
  });
});