"use client";

import { useSearchParams } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE, TelemetryTag } from "@/components/ui/primitives";
import { SUGGESTED_PROMPTS, generate } from "@/lib/ai";

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
  citations?: string[];
  /** chars currently revealed (streaming effect) */
  revealed?: number;
}

/* Reveal up to `n` chars, but never end inside an open **bold** span — if the
 * slice leaves a dangling `**`, trim back to before it so the word pops in whole
 * once its closing `**` streams in, instead of flashing literal asterisks. */
function safeReveal(text: string, n: number): string {
  const slice = text.slice(0, n);
  const markers = slice.match(/\*\*/g);
  if (markers && markers.length % 2 === 1) {
    return slice.slice(0, slice.lastIndexOf("**"));
  }
  return slice;
}

/* minimal markdown: **bold**, lists, line breaks */
function Rich({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const isBullet = line.startsWith("- ");
        const isNum = /^\d+\.\s/.test(line);
        const content = isBullet
          ? line.slice(2)
          : isNum
            ? line.replace(/^\d+\.\s/, "")
            : line;
        const parts = content.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith("**") && p.endsWith("**") ? (
            <strong key={j} className="text-ink font-semibold">
              {p.slice(2, -2)}
            </strong>
          ) : (
            <Fragment key={j}>{p}</Fragment>
          ),
        );
        return (
          <Fragment key={i}>
            {isBullet ? (
              <span className="flex gap-2.5 pl-1">
                <span className="text-emerald mt-[3px] shrink-0">·</span>
                <span>{parts}</span>
              </span>
            ) : isNum ? (
              <span className="flex gap-2.5 pl-1">
                <span className="readout text-emerald text-xs mt-[3px] shrink-0">
                  {line.match(/^\d+/)?.[0]}
                </span>
                <span>{parts}</span>
              </span>
            ) : (
              <span>{parts}</span>
            )}
            {i < lines.length - 1 && <br />}
          </Fragment>
        );
      })}
    </>
  );
}

export default function AssistantChat() {
  const params = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bootRef = useRef(false);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  const send = useCallback(
    (q: string) => {
      const query = q.trim();
      if (!query) return;
      const userMsg: Message = { id: ++idRef.current, role: "user", text: query };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setThinking(true);
      scrollToEnd();

      // analyst "thinks", then streams
      const reply = generate(query);
      const aiId = ++idRef.current;
      setTimeout(() => {
        setThinking(false);
        setMessages((m) => [
          ...m,
          { id: aiId, role: "ai", text: reply.text, citations: reply.citations, revealed: 0 },
        ]);
      }, 900 + Math.random() * 600);
    },
    [scrollToEnd],
  );

  /* streaming reveal */
  useEffect(() => {
    const streaming = messages.find(
      (m) => m.role === "ai" && m.revealed !== undefined && m.revealed < m.text.length,
    );
    if (!streaming) return;
    const id = setInterval(() => {
      setMessages((msgs) =>
        msgs.map((m) =>
          m.id === streaming.id
            ? { ...m, revealed: Math.min((m.revealed ?? 0) + 6, m.text.length) }
            : m,
        ),
      );
      scrollToEnd();
    }, 24);
    return () => clearInterval(id);
  }, [messages, scrollToEnd]);

  /* deep-link query (?q=) */
  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    const q = params.get("q");
    if (q) send(q);
  }, [params, send]);

  const empty = messages.length === 0 && !thinking;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-6 flex flex-col h-[100svh]">
      {/* header */}
      <div className="flex items-center justify-between pb-5 border-b border-line">
        <div className="flex items-center gap-3">
          <span className="relative grid place-items-center w-10 h-10 rounded-xl bg-emerald/10 border border-emerald/30 text-emerald font-bold">
            Æ
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald border-2 border-abyss" />
          </span>
          <div>
            <div className="font-[family-name:var(--font-syne)] font-bold">
              Environmental analyst
            </div>
            <div className="telemetry mt-0.5">Grounded in live network · 28 cities · Kazakhstan</div>
          </div>
        </div>
        <TelemetryTag tone="emerald">
          <span className="dot-live" />
          Online
        </TelemetryTag>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 flex flex-col gap-5">
        {empty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="m-auto text-center flex flex-col items-center gap-6 max-w-md"
          >
            <div
              className="w-20 h-20 rounded-full border border-emerald/30 grid place-items-center"
              style={{
                background:
                  "radial-gradient(circle at 35% 30%, rgba(45,226,166,0.18), transparent 65%)",
              }}
            >
              <span className="font-[family-name:var(--font-syne)] font-bold text-2xl text-emerald">
                Æ
              </span>
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-syne)] font-bold text-2xl mb-2">
                Ask the network anything.
              </h1>
              <p className="text-ink-dim font-light text-[15px] leading-relaxed">
                I analyze live environmental telemetry across Kazakhstan — air,
                water, industry, biodiversity, and ecological risk — and answer
                with sources.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_PROMPTS.map((p, i) => (
                <motion.button
                  key={p}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.07, duration: 0.6, ease: EASE }}
                  onClick={() => send(p)}
                  className="glass rounded-full px-4 py-2 text-[13px] text-ink-dim hover:text-emerald hover:border-emerald/30 transition-colors duration-300"
                >
                  {p}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-5 py-3.5 text-[14px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-carbon-3 border border-line-bright"
                    : "glass border-emerald/15 text-ink-dim"
                }`}
              >
                {m.role === "ai" ? (
                  <>
                    <Rich text={safeReveal(m.text, m.revealed ?? m.text.length)} />
                    {(m.revealed ?? m.text.length) < m.text.length && (
                      <span className="inline-block w-1.5 h-4 bg-emerald/80 ml-0.5 align-text-bottom animate-[blink_1s_steps(2,start)_infinite]" />
                    )}
                  </>
                ) : (
                  m.text
                )}
              </div>
              {m.role === "ai" &&
                m.citations &&
                m.citations.length > 0 &&
                (m.revealed ?? 0) >= m.text.length && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-wrap gap-1.5 pl-1"
                  >
                    {m.citations.map((c) => (
                      <span
                        key={c}
                        className="telemetry !text-[9px] !tracking-[0.12em] border border-line rounded-full px-2.5 py-1"
                      >
                        ⌖ {c}
                      </span>
                    ))}
                  </motion.div>
                )}
            </motion.div>
          ))}
        </AnimatePresence>

        {thinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 pl-1"
          >
            <span className="grid place-items-center w-7 h-7 rounded-lg bg-emerald/10 border border-emerald/30 text-emerald text-[10px] font-bold">
              Æ
            </span>
            <span className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.85, 1, 0.85] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
                  className="w-1.5 h-1.5 rounded-full bg-emerald"
                />
              ))}
            </span>
            <span className="telemetry">Reading sensor field…</span>
          </motion.div>
        )}
      </div>

      {/* composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="glass-bright panel-glow rounded-2xl p-2 pl-5 flex items-center gap-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about any city, risk, or metric…"
          aria-label="Message the environmental analyst"
          className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-ink-faint py-2.5"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send"
          className="grid place-items-center w-10 h-10 rounded-xl bg-emerald text-abyss disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[0_0_24px_rgba(45,226,166,0.4)]"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden>
            <path
              d="M8 13V3M4 7l4-4 4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
      <p className="telemetry !text-[9px] text-center mt-3 !tracking-[0.18em]">
        Analysis grounded in network telemetry · not a substitute for official advisories
      </p>
    </div>
  );
}
