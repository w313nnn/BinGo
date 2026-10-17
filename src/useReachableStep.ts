import { useEffect, useRef, useState } from "react";

/** Returning to an unchanged step keeps progress; editing invalidates later steps. */
export default function useReachableStep(current: number, last: number, session: string, answers: string, open: boolean) {
  const [reached, setReached] = useState(current);
  const previous = useRef({ session, answers, current, open });
  useEffect(() => {
    const old = previous.current;
    const reset = !open || current === 0 || session !== old.session || !old.open || (old.current === last && current < last);
    setReached(value => reset || answers !== old.answers ? current : Math.max(value, current));
    previous.current = { session, answers, current, open };
  }, [current, last, session, answers, open]);
  return Math.min(last - 1, Math.max(current, reached));
}
