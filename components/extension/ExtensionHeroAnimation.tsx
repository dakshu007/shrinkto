"use client";

import type { CSSProperties, ReactNode } from "react";
import { useStageClock, stageClip, range as r, ease, pop, lerp, path } from "@/components/motion/useStageClock";
import { Check, ChevronsLeftRight, Download, Lock, PenLine, RotateCw, ShieldCheck, SquareUser, Contact, X, ArrowRight, Puzzle } from "lucide-react";
import { ProMark } from "./ProMark";

/**
 * Hero animation for /chrome-extension-shrinkto-pro - the real job ShrinkTo
 * does, in five labelled steps on an 18 s loop:
 *
 *   1  an exam form rejects a 4.2 MB photo ("must be 20-50 KB")
 *   2  open ShrinkTo from the toolbar, tap the Exam photo preset
 *   3  it shrinks to 48 KB, 200x230, in a fraction of a second
 *   4  before / after slider: nothing visible was lost
 *   5  save, drop it on the form - accepted
 *
 * Every frame is derived from `t` (see useStageClock). The popup mirrors the
 * shipped extension UI. Phones get a portrait stage.
 */

const BLUE = "#1A73E8";
const INK = "#0e1525";
const DIM = "#5b6478";
const FAINT = "#8b93a7";
const LINE = "#e4e7f0";
const SURFACE = "#f3f5fa";
const OK = "#0f9f62";
const OK_SOFT = "#e7f7ef";
const BAD = "#dc2626";
const BAD_SOFT = "#fdeeed";
const GRAD = BLUE;
const GRAD_SOFT = "#e8f0fe";

export const CYCLE = 18;
const STILL_T = 15.8;
const FIRST_T = 0.4;
const BOUNDS = [0, 3, 6.5, 10, 13.5, CYCLE];

export const STEPS = [
  { n: "01", label: "File too large" },
  { n: "02", label: "Tap a preset" },
  { n: "03", label: "Shrunk to 48 KB" },
  { n: "04", label: "Check every pixel" },
  { n: "05", label: "Accepted" },
] as const;

const CAPTIONS = [
  "The form wants a 20-50 KB photo. Yours is 4.2 MB.",
  "Open ShrinkTo from the toolbar and tap the Exam photo preset.",
  "200×230 px, 48 KB, highest quality that fits - on your device, in a blink.",
  "Drag the slider: the difference is invisible. The file is 98% smaller.",
  "Save it, upload it. Accepted on the first try.",
];

const abs = (s: CSSProperties): CSSProperties => ({ position: "absolute", ...s });

function frameAt(t: number) {
  const u = ((t % CYCLE) + CYCLE) % CYCLE;
  let step = 0;
  for (let i = 0; i < 5; i++) if (u >= BOUNDS[i]) step = i;

  // Size counter: log-interpolate 4.2 MB -> 48 KB so it "falls" naturally.
  const shrinkP = ease(u, 6.7, 8.1);
  const bytes = Math.exp(lerp(Math.log(4.2 * 1024 * 1024), Math.log(48 * 1024), shrinkP));

  return {
    u,
    step,
    stepP: r(u, BOUNDS[step], BOUNDS[step + 1]),
    caption: CAPTIONS[step],
    fade: Math.min(r(u, 0, 0.35), 1 - r(u, CYCLE - 0.45, CYCLE)),
    pageIn: ease(u, 0.15, 1),
    // Step 1: the rejected upload.
    picked: u >= 1.7,
    errorIn: ease(u, 1.8, 2.1),
    shake: u >= 1.8 && u < 2.4 ? Math.sin((u - 1.8) * 60) * (1 - r(u, 1.8, 2.4)) * 6 : 0,
    // Toolbar icon press + popup.
    iconPress: r(u, 3.7, 3.85) * (1 - r(u, 3.85, 4.2)),
    popupOpen: u >= 3.95 && u < 14.5,
    popupIn: u < 14.2 ? pop(u, 3.95, 4.35) : 1 - r(u, 14.2, 14.5),
    presetOn: u >= 5.35,
    presetPress: u >= 5.25 && u < 5.45 ? 1 : 0,
    rowIn: ease(u, 5.7, 6.2),
    // Step 3: shrinking.
    shrinkP,
    bytes,
    ring: ease(u, 6.7, 8.1),
    tags: pop(u, 8.2, 8.6),
    // Step 4: compare.
    cmpIn: u >= 10 && u < 13.6 ? Math.min(ease(u, 10, 10.45), 1 - r(u, 13.25, 13.55)) : 0,
    slider: u < 10.6 ? 0.5 : u < 11.6 ? lerp(0.5, 0.12, ease(u, 10.6, 11.6)) : u < 12.6 ? lerp(0.12, 0.88, ease(u, 11.6, 12.6)) : lerp(0.88, 0.5, ease(u, 12.6, 13.2)),
    // Step 5: save + accepted.
    savePress: u >= 13.95 && u < 14.15 ? 1 : 0,
    saved: u >= 14.1,
    fly: u >= 14.35 && u < 15.25 ? ease(u, 14.35, 15.2) : -1,
    accepted: u >= 15.2,
    acceptIn: pop(u, 15.2, 15.6),
    burst: r(u, 15.2, 16.4),
    submitGlow: ease(u, 15.6, 16.1),
    cursorDown:
      (u >= 1.5 && u < 1.7) || (u >= 3.7 && u < 3.9) || (u >= 5.25 && u < 5.45) || (u >= 13.95 && u < 14.15),
  };
}
type Frame = ReturnType<typeof frameAt>;

function fmtBytes(n: number) {
  if (n >= 1024 * 1024) return `${(n / 1048576).toFixed(1)} MB`;
  return `${Math.round(n / 1024)} KB`;
}

// ---------------------------------------------------------------------------
// Layout - every position the cursor needs comes from here.
function layout(w: number, h: number, compact: boolean) {
  const bar = 72;
  const formX = compact ? 12 : 34;
  const formY = 22;
  const formW = compact ? w - 24 : 560;
  const popupW = compact ? Math.min(310, w - 24) : 330;
  const popupX = w - 12 - popupW;
  const popupY = bar + 8;
  const upload = { x: formX + 20, y: bar + formY + 214, w: formW - 40, h: 96 };
  return {
    bar,
    formX,
    formY,
    formW,
    popupW,
    popupX,
    popupY,
    upload,
    chooseBtn: { x: upload.x + upload.w - (compact ? 80 : 54), y: upload.y + 48 },
    icon: { x: w - 30, y: 54 },
    preset: { x: popupX + 58, y: popupY + 131 },
    saveBtn: { x: popupX + popupW - 34, y: popupY + 192 },
    rowThumb: { x: popupX + 39, y: popupY + 192 },
    h,
  };
}
type Layout = ReturnType<typeof layout>;

// ---------------------------------------------------------------------------
function Rail({ f, compact }: { f: Frame; compact: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: compact ? 5 : 8 }}>
      {STEPS.map((s, i) => {
        const on = i === f.step;
        const done = i < f.step;
        return (
          <div
            key={s.label}
            style={{
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: compact ? 34 : 40,
              padding: compact ? (on ? "0 12px 0 5px" : "0 5px") : "0 15px 0 6px",
              borderRadius: 99,
              background: on ? BLUE : "#FFFFFF",
              border: `1px solid ${on ? BLUE : LINE}`,
              color: on ? "#FFFFFF" : INK,
              boxShadow: on ? "0 10px 26px rgba(26,115,232,0.3)" : "0 1px 2px rgba(20,30,70,0.05)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              style={{
                minWidth: 26,
                height: compact ? 24 : 28,
                padding: "0 7px",
                borderRadius: 99,
                background: on ? "#FFFFFF" : done ? OK : SURFACE,
                color: on ? BLUE : done ? "#FFFFFF" : DIM,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.02em",
              }}
            >
              {done ? <Check size={13} strokeWidth={3} /> : compact ? i + 1 : s.n}
            </span>
            {(!compact || on) && <span style={{ fontSize: compact ? 13 : 14, fontWeight: 650, whiteSpace: "nowrap" }}>{s.label}</span>}
            {on && <span style={abs({ left: 0, bottom: 0, height: 2, width: `${f.stepP * 100}%`, background: "#1A73E8" })} />}
          </div>
        );
      })}
    </div>
  );
}

function Caption({ f, compact }: { f: Frame; compact: boolean }) {
  const o = Math.min(r(f.stepP, 0, 0.08), 1 - r(f.stepP, 0.94, 1));
  return (
    <p
      style={{
        margin: compact ? "14px 6px 0" : "18px 0 0",
        textAlign: "center",
        fontSize: compact ? 15 : 17,
        lineHeight: 1.4,
        fontWeight: 500,
        color: DIM,
        opacity: f.step === 0 && f.u < 0.4 ? 1 : o,
        transform: `translateY(${(1 - o) * 4}px)`,
        minHeight: compact ? 44 : 24,
      }}
    >
      {f.caption}
    </p>
  );
}

/** Stylised passport-style portrait, drawn with gradients (no photo needed). */
function Portrait({ w, h, radius = 8 }: { w: number; h: number; radius?: number; inverse?: boolean }) {
  return (
    <div style={{ position: "relative", width: w, height: h, borderRadius: radius, overflow: "hidden", background: "linear-gradient(180deg,#dbe7ff,#bfd3f8)", flexShrink: 0 }}>
      <div style={abs({ left: "50%", bottom: "-34%", width: "86%", height: "70%", transform: "translateX(-50%)", borderRadius: "50% 50% 0 0", background: "linear-gradient(180deg,#2f4a7d,#1f3157)" })} />
      <div style={abs({ left: "43.5%", top: "52%", width: "13%", height: "14%", background: "#e2ae86" })} />
      <div style={abs({ left: "50%", top: "24%", width: "36%", height: "34%", transform: "translateX(-50%)", borderRadius: "50%", background: "radial-gradient(circle at 45% 40%,#f2c49f,#dca07a)" })} />
      <div style={abs({ left: "50%", top: "18%", width: "39%", height: "19%", transform: "translateX(-50%)", borderRadius: "50% 50% 35% 35%", background: "#2b211b" })} />
    </div>
  );
}

function BrowserBar({ f, compact }: { f: Frame; compact: boolean }) {
  return (
    <div style={{ background: SURFACE, borderBottom: `1px solid ${LINE}` }}>
      <div style={{ height: 32, display: "flex", alignItems: "flex-end", gap: 4, padding: "0 10px" }}>
        <div style={{ display: "flex", gap: 6, alignSelf: "center", marginRight: 8 }}>
          {["#ff6159", "#ffbd2e", "#28c941"].map((c, i) => (
            <span key={i} style={{ width: 10, height: 10, borderRadius: 5, background: c }} />
          ))}
        </div>
        <div style={{ height: 26, width: compact ? 150 : 210, borderRadius: "8px 8px 0 0", background: "#fff", display: "flex", alignItems: "center", gap: 7, padding: "0 10px", fontSize: 11.5, color: INK, whiteSpace: "nowrap", overflow: "hidden" }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: "#1A73E8" }} />
          Recruitment Portal · Apply
        </div>
      </div>
      <div style={{ height: 40, display: "flex", alignItems: "center", gap: 10, padding: "0 10px", background: "#fff" }}>
        <RotateCw size={14} color={FAINT} />
        <div style={{ flex: 1, height: 28, borderRadius: 99, background: SURFACE, display: "flex", alignItems: "center", gap: 7, padding: "0 12px", fontSize: 12.5, color: DIM, overflow: "hidden", whiteSpace: "nowrap" }}>
          <Lock size={11} />
          {compact ? "recruitment.example.gov/apply" : "recruitment.example.gov/application/step-3-documents"}
        </div>
        <Puzzle size={16} color={FAINT} />
        <div style={{ position: "relative", width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", background: f.iconPress > 0 || f.popupOpen ? "rgba(26,115,232,0.12)" : "transparent" }}>
          {f.iconPress > 0 && <span style={abs({ inset: -4, borderRadius: 12, border: "2px solid #1A73E8", opacity: f.iconPress, transform: `scale(${0.8 + f.iconPress * 0.3})` })} />}
          <ProMark size={20} />
        </div>
      </div>
    </div>
  );
}

function FormPage({ f, L, compact }: { f: Frame; L: Layout; compact: boolean }) {
  const o = f.pageIn;
  const field = (label: string, value: string, y: number) => (
    <div style={abs({ left: 20, right: 20, top: y })}>
      <div style={{ fontSize: 11, fontWeight: 700, color: DIM, marginBottom: 5 }}>{label}</div>
      <div style={{ height: 32, borderRadius: 8, border: `1px solid ${LINE}`, background: "#FFFFFF", display: "flex", alignItems: "center", padding: "0 10px", fontSize: 12.5, color: INK }}>{value}</div>
    </div>
  );
  const upX = L.upload.x - L.formX;
  const upY = L.upload.y - L.bar - L.formY;
  const state = f.accepted ? "ok" : f.picked ? "bad" : "idle";
  return (
    <div style={abs({ inset: 0, background: "linear-gradient(180deg,#FFFFFF,rgba(26,115,232,0.05))" })}>
      {!compact && (
        <div style={abs({ left: L.formX + L.formW + 36, top: 30, right: 370, opacity: o * 0.9 })}>
          {[64, 92, 78, 56].map((wd, i) => (
            <div key={i} style={{ height: 10, width: `${wd}%`, borderRadius: 5, background: "rgba(26,115,232,0.1)", marginBottom: 12 }} />
          ))}
        </div>
      )}
      <div
        style={abs({
          left: L.formX,
          top: L.formY,
          width: L.formW,
          height: 380,
          borderRadius: 14,
          background: "#fff",
          border: `1px solid ${LINE}`,
          boxShadow: "0 10px 30px rgba(26,115,232,0.06)",
          opacity: o,
          transform: `translateY(${(1 - o) * 12}px)`,
        })}
      >
        <div style={abs({ left: 20, top: 16, right: 20 })}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: "#1A73E8" }}>STEP 3 OF 4 · DOCUMENTS</div>
          <div style={{ fontSize: 17, fontWeight: 750, color: INK, marginTop: 3, letterSpacing: "-0.02em" }}>Online Application Form</div>
        </div>
        {field("Full name", "Priya Sharma", 72)}
        {!compact ? field("Date of birth", "14 / 08 / 2001", 136) : field("Roll number", "2026-11-4821", 136)}
        <div style={abs({ left: 20, right: 20, top: 198, fontSize: 11, fontWeight: 700, color: DIM })}>
          Photograph <span style={{ color: FAINT, fontWeight: 600 }}>· JPG, 20-50 KB, 200×230 px</span>
        </div>
        <div
          style={abs({
            left: upX - 0,
            top: upY,
            width: L.upload.w,
            height: L.upload.h,
            borderRadius: 10,
            border: `1.5px ${state === "idle" ? "dashed" : "solid"} ${state === "ok" ? OK : state === "bad" ? BAD : "#cbd2e1"}`,
            background: state === "ok" ? OK_SOFT : state === "bad" ? BAD_SOFT : "#fafbfe",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 12px",
            transform: `translateX(${f.shake}px)${state === "ok" ? ` scale(${0.97 + 0.03 * Math.min(1, f.acceptIn)})` : ""}`,
            boxShadow: state === "ok" ? `0 0 0 ${4 * (1 - f.burst)}px rgba(15,159,98,0.18)` : "none",
          })}
        >
          {f.picked ? <Portrait w={46} h={54} radius={6} /> : <div style={{ width: 46, height: 54, borderRadius: 6, border: `1.5px dashed rgba(26,115,232,0.35)` }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            {state === "idle" && <div style={{ fontSize: 12.5, color: DIM }}>No file chosen</div>}
            {state === "bad" && (
              <div style={{ opacity: f.errorIn }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: INK }}>IMG_2041.jpg · 4.2 MB</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: BAD, marginTop: 2 }}><X size={12} strokeWidth={3} />File too large. Photo must be 20-50 KB.</div>
              </div>
            )}
            {state === "ok" && (
              <div style={{ transform: `scale(${0.9 + 0.1 * Math.min(1, f.acceptIn)})`, transformOrigin: "left center" }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>IMG_2041-shrinkto.jpg · 48 KB</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 800, color: OK, marginTop: 2 }}><Check size={12} strokeWidth={3} />Accepted · 200×230 px</div>
              </div>
            )}
          </div>
          {!compact && (
            <div style={{ height: 30, padding: "0 12px", borderRadius: 8, border: `1px solid ${LINE}`, background: "#fff", display: "flex", alignItems: "center", fontSize: 11.5, fontWeight: 700, color: INK, flexShrink: 0 }}>
              Choose file
            </div>
          )}
        </div>
        <div
          style={abs({
            left: 20,
            top: 326,
            height: 36,
            width: 150,
            borderRadius: 9,
            background: f.accepted ? BLUE : "#c9d1df",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 750,
            boxShadow: `0 8px 24px rgba(26,115,232,${0.4 * f.submitGlow})`,
          })}
        >
          Submit application <ArrowRight size={14} />
        </div>
        {/* celebration sparks */}
        {f.burst > 0 && f.burst < 1 &&
          Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const d = 20 + f.burst * 70;
            return (
              <span
                key={i}
                style={abs({
                  left: upX + 34 + Math.cos(a) * d,
                  top: upY + 48 + Math.sin(a) * d,
                  width: 6,
                  height: 6,
                  borderRadius: i % 2 ? 2 : 6,
                  background: [BLUE, "#ff5fa2", "#ffaf00", "#00bd6f"][i % 4],
                  opacity: 1 - f.burst,
                  transform: `rotate(${i * 30 + f.burst * 180}deg)`,
                })}
              />
            );
          })}
      </div>
    </div>
  );
}

function Chip({ children, on, w }: { children: ReactNode; on?: boolean; w?: number | string }) {
  return (
    <span
      style={{
        height: 28,
        width: w,
        padding: w ? 0 : "0 10px",
        borderRadius: 8,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        fontSize: 11.5,
        fontWeight: 750,
        whiteSpace: "nowrap",
        background: on ? GRAD : SURFACE,
        color: on ? "#fff" : INK,
        border: on ? "1px solid transparent" : `1px solid ${LINE}`,
        boxShadow: on ? "0 6px 14px rgba(26,115,232,0.3)" : "none",
      }}
    >
      {children}
    </span>
  );
}

function Popup({ f, L }: { f: Frame; L: Layout }) {
  const s = f.popupIn;
  const target = f.presetOn ? "≤ 48 KB" : "≤ 100 KB";
  const saved = Math.round(99 * f.ring);
  return (
    <div
      style={abs({
        left: L.popupX,
        top: L.popupY - L.bar,
        width: L.popupW,
        borderRadius: 14,
        overflow: "hidden",
        background: "#FFFFFF",
        border: `1px solid ${LINE}`,
        boxShadow: "0 24px 60px rgba(26,115,232,0.28)",
        transform: `scale(${0.9 + s * 0.1})`,
        transformOrigin: "top right",
        opacity: Math.min(1, s * 1.4),
        zIndex: 5,
      })}
    >
      <div style={{ height: 44, display: "flex", alignItems: "center", gap: 8, padding: "0 12px" }}>
        <ProMark size={24} />
        <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.02em", color: INK }}>
          Shrink<span style={{ background: GRAD, WebkitBackgroundClip: "text", color: "transparent" }}>To</span>
        </span>
        <span style={{ height: 19, padding: "0 7px", borderRadius: 99, background: GRAD, color: "#fff", fontSize: 9.5, fontWeight: 800, display: "inline-flex", alignItems: "center" }}>PRO</span>
      </div>
      <div style={{ padding: "0 10px 10px", display: "grid", gap: 8 }}>
        <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${LINE}`, padding: "9px 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", color: FAINT }}>
            TARGET SIZE
            <span style={{ letterSpacing: 0, fontSize: 10, color: BLUE, background: GRAD_SOFT, padding: "1px 7px", borderRadius: 99 }}>{target}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5, marginTop: 7 }}>
            {["20 KB", "50 KB", "100 KB", "200 KB"].map((c) => (
              <Chip key={c} on={!f.presetOn && c === "100 KB"} w="100%">
                {c}
              </Chip>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, overflow: "hidden" }}>
          <span style={{ transform: `scale(${1 - f.presetPress * 0.06})` }}>
            <Chip on={f.presetOn}><SquareUser size={12} />Exam photo</Chip>
          </span>
          <Chip><PenLine size={12} />Signature</Chip>
          <Chip><Contact size={12} />Passport</Chip>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            background: "#fff",
            borderRadius: 12,
            border: `1px solid ${LINE}`,
            padding: 8,
            opacity: f.rowIn,
            transform: `translateY(${(1 - f.rowIn) * 10}px)`,
            minHeight: 62,
          }}
        >
          <Portrait w={42} h={46} radius={8} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 750, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              IMG_2041-shrinkto <span style={{ color: FAINT }}>.jpg</span>
            </div>
            <div style={{ fontSize: 10.5, color: DIM, marginTop: 1, fontVariantNumeric: "tabular-nums" }}>
              <span style={{ textDecoration: "line-through", color: FAINT }}>4.2 MB</span> <ArrowRight size={9} style={{ display: "inline", verticalAlign: "-1px" }} /> <b style={{ color: INK }}>{f.shrinkP > 0 ? fmtBytes(f.bytes) : "…"}</b>
              {f.shrinkP >= 1 && " · 200×230"}
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 4, transform: `scale(${Math.max(0, f.tags)})`, transformOrigin: "left center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 4, background: OK_SOFT, color: OK }}><Check size={9} strokeWidth={3.2} />20-50 KB range</span>
              <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 4, background: SURFACE, color: DIM }}>Q92</span>
            </div>
          </div>
          <div style={{ position: "relative", width: 40, height: 40, borderRadius: 20, background: `conic-gradient(${OK} ${saved}%, rgba(26,115,232,0.08) 0)`, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <span style={{ position: "absolute", inset: 4, borderRadius: 16, background: "#fff" }} />
            <span style={{ position: "relative", fontSize: 9.5, fontWeight: 800, color: OK }}>-{saved}%</span>
          </div>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              display: "grid",
              placeItems: "center",
              background: f.saved ? OK_SOFT : f.savePress ? GRAD : SURFACE,
              color: f.saved ? OK : f.savePress ? "#fff" : BLUE,
              border: `1px solid ${LINE}`,
              fontWeight: 900,
              fontSize: 14,
              flexShrink: 0,
              transform: `scale(${1 - f.savePress * 0.08})`,
            }}
          >
            {f.saved ? <Check size={15} strokeWidth={3} /> : <Download size={15} strokeWidth={2.4} />}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 9.5, color: FAINT, fontWeight: 600 }}><ShieldCheck size={11} color={OK} />100% on-device · nothing uploaded</div>
      </div>
    </div>
  );
}

function Compare({ f, L, compact }: { f: Frame; L: Layout; compact: boolean }) {
  if (f.cmpIn <= 0) return null;
  const w = compact ? L.formW : 470;
  const h = compact ? 300 : 330;
  const left = compact ? L.formX : L.formX + 40;
  return (
    <div
      style={abs({
        left,
        top: 30,
        width: w,
        height: h,
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 30px 80px rgba(26,115,232,0.3)",
        opacity: f.cmpIn,
        transform: `translateY(${(1 - f.cmpIn) * 18}px) scale(${0.96 + 0.04 * f.cmpIn})`,
        zIndex: 6,
      })}
    >
      <div style={{ height: 38, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", borderBottom: `1px solid ${LINE}`, fontSize: 12, fontWeight: 750, color: INK }}>
        IMG_2041-shrinkto.jpg
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600, color: DIM, fontSize: 11 }}>4.2 MB <ArrowRight size={11} /> 48 KB</span>
      </div>
      <div style={{ position: "relative", height: h - 38, background: "rgba(26,115,232,0.08)" }}>
        <div style={abs({ inset: 0, display: "grid", placeItems: "center" })}>
          <Portrait w={(h - 38) * 0.78} h={h - 38} radius={0} />
        </div>
        <div style={abs({ inset: 0, display: "grid", placeItems: "center", clipPath: `inset(0 ${100 - f.slider * 100}% 0 0)`, filter: "saturate(1.04)" })}>
          <Portrait w={(h - 38) * 0.78} h={h - 38} radius={0} />
        </div>
        <div style={abs({ top: 0, bottom: 0, left: `${f.slider * 100}%`, width: 2, marginLeft: -1, background: "#fff", boxShadow: "0 0 12px rgba(26,115,232,0.35)" })}>
          <span style={abs({ top: "50%", left: "50%", width: 34, height: 34, marginLeft: -17, marginTop: -17, borderRadius: 17, background: "#fff", boxShadow: "0 4px 14px rgba(26,115,232,0.35)", display: "grid", placeItems: "center", color: BLUE })}><ChevronsLeftRight size={18} strokeWidth={2.5} /></span>
        </div>
        <span style={abs({ left: 10, top: 10, padding: "3px 8px", borderRadius: 7, background: "rgba(14,21,37,0.66)", color: "#FFFFFF", fontSize: 10.5, fontWeight: 750 })}>Original · 4.2 MB</span>
        <span style={abs({ right: 10, top: 10, padding: "3px 8px", borderRadius: 7, background: "#1A73E8", color: "#fff", fontSize: 10.5, fontWeight: 750 })}>ShrinkTo · 48 KB</span>
      </div>
    </div>
  );
}

function FlyingFile({ f, L }: { f: Frame; L: Layout }) {
  if (f.fly < 0) return null;
  const from = { x: L.rowThumb.x, y: L.rowThumb.y - L.bar };
  const to = { x: L.upload.x + 34, y: L.upload.y - L.bar + 48 };
  const x = lerp(from.x, to.x, f.fly);
  const y = lerp(from.y, to.y, f.fly) - Math.sin(f.fly * Math.PI) * 80;
  return (
    <div style={abs({ left: x - 26, top: y - 18, zIndex: 8, transform: `rotate(${(1 - f.fly) * -8}deg) scale(${1 - f.fly * 0.2})` })}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 9px 5px 5px", borderRadius: 10, background: "#fff", boxShadow: "0 14px 34px rgba(26,115,232,0.3)", fontSize: 11, fontWeight: 750, color: INK, whiteSpace: "nowrap" }}>
        <Portrait w={24} h={28} radius={5} />
        48 KB
      </div>
    </div>
  );
}

function Cursor({ f, L, w }: { f: Frame; L: Layout; w: number }) {
  const u = f.u;
  const o = Math.max(
    r(u, 0.8, 1.1) * (1 - r(u, 2.3, 2.6)),
    r(u, 3.0, 3.3) * (1 - r(u, 6.0, 6.3)),
    r(u, 13.5, 13.7) * (1 - r(u, 14.3, 14.6)),
  );
  if (o <= 0) return null;
  const p = path(u, [
    [0.8, { x: w * 0.3, y: L.h * 0.85 }],
    [1.5, L.chooseBtn],
    [3.0, { x: w * 0.55, y: L.h * 0.7 }],
    [3.7, L.icon],
    [4.6, { x: L.popupX + 80, y: L.popupY + 260 }],
    [5.25, L.preset],
    [6.0, { x: L.popupX + 120, y: L.popupY + 300 }],
    [13.5, { x: L.popupX + 150, y: L.popupY + 300 }],
    [13.95, L.saveBtn],
  ]);
  return (
    <div style={abs({ left: p.x, top: p.y, opacity: o, zIndex: 10, transform: `scale(${f.cursorDown ? 0.86 : 1})`, transformOrigin: "0 0" })}>
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path d="M4.04 4.66a.5.5 0 0 1 .62-.62l15.5 5.5a.5.5 0 0 1-.04.95l-6.34 1.56a2 2 0 0 0-1.47 1.47l-1.56 6.34a.5.5 0 0 1-.95.04z" fill={INK} stroke="#fff" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function Window({ f, w, h, compact }: { f: Frame; w: number; h: number; compact: boolean }) {
  const L = layout(w, h, compact);
  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        borderRadius: 16,
        background: "#fff",
        overflow: "hidden",
        boxShadow: "0 30px 80px rgba(20,30,70,0.16), 0 0 0 1px rgba(20,30,70,0.08)",
      }}
    >
      <BrowserBar f={f} compact={compact} />
      <div style={abs({ left: 0, right: 0, top: L.bar, bottom: 0, overflow: "hidden" })}>
        <FormPage f={f} L={L} compact={compact} />
        <Compare f={f} L={L} compact={compact} />
        {f.popupOpen && <Popup f={f} L={L} />}
        <FlyingFile f={f} L={L} />
      </div>
      <Cursor f={f} L={L} w={w} />
    </div>
  );
}

const LABEL =
  "How ShrinkTo works: an exam form rejects a 4.2 MB photo, you open ShrinkTo and tap the Exam photo preset, it shrinks the photo to 48 KB at 200 by 230 pixels on your device, a before and after slider shows no visible difference, and the form accepts the upload.";

function Stage({ W, H, winW, winH, compact }: { W: number; H: number; winW: number; winH: number; compact: boolean }) {
  const { wrapRef, t, k, fitted } = useStageClock(W, STILL_T, FIRST_T);
  const f = frameAt(t);
  return (
    <div ref={wrapRef} role="img" aria-label={LABEL} style={{ position: "relative", width: "100%", aspectRatio: `${W} / ${H}`, overflow: stageClip(fitted) }}>
      <div aria-hidden style={abs({ left: 0, top: 0, width: W, height: H, transform: `scale(${k})`, transformOrigin: "0 0", opacity: f.fade })}>
        <Rail f={f} compact={compact} />
        <Caption f={f} compact={compact} />
        <div style={abs({ left: (W - winW) / 2, top: compact ? 140 : 118 })}>
          <Window f={f} w={winW} h={winH} compact={compact} />
        </div>
      </div>
    </div>
  );
}

export function ExtensionHeroAnimation({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="stage-landscape">
        <Stage W={1080} H={620} winW={1068} winH={492} compact={false} />
      </div>
      <div className="stage-portrait">
        <Stage W={400} H={700} winW={392} winH={550} compact />
      </div>
    </div>
  );
}
