export const fmtINR = (n: number) => {
  if (!isFinite(n)) return "₹0";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.round(n));
  // Indian numbering format
  const s = abs.toString();
  let lastThree = s.slice(-3);
  const otherNumbers = s.slice(0, -3);
  const formatted =
    (otherNumbers ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," : "") + lastThree;
  return `${sign}₹${formatted}`;
};

export const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));

export const pct = (a: number, b: number) => (b <= 0 ? 0 : clamp(a / b));