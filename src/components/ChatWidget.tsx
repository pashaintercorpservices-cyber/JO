"use client";

import { useEffect, useRef, useState } from "react";

type VisitorType = "agency" | "jobseeker";
type Message = { role: "user" | "assistant"; content: string };
type Step = "type" | "contact" | "chat";

const STORAGE_KEY = "jo_chat_state";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("type");
  const [visitorType, setVisitorType] = useState<VisitorType | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [emailSentNotice, setEmailSentNotice] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setStep(parsed.step || "type");
        setVisitorType(parsed.visitorType || null);
        setName(parsed.name || "");
        setEmail(parsed.email || "");
        setPhone(parsed.phone || "");
        setSessionId(parsed.sessionId || null);
        setMessages(parsed.messages || []);
      }
    } catch {
      // sessionStorage unavailable or corrupted -- start fresh, not fatal
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ step, visitorType, name, email, phone, sessionId, messages })
      );
    } catch {
      // best-effort persistence only
    }
  }, [step, visitorType, name, email, phone, sessionId, messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  function handlePickType(t: VisitorType) {
    setVisitorType(t);
    setStep("contact");
  }

  function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) return;
    setStep("chat");
    setMessages([
      {
        role: "assistant",
        content: `Hi ${name.split(" ")[0]}! I'm the JobsOverseas assistant. ${
          visitorType === "agency"
            ? "How can I help with posting a vacancy or your account?"
            : "Ask me about live vacancies, applying, or anything else about JobsOverseas."
        }`,
      },
    ]);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return;
    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setWhatsappLink(null);
    setEmailSentNotice(false);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          visitorType,
          name,
          email,
          phone,
          message: text,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages([...nextMessages, { role: "assistant", content: "Sorry, something went wrong. Please try again or WhatsApp us at +91 88844 78676." }]);
        return;
      }
      if (data.sessionId) setSessionId(data.sessionId);
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
      if (data.status === "escalated" && data.whatsappLink) setWhatsappLink(data.whatsappLink);
      if (data.status === "resolved" && data.emailSent) setEmailSentNotice(true);
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: "Sorry, something went wrong. Please try again or WhatsApp us at +91 88844 78676." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 1000,
          width: 56, height: 56, borderRadius: "50%", border: "none",
          background: "var(--amber-500)", color: "#241000", fontSize: 22,
          boxShadow: "var(--shadow)", cursor: "pointer",
        }}
      >
        {open ? "✕" : "💬"}
      </button>

      {open && (
        <div
          style={{
            position: "fixed", bottom: 88, right: 20, zIndex: 1000,
            width: 340, maxWidth: "calc(100vw - 40px)", height: 480, maxHeight: "calc(100vh - 120px)",
            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
            boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", overflow: "hidden",
          }}
        >
          <div style={{ background: "var(--navy-900)", color: "#fff", padding: "12px 16px", fontWeight: 700, fontSize: 14 }}>
            JobsOverseas Support
          </div>

          {step === "type" && (
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
              <p style={{ fontSize: 14, color: "var(--navy-900)" }}>Are you a recruitment agency or a jobseeker?</p>
              <button className="btn btn-primary btn-block" onClick={() => handlePickType("agency")}>
                I&apos;m a Recruitment Agency
              </button>
              <button className="btn btn-ghost btn-block" onClick={() => handlePickType("jobseeker")}>
                I&apos;m a Jobseeker
              </button>
            </div>
          )}

          {step === "contact" && (
            <form onSubmit={handleContactSubmit} style={{ padding: 20, flex: 1, overflowY: "auto" }}>
              <div className="field">
                <label htmlFor="chat-name">Name</label>
                <input id="chat-name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="chat-email">Email</label>
                <input id="chat-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="chat-phone">Mobile</label>
                <input id="chat-phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <button className="btn btn-primary btn-block" type="submit">Start chat</button>
            </form>
          )}

          {step === "chat" && (
            <>
              <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {messages.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                      background: m.role === "user" ? "var(--amber-100)" : "var(--surface-2, #eef2f9)",
                      color: "var(--navy-900)",
                      padding: "8px 12px", borderRadius: 10, fontSize: 13.5, maxWidth: "85%",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.content}
                  </div>
                ))}
                {sending && <div style={{ fontSize: 12, color: "var(--muted)" }}>Typing…</div>}
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ alignSelf: "flex-start", textDecoration: "none" }}
                  >
                    Continue on WhatsApp →
                  </a>
                )}
                {emailSentNotice && (
                  <div style={{ fontSize: 12, color: "var(--success, #1f9d5c)" }}>
                    A copy of this conversation has been emailed to {email}.
                  </div>
                )}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid var(--border)" }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message…"
                  disabled={sending}
                  style={{
                    flex: 1, padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border)",
                    fontSize: 13.5, fontFamily: "var(--sans)",
                  }}
                />
                <button className="btn btn-primary btn-sm" type="submit" disabled={sending || !input.trim()}>
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
