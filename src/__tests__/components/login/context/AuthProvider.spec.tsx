import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { memo, type ReactNode } from "react";
import { render, renderHook, act, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  setCurrentUser: vi.fn(),
  purge: vi.fn(),
}));

vi.mock("../../../../utils/storage", () => ({ setCurrentUser: mocks.setCurrentUser }));
vi.mock("../../../../components/login/security/legacyPurge", () => ({
  purgeLegacyAuthArtifacts: mocks.purge,
}));

import { AuthProvider } from "../../../../components/login/context/AuthProvider";
import { useAuth } from "../../../../components/login/context/useAuth";
import { err, ok } from "../../../../components/login/domain/result";
import type { AuthUser } from "../../../../components/login/domain/types";
import { ANA, createFakeGateway } from "../helpers/fakeGateway";
import { deferred } from "../helpers/deferred";
import { ANA_EMAIL, VALID_PASSWORD } from "../helpers/fixtures";

type Fake = ReturnType<typeof createFakeGateway>;
type Overrides = NonNullable<Parameters<typeof createFakeGateway>[0]>;
type SettledStatus = "anonymous" | "authenticated";

const credentials = { email: ANA_EMAIL, password: "x" };
const signUpInput = { email: ANA_EMAIL, password: VALID_PASSWORD };

function mount(fake: Fake) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider gateway={fake.gateway}>{children}</AuthProvider>
  );
  return renderHook(() => useAuth(), { wrapper });
}

async function mountAs(status: SettledStatus, overrides: Overrides = {}) {
  const restore =
    status === "authenticated" ? { restore: vi.fn(async () => ANA) } : {};
  const fake = createFakeGateway({ ...restore, ...overrides });
  const { result, unmount } = mount(fake);
  await waitFor(() => expect(result.current.status).toBe(status));
  return { fake, result, unmount };
}

function withPendingRestore() {
  const restoring = deferred<AuthUser | null>();
  const fake = createFakeGateway({ restore: vi.fn(() => restoring.promise) });
  return { fake, restoring };
}

async function run<T>(action: () => Promise<T>): Promise<T> {
  let value!: T;
  await act(async () => {
    value = await action();
  });
  return value;
}

const firstCallOrder = (fn: { mock: { invocationCallOrder: number[] } }) =>
  fn.mock.invocationCallOrder[0]!;

function expectCalledBefore(
  first: { mock: { invocationCallOrder: number[] } },
  second: { mock: { invocationCallOrder: number[] } },
) {
  expect(firstCallOrder(first)).toBeLessThan(firstCallOrder(second));
}

const silenceConsoleError = () => vi.spyOn(console, "error").mockImplementation(() => {});

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("G11 — AuthProvider: estado inicial e restore", () => {
  it("estado inicial → loading, sem expor user", () => {
    const { fake } = withPendingRestore();
    const { result } = mount(fake);
    expect(result.current.status).toBe("loading");
    expect(result.current.user).toBeNull();
  });

  it("restore devolve user → authenticated", async () => {
    const { result } = await mountAs("authenticated");
    expect(result.current.user).toEqual(ANA);
  });

  it("restore devolve null → anonymous", async () => {
    const { result } = await mountAs("anonymous");
    expect(result.current.user).toBeNull();
  });

  it("restore lança → anonymous (não trava em loading)", async () => {
    await mountAs("anonymous", {
      restore: vi.fn(async () => {
        throw new Error("boom");
      }),
    });
  });

  it("chama purgeLegacyAuthArtifacts antes do restore", async () => {
    const fake = createFakeGateway();
    mount(fake);
    await waitFor(() => expect(fake.gateway.restore).toHaveBeenCalled());

    expect(mocks.purge).toHaveBeenCalledTimes(1);
    expectCalledBefore(mocks.purge, fake.gateway.restore);
  });

  it("após restore ok → setCurrentUser(user.id) antes de renderizar filhos autenticados", async () => {
    const fake = createFakeGateway({ restore: vi.fn(async () => ANA) });
    const setCurrentUserCallsAtRender: number[] = [];
    function Child() {
      const { status } = useAuth();
      if (status === "authenticated") {
        setCurrentUserCallsAtRender.push(mocks.setCurrentUser.mock.calls.length);
      }
      return <span>{status}</span>;
    }

    render(
      <AuthProvider gateway={fake.gateway}>
        <Child />
      </AuthProvider>,
    );
    await screen.findByText("authenticated");

    expect(mocks.setCurrentUser).toHaveBeenCalledWith(ANA.id);
    expect(setCurrentUserCallsAtRender[0]).toBeGreaterThanOrEqual(1);
  });

  it("restore anônimo → nenhum usuário é definido no storage de treino", async () => {
    await mountAs("anonymous");
    expect(mocks.setCurrentUser).not.toHaveBeenCalledWith(expect.stringMatching(/.+/));
  });

  it("desmontar antes do restore terminar → sem setState nem aviso", async () => {
    const { fake, restoring } = withPendingRestore();
    const errorSpy = silenceConsoleError();
    const { unmount } = mount(fake);

    unmount();
    await act(async () => restoring.resolve(ANA));

    expect(errorSpy).not.toHaveBeenCalled();
    expect(mocks.setCurrentUser).not.toHaveBeenCalledWith(ANA.id);
  });
});

describe("G11 — AuthProvider: signIn, signUp, signOut", () => {
  it("signIn ok → authenticated e retorna Result ok; setCurrentUser(user.id)", async () => {
    const { result } = await mountAs("anonymous");

    const outcome = await run(() => result.current.signIn(credentials));

    expect(outcome).toEqual(ok(ANA));
    expect(result.current.status).toBe("authenticated");
    expect(result.current.user).toEqual(ANA);
    expect(mocks.setCurrentUser).toHaveBeenCalledWith(ANA.id);
  });

  it("signIn com erro → continua anonymous e retorna Result err", async () => {
    const { result } = await mountAs("anonymous", {
      signIn: vi.fn(async () => err("INVALID_CREDENTIALS" as const)),
    });

    const outcome = await run(() => result.current.signIn(credentials));

    expect(outcome).toEqual({ ok: false, error: "INVALID_CREDENTIALS" });
    expect(result.current.status).toBe("anonymous");
    expect(mocks.setCurrentUser).not.toHaveBeenCalledWith(ANA.id);
  });

  it("signUp ok → authenticated", async () => {
    const { result } = await mountAs("anonymous");

    await run(() => result.current.signUp(signUpInput));

    expect(result.current.status).toBe("authenticated");
    expect(mocks.setCurrentUser).toHaveBeenCalledWith(ANA.id);
  });

  it("signUp com erro → continua anonymous", async () => {
    const { result } = await mountAs("anonymous", {
      signUp: vi.fn(async () => err("EMAIL_IN_USE" as const)),
    });

    await run(() => result.current.signUp(signUpInput));

    expect(result.current.status).toBe("anonymous");
  });

  it("signOut → anonymous, chama gateway.signOut e setCurrentUser(null)", async () => {
    const { fake, result } = await mountAs("authenticated");

    await run(() => result.current.signOut());

    expect(fake.gateway.signOut).toHaveBeenCalledTimes(1);
    expect(mocks.setCurrentUser).toHaveBeenLastCalledWith(null);
    expect(result.current.status).toBe("anonymous");
    expect(result.current.user).toBeNull();
  });

  it("signOut limpa o estado mesmo se o gateway lançar", async () => {
    const { result } = await mountAs("authenticated", {
      signOut: vi.fn(async () => {
        throw new Error("rede");
      }),
    });

    await run(() => result.current.signOut().catch(() => {}));

    expect(result.current.status).toBe("anonymous");
    expect(mocks.setCurrentUser).toHaveBeenLastCalledWith(null);
  });

  it("sendPasswordReset delega ao gateway", async () => {
    const { fake, result } = await mountAs("anonymous");

    await run(() => result.current.sendPasswordReset(ANA_EMAIL));

    expect(fake.gateway.sendPasswordReset).toHaveBeenCalledWith(ANA_EMAIL);
  });
});

describe("G11 — AuthProvider: multi-aba, memoização, storage", () => {
  it("onAuthChange(null) vindo de outra aba → anonymous", async () => {
    const { fake, result } = await mountAs("authenticated");

    act(() => fake.emitAuthChange(null));

    expect(result.current.status).toBe("anonymous");
    expect(mocks.setCurrentUser).toHaveBeenLastCalledWith(null);
  });

  it("cancela a inscrição do onAuthChange ao desmontar", async () => {
    const { fake, unmount } = await mountAs("anonymous");

    unmount();

    expect(fake.unsubscribe).toHaveBeenCalled();
  });

  it("useAuth fora do provider → erro claro", () => {
    silenceConsoleError();
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
  });

  it("o valor do contexto é memoizado: consumidores não re-renderizam sem mudança", async () => {
    const fake = createFakeGateway();
    let renders = 0;
    const Probe = memo(function Probe() {
      const { status } = useAuth();
      renders++;
      return <span>{status}</span>;
    });
    const child = <Probe />;
    const provider = () => <AuthProvider gateway={fake.gateway}>{child}</AuthProvider>;

    const { rerender } = render(provider());
    await screen.findByText("anonymous");
    const rendersBefore = renders;

    rerender(provider());
    rerender(provider());

    expect(renders).toBe(rendersBefore);
  });

  it("o provider não escreve direto em localStorage/sessionStorage", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const removeItem = vi.spyOn(Storage.prototype, "removeItem");
    const { result } = await mountAs("anonymous");

    await run(async () => {
      await result.current.signIn(credentials);
      await result.current.signOut();
    });

    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
  });
});