import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../../components/login/crypto/passwordHash", async (importOriginal) => {
  const real =
    await importOriginal<typeof import("../../../../components/login/crypto/passwordHash")>();
  return { ...real, verifyPassword: vi.fn(real.verifyPassword) };
});

import { verifyPassword } from "../../../../components/login/crypto/passwordHash";
import { makeMockGateway, registerAna } from "../helpers/mockGateway";
import { ANA_EMAIL, UNKNOWN_EMAIL, WRONG_PASSWORD, validLoginInput } from "../helpers/fixtures";

async function galleryWithAna() {
  const { gateway } = makeMockGateway();
  await registerAna(gateway);
  vi.mocked(verifyPassword).mockClear();
  return gateway;
}

describe("G5 — igualar o trabalho feito para e-mail inexistente", () => {
  beforeEach(() => vi.mocked(verifyPassword).mockClear());

  it("e-mail inexistente executa um hash fictício (verifyPassword é chamado)", async () => {
    const gateway = await galleryWithAna();

    const result = await gateway.signIn(
      validLoginInput({ email: UNKNOWN_EMAIL, password: WRONG_PASSWORD }),
    );

    expect(result).toEqual({ ok: false, error: "INVALID_CREDENTIALS" });
    expect(verifyPassword).toHaveBeenCalledTimes(1);
  });

  it("e-mail existente também chama verifyPassword exatamente uma vez", async () => {
    const gateway = await galleryWithAna();
    await gateway.signIn(validLoginInput({ email: ANA_EMAIL, password: WRONG_PASSWORD }));
    expect(verifyPassword).toHaveBeenCalledTimes(1);
  });

  it("sem nenhum usuário cadastrado o hash fictício ainda roda", async () => {
    const { gateway } = makeMockGateway();
    await gateway.signIn(validLoginInput({ email: UNKNOWN_EMAIL, password: WRONG_PASSWORD }));
    expect(verifyPassword).toHaveBeenCalledTimes(1);
  });
});