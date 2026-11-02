import { describe, it, expect, expectTypeOf } from "vitest";
import {
  isRole,
  type AuthState,
  type AuthUser,
  type Role,
} from "../../../../components/login/domain/types";

type StateOf<S extends AuthState["status"]> = Extract<AuthState, { status: S }>;

describe("G1 — tipos de domínio", () => {
  it('isRole("admin") → true; "user" → true', () => {
    expect(isRole("admin")).toBe(true);
    expect(isRole("user")).toBe(true);
  });

  it.each(["root", undefined, null, 1, "", "ADMIN", {}])("isRole(%j) → false", (v) => {
    expect(isRole(v)).toBe(false);
  });

  it("isRole é um type guard para Role", () => {
    expectTypeOf(isRole).guards.toEqualTypeOf<Role>();
  });

  it("Role é exatamente 'user' | 'admin'", () => {
    expectTypeOf<Role>().toEqualTypeOf<"user" | "admin">();
  });

  it("AuthUser não expõe hash, salt nem senha", () => {
    expectTypeOf<keyof AuthUser>().toEqualTypeOf<"id" | "name" | "email" | "role">();
  });

  it("AuthState: switch sobre status é exaustivo", () => {
    expectTypeOf<AuthState["status"]>().toEqualTypeOf<"loading" | "anonymous" | "authenticated">();

    function describeState(s: AuthState): string {
      switch (s.status) {
        case "loading":
          return "l";
        case "anonymous":
          return "a";
        case "authenticated":
          return s.user.id;
        default: {
          const _exhaustive: never = s;
          return _exhaustive;
        }
      }
    }
    expect(describeState({ status: "loading" })).toBe("l");
  });

  it("só o estado authenticated carrega user", () => {
    expectTypeOf<StateOf<"authenticated">>().toHaveProperty("user");
    expectTypeOf<StateOf<"loading">>().not.toHaveProperty("user");
    expectTypeOf<StateOf<"anonymous">>().not.toHaveProperty("user");
  });
});