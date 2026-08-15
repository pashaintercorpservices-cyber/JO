"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { registerAgencyAction, type AuthFormState } from "@/lib/actions/auth";

export function AgencyRegisterForm() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(registerAgencyAction, {});

  return (
    <form action={formAction}>
      {state.error && <div className="form-error">{state.error}</div>}
      <div className="field">
        <label htmlFor="agency_name">Agency name</label>
        <input id="agency_name" name="agency_name" type="text" required />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="full_name">Your name</label>
          <input id="full_name" name="full_name" type="text" required />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="tel" required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="license_number">
          Recruiting agent license number <span style={{ fontWeight: 400 }}>(optional)</span>
        </label>
        <input id="license_number" name="license_number" type="text" />
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
      <SubmitButton>Create agency account</SubmitButton>
    </form>
  );
}
