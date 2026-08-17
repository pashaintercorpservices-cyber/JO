"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { ImageUploadField } from "@/components/ImageUploadField";
import { VacancyRepeater, type VacancyInitial } from "@/components/VacancyRepeater";
import { updateJobAdAction, type AdFormState } from "@/lib/actions/jobAds";
import { COUNTRIES } from "@/lib/format";

export function EditAdForm({
  userId,
  ad,
  vacancies,
}: {
  userId: string;
  ad: {
    id: string;
    title: string;
    employer_name: string | null;
    country: string;
    city: string | null;
    description: string | null;
    contact_email: string;
    contact_name: string | null;
    contact_phone: string | null;
    vacancies: number | null;
    image_url: string | null;
  };
  vacancies: VacancyInitial[];
}) {
  const [state, formAction] = useActionState<AdFormState, FormData>(updateJobAdAction, {});
  const [imageUrl, setImageUrl] = useState(ad.image_url || "");

  return (
    <form action={formAction}>
      {state.error && <div className="form-error">{state.error}</div>}
      <input type="hidden" name="ad_id" value={ad.id} />

      <div className="field">
        <label htmlFor="title">Position / vacancy title</label>
        <input id="title" name="title" type="text" required defaultValue={ad.title} />
      </div>

      <div className="card" style={{ background: "var(--amber-100)", marginBottom: 16, borderColor: "var(--amber-500)", borderWidth: 2, borderStyle: "solid" }}>
        <p style={{ fontWeight: 700, marginBottom: 4, fontSize: 15 }}>
          Advertising more than one position in this ad?
        </p>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
          Add or remove positions below — candidates will be able to search and apply for the
          exact position.
        </p>
        <VacancyRepeater initial={vacancies} />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="employer_name">Employer name</label>
          <input id="employer_name" name="employer_name" type="text" defaultValue={ad.employer_name ?? undefined} />
        </div>
        <div className="field">
          <label htmlFor="vacancies">Number of vacancies</label>
          <input id="vacancies" name="vacancies" type="number" min={1} defaultValue={ad.vacancies ?? undefined} />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="country">Country</label>
          <select id="country" name="country" required defaultValue={ad.country}>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="city">City</label>
          <input id="city" name="city" type="text" defaultValue={ad.city ?? undefined} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="description">Basic details</label>
        <textarea
          id="description"
          name="description"
          placeholder="Salary, benefits, experience required, qualifications…"
          defaultValue={ad.description ?? undefined}
        />
      </div>

      <div className="field">
        <label htmlFor="contact_email">Email to receive applications</label>
        <input id="contact_email" name="contact_email" type="email" required defaultValue={ad.contact_email} />
        <span className="hint">Every application will be emailed here and saved in your dashboard.</span>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="contact_name">Hiring manager / contact person name</label>
          <input id="contact_name" name="contact_name" type="text" placeholder="e.g. Rahul Menon" defaultValue={ad.contact_name ?? undefined} />
        </div>
        <div className="field">
          <label htmlFor="contact_phone">Contact phone number</label>
          <input id="contact_phone" name="contact_phone" type="tel" placeholder="e.g. +91 98765 43210" defaultValue={ad.contact_phone ?? undefined} />
        </div>
      </div>
      <span className="hint" style={{ display: "block", marginTop: -10, marginBottom: 16 }}>
        Shared with candidates in their application confirmation email, so they can reach you directly.
      </span>

      <ImageUploadField userId={userId} imageUrl={imageUrl} onImageUrlChange={setImageUrl} />

      <SubmitButton disabled={!imageUrl}>Save changes</SubmitButton>
    </form>
  );
}
