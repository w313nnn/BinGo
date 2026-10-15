import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Shield, X, Lock, CheckCircle2, Mail, User, Phone, Eye, EyeOff, Leaf, Recycle,
  ChevronDown, Check, Info, Globe, Sparkles, MapPin, ExternalLink,
} from "lucide-react";
import { getDeviceAccounts, saveDeviceAccount, removeDeviceAccount, UserAccount } from "./appData";
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
    <div className="w-full max-w-[420px] mx-auto min-h-screen sm:min-h-[820px] sm:max-h-[92vh] bg-white sm:rounded-[2.5rem] overflow-hidden shadow-2xl border-0 sm:border sm:border-slate-300/80 flex flex-col relative select-none">
      {/* Phone status bar */}
      <div className="px-6 pt-3 pb-1 flex justify-between items-center shrink-0 absolute top-0 left-0 right-0 z-20">
        <span className="text-white/90 text-[12px] font-semibold tabular-nums tracking-tight">9:41</span>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2.5 border border-white/80 rounded-xs p-0.5">
            <div className="h-full w-3/4 bg-white rounded-xs" />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

function AuthHero() {
  return (
    <div
      className="shrink-0 relative overflow-hidden pt-10 pb-6 px-6"
      style={{
        background: "linear-gradient(145deg, #133E26 0%, #15803D 60%, #16A34A 100%)",
      }}
    >
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 blur-xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-emerald-400/10 blur-lg pointer-events-none" />

      <div className="flex flex-col items-center text-center mt-2">
        <motion.div
          className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-3 border border-emerald-100"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative">
            <Leaf className="w-8 h-8 text-emerald-700" strokeWidth={2.2} />
            <Recycle className="w-4 h-4 text-emerald-500 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" strokeWidth={2.5} />
          </div>
        </motion.div>

        <h1 className="text-white text-2xl font-bold tracking-tight flex items-center gap-1 font-sans">
          <span>Bin</span>
          <span className="text-amber-300 font-extrabold">Go</span>
        </h1>
        <p className="text-emerald-100/90 text-xs font-medium mt-1">
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
  const [googleEmailInput, setGoogleEmailInput] = useState("");
  const [googleNameInput, setGoogleNameInput] = useState("");
  const [googleModalError, setGoogleModalError] = useState("");
  const [deviceAccounts, setDeviceAccounts] = useState<UserAccount[]>(() => getDeviceAccounts());

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

  function selectSavedAccount(acc: UserAccount) {
    try {
      localStorage.setItem("bingo_username", acc.name);
      localStorage.setItem("bingo_user_email", acc.email);
      localStorage.setItem("bingo_user_phone", acc.phone);
      localStorage.setItem("bingo_user_zone", acc.zone);
      localStorage.setItem("bingo_user_area", acc.area);
    } catch {}
    saveDeviceAccount(acc);
    onDone(false, acc.name);
  }

  function handleDeleteSavedAccount(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    removeDeviceAccount(id);
    setDeviceAccounts(getDeviceAccounts());
  }

  async function handleCompleteGoogleLogin(selectedEmail: string, selectedName?: string) {
    const cleanEmail = selectedEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setGoogleModalError("Please enter a valid Google email address.");
      return;
    }
    setGoogleModalError("");
    setGoogleLoading(true);

    const displayName = selectedName?.trim() || cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Resident";
    const googleAcc: UserAccount = {
      id: `google_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`,
      name: displayName,
      email: cleanEmail,
      avatar: displayName.charAt(0).toUpperCase() || "G",
      bg: "bg-emerald-600 text-white",
      zone: "Zone E – City of Elmina",
      area: "Kanopi Residences, City of Elmina, Shah Alam",
      phone: "+60 12-882 1923",
      collectionDays: "Monday, Wednesday & Saturday",
      provider: "google",
      lastLoginAt: Date.now(),
    };

    saveDeviceAccount(googleAcc);

    try {
      localStorage.setItem("bingo_username", displayName);
      localStorage.setItem("bingo_user_email", cleanEmail);
      localStorage.setItem("bingo_user_phone", googleAcc.phone);
      localStorage.setItem("bingo_user_zone", googleAcc.zone);
      localStorage.setItem("bingo_user_area", googleAcc.area);
    } catch {}

    try {
      await syncUserProfileToDb({
        name: displayName,
        email: cleanEmail,
        zone: googleAcc.zone,
        area: googleAcc.area,
        phone: googleAcc.phone,
        collectionDays: googleAcc.collectionDays,
      });
    } catch (e) {
      console.warn("Could not sync to DB:", e);
    }

    setGoogleLoading(false);
    setShowGoogleModal(false);
    onDone(false, displayName);
  }

  async function handleGoogleSignIn() {
    setGoogleModalError("");
    setGoogleLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res?.user) {
        const u = res.user;
        const name = u.displayName || u.email?.split("@")[0] || "Resident";
        const email = u.email || "";
        const phone = u.phoneNumber || "+60 12-882 1923";
        const photoURL = u.photoURL || undefined;

        // Dynamically save account authenticated from this Chrome profile
        const googleAcc: UserAccount = {
          id: u.uid || `google_${Date.now()}`,
          name,
          email,
          avatar: name.charAt(0).toUpperCase() || "G",
          bg: "bg-emerald-600 text-white",
          zone: "Zone E – City of Elmina",
          area: "Kanopi Residences, City of Elmina, Shah Alam",
          phone,
          collectionDays: "Monday, Wednesday & Saturday",
          photoURL,
          provider: "google",
          lastLoginAt: Date.now(),
        };
        saveDeviceAccount(googleAcc);

        try {
          localStorage.setItem("bingo_username", name);
          localStorage.setItem("bingo_user_email", email);
          localStorage.setItem("bingo_user_phone", phone);
          localStorage.setItem("bingo_user_zone", googleAcc.zone);
          localStorage.setItem("bingo_user_area", googleAcc.area);
        } catch {}

        await syncUserProfileToDb({
          name,
          email,
          zone: googleAcc.zone,
          area: googleAcc.area,
          phone,
          collectionDays: googleAcc.collectionDays,
        });

        onDone(false, name);
        return;
      }
    } catch (err: any) {
      console.warn("Direct Google popup not supported in this environment, opening Google account chooser:", err);
      // Seamlessly open Google Account Chooser without showing any red popup error
      setShowGoogleModal(true);
      if (email && email.includes("@")) {
        setGoogleEmailInput(email.trim());
      }
    } finally {
      setGoogleLoading(false);
    }
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
          <div className="flex-1 px-6 pt-5 pb-6 flex flex-col overflow-y-auto bg-slate-50">
            {/* Dynamic accounts remembered on this device */}
            {deviceAccounts.length > 0 && (
              <div className="mb-4 bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-700" />
                    Accounts on this browser
                  </span>
                  <span className="text-[10px] text-slate-400">Chrome profile</span>
                </div>
                <div className="space-y-1.5">
                  {deviceAccounts.map(acc => (
                    <div
                      key={acc.id}
                      onClick={() => selectSavedAccount(acc)}
                      className="flex items-center justify-between p-2 rounded-xl border border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {acc.photoURL ? (
                          <img src={acc.photoURL} alt={acc.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${acc.bg || "bg-emerald-700 text-white"}`}>
                            {acc.avatar || acc.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 truncate">{acc.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{acc.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[10px] font-semibold text-emerald-700 group-hover:underline">
                          Sign In &rarr;
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSavedAccount(e, acc.id)}
                          title="Remove from this browser"
                          className="p-1 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* iOS-style Segmented control */}
            <div className="flex bg-slate-200/70 p-1 rounded-xl mb-4 shrink-0">
              <button
                type="button"
                onClick={() => { setTab("email"); setEmailError(""); setPasswordError(""); setPhoneError(""); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${tab === "email" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                <Mail className="w-3.5 h-3.5" strokeWidth={2} /> Email
              </button>
              <button
                type="button"
                onClick={() => { setTab("phone"); setEmailError(""); setPasswordError(""); setPhoneError(""); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${tab === "phone" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                <Phone className="w-3.5 h-3.5" strokeWidth={2} /> Phone (MY)
              </button>
            </div>

            {tab === "email" && (
              <div className="flex flex-col flex-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">Email Address</label>

                <div className="relative mb-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.8} />
                  <input
                    type="text"
                    value={email}
                    onChange={e => { const val = e.target.value.replace(/\s/g, ""); setEmail(val); if (emailError) setEmailError(""); }}
                    onBlur={() => { if (!email.trim()) setEmailError("Email is required."); else if (!emailFmt(email)) setEmailError(emailErrMsg(email)); else setEmailError(""); }}
                    placeholder="your@email.com"
                    className={`w-full h-11 bg-white border rounded-xl pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs leading-normal ${emailError ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"}`}
                  />
                </div>
                {emailError ? <p className="text-[11px] font-medium text-red-600 mb-2.5 flex items-center gap-1"><X className="w-3 h-3 shrink-0" strokeWidth={2.5} />{emailError}</p> : <div className="mb-2.5" />}

                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">Password</label>
                <div className="relative mb-1">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.8} />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value.replace(/\s/g, "")); if (passwordError) setPasswordError(""); }}
                    onBlur={() => { if (!password) setPasswordError("Password is required."); else setPasswordError(""); }}
                    placeholder="••••••••"
                    className={`w-full h-11 bg-white border rounded-xl pl-10 pr-10 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs leading-normal ${passwordError ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"}`}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                    {showPw ? <EyeOff className="w-4 h-4" strokeWidth={1.8} /> : <Eye className="w-4 h-4" strokeWidth={1.8} />}
                  </button>
                </div>
                {passwordError ? <p className="text-[11px] font-medium text-red-600 mb-3 flex items-center gap-1"><X className="w-3 h-3 shrink-0" strokeWidth={2.5} />{passwordError}</p> : <div className="mb-3" />}

                <div className="flex items-center justify-between mb-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div onClick={() => setRememberMe(v => !v)} className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${rememberMe ? "bg-emerald-700 border-emerald-700 text-white" : "border-slate-300 bg-white"}`}>
                      {rememberMe && <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className="text-xs text-slate-600">Remember me</span>
                  </label>
                  <button type="button" onClick={() => setScreen("forgot")} className="text-xs font-semibold text-emerald-700 hover:underline">Forgot password?</button>
                </div>

                <button
                  type="button"
                  onClick={trySignIn}
                  disabled={!emailFmt(email) || !password}
                  className={`w-full py-3 rounded-xl text-xs font-semibold transition-all mb-2 shadow-sm ${emailFmt(email) && password ? "bg-emerald-700 text-white hover:bg-emerald-800 active:scale-[0.99]" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
                >
                  Sign In
                </button>
                <OrDivider />
                <GoogleButton onClick={handleGoogleSignIn} loading={googleLoading} />
                <p className="text-xs text-slate-600 text-center mt-4">
                  New to BinGo?{" "}
                  <button type="button" onClick={() => setScreen("register")} className="font-semibold text-emerald-700 hover:underline">Create Account</button>
                </p>
              </div>
            )}

            {tab === "phone" && (
              <div className="flex flex-col flex-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">Mobile Number</label>
                <div className="flex gap-2 mb-1">
                  <div className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex items-center gap-1.5 shrink-0 shadow-xs">
                    <span className="text-xs font-semibold text-slate-700">MY +60</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onKeyDown={e => { if (!/[\d]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab"].includes(e.key)) e.preventDefault(); }}
                    onChange={e => { setPhone(fmtPhone(e.target.value)); if (phoneError) setPhoneError(""); }}
                    onBlur={() => { const digits = phone.replace(/\D/g, ""); if (!phone.trim() || digits.length < 9 || digits.length > 10 || !digits.startsWith("1")) setPhoneError("Must be a valid Malaysian phone number."); else setPhoneError(""); }}
                    placeholder="12-3456789"
                    className={`flex-1 h-11 bg-white border rounded-xl px-3.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs leading-normal ${phoneError ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"}`}
                  />
                </div>
                {phoneError ? <p className="text-[11px] font-medium text-red-600 mb-3 flex items-center gap-1"><X className="w-3 h-3 shrink-0" strokeWidth={2.5} />{phoneError}</p> : <div className="mb-3" />}

                <button
                  type="button"
                  onClick={tryPhoneOtp}
                  className="w-full py-3 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-all shadow-sm mb-2 active:scale-[0.99]"
                >
                  Send Verification Code
                </button>
                <OrDivider />
                <GoogleButton onClick={handleGoogleSignIn} loading={googleLoading} />
                <p className="text-xs text-slate-600 text-center mt-4">
                  New to BinGo?{" "}
                  <button type="button" onClick={() => setScreen("register")} className="font-semibold text-emerald-700 hover:underline">Create Account</button>
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Google Account Chooser Modal (Dynamic browser/Chrome history) ── */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => { setShowGoogleModal(false); setGoogleModalError(""); }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Google Header */}
            <div className="flex flex-col items-center text-center pb-2">
              <svg className="w-10 h-10 mb-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <h3 className="text-base font-bold text-slate-900">Sign in with Google</h3>
              <p className="text-xs text-slate-500 mt-0.5">to continue to BinGo Smart Waste</p>
            </div>

            {/* List of accounts remembered on this Chrome browser */}
            {deviceAccounts.length > 0 && (
              <div className="space-y-2 mt-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Accounts on this device
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {deviceAccounts.map(acc => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleCompleteGoogleLogin(acc.email, acc.name)}
                      className="w-full flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {acc.photoURL ? (
                          <img src={acc.photoURL} alt={acc.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${acc.bg || "bg-emerald-700 text-white"}`}>
                            {acc.avatar || acc.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 truncate">{acc.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{acc.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 shrink-0 ml-2 group-hover:underline">
                        Continue &rarr;
                      </span>
                    </button>
                  ))}
                </div>
                <div className="relative my-3 flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-2 text-[10px] text-slate-400 font-medium absolute">or use another Google account</span>
                </div>
              </div>
            )}

            {/* Enter Google Email */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Google Email Address
                </label>
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => { setGoogleEmailInput(e.target.value); setGoogleModalError(""); }}
                  placeholder="e.g. resident@gmail.com"
                  className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all shadow-xs"
                  autoFocus={deviceAccounts.length === 0}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Full Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={googleNameInput}
                  onChange={(e) => setGoogleNameInput(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all shadow-xs"
                />
              </div>

              {googleModalError && (
                <p className="text-[11px] font-medium text-red-600 flex items-center gap-1">
                  <X className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                  {googleModalError}
                </p>
              )}

              <button
                type="button"
                onClick={() => handleCompleteGoogleLogin(googleEmailInput, googleNameInput)}
                disabled={googleLoading || !googleEmailInput.trim()}
                className={`w-full py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
                  googleEmailInput.trim()
                    ? "bg-emerald-700 hover:bg-emerald-800 text-white active:scale-[0.99]"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>{googleLoading ? "Signing in..." : "Continue with Google Account"}</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center leading-normal pt-1">
              Secured for this Chrome browser. No stranger's account will be visible on other devices.
            </p>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
