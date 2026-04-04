export const safeToDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === "string") {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) return d;
  }
  if (timestamp?.toDate) return timestamp.toDate();
  if (timestamp?.seconds)
    return new Date(
      timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000,
    );
  if (typeof timestamp === "number") return new Date(timestamp);
  return new Date();
};

export const formatDate = (timestamp: any, lang: string) => {
  const date = safeToDate(timestamp);
  return date.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatRelativeTime = (timestamp: any, lang: string) => {
  const date = safeToDate(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return lang === "en" ? "Just now" : "இப்போது";
    return lang === "en"
      ? `${diffMins} minutes ago`
      : `${diffMins} நிமிடங்களுக்கு முன்பு`;
  }
  if (diffHours < 24)
    return lang === "en"
      ? `${diffHours} hours ago`
      : `${diffHours} மணி நேரம் முன்பு`;
  const diffDays = Math.floor(diffHours / 24);
  return lang === "en"
    ? `${diffDays} days ago`
    : `${diffDays} நாட்களுக்கு முன்பு`;
};
