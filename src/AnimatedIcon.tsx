import { MorphIcon } from "morphicons/react";
import { Bell, X, Plus, Eye, EyeOff, User, Pin, PinOff, ChevronDown, ChevronUp, Filter, Check, Menu } from "lucide";

const shapes = { bell: Bell, close: X, plus: Plus, eye: Eye, eyeOff: EyeOff, user: User,
  pin: Pin, pinOff: PinOff, down: ChevronDown, up: ChevronUp, filter: Filter, check: Check, menu: Menu };

type Props = { name: keyof typeof shapes; className?: string; strokeWidth?: number };

export default function AnimatedIcon({ name, className = "w-5 h-5", strokeWidth = 1.8 }: Props) {
  return <MorphIcon icon={shapes[name]} className={className} strokeWidth={strokeWidth}
    spring="smooth" reducedMotion="user" data-animated-icon={name} />;
}
