"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { ImageUploadField } from "@/components/ImageUploadField";
import { VacancyRepeater } from "@/components/VacancyRepeater";
import { createJobAdAction, type AdFormState } from "@/lib/actions/jobAds";
import { COUNTRIES } from "@/lib/format";
import { formatRupees } from "@/lib/format";

export function NewAdForm({ userId, feePaise }: { userId: string; feePaise: number }) {
  const [state, formAction] = useActionState<AdFormState, FormData>(createJobAdAction, {});
  const [imageUrl, setImageUrl] = useState("");

  return (
    <form action={formAction}>
      {state.error && <div className="form-error">{state.error}</div>}

      <div className="field">
        <label htmlFor="title">Position / vacancy title</label>
        <input id="title" name="title" type="text" required placeholder="e.g. Site Supervisor" />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="employer_name">Employer name</label>
          <input id="employer_name" name="employer_name" type="text" placeholder="e.g. Al Fahad Construction LLC" />
        </div>
        <div className="field">
          <label htmlFor="vacancies">Number of vacancies</label>
          <input id="vacancies" name="vacancies" type="number" min={1} />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="country">Country</label>
          <select id="country" name="country" required defaultValue="">
            <option value="" disabled>
              Select country
            </option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="city">City</label>
          <input id="city" name="city" type="text" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="description">Basic details</label>
        <textarea
          id="description"
          name="description"
          placeholder="Salary, benefits, experience required, qualifications…"
        />
      </div>

      <div className="field">
        <label htmlFor="contact_email">Email to receive applications</label>
        <input id="contact_email" name="contact_email" type="email" required />
        <span className="hint">Every application will be emailed here and saved in your dashboard.</span>
      </div>

      <ImageUploadField userId={userId} imageUrl={imageUrl} onImageUrlChange={setImageUrl} />

      <div className="card" style={{ background: "var(--amber-100)", marginBottom: 16, borderColor: "var(--amber-500)" }}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>Does your flyer advertise more than one position?</p>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          If the image above lists several roles (e.g. Welders, Fitters, Electricians), add each one
          below with its own location and salary so candidates can search and apply for the exact
          position — otherwise skip this and the details above are used as the single vacancy.
        </p>
      </div>

      <VacancyRepeater />

      <div className="card" style={{ background: "var(--surface-2)", marginBottom: 16 }}>
        <p style={{ fontWeight: 700, marginBottom: 6 }}>Posting fee — {formatRupees(feePaise)}</p>
        <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
          Includes a Facebook &amp; Instagram promotion of your ad (₹1,500 budget, run over 2 days
          by the JobsOverseas team). Payment is collected on the next step via Razorpay.
        </p>
      </div>

      <SubmitButton disabled={!imageUrl}>Continue to payment</SubmitButton>
    </form>
  );
}
