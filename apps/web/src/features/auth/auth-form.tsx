"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { ApiError, authApi, type RegisterInput } from "@/lib/api";

import { currentUserQueryKey } from "./use-auth";

type AuthMode = "login" | "register";
type FieldErrors = Partial<Record<keyof RegisterInput, string>>;

export function AuthForm({ mode }: Readonly<{ mode: AuthMode }>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: mode === "register" ? authApi.register : authApi.login,
    onSuccess: (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);
      router.replace("/app");
    },
    onError: (error: Error) => {
      if (error instanceof ApiError) {
        const serverErrors = Object.fromEntries(
          Object.entries(error.problem.errors ?? {}).map(
            ([field, messages]) => [
              field,
              messages[0] ?? "Please check this value.",
            ],
          ),
        ) as FieldErrors;
        setFieldErrors(serverErrors);
        setFormError(error.problem.detail);
        return;
      }
      setFormError(
        "We could not reach NexusOps. Check your connection and try again.",
      );
    },
  });

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setFormError(null);
    const form = new FormData(event.currentTarget);
    const input: RegisterInput = {
      displayName: String(form.get("displayName") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    };
    const errors = validate(input, mode);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    if (mode === "register") {
      mutation.mutate(input);
    } else {
      mutation.mutate({ email: input.email, password: input.password });
    }
  }

  const isRegister = mode === "register";

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      {isRegister ? (
        <FormField
          autoComplete="name"
          error={fieldErrors.displayName}
          id="displayName"
          label="Full name"
          placeholder="Ada Lovelace"
        />
      ) : null}
      <FormField
        autoComplete="email"
        error={fieldErrors.email}
        id="email"
        inputMode="email"
        label="Work email"
        placeholder="you@company.com"
        type="email"
      />
      <div className="field">
        <div className="label-row">
          <label htmlFor="password">Password</label>
          <button
            aria-controls="password"
            className="text-button"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <input
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
          aria-invalid={fieldErrors.password ? true : undefined}
          autoComplete={isRegister ? "new-password" : "current-password"}
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
        />
        {isRegister && !fieldErrors.password ? (
          <p className="field-help">Use at least 12 characters.</p>
        ) : null}
        {fieldErrors.password ? (
          <p className="field-error" id="password-error">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      {formError ? (
        <div className="form-alert" role="alert">
          {formError}
        </div>
      ) : null}

      <button
        className="primary-button"
        disabled={mutation.isPending}
        type="submit"
      >
        {mutation.isPending
          ? isRegister
            ? "Creating account…"
            : "Signing in…"
          : isRegister
            ? "Create account"
            : "Sign in"}
      </button>

      <p className="auth-switch">
        {isRegister ? "Already have an account?" : "New to NexusOps?"}{" "}
        <Link href={isRegister ? "/signin" : "/signup"}>
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}

interface FormFieldProps {
  autoComplete: string;
  error?: string;
  id: keyof RegisterInput;
  inputMode?: "email";
  label: string;
  placeholder?: string;
  type?: "email" | "text";
}

function FormField({
  autoComplete,
  error,
  id,
  inputMode,
  label,
  placeholder,
  type = "text",
}: Readonly<FormFieldProps>) {
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        autoComplete={autoComplete}
        id={id}
        inputMode={inputMode}
        name={id}
        placeholder={placeholder}
        type={type}
      />
      {error ? (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function validate(input: RegisterInput, mode: AuthMode): FieldErrors {
  const errors: FieldErrors = {};
  if (mode === "register" && input.displayName.length < 2) {
    errors.displayName = "Enter your full name.";
  }
  if (!/^\S+@\S+\.\S+$/.test(input.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (mode === "register" && input.password.length < 12) {
    errors.password = "Use at least 12 characters.";
  } else if (input.password.length === 0) {
    errors.password = "Enter your password.";
  }
  return errors;
}
