import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { differenceInDays } from "date-fns";
import { useMission } from "@/lib/mission/store";
import { fmtINR } from "@/lib/mission/format";
import { Modal, Field } from "./Modal";

function NeuCard({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="neu p-7"
    >
      <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-5">
        {title}
      </div>
      {children}
    </motion.div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`text-display tabular-nums ${
          accent ? "text-3xl text-foreground" : "text-lg text-foreground/80"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Radial({
  pct,
  label,
  sub,
  onClick,
}: {
  pct: number;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  const size = 320;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct);

  return (
    <button
      onClick={onClick}
      className="group relative mx-auto block focus:outline-none"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-3 rounded-full neu" />
      <svg width={size} height={size} className="relative -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="white"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: off }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: "drop-shadow(0 0 18px rgba(255,255,255,0.35))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Mission
        </div>
        <div className="text-display text-7xl text-foreground mt-1 tabular-nums">
          {Math.round(pct * 100)}
          <span className="text-2xl text-muted-foreground align-top ml-1">%</span>
        </div>
        <div className="text-xs text-foreground/80 mt-2">{label}</div>
        <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-[0.3em]">
          {sub}
        </div>
        <div className="text-[10px] text-muted-foreground/60 mt-4 uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition">
          Tap to edit
        </div>
      </div>
    </button>
  );
}

export function Financial() {
  const m = useMission();
  const [open, setOpen] = useState(false);

  const remainingRev = Math.max(0, m.revenueTarget - m.currentRevenue);
  const remainingClients = Math.max(0, m.clientTarget - m.currentClients);

  const daysRemaining = useMemo(
    () => Math.max(1, differenceInDays(new Date(m.missionTarget), new Date())),
    [m.missionTarget],
  );
  // 30-day pace for ₹1L mission feels right too — we surface both.
  const days30 = 30;

  const reqPerDay = remainingRev / days30;
  const reqPerWeek = reqPerDay * 7;
  const reqPerMonth = reqPerDay * 30;

  const closeRate = m.coldCalls > 0 ? (m.dealsClosed / m.coldCalls) * 100 : 0;
  const followUpRate = m.coldCalls > 0 ? (m.followUps / m.coldCalls) * 100 : 0;
  const clientsPerMonth = Math.ceil(remainingClients / Math.max(1, days30 / 30));
  const callsPerDay = Math.ceil(remainingClients / Math.max(1, days30) / Math.max(0.05, closeRate / 100 || 0.1));

  const revPct = m.revenueTarget > 0 ? m.currentRevenue / m.revenueTarget : 0;
  const status =
    revPct >= 0.5 ? "ON TRACK" : revPct >= 0.2 ? "AT RISK" : "OFF TRACK";
  const statusColor =
    status === "ON TRACK"
      ? "text-success"
      : status === "AT RISK"
        ? "text-warning"
        : "text-danger";

  return (
    <section className="relative min-h-screen w-full py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-16">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">
              02 · Financial Mission
            </div>
            <h2 className="text-display text-5xl md:text-7xl text-foreground">
              ₹1,00,000 <span className="text-muted-foreground">in 30 days.</span>
            </h2>
          </div>
          <div className={`text-display text-2xl tracking-widest ${statusColor}`}>
            ● {status}
          </div>
        </div>

        {/* Top grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          <NeuCard title="Revenue Goal" delay={0}>
            <Row label="Target" value={fmtINR(m.revenueTarget)} />
            <Row label="Current" value={fmtINR(m.currentRevenue)} accent />
            <Row label="Remaining" value={fmtINR(remainingRev)} />
          </NeuCard>
          <NeuCard title="Client Goal" delay={0.1}>
            <Row label="Target" value={`${m.clientTarget}`} />
            <Row label="Current" value={`${m.currentClients}`} accent />
            <Row label="Remaining" value={`${remainingClients}`} />
          </NeuCard>
          <NeuCard title="Sales Activity" delay={0.2}>
            <Row label="Cold Calls" value={`${m.coldCalls}`} />
            <Row label="Follow Ups" value={`${m.followUps}`} />
            <Row label="Deals Closed" value={`${m.dealsClosed}`} />
            <Row label="Close Rate" value={`${closeRate.toFixed(1)}%`} />
            <Row label="Follow-up Rate" value={`${followUpRate.toFixed(1)}%`} />
          </NeuCard>
        </div>

        {/* Radial + Pace */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-12 items-center">
          <Radial
            pct={revPct}
            label={`${fmtINR(m.currentRevenue)} / ${fmtINR(m.revenueTarget)}`}
            sub={`${m.currentClients} / ${m.clientTarget} clients`}
            onClick={() => setOpen(true)}
          />

          <div className="neu p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                Required Pace Engine
              </div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {daysRemaining.toLocaleString()} days to 2029 · 30-day sprint
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              <Stat label="Revenue Remaining" value={fmtINR(remainingRev)} />
              <Stat label="Days Remaining" value={`${days30}`} />
              <Stat label="Per Day" value={fmtINR(reqPerDay)} />
              <Stat label="Per Week" value={fmtINR(reqPerWeek)} />
              <Stat label="Per Month" value={fmtINR(reqPerMonth)} />
              <Stat label="Clients Needed" value={`${remainingClients}`} />
              <Stat label="Clients / Month" value={`${clientsPerMonth}`} />
              <Stat label="Cold Calls / Day" value={`${callsPerDay}`} />
              <Stat label="Close Rate" value={`${closeRate.toFixed(1)}%`} />
            </div>
          </div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit Mission">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Revenue Target"
            type="number"
            prefix="₹"
            value={m.revenueTarget}
            onChange={(v) => m.setField("revenueTarget", +v)}
          />
          <Field
            label="Current Revenue"
            type="number"
            prefix="₹"
            value={m.currentRevenue}
            onChange={(v) => m.setField("currentRevenue", +v)}
          />
          <Field
            label="Client Target"
            type="number"
            value={m.clientTarget}
            onChange={(v) => m.setField("clientTarget", +v)}
          />
          <Field
            label="Current Clients"
            type="number"
            value={m.currentClients}
            onChange={(v) => m.setField("currentClients", +v)}
          />
          <Field
            label="Cold Calls"
            type="number"
            value={m.coldCalls}
            onChange={(v) => m.setField("coldCalls", +v)}
          />
          <Field
            label="Follow Ups"
            type="number"
            value={m.followUps}
            onChange={(v) => m.setField("followUps", +v)}
          />
          <Field
            label="Deals Closed"
            type="number"
            value={m.dealsClosed}
            onChange={(v) => m.setField("dealsClosed", +v)}
          />
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={() => setOpen(false)}
            className="rounded-full bg-white text-black px-6 py-2.5 text-sm font-medium hover:bg-white/90 transition"
          >
            Save
          </button>
        </div>
      </Modal>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="neu-inset p-4">
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </div>
      <div className="text-display text-2xl text-foreground mt-2 tabular-nums">{value}</div>
    </div>
  );
}