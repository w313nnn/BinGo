import { localizeText } from "./i18n";
import { useEffect, useState } from "react";
export function greetingForHour(hour: number) {
  return hour >= 5 && hour < 12 ? "Good morning" : hour >= 12 && hour < 18 ? "Good afternoon" : "Good evening";
}
export default function Greeting() {
  const [hour, setHour] = useState(() => new Date().getHours());
  useEffect(() => {
    const refresh = () => { if (!document.hidden) setHour(new Date().getHours()); };
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("focus", refresh); };
  }, []);
  return <>{localizeText(greetingForHour(hour))},</>;
}
