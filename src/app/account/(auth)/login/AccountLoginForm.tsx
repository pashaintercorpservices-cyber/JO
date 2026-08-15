"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { loginAction, type AuthFormState } from "@/lib/actions/auth";

export function AccountLoginForm({ next }: { next: string }) {
  const action = loginAction.bind(null, next);
  const [state, formAction] = useActionState<AuthFormState, FormData>(action, {});

  return (
    <form action={formAction}>
      {state.error && <div className="form-error">{state.error}</div>}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      <SubmitButton>Log in</SubmitButton>
    </form>
  );
}
