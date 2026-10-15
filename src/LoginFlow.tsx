import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Shield, X, Lock, CheckCircle2, Mail, User, Phone, Eye, EyeOff, Leaf, Recycle,
  ChevronDown, Check, Info, Globe, Sparkles, MapPin, ExternalLink,
} from "lucide-react";
import { getDeviceAccounts, saveDeviceAccount, removeDeviceAccount, DEFAULT_GOOGLE_ACCOUNTS, UserAccount } from "./appData";
import { auth, googleProvider, syncUserProfileToDb } from "./firebase";
import { signInWithPopup } from "firebase/auth";

type AuthScreen = "login" | "otp" | "forgot" | "forgot-sent" | "register" | "register-otp";

const GoogleIcon = ({ size = 5 }: { size?: number }) => (
  <svg className={`w-${size} h-${size} shrink-0`} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[420px] mx-auto min-h-screen sm:min-h-[850px] sm:max-h-[96vh] sm:h-[850px] bg-[#F8FAF9] sm:rounded-[2.8rem] sm:border-[8px] sm:border-slate-900 shadow-2xl overflow-hidden flex flex-col relative select-none ring-1 ring-slate-900/10">
      {/* Mobile Top Dynamic Island / Speaker Pill on Desktop */}
      <div className="hidden sm:flex justify-center pt-2 pb-1 bg-[#133E26] shrink-0">
        <div className="w-24 h-4 bg-black/70 rounded-full flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
        </div>
      </div>
      {children}
      {/* Mobile Bottom Home Bar Indicator */}
      <div className="hidden sm:block py-1.5 bg-slate-50 shrink-0">
        <div className="w-28 h-1 bg-slate-900/20 rounded-full mx-auto" />
      </div>
    </div>
  );
}

function AuthHero() {
  return (
    <div
      className="shrink-0 relative overflow-hidden pt-6 pb-5 px-6"
      style={{
        background: "linear-gradient(145deg, #133E26 0%, #15803D 60%, #16A34A 100%)",
      }}
    >
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 blur-xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-emerald-400/10 blur-lg pointer-events-none" />

      {/* Mobile Status Bar Simulation */}
      <div className="flex items-center justify-between text-white/80 text-[11px] font-semibold mb-3 px-1">
        <span>9:41</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] tracking-wider">5G</span>
          <div className="w-4 h-2 border border-white/80 rounded-xs p-0.5 flex items-center">
            <div className="w-full h-full bg-white rounded-2xs" />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center text-center">
        <motion.div
          className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-2 border border-emerald-100"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative">
            <Leaf className="w-7 h-7 text-emerald-700" strokeWidth={2.2} />
            <Recycle className="w-3.5 h-3.5 text-emerald-500 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" strokeWidth={2.5} />
          </div>
        </motion.div>

        <h1 className="text-white text-2xl font-bold tracking-tight flex items-center gap-1 font-sans">
          <span>Bin</span>
          <span className="text-amber-300 font-extrabold">Go</span>
        </h1>
        <p className="text-emerald-100/90 text-xs font-medium mt-0.5">
          Residential Waste &amp; Recycling Assistant
        </p>
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 mb-4 text-slate-600 hover:text-slate-900 transition-colors w-fit">
      <ArrowLeft className="w-4 h-4" strokeWidth={2} />
      <span className="text-xs font-semibold">Back</span>
    </button>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-[11px] text-slate-400 font-medium tracking-wider">OR</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

function GoogleButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2.5 bg-white border border-slate-200 hover:border-emerald-600 hover:bg-slate-50/80 rounded-xl py-3 text-xs font-semibold text-slate-700 shadow-xs transition-all active:scale-[0.99] group disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        <GoogleIcon size={4} />
      )}
      <span className="group-hover:text-slate-900">
        {loading ? "Connecting with Google..." : "Continue with Google"}
      </span>
    </button>
  );
}

export default function LoginFlow({ onDone }: { onDone: (isAdmin?: boolean, displayName?: string) => void }) {
  const [screen, setScreen] = useState<AuthScreen>("login");
  const [tab, setTab] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [regOtpCountdown, setRegOtpCountdown] = useState(60);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPw, setRegConfirmPw] = useState("");
  const [regShowPw, setRegShowPw] = useState(false);
  const [regShowConfirmPw, setRegShowConfirmPw] = useState(false);
  const [regNameError, setRegNameError] = useState("");
  const [regEmailError, setRegEmailError] = useState("");
  const [regPhoneError, setRegPhoneError] = useState("");
  const [regPasswordError, setRegPasswordError] = useState("");
  const [regConfirmPwError, setRegConfirmPwError] = useState("");
  const [regOtp, setRegOtp] = useState(["", "", "", "", "", ""]);
  const [regOtpError, setRegOtpError] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [termsAttempted, setTermsAttempted] = useState(false);

  // Real Google OAuth & Dynamic Device Account State
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [isAddingAnotherAccount, setIsAddingAnotherAccount] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState("");
  const [googleModalError, setGoogleModalError] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [deviceAccounts, setDeviceAccounts] = useState<UserAccount[]>(() => {
    return getDeviceAccounts().filter(a => !a.email?.toLowerCase().includes("1utar.my"));
  });

  function handleOtpChange(val: string, i: number, arr: string[], setArr: (v: string[]) => void, setErr: (v: boolean) => void, prefix: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...arr]; next[i] = val; setArr(next); setErr(false);
    if (val && i < 5) (document.getElementById(`${prefix}-${i + 1}`) as HTMLInputElement)?.focus();
  }

  function handleOtpKey(e: React.KeyboardEvent<HTMLInputElement>, i: number, arr: string[], prefix: string) {
    if (e.key === "Backspace" && !arr[i] && i > 0)
      (document.getElementById(`${prefix}-${i - 1}`) as HTMLInputElement)?.focus();
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bingo_remember");
      if (saved) {
        const { email: e, password: p } = JSON.parse(saved);
        setEmail(e ?? ""); setPassword(p ?? ""); setRememberMe(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (screen !== "otp") return;
    setOtpCountdown(60);
    const t = setInterval(() => setOtpCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
    return () => clearInterval(t);
  }, [screen, resendCount]);

  useEffect(() => {
    if (screen !== "register-otp") return;
    setRegOtpCountdown(60);
    const t = setInterval(() => setRegOtpCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
    return () => clearInterval(t);
  }, [screen]);

  const emailFmt = (v: string) => /^[^\s@]+@[^\s@]+\.[a-zA-Z0-9.-]+$/.test(v.trim().toLowerCase());
  const emailErrMsg = (v: string): string => {
    return "Must be a valid email address (e.g. user@gmail.com)";
  };
  const fmtPhone = (raw: string) => {
    const d = raw.replace(/\D/g, "").slice(0, 10);
    return d.length > 2 ? d.slice(0, 2) + "-" + d.slice(2) : d;
  };
  const forgotValid = emailFmt(forgotEmail);
  const regPwValid = (p: string) => p.length >= 8 && p.length <= 12 && /[^a-zA-Z0-9]/.test(p);
  const regValid = regName.trim().length >= 2 && emailFmt(regEmail) &&
    regEmail.trim().toLowerCase() !== "admin123@bingo.com" &&
    regPhone.replace(/\D/g, "").length >= 9 && regPhone.replace(/\D/g, "").length <= 10 &&
    regPwValid(regPassword) && regConfirmPw === regPassword && agreeTerms;

  const ADMIN_EMAIL = "admin123@bingo.com";
  const ADMIN_PASS = "admin123";
  const USERS_KEY = "bingo_users";
  const getStoredUsers = (): { email: string; password: string }[] => {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; }
  };

  function trySignIn() {
    let hasError = false;
    if (!email.trim()) { setEmailError("Email is required."); hasError = true; }
    else if (!emailFmt(email)) { setEmailError(emailErrMsg(email)); hasError = true; }
    else { setEmailError(""); }
    if (!password) { setPasswordError("Password is required."); hasError = true; }
    else { setPasswordError(""); }
    if (hasError) return;
    const emailLower = email.trim().toLowerCase();
    if (emailLower === ADMIN_EMAIL) {
      if (password === ADMIN_PASS) {
        if (rememberMe) localStorage.setItem("bingo_remember", JSON.stringify({ email: email.trim(), password }));
        else localStorage.removeItem("bingo_remember");
        onDone(true);
      } else { setPasswordError("Email or password is incorrect."); }
      return;
    }
    const users = getStoredUsers();
    const match = users.find(u => u.email.toLowerCase() === emailLower && u.password === password);
    if (!match) { setPasswordError("Email or password is incorrect."); return; }
    if (rememberMe) localStorage.setItem("bingo_remember", JSON.stringify({ email: email.trim(), password }));
    else localStorage.removeItem("bingo_remember");
    const storedName = (match as any).name as string | undefined;
    if (storedName) localStorage.setItem("bingo_username", storedName);
    localStorage.setItem("bingo_user_email", email.trim().toLowerCase());
    
    // Dynamically record this account on this Chrome browser
    const userAccount: UserAccount = {
      id: `email_${emailLower.replace(/[^a-z0-9]/g, "_")}`,
      name: storedName || "Resident",
      email: email.trim().toLowerCase(),
      avatar: (storedName || "Resident").charAt(0).toUpperCase(),
      bg: "bg-emerald-700 text-white",
      zone: "Zone E – City of Elmina",
      area: "Kanopi Residences, City of Elmina, Shah Alam",
      phone: "+60 12-882 1923",
      collectionDays: "Monday, Wednesday & Saturday",
      provider: "email",
      lastLoginAt: Date.now(),
    };
    saveDeviceAccount(userAccount);
    
    onDone(false, storedName);
  }

  function tryPhoneOtp() {
    const digits = phone.replace(/\D/g, "");
    if (!phone.trim() || digits.length < 9 || digits.length > 10 || !digits.startsWith("1")) {
      setPhoneError("Must be a valid Malaysian phone number."); return;
    }
    setPhoneError(""); setScreen("otp");
  }


  async function handleSelectGoogleAccount(acc: UserAccount) {
    setGoogleLoading(true);
    setGoogleModalError("");
    try {
      localStorage.setItem("bingo_username", acc.name);
      localStorage.setItem("bingo_user_email", acc.email);
      localStorage.setItem("bingo_user_phone", acc.phone || "+60 12-882 1923");
      localStorage.setItem("bingo_user_zone", acc.zone || "Zone E – City of Elmina");
      localStorage.setItem("bingo_user_area", acc.area || "Kanopi Residences, City of Elmina, Shah Alam");
    } catch {}

    saveDeviceAccount(acc);

    try {
      await syncUserProfileToDb({
        name: acc.name,
        email: acc.email,
        zone: acc.zone,
        area: acc.area,
        phone: acc.phone,
        collectionDays: acc.collectionDays,
      });
    } catch (e) {
      console.warn("Could not sync to DB:", e);
    }

    setGoogleLoading(false);
    setShowGoogleModal(false);
    onDone(false, acc.name);
  }

  async function handleAddCustomGoogleAccount() {
    const cleanEmail = googleCustomEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setGoogleModalError("Please enter a valid Google email address.");
      return;
    }
    // Automatically take the name from the Google email address prefix (no manual typing needed)
    const autoName = cleanEmail
      .split("@")[0]
      .replace(/[._-]/g, " ")
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") || "Resident";

    const newAcc: UserAccount = {
      id: `google_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`,
      name: autoName,
      email: cleanEmail,
      avatar: autoName.charAt(0).toUpperCase(),
      bg: "bg-[#00838f] text-white",
      zone: "Zone E – City of Elmina",
      area: "Kanopi Residences, City of Elmina, 40160 Shah Alam, Selangor",
      phone: "+60 12-882 1923",
      collectionDays: "Monday, Wednesday & Saturday",
      provider: "google",
      lastLoginAt: Date.now(),
    };

    saveDeviceAccount(newAcc);
    setDeviceAccounts(getDeviceAccounts());
    await handleSelectGoogleAccount(newAcc);
  }

  function handleGoogleSignIn() {
    setGoogleModalError("");
    setGoogleCustomEmail("");
    setIsAddingAnotherAccount(false);
    setShowGoogleModal(true);
  }

  return (
    <AuthShell>
      {/* ── Screen: Phone OTP ── */}
      {screen === "otp" && (
        <>
          <AuthHero />
          <div className="flex-1 px-6 pt-5 pb-6 flex flex-col overflow-y-auto bg-slate-50">
            <BackButton onClick={() => { setScreen("login"); setOtp(["","","","","",""]); setOtpError(false); }} />
            <div className="w-11 h-11 bg-emerald-100/70 rounded-xl flex items-center justify-center mb-3 text-emerald-800">
              <Shield className="w-5 h-5" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Verify Your Phone</h2>
            <div className="flex items-center gap-2 mt-1 mb-5">
              <span className="text-xs text-slate-600">SMS code sent to <strong className="text-slate-900">+60 {phone}</strong></span>
              <button onClick={() => setScreen("login")} className="text-xs font-semibold text-emerald-700 hover:underline">
                Edit
              </button>
            </div>
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2 block">Enter 6-digit code</label>
            <div className="flex gap-2 justify-between mb-2">
              {otp.map((digit, i) => (
                <input key={i} id={`otp-${i}`} type="tel" inputMode="numeric" maxLength={1} value={digit}
                  onChange={e => handleOtpChange(e.target.value, i, otp, setOtp, setOtpError, "otp")}
                  onKeyDown={e => handleOtpKey(e, i, otp, "otp")}
                  className={`w-11 h-12 text-center text-lg font-bold rounded-xl border transition-all bg-white shadow-xs outline-none ${otpError ? "border-red-400 bg-red-50/50" : digit ? "border-emerald-600 ring-2 ring-emerald-600/10" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"} text-slate-900`}
                />
              ))}
            </div>
            {otpError && <p className="text-xs font-medium text-red-600 mb-3 flex items-center gap-1"><X className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />Invalid code. Please re-enter or resend.</p>}
            {!otpError && <div className="mb-3" />}
            <button onClick={() => { if (otp.join("").length === 6) onDone(false); else setOtpError(true); }}
              className={`w-full py-3 rounded-xl text-xs font-semibold transition-all mb-4 shadow-sm ${otp.join("").length === 6 ? "bg-emerald-700 text-white hover:bg-emerald-800" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
              Verify &amp; Sign In
            </button>
            <div className="flex flex-col items-center gap-1.5 text-xs text-slate-500">
              {otpCountdown > 0
                ? <p>Resend code in <strong className="text-slate-800 tabular-nums">00:{String(otpCountdown).padStart(2, "0")}</strong></p>
                : <div className="flex items-center gap-1">
                    <span>Didn't receive code?</span>
                    <button onClick={() => { setResendCount(c => c + 1); setOtp(["","","","","",""]); setOtpError(false); }} className="font-semibold text-emerald-700 hover:underline">Resend SMS</button>
                  </div>
              }
            </div>
          </div>
        </>
      )}

      {/* ── Screen: Forgot Password ── */}
      {screen === "forgot" && (
        <>
          <AuthHero />
          <div className="flex-1 px-6 pt-5 pb-6 flex flex-col overflow-y-auto bg-slate-50">
            <BackButton onClick={() => setScreen("login")} />
            <div className="w-11 h-11 bg-emerald-100/70 rounded-xl flex items-center justify-center mb-3 text-emerald-800">
              <Lock className="w-5 h-5" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Forgot Password</h2>
            <p className="text-xs text-slate-600 mt-1 mb-5">Enter your registered email and we'll send you a password recovery link.</p>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">Email Address</label>
            <div className="relative mb-5">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-xs outline-none focus:border-emerald-600"
              />
            </div>
            {forgotSent ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-700 mx-auto mb-1" />
                <p className="text-xs font-bold text-emerald-900">Recovery link sent!</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Please check your inbox or spam folder.</p>
              </div>
            ) : (
              <button
                type="button"
                disabled={!forgotValid}
                onClick={() => setForgotSent(true)}
                className={`w-full py-3 rounded-xl text-xs font-semibold shadow-xs ${forgotValid ? "bg-emerald-700 text-white hover:bg-emerald-800" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
              >
                Send Recovery Link
              </button>
            )}
          </div>
        </>
      )}

      {/* ── Screen: Create Account (Register) ── */}
      {screen === "register" && (
        <>
          <AuthHero />
          <div className="flex-1 px-6 pt-5 pb-6 flex flex-col overflow-y-auto bg-slate-50">
            <BackButton onClick={() => setScreen("login")} />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-0.5">Create Account</h2>
            <p className="text-xs text-slate-600 mb-4">Join BinGo and start earning green points for your household.</p>
            
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1 block">Full Name</label>
            <div className="relative mb-1">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.8} />
              <input type="text" value={regName} onChange={e => { setRegName(e.target.value); if (regNameError) setRegNameError(""); }}
                onBlur={() => { if (!regName.trim()) setRegNameError("Full name is required."); else if (regName.trim().length < 2) setRegNameError("Name must be at least 2 characters."); else setRegNameError(""); }}
                placeholder="Enter your full name"
                className={`w-full h-11 bg-white border rounded-xl pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs leading-normal ${regNameError ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"}`} />
            </div>
            {regNameError ? <p className="text-[11px] font-medium text-red-600 mb-2 flex items-center gap-1"><X className="w-3 h-3 shrink-0" strokeWidth={2.5} />{regNameError}</p> : <div className="mb-2" />}

            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1 block">Email Address</label>
            <div className="relative mb-1">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.8} />
              <input type="text" value={regEmail} onChange={e => { setRegEmail(e.target.value.replace(/\s/g, "")); if (regEmailError) setRegEmailError(""); }}
                onBlur={() => { if (!regEmail.trim()) setRegEmailError("Email is required."); else if (!emailFmt(regEmail)) setRegEmailError(emailErrMsg(regEmail)); else if (regEmail.trim().toLowerCase() === "admin123@bingo.com") setRegEmailError("This email address cannot be registered."); else setRegEmailError(""); }}
                placeholder="your@email.com"
                className={`w-full h-11 bg-white border rounded-xl pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs leading-normal ${regEmailError ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"}`} />
            </div>
            {regEmailError ? <p className="text-[11px] font-medium text-red-600 mb-2 flex items-center gap-1"><X className="w-3 h-3 shrink-0" strokeWidth={2.5} />{regEmailError}</p> : <div className="mb-2" />}

            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1 block">Phone Number</label>
            <div className="flex gap-2 mb-1">
              <div className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex items-center gap-1.5 shrink-0 shadow-xs">
                <span className="text-xs">🇲🇾</span><span className="text-xs font-semibold text-slate-700">+60</span>
              </div>
              <input type="tel" inputMode="numeric" value={regPhone}
                onKeyDown={e => { if (!/[\d]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab"].includes(e.key)) e.preventDefault(); }}
                onChange={e => { setRegPhone(fmtPhone(e.target.value)); if (regPhoneError) setRegPhoneError(""); }}
                onBlur={() => { const d = regPhone.replace(/\D/g, ""); if (!regPhone.trim()) setRegPhoneError("Phone number is required."); else if (d.length < 9 || d.length > 10) setRegPhoneError("Must be a valid Malaysian phone number."); else setRegPhoneError(""); }}
                placeholder="12-3456789"
                className={`flex-1 h-11 bg-white border rounded-xl px-3.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs leading-normal ${regPhoneError ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"}`} />
            </div>
            {regPhoneError ? <p className="text-[11px] font-medium text-red-600 mb-2 flex items-center gap-1"><X className="w-3 h-3 shrink-0" strokeWidth={2.5} />{regPhoneError}</p> : <div className="mb-2" />}

            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1 block">Password</label>
            <div className="relative mb-1">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.8} />
              <input type={regShowPw ? "text" : "password"} value={regPassword}
                onChange={e => { setRegPassword(e.target.value.replace(/\s/g, "")); if (regPasswordError) setRegPasswordError(""); }}
                onBlur={() => { if (!regPassword) setRegPasswordError("Password is required."); else if (!regPwValid(regPassword)) setRegPasswordError("Must be 8-12 characters with at least one symbol."); else setRegPasswordError(""); }}
                placeholder="8-12 characters + symbol"
                className={`w-full h-11 bg-white border rounded-xl pl-10 pr-10 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs leading-normal ${regPasswordError ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"}`} />
              <button type="button" onClick={() => setRegShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                {regShowPw ? <EyeOff className="w-4 h-4" strokeWidth={1.8} /> : <Eye className="w-4 h-4" strokeWidth={1.8} />}
              </button>
            </div>
            {regPasswordError ? <p className="text-[11px] font-medium text-red-600 mb-2 flex items-center gap-1"><X className="w-3 h-3 shrink-0" strokeWidth={2.5} />{regPasswordError}</p> : <div className="mb-2" />}

            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1 block">Confirm Password</label>
            <div className="relative mb-1">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.8} />
              <input type={regShowConfirmPw ? "text" : "password"} value={regConfirmPw}
                onChange={e => { setRegConfirmPw(e.target.value.replace(/\s/g, "")); if (regConfirmPwError) setRegConfirmPwError(""); }}
                onBlur={() => { if (!regConfirmPw) setRegConfirmPwError("Please confirm your password."); else if (regConfirmPw !== regPassword) setRegConfirmPwError("Passwords do not match."); else setRegConfirmPwError(""); }}
                placeholder="Re-enter your password"
                className={`w-full h-11 bg-white border rounded-xl pl-10 pr-10 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs leading-normal ${regConfirmPwError ? "border-red-400 bg-red-50/20" : regConfirmPw && regConfirmPw === regPassword ? "border-emerald-500" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"}`} />
              <button type="button" onClick={() => setRegShowConfirmPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                {regShowConfirmPw ? <EyeOff className="w-4 h-4" strokeWidth={1.8} /> : <Eye className="w-4 h-4" strokeWidth={1.8} />}
              </button>
            </div>
            {regConfirmPwError ? <p className="text-[11px] font-medium text-red-600 mb-3 flex items-center gap-1"><X className="w-3 h-3 shrink-0" strokeWidth={2.5} />{regConfirmPwError}</p>
              : regConfirmPw && regConfirmPw === regPassword ? <p className="text-[11px] font-medium text-emerald-700 mb-3 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />Passwords match</p>
              : <div className="mb-3" />}

            <label className="flex items-start gap-2.5 mb-2 cursor-pointer">
              <div onClick={() => { setAgreeTerms(v => !v); setTermsAttempted(false); }}
                className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${agreeTerms ? "bg-emerald-700 border-emerald-700 text-white" : termsAttempted ? "border-red-500 bg-white" : "border-slate-300 bg-white"}`}>
                {agreeTerms && <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span className={`text-xs leading-snug ${termsAttempted && !agreeTerms ? "text-red-600 font-medium" : "text-slate-600"}`}>
                I agree to the <strong className="text-slate-900">Terms of Service</strong> and <strong className="text-slate-900">Privacy Policy</strong>
              </span>
            </label>
            {termsAttempted && !agreeTerms && <p className="text-[11px] font-medium text-red-600 mb-3 flex items-center gap-1"><X className="w-3 h-3 shrink-0" strokeWidth={2.5} />You must accept terms to proceed.</p>}

            <button onClick={() => { if (!regName.trim()) { setRegNameError("Full name is required."); return; } if (regName.trim().length < 2) { setRegNameError("Name must be at least 2 characters."); return; } if (!agreeTerms) { setTermsAttempted(true); return; } if (regValid) setScreen("register-otp"); }}
              className={`w-full py-3 rounded-xl text-xs font-semibold transition-all mb-2 shadow-sm ${regValid ? "bg-emerald-700 text-white hover:bg-emerald-800" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
              Create Account
            </button>
            <OrDivider />
            <GoogleButton onClick={handleGoogleSignIn} loading={googleLoading} />
            <p className="text-xs text-slate-600 text-center mt-3">Already registered?{" "}<button onClick={() => setScreen("login")} className="font-semibold text-emerald-700 hover:underline">Sign In</button></p>
          </div>
        </>
      )}

      {/* ── Screen: Register OTP ── */}
      {screen === "register-otp" && (
        <>
          <AuthHero />
          <div className="flex-1 px-6 pt-5 pb-6 flex flex-col overflow-y-auto bg-slate-50">
            <BackButton onClick={() => setScreen("register")} />
            <div className="w-11 h-11 bg-emerald-100/70 rounded-xl flex items-center justify-center mb-3 text-emerald-800">
              <Shield className="w-5 h-5" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Confirm Phone Number</h2>
            <div className="flex items-center gap-2 mt-1 mb-5">
              <span className="text-xs text-slate-600">Verification code sent to <strong className="text-slate-900">+60 {regPhone}</strong></span>
              <button onClick={() => setScreen("register")} className="text-xs font-semibold text-emerald-700 hover:underline">
                Edit
              </button>
            </div>
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2 block">Enter 6-digit code</label>
            <div className="flex gap-2 justify-between mb-2">
              {regOtp.map((digit, i) => (
                <input key={i} id={`rotp-${i}`} type="tel" inputMode="numeric" maxLength={1} value={digit}
                  onChange={e => handleOtpChange(e.target.value, i, regOtp, setRegOtp, setRegOtpError, "rotp")}
                  onKeyDown={e => handleOtpKey(e, i, regOtp, "rotp")}
                  className={`w-11 h-12 text-center text-lg font-bold rounded-xl border transition-all bg-white shadow-xs outline-none ${regOtpError ? "border-red-400 bg-red-50/50" : digit ? "border-emerald-600 ring-2 ring-emerald-600/10" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"} text-slate-900`} />
              ))}
            </div>
            {regOtpError && <p className="text-xs font-medium text-red-600 mb-3 flex items-center gap-1"><X className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />Invalid code. Please try again.</p>}
            {!regOtpError && <div className="mb-3" />}
            <button onClick={() => {
                if (regOtp.join("").length !== 6) { setRegOtpError(true); return; }
                const name = regName.trim() || "User";
                try {
                  const users = JSON.parse(localStorage.getItem("bingo_users") || "[]");
                  users.push({ email: regEmail.trim().toLowerCase(), password: regPassword, name });
                  localStorage.setItem("bingo_users", JSON.stringify(users));
                  localStorage.setItem("bingo_username", name);
                  localStorage.setItem("bingo_user_email", regEmail.trim().toLowerCase());
                  localStorage.setItem("bingo_user_phone", regPhone ? `+60 ${regPhone}` : "+60 12-882 1923");
                } catch {}

                const newAccount: UserAccount = {
                  id: `reg_${regEmail.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
                  name,
                  email: regEmail.trim().toLowerCase(),
                  avatar: name.charAt(0).toUpperCase() || "R",
                  bg: "bg-emerald-700 text-white",
                  zone: "Zone E – City of Elmina",
                  area: "City of Elmina, Shah Alam",
                  phone: regPhone ? `+60 ${regPhone}` : "+60 12-882 1923",
                  collectionDays: "Monday, Wednesday & Saturday",
                  provider: "email",
                  lastLoginAt: Date.now(),
                };
                saveDeviceAccount(newAccount);

                onDone(false, name);
              }}
              className={`w-full py-3 rounded-xl text-xs font-semibold transition-all mb-4 shadow-sm ${regOtp.join("").length === 6 ? "bg-emerald-700 text-white hover:bg-emerald-800" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
              Complete Registration
            </button>
            <div className="flex flex-col items-center gap-1.5 text-xs text-slate-500">
              {regOtpCountdown > 0
                ? <p>Resend code in <strong className="text-slate-800 tabular-nums">00:{String(regOtpCountdown).padStart(2, "0")}</strong></p>
                : <div className="flex items-center gap-1">
                    <span>Didn't receive SMS?</span>
                    <button onClick={() => { setRegOtp(["","","","","",""]); setRegOtpError(false); setRegOtpCountdown(60); }} className="font-semibold text-emerald-700 hover:underline">Resend SMS</button>
                  </div>
              }
            </div>
          </div>
        </>
      )}

      {/* ── Screen: Main Login Screen ── */}
      {screen === "login" && (
        <>
          <AuthHero />
          <div className="flex-1 px-5 pt-5 pb-6 flex flex-col justify-between overflow-y-auto bg-slate-50">
            <div>
              {/* Welcome text */}
              <div className="mb-4 text-center">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Welcome to BinGo</h2>
                <p className="text-xs text-slate-500 mt-1 max-w-[300px] mx-auto">
                  Select your Google Account to sign in immediately. Your name and details are taken automatically.
                </p>
              </div>

              {/* ── Active Google Account (Chrome Login) 1-Tap Card ── */}
              {(() => {
                const primary = deviceAccounts.find(a => !a.email?.toLowerCase().includes("1utar.my")) || {
                  id: "google_lee_weien_0643",
                  name: "Wei En Lee",
                  email: "lee.weien.0643@gmail.com",
                  avatar: "W",
                  bg: "bg-[#00838f] text-white",
                  zone: "Zone E – City of Elmina",
                  area: "Kanopi Residences, City of Elmina, 40160 Shah Alam, Selangor",
                  phone: "+60 12-882 1923",
                  collectionDays: "Monday, Wednesday & Saturday",
                  provider: "google" as const,
                  lastLoginAt: Date.now(),
                };
                return (
                  <div className="mb-4 bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs">
                    <div className="flex items-center justify-between mb-2.5 px-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                        <GoogleIcon size={3} />
                        <span>Google Account</span>
                      </span>
                      <span className="text-[11px] text-emerald-700 font-bold">1-Tap Sign In</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectGoogleAccount(primary)}
                      disabled={googleLoading}
                      className="w-full p-3 rounded-xl bg-slate-50/90 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 transition-all flex items-center gap-3 text-left active:scale-[0.99] group cursor-pointer"
                    >
                      {primary.photoURL ? (
                        <img
                          src={primary.photoURL}
                          alt={primary.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-emerald-500/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#00838f] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs ring-2 ring-cyan-500/20">
                          {primary.avatar || primary.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 truncate">
                          {primary.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {primary.email}
                        </p>
                        <p className="text-[10px] text-emerald-700/80 font-medium truncate mt-0.5">
                          {primary.area || "Kanopi Residences, City of Elmina, Shah Alam"}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                        <ChevronDown className="w-4 h-4 -rotate-90" strokeWidth={2.5} />
                      </div>
                    </button>
                  </div>
                );
              })()}

              {/* ── Continue with Google Button ── */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-2.5 bg-white border border-slate-300 hover:border-emerald-600 hover:bg-slate-50 rounded-xl py-3 text-xs font-semibold text-slate-800 shadow-xs transition-all active:scale-[0.99] group disabled:opacity-60"
                >
                  {googleLoading ? (
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <GoogleIcon size={4} />
                  )}
                  <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGoogleModalError("");
                    setGoogleCustomEmail("");
                    setIsAddingAnotherAccount(false);
                    setShowGoogleModal(true);
                  }}
                  className="w-full text-center py-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
                >
                  Choose another account
                </button>
              </div>

              {/* Municipal Staff Login Section */}
              <div className="mt-5 pt-3.5 border-t border-slate-200">
                {!showAdminLogin ? (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowAdminLogin(true)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Municipal Staff Login</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Municipal Administration</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAdminLogin(false)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
                      >
                        Hide
                      </button>
                    </div>

                    <div>
                      <input
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value.replace(/\s/g, "")); if (emailError) setEmailError(""); }}
                        placeholder="admin123@bingo.com"
                        className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        value={password}
                        onChange={e => { setPassword(e.target.value); if (passwordError) setPasswordError(""); }}
                        placeholder="••••••••"
                        className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs outline-none focus:border-emerald-600"
                      />
                    </div>
                    {passwordError && <p className="text-[10px] text-red-600">{passwordError}</p>}
                    <button
                      type="button"
                      onClick={trySignIn}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                    >
                      Enter Municipal Panel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom info */}
            <div className="pt-3 text-center">
              <p className="text-[11px] text-slate-500 leading-snug">
                BinGo uses Google Account sync to secure your Selangor municipal recycling green points and localized pickup schedules.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── Google "Choose an account" Modal (Authentic Dark Theme as shown in Image 1 & Image 2) ── */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#131314] text-white rounded-[28px] max-w-[440px] w-full p-6 sm:p-7 shadow-2xl border border-[#3c4043] flex flex-col relative max-h-[92vh] overflow-y-auto">
            
            {/* Top Bar: Google G logo + Sign in with Google + Close X */}
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <GoogleIcon size={4} />
                <span className="text-[13px] font-medium text-[#e3e3e3] tracking-tight">
                  Sign in with Google
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setShowGoogleModal(false); setIsAddingAnotherAccount(false); }}
                className="p-1 rounded-full text-[#9aa0a6] hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!isAddingAnotherAccount ? (
              <>
                {/* Brand Logo & Heading */}
                <div className="pt-2 pb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#15803D] to-[#16A34A] flex items-center justify-center shadow-md mb-4 border border-emerald-500/30">
                    <Leaf className="w-5 h-5 text-white" strokeWidth={2.4} />
                  </div>
                  <h2 className="text-[22px] sm:text-[24px] font-normal text-[#e3e3e3] tracking-tight leading-snug">
                    Choose an account
                  </h2>
                  <p className="text-[13px] text-[#c4c7c5] mt-1">
                    to continue to <span className="text-[#8ab4f8] font-medium">shining-display-s6tvw.firebaseapp.com</span>
                  </p>
                </div>

                {/* Account Selection List */}
                <div className="divide-y divide-[#3c4043] border-y border-[#3c4043] my-4">
                  {(deviceAccounts.filter(a => !a.email?.toLowerCase().includes("1utar.my")).length > 0
                    ? deviceAccounts.filter(a => !a.email?.toLowerCase().includes("1utar.my"))
                    : DEFAULT_GOOGLE_ACCOUNTS
                  ).map((acc: UserAccount, index: number) => {
                    const initials = acc.name ? acc.name.charAt(0).toUpperCase() : "G";
                    const isCyan = index % 2 === 0;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleSelectGoogleAccount(acc)}
                        disabled={googleLoading}
                        className="w-full py-3.5 px-2 flex items-center gap-3.5 text-left hover:bg-white/5 active:bg-white/10 transition-colors rounded-xl group disabled:opacity-50"
                      >
                        {acc.photoURL ? (
                          <img
                            src={acc.photoURL}
                            alt={acc.name}
                            className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-white/20"
                          />
                        ) : (
                          <div
                            className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-medium text-[15px] ${
                              isCyan ? "bg-[#00838f] text-white" : "bg-[#7b1fa2] text-white"
                            }`}
                          >
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-[#e3e3e3] leading-snug truncate group-hover:text-white">
                            {acc.name}
                          </p>
                          <p className="text-[12px] text-[#c4c7c5] truncate leading-tight">
                            {acc.email}
                          </p>
                        </div>
                      </button>
                    );
                  })}

                  {/* Use another account row */}
                  <button
                    type="button"
                    onClick={() => { setIsAddingAnotherAccount(true); setGoogleModalError(""); }}
                    className="w-full py-3.5 px-2 flex items-center gap-3.5 text-left hover:bg-white/5 active:bg-white/10 transition-colors rounded-xl group"
                  >
                    <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[#c4c7c5] group-hover:text-white">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5.121 17.804A7.5 7.5 0 0112 15a7.5 7.5 0 016.879 2.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-[14px] font-medium text-[#e3e3e3] group-hover:text-white">
                      Use another account
                    </span>
                  </button>
                </div>

                {/* Privacy & Terms Note */}
                <p className="text-[12px] text-[#c4c7c5] leading-relaxed pt-1">
                  Before using this app, you can review BinGo's{" "}
                  <a href="#privacy" onClick={(e) => e.preventDefault()} className="text-[#8ab4f8] font-medium hover:underline">
                    Privacy Policy
                  </a>{" "}
                  and{" "}
                  <a href="#terms" onClick={(e) => e.preventDefault()} className="text-[#8ab4f8] font-medium hover:underline">
                    Terms of Service
                  </a>.
                </p>

                {/* Bottom Bar: Language & Links */}
                <div className="pt-6 mt-2 flex items-center justify-between text-[11px] text-[#9aa0a6] border-t border-[#3c4043]/60">
                  <span className="hover:text-[#e3e3e3] cursor-pointer">English (United Kingdom) &#9662;</span>
                  <div className="flex items-center gap-4">
                    <a href="#help" onClick={(e) => e.preventDefault()} className="hover:text-[#e3e3e3]">Help</a>
                    <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-[#e3e3e3]">Privacy</a>
                    <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-[#e3e3e3]">Terms</a>
                  </div>
                </div>
              </>
            ) : (
              /* Use Another Account Sub-view */
              <div className="space-y-4 pt-1">
                <div className="pb-1">
                  <h2 className="text-[22px] font-normal text-[#e3e3e3] tracking-tight">Sign in</h2>
                  <p className="text-[13px] text-[#c4c7c5] mt-1">
                    with your Google Account to continue to <span className="text-[#8ab4f8]">shining-display-s6tvw.firebaseapp.com</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="email"
                      value={googleCustomEmail}
                      onChange={(e) => { setGoogleCustomEmail(e.target.value); setGoogleModalError(""); }}
                      placeholder="Email or phone"
                      className="w-full bg-[#1E1F20] border border-[#5f6368] rounded-md px-3.5 py-3 text-[14px] text-white placeholder:text-[#8e918f] outline-none focus:border-[#8ab4f8] focus:ring-1 focus:ring-[#8ab4f8] transition-all"
                      autoFocus
                    />
                  </div>
                  {googleModalError && (
                    <p className="text-[11px] text-red-400 flex items-center gap-1">
                      <X className="w-3.5 h-3.5 shrink-0" />
                      {googleModalError}
                    </p>
                  )}
                  <p className="text-[11px] text-[#8e918f]">
                    To continue, Google will share your name, email address, and profile info with BinGo.
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsAddingAnotherAccount(false)}
                    className="text-[13px] font-medium text-[#8ab4f8] hover:text-[#a8c7fa] hover:underline"
                  >
                    Back to accounts
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomGoogleAccount}
                    className="bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#001d35] font-semibold text-[13px] px-6 py-2.5 rounded-full shadow-sm transition-all active:scale-95"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AuthShell>
  );
}
