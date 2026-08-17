"use client";

import { useEffect, useState } from "react";

const SLIDES = [
  {
    eyebrow: "For candidates",
    title: "Apply directly — no middlemen",
    body: "Every vacancy here is posted by a verified agency and approved by our team before it goes live.",
    bg: "linear-gradient(120deg, #0a1f4a, #2c4d94)",
  },
  {
    eyebrow: "For agencies",
    title: "Post a vacancy, go live in minutes",
    body: "Every ad includes a Facebook & Instagram promotion, run by our team — extra reach, zero extra effort on your part.",
    bg: "linear-gradient(120deg, #4a2b0a, #c2701c)",
  },
  {
    eyebrow: "Trust & safety",
    title: "Every agency is verified before posting",
    body: "Recruiting agent license details are reviewed as part of onboarding.",
    bg: "linear-gradient(120deg, #0b4d3f, #1f9d5c)",
  },
];

export function BannerCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="promo-carousel">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.title}
          className={`promo-slide${i === active ? " active" : ""}`}
          style={{ background: slide.bg }}
        >
          <div>
            <p className="eyebrow">{slide.eyebrow}</p>
            <h3>{slide.title}</h3>
            <p>{slide.body}</p>
          </div>
        </div>
      ))}
      <div className="promo-dots">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            className={i === active ? "active" : ""}
            aria-label={`Show slide ${i + 1}`}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </div>
  );
}
