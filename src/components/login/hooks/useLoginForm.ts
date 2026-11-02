import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getAuthErrorMessage, getFieldErrorMessage } from "../domain/authErrors";
import { loginSchema } from "../domain/schemas";
import { safeRedirect } from "../routes/safeRedirect";
import { sharedLoginThrottle, type LoginThrottle } from "../security/loginThrottle";

export type LoginField = "email" | "password";
export type LoginFormData = Record<LoginField, string>;
export type LoginFormErrors = Partial<Record<LoginField, string>>;

const INITIAL: LoginFormData = { email: "", password: "" };
const ALL_TOUCHED: Record<LoginField, boolean> = { email: true, password: true };

export function useLoginForm({ throttle = sharedLoginThrottle }: { throttle?: LoginThrottle } = {}) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState<LoginFormData>(INITIAL);
  const [touched, setTouched] = useState<Partial<Record<LoginField, boolean>>>({});
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

  const errors = useMemo<LoginFormErrors>(() => {
    const parsed = loginSchema.safeParse(formData);
    if (parsed.success) return {};
    const out: LoginFormErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as LoginField;
      if (touched[field] && !out[field]) out[field] = getFieldErrorMessage(issue.message);
    }
    return out;
  }, [formData, touched]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
  }, []);

  const handleBlur = useCallback((e: ChangeEvent<HTMLInputElement> | { target: { name: string } }) => {
    const name = e.target.name as LoginField;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const togglePasswordVisibility = useCallback(() => setPasswordVisible((v) => !v), []);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (inFlight.current) return;

    setTouched(ALL_TOUCHED);
    setSubmitCount((n) => n + 1);

    const parsed = loginSchema.safeParse(formData);
    if (!parsed.success) return;
    const { email, password } = parsed.data;

    const gate = throttle.check(email);
    if (!gate.canAttempt) {
      setFormError(getAuthErrorMessage("TOO_MANY_ATTEMPTS", { retryAfterSeconds: gate.retryAfterSeconds }));
      return;
    }

    inFlight.current = true;
    setLoading(true);
    setFormError(null);
    try {
      const result = await signIn({ email, password });
      if (!mounted.current) return;

      if (result.ok) {
        throttle.recordSuccess(email);
        const from = (location.state as { from?: unknown } | null)?.from;
        navigate(safeRedirect(from), { replace: true });
        return;
      }
      if (result.error === "INVALID_CREDENTIALS") {
        throttle.recordFailure(email);
        setFormData((prev) => ({ ...prev, password: "" }));
      }
      setFormError(getAuthErrorMessage(result.error));
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
    handleChange,
    handleBlur,
    handleSubmit,
    togglePasswordVisibility,
  };
}

export type UseLoginFormReturn = ReturnType<typeof useLoginForm>;
