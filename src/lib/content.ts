export const formatDate = (date: Date) => date.toLocaleDateString("en", {
  year: "numeric",
  month: "short",
  day: "2-digit"
});

export const sortByDate = <T extends { data: { date: Date } }>(entries: T[]) =>
  [...entries].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
