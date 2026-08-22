"use client";

import { useActionState, useRef, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { ResumeUploadField, type ResumePreview } from "@/components/ResumeUploadField";
import { ResumePreviewCard } from "@/components/ResumePreviewCard";
import { VideoIntroRecorder } from "@/components/VideoIntroRecorder";
import { submitApplicationAction, type ApplyFormState } from "@/lib/actions/applications";

type Prefill = { name?: string; email?: string; phone?: string };
type VacancyOption = {
  id: string;
  title: string;
  country: string;
  city?: string | null;
  salary_range?: string | null;
  requireVideoIntro: boolean;
};

function vacancyLabel(v: VacancyOption): string {
  const location = v.city ? `${v.city}, ${v.country}` : v.country;
  const salary = v.salary_range ? ` · ${v.salary_range}` : "";
  return `${v.title} — ${location}${salary}`;
}

export function ApplyForm({
  vacancies,
  prefill,
}: {
  vacancies: VacancyOption[];
  prefill?: Prefill;
}) {
  const [state, formAction] = useActionState<ApplyFormState, FormData>(
    submitApplicationAction,
    {}
  );
  const [resumeReady, setResumeReady] = useState(false);
  const [resumeFile, setResumeFile] = useState<ResumePreview | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [selectedVacancyId, setSelectedVacancyId] = useState(
    vacancies.length === 1 ? vacancies[0].id : ""
  );
  const [step, setStep] = useState<1 | 2>(1);
  const step1Ref = useRef<HTMLDivElement>(null);

  const selectedVacancy = vacancies.find((v) => v.id === selectedVacancyId);
  const videoRequired = Boolean(selectedVacancy?.requireVideoIntro);

  if (state.success) {
    return (
      <div className="form-success">
        Application submitted. The agency will contact you directly if you&apos;re shortlisted.
      </div>
    );
  }

  function handleContinue() {
    if (!step1Ref.current) return;
    // Validate only step 1's own fields. form.reportValidity() would also try to
    // validate step 2's required fields (suitability_answer, resume_confirmed,
    // availability_confirmed) -- browsers can't focus those while their container
    // is display:none and throw
    // "not focusable" instead of reporting, which silently breaks Continue.
    const fields = step1Ref.current.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      "[required]"
    );
    let allValid = true;
    fields.forEach((field) => {
      if (!field.reportValidity()) allValid = false;
    });
    if (allValid) setStep(2);
  }

  const canContinue = resumeReady && (!videoRequired || videoReady);

  return (
    <form action={formAction}>
      {state.error && <div className="form-error">{state.error}</div>}

      <div ref={step1Ref} style={{ display: step === 1 ? "block" : "none" }}>
        <div className="field">
          <label htmlFor="job_vacancy_id">Position you&apos;re applying for</label>
          <select
            id="job_vacancy_id"
            name="job_vacancy_id"
            required
            value={selectedVacancyId}
            onChange={(e) => setSelectedVacancyId(e.target.value)}
          >
            {vacancies.length !== 1 && (
              <option value="" disabled>
                Select a vacancy
              </option>
            )}
            {vacancies.map((v) => (
              <option key={v.id} value={v.id}>
                {vacancyLabel(v)}
              </option>
            ))}
          </select>
        </div>

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

        <ResumeUploadField onReadyChange={setResumeReady} onFileSelected={setResumeFile} />

        {videoRequired && (
          <VideoIntroRecorder
            key={selectedVacancyId}
            onReadyChange={setVideoReady}
            onVideoSelected={() => {}}
          />
        )}

        <div className="checkbox-row">
          <input id="consent" name="consent" type="checkbox" required />
          <label htmlFor="consent">
            I consent to JobsOverseas sharing these details with the agency advertising this
            vacancy, for the purpose of this application.
          </label>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!canContinue}
          onClick={handleContinue}
        >
          Continue to review →
        </button>
      </div>

      <div style={{ display: step === 2 ? "block" : "none" }}>
        <div className="field">
          <label>Your attached resume</label>
          {resumeFile && <ResumePreviewCard file={resumeFile} />}
        </div>

        <div className="field">
          <label htmlFor="suitability_answer">
            Why do you think you are suitable for the above vacancy?
          </label>
          <textarea
            id="suitability_answer"
            name="suitability_answer"
            required
            rows={4}
            placeholder="A few sentences on your relevant experience or skills"
          />
        </div>

        <div className="checkbox-row">
          <input id="resume_confirmed" name="resume_confirmed" type="checkbox" required />
          <label htmlFor="resume_confirmed">
            I&apos;ve checked the preview above and confirm this is the correct file / resume.
          </label>
        </div>

        <div className="checkbox-row">
          <input id="availability_confirmed" name="availability_confirmed" type="checkbox" required />
          <label htmlFor="availability_confirmed">
            I confirm I am genuinely interested in and available to work in
            {selectedVacancy ? ` ${selectedVacancy.city ? `${selectedVacancy.city}, ` : ""}${selectedVacancy.country}` : " the job location"}
            {" "}if selected.
          </label>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
            ← Back
          </button>
          <div style={{ flex: 1 }}>
            <SubmitButton>Submit application</SubmitButton>
          </div>
        </div>
      </div>
    </form>
  );
}
