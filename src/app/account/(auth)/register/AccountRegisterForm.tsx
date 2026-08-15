"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { registerCandidateAction, type AuthFormState } from "@/lib/actions/auth";

export function AccountRegisterForm() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    registerCandidateAction,
    {}
  );

  return (
    <form action={formAction}>
      {state.error && <div className="form-error">{state.error}</div>}
      <div className="field">
        <label htmlFor="full_name">Full name</label>
        <input id="full_name" name="full_name" type="text" required />
      </div>
      <div className="field">
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" type="tel" required />
      </div>
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
          minLength={8}
          autoComplete="new-password"
        />
        <span className="hint">At least 8 characters</span>
      </div>
      <SubmitButton>Create account</SubmitButton>
    </form>
  );
}
