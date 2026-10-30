import { localizeText } from "./i18n";


export default function FlowStepper({ current, steps, reachable = current, disabled = false, onStepSelect }: {
  disabled?: boolean; current: number; steps: string[]; reachable?: number; onStepSelect?: (step: number) => void;
}) {

  const finished = current === steps.length;
  return <ol className="flow-stepper" aria-label={localizeText("Progress")}>
    {localizeText(steps.map((label, index) => {
      const step = index + 1, active = step === current, done = step < current;
      const available = !disabled && !active && step <= reachable && step < steps.length && !finished && !!onStepSelect;
      return <li key={label} style={{ flex: active ? 3.1 : 1 }}
        className={active ? "flow-step active" : "flow-step"}>
        <button type="button" disabled={!available} onClick={() => onStepSelect?.(step)}
          aria-current={active ? "step" : undefined}
          aria-label={localizeText(`${available ? "Go to " : ""}Step ${step}: ${label}${done ? ", complete" : ""}`)}>
          <span className="flow-step-number">{localizeText(step)}</span>
          {localizeText(active && <span className="flow-step-label">{localizeText(label)}</span>)}
        </button>
      </li>;
    }))}
  </ol>;
}
