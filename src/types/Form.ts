export interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export type FormErrors = Partial<Record<keyof FormData, string>>;
