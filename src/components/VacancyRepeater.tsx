"use client";

import { useState } from "react";
import { COUNTRIES } from "@/lib/format";

export type VacancyInitial = {
  title: string;
  country?: string | null;
  city?: string | null;
  salary_range?: string | null;
  vacancies?: number | null;
  details?: string | null;
  require_video_intro?: boolean | null;
};

type Row = { key: number } & VacancyInitial;

export function VacancyRepeater({ initial }: { initial?: VacancyInitial[] }) {
  const [rows, setRows] = useState<Row[]>(
    initial && initial.length > 0
      ? initial.map((v, i) => ({ key: i, ...v }))
      : [{ key: 0, title: "" }]
  );
  const [nextKey, setNextKey] = useState(rows.length);

  function toggleRequireVideo(key: number, checked: boolean) {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, require_video_intro: checked } : row)));
  }

  return (
    <div className="field">
      <label>
        Vacancies advertised in this ad{" "}
        <span style={{ fontWeight: 400 }}>
          (optional — add one row per position if this ad covers several trades/roles; leave
          blank to use the position title above)
        </span>
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((row, i) => (
          <div
            key={row.key}
            className="card"
            style={{ padding: 14, background: "var(--surface-2)", position: "relative" }}
          >
            <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "var(--navy-900)" }}>
              Position {i + 1}
            </p>
            {rows.length > 1 && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                style={{ position: "absolute", top: 10, right: 10, padding: "4px 9px" }}
                onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))}
                aria-label="Remove this vacancy"
              >
                ✕ Remove
              </button>
            )}
            <div className="field-row">
              <div className="field" style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12 }}>Position title</label>
                <input name="vac_title" type="text" placeholder="e.g. Welder" defaultValue={row.title} />
              </div>
              <div className="field" style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12 }}>Number of openings</label>
                <input name="vac_count" type="number" min={1} defaultValue={row.vacancies ?? undefined} />
              </div>
            </div>
            <div className="field-row">
              <div className="field" style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12 }}>Country</label>
                <select name="vac_country" defaultValue={row.country ?? ""}>
                  <option value="">Same as above</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12 }}>City</label>
                <input name="vac_city" type="text" defaultValue={row.city ?? undefined} />
              </div>
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12 }}>Salary range</label>
              <input
                name="vac_salary"
                type="text"
                placeholder="e.g. AED 3,500–4,500"
                defaultValue={row.salary_range ?? undefined}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 12 }}>Experience / qualifications / benefits</label>
              <textarea name="vac_details" style={{ minHeight: 60 }} defaultValue={row.details ?? undefined} />
            </div>
            <div className="checkbox-row" style={{ marginTop: 10, marginBottom: 0 }}>
              <input
                id={`vac_require_video_checkbox_${row.key}`}
                type="checkbox"
                checked={row.require_video_intro ?? false}
                onChange={(e) => toggleRequireVideo(row.key, e.target.checked)}
              />
              <label htmlFor={`vac_require_video_checkbox_${row.key}`} style={{ fontSize: 12.5 }}>
                Require a short 1-2 minute video introduction for this position (recommended for
                senior roles)
              </label>
            </div>
            <input type="hidden" name="vac_require_video" value={row.require_video_intro ? "true" : "false"} />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        style={{ marginTop: 12 }}
        onClick={() => {
          setRows((r) => [...r, { key: nextKey, title: "" }]);
          setNextKey((k) => k + 1);
        }}
      >
        + Add another position
      </button>
    </div>
  );
}
