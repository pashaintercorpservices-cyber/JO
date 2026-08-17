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
        <span className="hint">If you're only advertising one position, this is all you need — fill in the rest of the form below.</span>
      </div>

      <div className="card" style={{ background: "var(--amber-100)", marginBottom: 16, borderColor: "var(--amber-500)", borderWidth: 2, borderStyle: "solid" }}>
        <p style={{ fontWeight: 700, marginBottom: 4, fontSize: 15 }}>
          Advertising more than one position in this ad?
        </p>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
          If your flyer lists several roles (e.g. Welders, Fitters, Electricians), click below to
          add each one with its own location and salary — candidates will be able to search and
          apply for the exact position. Leave this empty to use the title above as the only vacancy.
        </p>
        <VacancyRepeater />
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

      <div className="field-row">
        <div className="field">
          <label htmlFor="contact_name">Hiring manager / contact person name</label>
          <input id="contact_name" name="contact_name" type="text" placeholder="e.g. Rahul Menon" />
        </div>
        <div className="field">
          <label htmlFor="contact_phone">Contact phone number</label>
          <input id="contact_phone" name="contact_phone" type="tel" placeholder="e.g. +91 98765 43210" />
        </div>
      </div>
      <span className="hint" style={{ display: "block", marginTop: -10, marginBottom: 16 }}>
        Shared with candidates in their application confirmation email, so they can reach you directly.
      </span>

      <ImageUploadField userId={userId} imageUrl={imageUrl} onImageUrlChange={setImageUrl} />

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
