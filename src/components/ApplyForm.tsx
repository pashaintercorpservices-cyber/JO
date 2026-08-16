"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { submitApplicationAction, type ApplyFormState } from "@/lib/actions/applications";

type Prefill = { name?: string; email?: string; phone?: string };
type VacancyOption = { id: string; title: string; country: string };

export function ApplyForm({
  vacancy,
  vacancies,
  prefill,
}: {
  vacancy?: VacancyOption;
  vacancies?: VacancyOption[];
  prefill?: Prefill;
}) {
  const [state, formAction] = useActionState<ApplyFormState, FormData>(
    submitApplicationAction,
    {}
  );

  if (state.success) {
    return (
      <div className="form-success">
        Application submitted. The agency will contact you directly if you&apos;re shortlisted.
      </div>
    );
  }

  return (
    <form action={formAction}>
      {state.error && <div className="form-error">{state.error}</div>}

      {vacancy ? (
        <input type="hidden" name="job_vacancy_id" value={vacancy.id} />
      ) : (
        <div className="field">
          <label htmlFor="job_vacancy_id">Position you&apos;re applying for</label>
          <select id="job_vacancy_id" name="job_vacancy_id" required defaultValue="">
            <option value="" disabled>
              Select a vacancy
            </option>
            {(vacancies || []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.title} — {v.country}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field">
        <label htmlFor="name">Full name</label>
        <input id="name" name="name" type="text" required defaultValue={prefill?.name} />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required defaultValue={prefill?.email} />
        </div>
        <div className="field">
          <label htmlFor="phone">Contact number</label>
          <input id="phone" name="phone" type="tel" required defaultValue={prefill?.phone} />
        </div>
      </div>

      <div className="checkbox-row">
        <input id="consent" name="consent" type="checkbox" required />
        <label htmlFor="consent">
          I consent to JobsOverseas sharing these details with the agency advertising this
          vacancy, for the purpose of this application.
        </label>
      </div>

      <SubmitButton>Submit application</SubmitButton>
    </form>
  );
}
