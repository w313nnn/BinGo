import {useEffect, useRef, useState, type KeyboardEvent} from "react";
import {motion, useReducedMotion} from "motion/react";
import {Bell, BellOff, Check, ChevronDown, Clock, Recycle, X} from "lucide-react";

type Option = {id: string; label: string};
type Props = {title: string; subtitle: string; collection: string; zone: string; options: Option[];
  value: string; enabled: boolean; closeLabel: string; removeLabel: string;
  onClose: () => void; onSave: (value: string) => void; onRemove: () => void;};

export default function ReminderDialog({title, subtitle, collection, zone, options, value, enabled,
  closeLabel, removeLabel, onClose, onSave, onRemove}: Props) {
  const [draft, setDraft] = useState((options.some(option => option.label === value) ? value : "") || options.find(o => o.id === "1h")?.label || options[0]?.label || "");
  const [choosing, setChoosing] = useState(false);
  const previousDraft = useRef(draft);
  const cancelChoice = () => {setDraft(previousDraft.current); setChoosing(false);};
  const sheet = useRef<HTMLElement>(null), picker = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const previousChoosing = useRef(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    heading.current?.focus();
    return () => {if (previous?.isConnected) previous.focus();};
  }, []);
  useEffect(() => {
    if (choosing) (picker.current?.querySelector<HTMLButtonElement>('button[aria-checked="true"]') || picker.current?.querySelector<HTMLButtonElement>('button'))?.focus();
    else if (previousChoosing.current) trigger.current?.focus();
    previousChoosing.current = choosing;
  }, [choosing]);
  function keys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {event.preventDefault(); event.stopPropagation(); choosing ? cancelChoice() : onClose(); return;}
    if (event.key !== "Tab") return;
    const active = choosing ? picker.current : sheet.current;
    const controls = Array.from(active?.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), [tabindex="0"], summary') || []).filter(control => control.tabIndex >= 0);
    const first = controls[0], last = controls[controls.length - 1];
    if (!first) {event.preventDefault(); return;}
    if (event.shiftKey && (document.activeElement === first || document.activeElement === heading.current)) {event.preventDefault(); last.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
  }
  return <div className="reminder-overlay" onKeyDown={keys}>
    <div className="reminder-backdrop" onClick={onClose} />
    <motion.section ref={sheet} role="dialog" aria-modal={!choosing || undefined} aria-labelledby="reminder-title"
      inert={choosing} aria-hidden={choosing || undefined} className="reminder-sheet"
      initial={{y: reduced ? 0 : 30, opacity: 0}} animate={{y: 0, opacity: 1}} exit={{y: reduced ? 0 : 20, opacity: 0}}
      transition={{duration: reduced ? 0 : .22, ease: "easeOut"}}>
      <div className="reminder-heading"><div><span className="reminder-eyebrow"><Bell size={13} /> Collection</span>
        <h2 ref={heading} tabIndex={-1} id="reminder-title">{title}</h2></div>
        <button type="button" className="icon-button reminder-close" aria-label={closeLabel} onClick={onClose}><X size={18} /></button></div>
      <p className="reminder-subtitle">{subtitle}</p>
      <div className="reminder-collection"><span className="reminder-collection-icon"><Recycle size={21} /></span>
        <div><strong>{collection}</strong><p>{zone}</p></div></div>
      <label className="reminder-field-label" htmlFor="reminder-time-trigger">Notify me</label>
      <button ref={trigger} id="reminder-time-trigger" type="button" aria-haspopup="dialog" aria-expanded={choosing}
        className="reminder-time-trigger" onClick={() => {previousDraft.current = draft; setChoosing(true);}}><Clock size={19} /><strong>{draft || "Choose a time"}</strong><ChevronDown size={17} /></button>
      <button type="button" className="reminder-save" disabled={!draft} onClick={() => onSave(draft)}>{enabled ? "Save changes" : "Save reminder"}</button>
      {enabled && <button type="button" className="reminder-remove" onClick={onRemove}><BellOff size={15} />{removeLabel}</button>}
      <details className="reminder-note"><summary>About reminders</summary><p>This saves your timing preference for this session. Background notifications are not connected yet.</p></details>
    </motion.section>
    {choosing && <div className="reminder-time-overlay"><div className="reminder-backdrop" onClick={cancelChoice} />
      <motion.section ref={picker} role="dialog" aria-modal="true" aria-labelledby="reminder-time-title" className="reminder-time-popup"
        initial={{y: reduced ? 0 : 16, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{duration: reduced ? 0 : .18}}>
        <div className="reminder-heading"><div><span className="reminder-eyebrow">Before collection</span><h3 id="reminder-time-title">Choose a time</h3></div>
          <button type="button" className="icon-button reminder-close" aria-label="Close time choices" onClick={cancelChoice}><X size={18} /></button></div>
        <div className="reminder-time-options" role="radiogroup" aria-label="Reminder timing">{options.map((option, index) => <button key={option.id} type="button"
          role="radio" tabIndex={draft === option.label ? 0 : -1} aria-checked={draft === option.label} className="reminder-time-option" onClick={() => {setDraft(option.label); setChoosing(false);}}
          onKeyDown={event => {if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
            setDraft(options[next].label);
            picker.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
          }}}><span>{option.label}</span>{option.id === "1h" && <small>Suggested</small>}{draft === option.label ? <Check size={18} /> : <span className="reminder-radio" />}</button>)}</div>
      </motion.section></div>}
  </div>;
}
