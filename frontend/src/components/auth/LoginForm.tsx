"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError, login } from "@/lib/api";
import { hasLoginErrors, validateLogin } from "@/lib/validation";
import type { LoginFieldErrors, LoginInput } from "@/types";
import { PasswordInput } from "@/components/ui/PasswordInput";

const GENERIC_ERROR = "Could not log in. Please try again.";

export function LoginForm() {
  const router = useRouter();
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<LoginInput>({
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(field: keyof LoginInput, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    setFormError(null);
    // After the first submit, errors update live as the user types.
    if (submitted) setErrors(validateLogin(next));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setSubmitted(true);
    setFormError(null);
    const fieldErrors = validateLogin(values);
    setErrors(fieldErrors);

    if (hasLoginErrors(fieldErrors)) {
      (fieldErrors.identifier ? identifierRef : passwordRef).current?.focus();
      return;
    }

    setLoading(true);
    try {
      await login(values);
      // Keep the loading state on while the next page opens.
      router.push("/dashboard");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : GENERIC_ERROR);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <Input
        ref={identifierRef}
        label="Email or username"
        name="identifier"
        type="text"
        placeholder="owner@email.com"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        value={values.identifier}
        onChange={(event) => handleChange("identifier", event.target.value)}
        error={errors.identifier}
        disabled={loading}
      />

      <PasswordInput
        ref={passwordRef}
        label="Password"
        name="password"
        placeholder="Enter your password"
        autoComplete="current-password"
        value={values.password}
        onChange={(event) => handleChange("password", event.target.value)}
        error={errors.password}
        disabled={loading}
      />

      <div className="-mt-1 flex justify-end">
        {/* No forgot-password screen yet (open question 7): link only. */}
        <a
          href="#"
          onClick={(event) => event.preventDefault()}
          className="rounded text-sm font-medium leading-5 text-primary-600 transition-colors hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          Forgot password?
        </a>
      </div>

      {formError && (
        <div
          role="alert"
          className="rounded-[10px] border border-danger-600 bg-danger-50 px-4 py-3 text-sm leading-[22px] text-danger-700"
        >
          {formError}
        </div>
      )}

      <Button type="submit" size="lg" fullWidth loading={loading}>
        Log in
      </Button>
    </form>
  );
}
