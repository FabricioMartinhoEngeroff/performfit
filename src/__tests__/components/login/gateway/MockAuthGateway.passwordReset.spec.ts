import { describe, it, expect } from "vitest";
import type { AuthGateway } from "../../../../components/login/gateway/AuthGateway";
import { makeMockGateway, registerAna } from "../helpers/mockGateway";
import { ANA_EMAIL, UNKNOWN_EMAIL } from "../helpers/fixtures";

const storageSnapshot = () => JSON.stringify({ ...localStorage });

describe("G18 — MockAuthGateway.sendPasswordReset", () => {
  it("resolve ok sem revelar se o e-mail existe e sem alterar dados", async () => {
    const { gateway: mock } = makeMockGateway();
    const gateway: AuthGateway = mock;
    await registerAna(mock);
    const before = storageSnapshot();

    const existing = await gateway.sendPasswordReset(ANA_EMAIL);
    const missing = await gateway.sendPasswordReset(UNKNOWN_EMAIL);

    expect(existing).toEqual({ ok: true, value: undefined });
    expect(missing).toEqual(existing);
    expect(storageSnapshot()).toBe(before);
  });
});