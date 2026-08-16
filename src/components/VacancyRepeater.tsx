"use client";

import { useState } from "react";
import { COUNTRIES } from "@/lib/format";

type Row = { key: number };

export function VacancyRepeater() {
  const [rows, setRows] = useState<Row[]>([{ key: 0 }]);
  const [nextKey, setNextKey] = useState(1);

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
                <input name="vac_title" type="text" placeholder="e.g. Welder" />
              </div>
              <div className="field" style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12 }}>Number of openings</label>
                <input name="vac_count" type="number" min={1} />
              </div>
            </div>
            <div className="field-row">
              <div className="field" style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12 }}>Country</label>
                <select name="vac_country" defaultValue="">
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
                <input name="vac_city" type="text" />
              </div>
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12 }}>Salary range</label>
              <input name="vac_salary" type="text" placeholder="e.g. AED 3,500–4,500" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 12 }}>Experience / qualifications / benefits</label>
              <textarea name="vac_details" style={{ minHeight: 60 }} />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        style={{ marginTop: 12 }}
        onClick={() => {
          setRows((r) => [...r, { key: nextKey }]);
          setNextKey((k) => k + 1);
        }}
      >
        + Add another position
      </button>
    </div>
  );
}
