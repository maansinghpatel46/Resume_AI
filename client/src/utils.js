export const EMAIL_RE = /^\S+@\S+\.\S+$/;

// 'YYYY-MM' -> 'Jan 2024'
export const fmtMonth = (v) => {
  if (!v) return "";
  const [y, m] = v.split("-");
  if (!y) return "";
  if (!m) return y;
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });
};

export const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(d).toLocaleDateString();
};
