import { MockAuthGateway } from "../../../../components/login/gateway/MockAuthGateway";
import {
  ANA_EMAIL,
  createFakeClock,
  TEST_ITERATIONS,
  VALID_PASSWORD,
} from "./fixtures";

export function makeMockGateway({ iterations = TEST_ITERATIONS }: { iterations?: number } = {}) {
  const clock = createFakeClock();
  const gateway = new MockAuthGateway({ now: clock.now, iterations });
  return { gateway, clock };
}

export async function registerAna(
  gateway: MockAuthGateway,
  overrides: Record<string, string> = {},
) {

  return gateway.signUp({
    email: ANA_EMAIL,
    password: VALID_PASSWORD,
    ...overrides,
  });
}