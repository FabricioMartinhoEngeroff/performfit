import { MOCK_USERS_KEY } from "../../../../components/login/gateway/MockAuthGateway";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string;
  salt: string;
  iterations: number;
}

export const readStoredUsers = (): StoredUser[] =>
  JSON.parse(localStorage.getItem(MOCK_USERS_KEY) ?? "[]");

export const writeStoredUsers = (records: readonly unknown[]): void =>
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(records));

export function firstStoredUser(): StoredUser {
  const [user] = readStoredUsers();
  if (!user) throw new Error("nenhum usuário gravado no mock");
  return user;
}

export function patchFirstStoredUser(patch: Partial<StoredUser>): void {
  const [first, ...others] = readStoredUsers();
  writeStoredUsers([{ ...first, ...patch }, ...others]);
}

export const allStorageText = (): string =>
  JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });