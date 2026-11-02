import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "../context/useAuth";
import { getAuthErrorMessage, getFieldErrorMessage } from "../domain/authErrors";
import { parseEmail } from "../domain/schemas";

export const PASSWORD_RESET_NEUTRAL_MESSAGE = "Se o e-mail estiver cadastrado, enviaremos um link.";
export const RESET_COOLDOWN_SECONDS = 60;

export type ResetStatus = "idle" | "sent";

export function usePasswordReset({ now = () => performance.now() }: { now?: () => number } = {}) {
  const { sendPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<ResetStatus>("idle");
  const [loading, setLoading] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const inFlight = useRef(false);
  const lastSentAt = useRef<number | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(null);
  }, []);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (inFlight.current) return;

    const parsed = parseEmail(email);
    if (!parsed.ok) {
      setError(getFieldErrorMessage(parsed.error));
      return;
    }

    if (lastSentAt.current !== null) {
      const elapsedMs = now() - lastSentAt.current;
      if (elapsedMs < RESET_COOLDOWN_SECONDS * 1000) {
        setCooldownRemaining(Math.ceil((RESET_COOLDOWN_SECONDS * 1000 - elapsedMs) / 1000));
        return;
      }
    }

    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await sendPasswordReset(parsed.value);
      if (!mounted.current) return;
      if (result.ok) {
        lastSentAt.current = now();
        setCooldownRemaining(RESET_COOLDOWN_SECONDS);
        setStatus("sent");
        setMessage(PASSWORD_RESET_NEUTRAL_MESSAGE);
      } else {
        setMessage(null);
        setError(getAuthErrorMessage(result.error));
      }
    } catch {
      if (mounted.current) {
        setMessage(null);
        setError(getAuthErrorMessage("UNKNOWN"));
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  };

  return { email, error, message, status, loading, cooldownRemaining, handleChange, handleSubmit };
}

export type UsePasswordResetReturn = ReturnType<typeof usePasswordReset>;
