import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getAuthErrorMessage, getFieldErrorMessage } from "../domain/authErrors";
import { getPasswordRequirements, registerSchema } from "../domain/schemas";

export type RegisterField = "email" | "password" | "confirmPassword";
export type RegisterFormData = Record<RegisterField, string>;
export type RegisterFormErrors = Partial<Record<RegisterField, string>>;

const INITIAL: RegisterFormData = { email: "", password: "", confirmPassword: "" };
const ALL_TOUCHED: Record<RegisterField, boolean> = { email: true, password: true, confirmPassword: true };

export function useRegisterForm() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterFormData>(INITIAL);
  const [touched, setTouched] = useState<Partial<Record<RegisterField, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<RegisterFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const errors = useMemo<RegisterFormErrors>(() => {
    const out: RegisterFormErrors = {};
    const parsed = registerSchema.safeParse(formData);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as RegisterField;
        if (touched[field] && !out[field]) out[field] = getFieldErrorMessage(issue.message);
      }
    }
    return { ...out, ...serverErrors };
  }, [formData, touched, serverErrors]);

  const requirements = useMemo(() => getPasswordRequirements(formData.password), [formData.password]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setServerErrors((prev) => {
      const next = { ...prev };
      delete next[name as RegisterField];
      return next;
    });
    setFormError(null);
  }, []);

  const handleBlur = useCallback((e: ChangeEvent<HTMLInputElement> | { target: { name: string } }) => {
    const name = e.target.name as RegisterField;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const togglePasswordVisibility = useCallback(() => setPasswordVisible((v) => !v), []);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (inFlight.current) return;

    setTouched(ALL_TOUCHED);
    setSubmitCount((n) => n + 1);

    const parsed = registerSchema.safeParse(formData);
    if (!parsed.success) return;
    const { email, password } = parsed.data;

    inFlight.current = true;
    setLoading(true);
    setFormError(null);
    setServerErrors({});
    try {
      const result = await signUp({ email, password });
      if (!mounted.current) return;

      if (result.ok) {
        navigate("/app", { replace: true });
      } else if (result.error === "EMAIL_IN_USE") {
        setServerErrors({ email: getAuthErrorMessage("EMAIL_IN_USE") });
      } else if (result.error === "WEAK_PASSWORD") {
        setServerErrors({ password: getAuthErrorMessage("WEAK_PASSWORD") });
      } else {
        setFormError(getAuthErrorMessage(result.error));
      }
    } catch {
      if (mounted.current) setFormError(getAuthErrorMessage("UNKNOWN"));
    } finally {
      inFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  };

  return {
    formData,
    errors,
    formError,
    loading,
    passwordVisible,
    submitCount,
    requirements,
    handleChange,
    handleBlur,
    handleSubmit,
    togglePasswordVisibility,
  };
}

export type UseRegisterFormReturn = ReturnType<typeof useRegisterForm>;
