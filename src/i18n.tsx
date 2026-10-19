import { Fragment, useSyncExternalStore, type ReactNode } from "react";
import ms from "./locales/ms.json";
export type AppLanguage = "en" | "ms";
const listeners = new Set<() => void>();
let language: AppLanguage = (() => { try { return localStorage.getItem("bingo_language") === "ms" ? "ms" : "en"; } catch { return "en"; } })();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function useAppLanguage() { return useSyncExternalStore(subscribe, () => language, () => "en" as AppLanguage); }
export function setAppLanguage(next: AppLanguage) {
  language = next;
  try { localStorage.setItem("bingo_language", next); } catch { /* Language still works without browser storage. */ }
  document.documentElement.lang = next === "ms" ? "ms" : "en";
  listeners.forEach(listener => listener());
}
export function currentLocale(englishLocale = "en-MY") { return language === "ms" ? "ms-MY" : englishLocale; }
const dictionary = ms as Record<string, string>;
const phrases = Object.keys(dictionary).filter(key => key.length > 1).sort((a,b) => b.length-a.length);
const escaped = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const matcher = new RegExp(phrases.map(escaped).join("|"), "g");
export function localizeText<T>(value: T): T {
  if (language === "ms" && Array.isArray(value)) return value.map(item => localizeText(item)) as T;
  if (language !== "ms" || typeof value !== "string" || !value.trim()) return value;
  const leading = value.match(/^\s*/)?.[0] || "", trailing = value.match(/\s*$/)?.[0] || "";
  const clean = value.trim();
  if (dictionary[clean]) return (leading + dictionary[clean] + trailing) as T;
  // Longest phrases first; only translate complete words, never substrings of names/IDs.
  return value.replace(/\b(\d{1,2})(:\d{2})?\s*(AM|PM)\b/g, (_, hour, minutes, period) => {
    const h=Number(hour); const suffix=period === "AM" ? (h === 12 ? "tengah malam" : "pagi") : h === 12 || h === 1 ? "tengah hari" : h < 7 ? "petang" : "malam";
    return `${hour}${minutes || ""} ${suffix}`;
  }).replace(matcher, (match, offset: number, full: string) => {
    if (/[\p{L}\p{N}_]/u.test(full[offset-1] || "") || /[\p{L}\p{N}_]/u.test(full[offset+match.length] || "")) return match;
    return dictionary[match];
  }) as T;
}
function localizeNode(node: ReactNode): ReactNode {
  if (typeof node === "string") return localizeText(node);
  if (Array.isArray(node)) return node.map((item,index) => <Fragment key={index}>{localizeNode(item)}</Fragment>);
  return node;
}
/** Text-only localization: renders no DOM element and never changes stored values or event handlers. */
export function L({children}: {children?: ReactNode}) { useAppLanguage(); return <>{localizeNode(children)}</>; }
