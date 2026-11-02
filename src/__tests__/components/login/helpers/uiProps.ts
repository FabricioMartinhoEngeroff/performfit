import { vi } from "vitest";
import type { FormEvent } from "react";

export const baseFormProps = () => ({
  errors: {},
  formError: null,
  loading: false,
  passwordVisible: false,
  submitCount: 0,
  handleChange: vi.fn(),
  handleBlur: vi.fn(),
  handleSubmit: vi.fn((event?: FormEvent) => event?.preventDefault()),
  togglePasswordVisibility: vi.fn(),
});