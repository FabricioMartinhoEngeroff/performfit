import type { SignUpInput } from "../../../../components/login/gateway/AuthGateway";

export const SECOND = 1000;
export const HOUR = 60 * 60 * SECOND;

const DEFAULT_CLOCK_START = Date.UTC(2026, 0, 1, 12, 0, 0);

export function createFakeClock(start = DEFAULT_CLOCK_START) {
  let t = start;
  const advance = (ms: number) => {
    t += ms;
  };
  return {
    now: () => t,
    advance,
    advanceSeconds: (s: number) => advance(s * SECOND),
    set: (v: number) => {
      t = v;
    },
  };
}

export const FAILURES_BEFORE_LOCK = 5;
export const FIRST_LOCK_SECONDS = 30;
export const TEST_ITERATIONS = 1_000;
export const VALID_PASSWORD = "Abcdef1!";

export const ANA_NAME = "Ana Silva";
export const ANA_EMAIL = "ana@example.com";
export const UNKNOWN_EMAIL = "ninguem@example.com";
export const WRONG_PASSWORD = "Errada1!";
export const PUBLIC_USER_KEYS = ["email", "id", "name", "role"];

export function validRegisterInput(overrides: Record<string, unknown> = {}) {
  return {
    email: ANA_EMAIL,
    password: VALID_PASSWORD,
    confirmPassword: VALID_PASSWORD,
    ...overrides,
  };
}

const LOCAL_PART = "a".repeat(64);
const TLD = ".com";
const MAX_LABEL_LENGTH = 64;

export function emailWithLength(totalLength: number): string {
  const domainLabelsLength = totalLength - LOCAL_PART.length - "@".length - TLD.length;
  const labelCount = Math.ceil((domainLabelsLength + 1) / MAX_LABEL_LENGTH);

  const labelChars = domainLabelsLength - (labelCount - 1);
  const baseSize = Math.floor(labelChars / labelCount);
  const longerLabels = labelChars - baseSize * labelCount;

  const labels = Array.from({ length: labelCount }, (_, i) =>
    "b".repeat(baseSize + (i < longerLabels ? 1 : 0)),
  );
  return `${LOCAL_PART}@${labels.join(".")}${TLD}`;
}

type ZodLikeIssue = { message: string; path: PropertyKey[] };
type ZodLikeFailure = { success: false; error: { issues: ZodLikeIssue[] } };
type ZodLikeResult = { success: true; data: unknown } | ZodLikeFailure;

const issuesOf = (result: ZodLikeResult): ZodLikeIssue[] =>
  result.success ? [] : result.error.issues;

export function issueCodes(result: ZodLikeResult): string[] {
  return issuesOf(result).map((i) => i.message);
}

export function issuesFor(result: ZodLikeResult, field: string) {
  return issuesOf(result).filter((i) => i.path[0] === field);
}

export function validLoginInput(overrides: Record<string, unknown> = {}) {
  return {
    email: ANA_EMAIL,
    password: VALID_PASSWORD,
    ...overrides,
  };
}

export const FIELD_LIMITS = { email: 254, password: 128 } as const;
export const SECRET_PASSWORD = "S3gr3d0!XYZ";

export const sorted = <T extends string>(items: readonly T[]): T[] => [...items].sort();

export const forge = (v: unknown): SignUpInput => v as SignUpInput;