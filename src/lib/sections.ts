import site from "../content/site.json";

export type SectionKey = "writeups" | "projects" | "notes" | "labs" | "research" | "about" | "contact";
export type ContentSectionKey = "writeups" | "projects" | "notes" | "labs" | "research";

type SectionCounts = Partial<Record<ContentSectionKey, number>>;
type SectionSetting = {
  enabled?: boolean;
  requireContent?: boolean;
};

const sectionSettings = site.sections as Record<SectionKey, SectionSetting>;

export const navigationSections: Array<{ key: SectionKey | "home"; label: string; href: string }> = [
  { key: "home", label: "Home", href: "/" },
  { key: "writeups", label: "Writeups", href: "/writeups/" },
  { key: "projects", label: "Projects", href: "/projects/" },
  { key: "notes", label: "Notes", href: "/notes/" },
  { key: "labs", label: "Labs", href: "/labs/" },
  { key: "research", label: "Research", href: "/research/" },
  { key: "about", label: "About", href: "/about/" },
  { key: "contact", label: "Contact", href: "/contact/" }
];

export const isContentSection = (key: SectionKey | "home"): key is ContentSectionKey =>
  ["writeups", "projects", "notes", "labs", "research"].includes(key);

export const isSectionAvailable = (key: SectionKey, counts: SectionCounts = {}) => {
  const setting = sectionSettings[key] ?? {};
  if (setting.enabled === false) return false;
  if (setting.requireContent && isContentSection(key)) return (counts[key] ?? 0) > 0;
  return true;
};

export const getNavigationLinks = (counts: SectionCounts = {}) =>
  navigationSections.filter((section) => section.key === "home" || isSectionAvailable(section.key, counts));
