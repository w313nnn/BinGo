import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, X, Lock, CheckCircle2, Mail, User, Phone, Eye, EyeOff, Leaf, Recycle,
  ChevronDown, Check, Info, Globe, Sparkles, MapPin, ExternalLink,
} from "lucide-react";
import { getDeviceAccounts, saveDeviceAccount, removeDeviceAccount, UserAccount } from "./appData";
import BackButton from "./BackButton";
import AnimatedIcon from "./AnimatedIcon";
import GreenOrb from "./GreenOrb";
import DetailsDisclosure from "./DetailsDisclosure";
import { auth, syncUserProfileToDb } from "./firebase";
import { GoogleAuthProvider, getRedirectResult, signInWithPopup, signInWithRedirect, type User as FirebaseUser } from "firebase/auth";

type AuthScreen = "login" | "otp" | "forgot" | "forgot-sent" | "register" | "register-otp";

const GoogleIcon = ({ size = 5 }: { size?: number }) => (
  <svg className="shrink-0" style={{ width: `${size * 0.25}rem`, height: `${size * 0.25}rem` }} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[420px] mx-auto app-shell auth-shell bg-[#F8FAF9] sm:rounded-[2.8rem] sm:border-[8px] sm:border-slate-900 shadow-2xl overflow-hidden flex flex-col relative select-none ring-1 ring-slate-900/10">
      {/* Mobile Top Dynamic Island / Speaker Pill on Desktop */}
      <div className="hidden sm:flex justify-center pt-2 pb-1 bg-[#133E26] shrink-0">
        <div className="w-24 h-4 bg-black/70 rounded-full flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
        </div>
      </div>
      <GreenOrb />
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
        background: "transparent",
      }}
    >
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 blur-xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-emerald-400/10 blur-lg pointer-events-none" />

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

        <h1 className="text-emerald-950 text-2xl font-bold tracking-tight flex items-center gap-1 font-sans">
          <span>Bin</span>
          <span className="text-emerald-700 font-extrabold">Go</span>
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-0.5">
          Waste less. Recycle more.
        </p>
      </div>
    </div>
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
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
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
  const [regResendCount, setRegResendCount] = useState(0);
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
  const googleDialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!showGoogleModal) return;
    const trigger = document.activeElement as HTMLElement | null;
    googleDialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => trigger?.focus();
  }, [showGoogleModal]);

  function handleGoogleDialogKeys(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && !googleLoading) { event.preventDefault(); setShowGoogleModal(false); }
    if (event.key !== "Tab") return;
    const controls = Array.from(googleDialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], input:not(:disabled)") || []);
    const first = controls[0], last = controls[controls.length - 1];
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  const [googleModalError, setGoogleModalError] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [deviceAccounts, setDeviceAccounts] = useState<UserAccount[]>(() => {
    return getDeviceAccounts();
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
  }, [screen, regResendCount]);

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
  const getStoredUsers = (): { email: string; password: string; name?: string }[] => {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; }
  };

  function trySignIn() {
    let hasError = false;
    if (!email.trim()) { setEmailError("Email is required."); hasError = true; }
    else if (!emailFmt(email)) { setEmailError(emailErrMsg(email)); hasError = true; }
    else { setEmailError(""); }
    if (!password) { setPasswordError("Password is required."); hasError = true; }
    else if (password.length < 6) { setPasswordError("Password must be at least 6 characters."); hasError = true; }
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
    let match = users.find(u => u.email.toLowerCase() === emailLower);
    if (match) {
      if (match.password !== password) {
        setPasswordError("Incorrect password for this email.");
        return;
      }
    } else {
      // First-time resident sign in: automatically register credentials so they can log in smoothly
      const autoName = emailLower
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ") || "Resident";
      const newEntry = { email: emailLower, password, name: autoName };
      users.push(newEntry);
      match = newEntry;
      try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      } catch {}
    }

    if (rememberMe) localStorage.setItem("bingo_remember", JSON.stringify({ email: email.trim(), password }));
    else localStorage.removeItem("bingo_remember");
    const storedName = (match as any).name as string | undefined || "Resident";
    if (storedName) localStorage.setItem("bingo_username", storedName);
    localStorage.setItem("bingo_user_email", email.trim().toLowerCase());
    localStorage.setItem("bingo_user_phone", "+60 12-882 1923");
    localStorage.setItem("bingo_user_zone", "Zone E – City of Elmina");
    localStorage.setItem("bingo_user_area", "Kanopi Residences, City of Elmina, 40160 Shah Alam, Selangor");
    
    // Dynamically record this account on this Chrome browser
    const userAccount: UserAccount = {
      id: `email_${emailLower.replace(/[^a-z0-9]/g, "_")}`,
      name: storedName,
      email: email.trim().toLowerCase(),
      avatar: storedName.charAt(0).toUpperCase(),
      bg: "bg-emerald-700 text-white",
      zone: "Zone E – City of Elmina",
      area: "Kanopi Residences, City of Elmina, 40160 Shah Alam, Selangor",
      phone: "+60 12-882 1923",
      collectionDays: "Monday, Wednesday & Saturday",
      provider: "email",
      lastLoginAt: Date.now(),
    };
    saveDeviceAccount(userAccount);

    syncUserProfileToDb({
      name: storedName,
      email: emailLower,
      zone: "Zone E – City of Elmina",
      area: "Kanopi Residences, City of Elmina, 40160 Shah Alam, Selangor",
      phone: "+60 12-882 1923",
      collectionDays: "Monday, Wednesday & Saturday",
    }).catch(() => {});
    
    onDone(false, storedName);
  }

  function tryPhoneOtp() {
    if (!phone.trim()) {
      setPhoneError("Phone number is required.");
      return;
    }
    let digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) digits = digits.slice(1);
    if (!digits || digits.length < 8 || digits.length > 10 || !digits.startsWith("1")) {
      setPhoneError("Please enter a valid Malaysian mobile number (e.g. 12-3456789).");
      return;
    }
    setPhoneError("");
    setScreen("otp");
  }

  async function finishGoogleSignIn(user: FirebaseUser, loginHint?: string) {
    const accountEmail = user.email?.trim().toLowerCase();
    if (!accountEmail) throw new Error("Google did not return an email address.");
    if (loginHint && accountEmail !== loginHint.trim().toLowerCase()) {
      const mismatch = new Error(`Google returned ${accountEmail}, not the selected account ${loginHint}.`);
      Object.assign(mismatch, { code: "bingo/account-mismatch" });
      throw mismatch;
    }

    const name = user.displayName || accountEmail.split("@")[0] || "Resident";
    const account: UserAccount = {
      id: `google_${user.uid}`,
      name,
      email: accountEmail,
      photoURL: user.photoURL || undefined,
      avatar: name.charAt(0).toUpperCase(),
      bg: "bg-[#00838f] text-white",
      zone: "Zone E – City of Elmina",
      area: "Kanopi Residences, City of Elmina, Shah Alam",
      phone: user.phoneNumber || "+60 12-882 1923",
      collectionDays: "Monday, Wednesday & Saturday",
      provider: "google",
      lastLoginAt: Date.now(),
    };

    saveDeviceAccount(account);
    setDeviceAccounts(getDeviceAccounts());
    try {
      localStorage.setItem("bingo_username", name);
      localStorage.setItem("bingo_user_email", account.email);
      localStorage.setItem("bingo_user_phone", account.phone);
      localStorage.setItem("bingo_user_zone", account.zone);
      localStorage.setItem("bingo_user_area", account.area);
      localStorage.removeItem("bingo_google_login_hint");
    } catch {}

    await syncUserProfileToDb({
      name,
      email: account.email,
      phone: account.phone,
      zone: account.zone,
      area: account.area,
    }).catch(error => console.warn("Could not sync Google profile:", error));

    setShowGoogleModal(false);

    onDone(false, name);
  }

  function googleErrorMessage(error: any): string {
    switch (error?.code) {
      case "auth/unauthorized-domain":
        return `This address (${window.location.hostname}) is not authorized in Firebase. Add it under Firebase Authentication → Settings → Authorized domains, or open BinGo from an authorized address.`;
      case "auth/operation-not-allowed":
        return "Google sign-in is disabled for this Firebase project. Enable Google under Firebase Authentication → Sign-in method.";
      case "auth/popup-blocked":
        return "The browser blocked Google's sign-in window. Try again in your browser or allow pop-ups for this site.";
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return "Google sign-in was cancelled. Choose an account to try again.";
      case "auth/network-request-failed":
        return "Google sign-in could not reach Firebase. Check your connection and try again.";
      case "bingo/account-mismatch":
        return error.message;
      default:
        return `Google sign-in failed${error?.code ? ` (${error.code})` : ""}. Check this Firebase project's Google sign-in settings and try again.`;
    }
  }

  // Mobile browsers handle the full-page redirect more reliably than OAuth popups.
  useEffect(() => {
    let active = true;
    setGoogleLoading(true);
    getRedirectResult(auth)
      .then(async result => {
        if (!active) return;
        if (!result) {
          try { localStorage.removeItem("bingo_google_login_hint"); } catch {}
          return;
        }
        const hint = localStorage.getItem("bingo_google_login_hint") || undefined;
        await finishGoogleSignIn(result.user, hint);
      })
      .catch(error => {
        if (!active) return;
        try { localStorage.removeItem("bingo_google_login_hint"); } catch {}
        console.error("Google redirect sign-in failed:", error);
        setGoogleModalError(googleErrorMessage(error));
        setShowGoogleModal(true);
      })
      .finally(() => {
        if (active) setGoogleLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function completeGoogleSignIn(loginHint?: string) {
    setGoogleLoading(true);
    setGoogleModalError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters(
        loginHint
          ? { login_hint: loginHint }
          : { prompt: "select_account" }
      );

      const isMobileBrowser = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 1 && window.matchMedia("(max-width: 767px)").matches);
      if (isMobileBrowser) {
        localStorage.setItem("bingo_google_login_hint", loginHint || "");
        await signInWithRedirect(auth, provider);
        return;
      }

      const result = await signInWithPopup(auth, provider);
      await finishGoogleSignIn(result.user, loginHint);
    } catch (error: any) {
      console.error("Google sign-in failed:", error);
      if (error?.code === "bingo/account-mismatch") {
        setGoogleModalError(error.message);
      } else {
        setGoogleModalError(googleErrorMessage(error));
      }
      setShowGoogleModal(true);

      setGoogleLoading(false);
      try { localStorage.removeItem("bingo_google_login_hint"); } catch {}
    }
  }

  async function handleSelectGoogleAccount(account: UserAccount) {
    await completeGoogleSignIn(account.email);
  }

  async function handleGoogleSignIn() {
    setGoogleModalError("");

    const savedGoogleAccounts = getDeviceAccounts().filter(account => account.provider === "google");
    setDeviceAccounts(savedGoogleAccounts);

    if (savedGoogleAccounts.length > 0) {
      setShowGoogleModal(true);
      return;
    }

    await completeGoogleSignIn();
  }

  const googleAccounts = deviceAccounts.filter(account => account.provider === "google")
    .sort((a, b) => (b.lastLoginAt || 0) - (a.lastLoginAt || 0));

  return (
    <AuthShell>
      {/* ── Screen: Phone OTP ── */}
      {screen === "otp" && (
        <>
          <AuthHero />
          <div className="flex-1 px-6 pt-5 pb-6 flex flex-col overflow-y-auto bg-slate-50">
            <div className="flex items-center gap-2 mb-4">
              <BackButton onClick={() => { setScreen("login"); setOtp(["","","","","",""]); setOtpError(false); }} />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Verify Your Phone</h2>
            </div>
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
                  className={`w-11 min-w-0 flex-1 h-12 text-center text-lg font-bold rounded-xl border transition-all bg-white shadow-xs outline-none ${otpError ? "border-red-400 bg-red-50/50" : digit ? "border-emerald-600 ring-2 ring-emerald-600/10" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"} text-slate-900`}
                />
              ))}
            </div>
            {otpError && <p className="text-xs font-medium text-red-600 mb-3 flex items-center gap-1"><X className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />Invalid code. Please re-enter or resend.</p>}
            {!otpError && <p className="text-[11px] text-slate-400 mb-3 text-center">💡 Demo mode: Enter any 6 digits (e.g. 123456)</p>}
            <button
              onClick={() => {
                if (otp.join("").length === 6) {
                  const cleanPhone = phone.replace(/\D/g, "");
                  const phoneFormatted = `+60 ${phone}`;
                  const phoneEmail = `user_${cleanPhone}@phone.bingo.my`;
                  const residentName = `Resident (+60 ${phone})`;
                  try {
                    localStorage.setItem("bingo_username", residentName);
                    localStorage.setItem("bingo_user_email", phoneEmail);
                    localStorage.setItem("bingo_user_phone", phoneFormatted);
                  } catch {}

                  const userAccount: UserAccount = {
                    id: `phone_${cleanPhone}`,
                    name: residentName,
                    email: phoneEmail,
                    avatar: "📱",
                    bg: "bg-emerald-700 text-white",
                    zone: "Zone E – City of Elmina",
                    area: "Kanopi Residences, City of Elmina, 40160 Shah Alam, Selangor",
                    phone: phoneFormatted,
                    collectionDays: "Monday, Wednesday & Saturday",
                    provider: "phone",
                    lastLoginAt: Date.now(),
                  };
                  saveDeviceAccount(userAccount);
                  syncUserProfileToDb({
                    name: residentName,
                    email: phoneEmail,
                    phone: phoneFormatted,
                    zone: "Zone E – City of Elmina",
                    area: "Kanopi Residences, City of Elmina, 40160 Shah Alam, Selangor",
                  }).catch(() => {});

                  onDone(false, residentName);
                } else {
                  setOtpError(true);
                }
              }}
              className={`w-full py-3 rounded-xl text-xs font-semibold transition-all mb-4 shadow-sm cursor-pointer ${
                otp.join("").length === 6
                  ? "bg-emerald-700 text-white hover:bg-emerald-800 active:scale-[0.99]"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
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
            <div className="flex items-center gap-2 mb-4">
              <BackButton onClick={() => setScreen("login")} />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Forgot Password</h2>
            </div>
            <p className="text-xs text-slate-600 mt-1 mb-5">Enter your registered email and we'll send you a password recovery link.</p>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">Email Address</label>
            <div className="relative mb-5">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                aria-label="Password reset email" autoComplete="email" value={forgotEmail}
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
            <div className="flex items-center gap-2 mb-4">
              <BackButton onClick={() => setScreen("login")} />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Create Account</h2>
            </div>
            <p className="text-xs text-slate-600 mb-4">Start recycling with BinGo.</p>
            
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1 block">Full Name</label>
            <div className="relative mb-1">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.8} />
              <input type="text" aria-label="Full name" autoComplete="name" value={regName} onChange={e => { setRegName(e.target.value); if (regNameError) setRegNameError(""); }}
                onBlur={() => { if (!regName.trim()) setRegNameError("Full name is required."); else if (regName.trim().length < 2) setRegNameError("Name must be at least 2 characters."); else setRegNameError(""); }}
                placeholder="Enter your full name"
                className={`w-full h-11 bg-white border rounded-xl pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs leading-normal ${regNameError ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"}`} />
            </div>
            {regNameError ? <p className="text-[11px] font-medium text-red-600 mb-2 flex items-center gap-1"><X className="w-3 h-3 shrink-0" strokeWidth={2.5} />{regNameError}</p> : <div className="mb-2" />}

            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1 block">Email Address</label>
            <div className="relative mb-1">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.8} />
              <input type="text" aria-label="Registration email" autoComplete="email" value={regEmail} onChange={e => { setRegEmail(e.target.value.replace(/\s/g, "")); if (regEmailError) setRegEmailError(""); }}
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
              <input type="tel" inputMode="numeric" aria-label="Registration phone" autoComplete="tel-national" value={regPhone}
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
              <input type={regShowPw ? "text" : "password"} aria-label="Create password" autoComplete="new-password" value={regPassword}
                onChange={e => { setRegPassword(e.target.value.replace(/\s/g, "")); if (regPasswordError) setRegPasswordError(""); }}
                onBlur={() => { if (!regPassword) setRegPasswordError("Password is required."); else if (!regPwValid(regPassword)) setRegPasswordError("Must be 8-12 characters with at least one symbol."); else setRegPasswordError(""); }}
                placeholder="8-12 characters + symbol"
                className={`w-full h-11 bg-white border rounded-xl pl-10 pr-14 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs leading-normal ${regPasswordError ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"}`} />
              <button type="button" aria-label={regShowPw ? "Hide password" : "Show password"} onClick={() => setRegShowPw(v => !v)} className="icon-button password-toggle absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <AnimatedIcon name={regShowPw ? "eyeOff" : "eye"} className="w-4 h-4" />
              </button>
            </div>
            {regPasswordError ? <p className="text-[11px] font-medium text-red-600 mb-2 flex items-center gap-1"><X className="w-3 h-3 shrink-0" strokeWidth={2.5} />{regPasswordError}</p> : <div className="mb-2" />}

            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1 block">Confirm Password</label>
            <div className="relative mb-1">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.8} />
              <input type={regShowConfirmPw ? "text" : "password"} aria-label="Confirm password" autoComplete="new-password" value={regConfirmPw}
                onChange={e => { setRegConfirmPw(e.target.value.replace(/\s/g, "")); if (regConfirmPwError) setRegConfirmPwError(""); }}
                onBlur={() => { if (!regConfirmPw) setRegConfirmPwError("Please confirm your password."); else if (regConfirmPw !== regPassword) setRegConfirmPwError("Passwords do not match."); else setRegConfirmPwError(""); }}
                placeholder="Re-enter your password"
                className={`w-full h-11 bg-white border rounded-xl pl-10 pr-14 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs leading-normal ${regConfirmPwError ? "border-red-400 bg-red-50/20" : regConfirmPw && regConfirmPw === regPassword ? "border-emerald-500" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"}`} />
              <button type="button" aria-label={regShowConfirmPw ? "Hide confirmation password" : "Show confirmation password"} onClick={() => setRegShowConfirmPw(v => !v)} className="icon-button password-toggle absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <AnimatedIcon name={regShowConfirmPw ? "eyeOff" : "eye"} className="w-4 h-4" />
              </button>
            </div>
            {regConfirmPwError ? <p className="text-[11px] font-medium text-red-600 mb-3 flex items-center gap-1"><X className="w-3 h-3 shrink-0" strokeWidth={2.5} />{regConfirmPwError}</p>
              : regConfirmPw && regConfirmPw === regPassword ? <p className="text-[11px] font-medium text-emerald-700 mb-3 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />Passwords match</p>
              : <div className="mb-3" />}

            <label className="flex items-start gap-2.5 mb-2 cursor-pointer">
              <input type="checkbox" checked={agreeTerms}
                onChange={event => { setAgreeTerms(event.target.checked); setTermsAttempted(false); }}
                aria-invalid={termsAttempted && !agreeTerms}
                className="w-5 h-5 mt-0.5 shrink-0 accent-emerald-700" />
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
            <div className="flex items-center gap-2 mb-4">
              <BackButton onClick={() => setScreen("register")} />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Confirm Phone Number</h2>
            </div>
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
                  className={`w-11 min-w-0 flex-1 h-12 text-center text-lg font-bold rounded-xl border transition-all bg-white shadow-xs outline-none ${regOtpError ? "border-red-400 bg-red-50/50" : digit ? "border-emerald-600 ring-2 ring-emerald-600/10" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"} text-slate-900`} />
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
                    <button onClick={() => { setRegOtp(["","","","","",""]); setRegOtpError(false); setRegResendCount(c => c + 1); }} className="font-semibold text-emerald-700 hover:underline">Resend SMS</button>
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
          <div className="flex-1 px-5 pt-4 pb-6 flex flex-col justify-between overflow-y-auto bg-[#F4F8F5]">
            <div>
              {/* ── Segmented Control: Exactly 2 Options (Email vs Phone MY) ── */}
              <div className="bg-[#E4ECE6] p-1 rounded-2xl mb-5 flex items-center gap-1 shadow-2xs">
                <button
                  type="button"
                  aria-pressed={loginMethod === "email"} onClick={() => setLoginMethod("email")}
                  className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    loginMethod === "email"
                      ? "bg-white text-[#15803D] shadow-xs"
                      : "text-slate-700 hover:text-slate-900"
                  }`}
                >
                  <Mail className={`w-4 h-4 ${loginMethod === "email" ? "text-[#15803D]" : "text-slate-700"}`} strokeWidth={2} />
                  <span>Email</span>
                </button>
                <button
                  type="button"
                  aria-pressed={loginMethod === "phone"} onClick={() => setLoginMethod("phone")}
                  className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    loginMethod === "phone"
                      ? "bg-white text-[#15803D] shadow-xs"
                      : "text-slate-700 hover:text-slate-900"
                  }`}
                >
                  <Phone className={`w-4 h-4 ${loginMethod === "phone" ? "text-[#15803D]" : "text-slate-700"}`} strokeWidth={2} />
                  <span>Phone</span>
                </button>
              </div>

              {/* ── SIGN IN COLUMN: EMAIL OPTION ── */}
              {loginMethod === "email" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#1e5d3c] mb-1.5 block">
                      EMAIL
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800 pointer-events-none" strokeWidth={1.8} />
                      <input
                        type="email"
                        aria-label="Email address" autoComplete="username" value={email}
                        onChange={e => {
                          setEmail(e.target.value.replace(/\s/g, ""));
                          if (emailError) setEmailError("");
                        }}
                        placeholder="your@email.com"
                        className={`w-full h-12 bg-white border rounded-2xl pl-11 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs ${
                          emailError ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                        }`}
                      />
                    </div>
                    {emailError && <p className="text-[11px] font-medium text-red-600 mt-1">{emailError}</p>}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#1e5d3c] mb-1.5 block">
                      PASSWORD
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800 pointer-events-none" strokeWidth={1.8} />
                      <input
                        type={showPw ? "text" : "password"}
                        aria-label="Password" autoComplete="current-password" value={password}
                        onChange={e => {
                          setPassword(e.target.value);
                          if (passwordError) setPasswordError("");
                        }}
                        onKeyDown={e => {
                          if (e.key === "Enter") trySignIn();
                        }}
                        placeholder="••••••••"
                        className={`w-full h-12 bg-white border rounded-2xl pl-11 pr-14 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs ${
                          passwordError ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                        }`}
                      />
                      <button
                        type="button"
                        aria-label={showPw ? "Hide password" : "Show password"} onClick={() => setShowPw(v => !v)}
                        className="icon-button password-toggle absolute right-1 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        <AnimatedIcon name={showPw ? "eyeOff" : "eye"} className="w-4 h-4" />
                      </button>
                    </div>
                    {passwordError && <p className="text-[11px] font-medium text-red-600 mt-1">{passwordError}</p>}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer text-[#1e5d3c] font-semibold text-xs select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer accent-emerald-700"
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setScreen("forgot")}
                      className="text-xs font-bold text-[#1e5d3c] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={trySignIn}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-xs bg-[#15803D] hover:bg-[#166534] text-white cursor-pointer"
                  >
                    <span>Sign In →</span>
                  </button>
                </div>
              )}

              {/* ── SIGN IN COLUMN: PHONE OPTION ── */}
              {loginMethod === "phone" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#1e5d3c] mb-1.5 block">
                      PHONE NUMBER (MY)
                    </label>
                    <div className="flex gap-2">
                      <div className="h-12 bg-white border border-slate-200 rounded-2xl px-3.5 flex items-center gap-1.5 shrink-0 shadow-2xs">
                        <span className="text-sm">🇲🇾</span>
                        <span className="text-xs font-bold text-slate-800">+60</span>
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        aria-label="Malaysian mobile number" autoComplete="tel-national" value={phone}
                        onKeyDown={e => {
                          if (!/[\d]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"].includes(e.key)) {
                            e.preventDefault();
                          }
                          if (e.key === "Enter") tryPhoneOtp();
                        }}
                        onChange={e => {
                          setPhone(fmtPhone(e.target.value));
                          if (phoneError) setPhoneError("");
                        }}
                        placeholder="12-3456789"
                        className={`flex-1 h-12 bg-white border rounded-2xl px-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs ${
                          phoneError ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                        }`}
                      />
                    </div>
                    {phoneError && <p className="text-[11px] font-medium text-red-600 mt-1">{phoneError}</p>}
                  </div>

                  <button
                    type="button"
                    onClick={tryPhoneOtp}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-xs bg-[#15803D] hover:bg-[#166534] text-white cursor-pointer"
                  >
                    <span>Sign In →</span>
                  </button>
                </div>
              )}

              {/* ── OR DIVIDER ── */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] text-slate-400 font-medium tracking-wider">OR</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* ── CONTINUE WITH GOOGLE BUTTON (Exact match to image) ── */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 rounded-2xl py-3.5 text-sm font-semibold text-slate-800 shadow-xs transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <GoogleIcon size={5} />
                )}
                <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
              </button>

              {/* ── NEW TO BINGO? CREATE ACCOUNT ── */}
              <div className="mt-4 text-center">
                <span className="text-xs text-slate-700 font-medium">New to BinGo? </span>
                <button
                  type="button"
                  onClick={() => setScreen("register")}
                  className="text-xs font-bold text-[#15803D] hover:underline cursor-pointer"
                >
                  Create account
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
                        aria-label="Email address" autoComplete="username" value={email}
                        onChange={e => { setEmail(e.target.value.replace(/\s/g, "")); if (emailError) setEmailError(""); }}
                        placeholder="admin123@bingo.com"
                        className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        aria-label="Password" autoComplete="current-password" value={password}
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
                Your recycling, in one place.
              </p>
            </div>
          </div>
        </>
      )}

      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onMouseDown={event => { if (event.target === event.currentTarget && !googleLoading) setShowGoogleModal(false); }}>
          <section ref={googleDialogRef} role="dialog" aria-modal="true" aria-labelledby="google-dialog-title"
            aria-describedby="google-dialog-description" onKeyDown={handleGoogleDialogKeys}
            className="w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="flex items-center gap-2 font-bold text-emerald-800"><Leaf className="w-5 h-5" />BinGo</span>
              <button type="button" aria-label="Close account picker" disabled={googleLoading}
                onClick={() => setShowGoogleModal(false)} className="icon-button touch-target rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <h2 id="google-dialog-title" className="text-xl font-bold">Continue with Google</h2>
            <p id="google-dialog-description" className="mt-2 text-sm leading-relaxed text-slate-600">{googleAccounts.length ? "Choose a saved account." : "Continue to Google to sign in."}</p>
            {googleModalError && <div role="alert" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-950">{googleModalError}</div>}
            <div className="my-4 space-y-2">
              {googleAccounts.map(account => (
                  <button key={account.id} type="button" disabled={googleLoading}
                    onClick={() => handleSelectGoogleAccount(account)}
                    className="w-full flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-left hover:border-emerald-600 hover:bg-emerald-50 disabled:opacity-50">
                    <span aria-hidden="true" className="w-10 h-10 shrink-0 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">{account.name.charAt(0).toUpperCase()}</span>
                    <span className="min-w-0 flex-1"><span className="block font-semibold truncate">{account.name}</span><span className="block text-sm text-slate-600 break-all">{account.email}</span></span>
                    <ChevronDown aria-hidden="true" className="w-4 h-4 -rotate-90 shrink-0" />
                  </button>
                ))}
            </div>
            <button type="button" disabled={googleLoading} onClick={() => completeGoogleSignIn()}
              className="w-full min-h-12 rounded-xl border border-slate-300 px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
              <GoogleIcon size={5} />{googleLoading ? "Connecting to Google…" : googleAccounts.length ? "Use another Google account" : "Continue to Google"}
            </button>
            <DetailsDisclosure label="Account history"><p>Saved accounts stay on this browser. A different device or site address has its own history.</p></DetailsDisclosure>
          </section>
        </div>
      )}
    </AuthShell>
  );
}
