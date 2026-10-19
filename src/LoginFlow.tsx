import { L, localizeText } from "./i18n";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, X, Lock, CheckCircle2, Mail, User, Phone, Eye, EyeOff, Leaf, Recycle,
  ChevronDown, Check, Info, Globe, Sparkles, MapPin, ExternalLink,
} from "lucide-react";
import { getDeviceAccounts, saveDeviceAccount, removeDeviceAccount, UserAccount } from "./appData";
import BackButton from "./BackButton";
import AnimatedIcon from "./AnimatedIcon";
import BrandIdentity from "./BrandIdentity";
import GreenOrb from "./GreenOrb";
import DetailsDisclosure from "./DetailsDisclosure";
import { auth, resolveAdminAccess, syncUserProfileToDb } from "./firebase";
import { GoogleAuthProvider, getRedirectResult, signInWithPopup, signInWithRedirect, type User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";

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
      {localizeText(children)}
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

      <motion.div initial={{opacity: 0, y: 4}} animate={{opacity: 1, y: 0}} transition={{duration: .35}}>
        <BrandIdentity />
      </motion.div>
    </div>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-[11px] text-slate-400 font-medium tracking-wider"><L>{"OR"}</L></span>
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
      {localizeText(loading ? (
        <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        <GoogleIcon size={4} />
      ))}
      <span className="group-hover:text-slate-900">
        {localizeText(loading ? "Connecting with Google..." : "Continue with Google")}
      </span>
    </button>
  );
}

export default function LoginFlow({ onDone, onDemo }: { onDone: (isAdmin?: boolean, displayName?: string) => void; onDemo: () => Promise<void> }) {
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
  const [authBusy, setAuthBusy] = useState(false);
  const authLock = useRef(false);
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
        const { email: e } = JSON.parse(saved);
        setEmail(e ?? ""); setRememberMe(true);
        localStorage.setItem("bingo_remember", JSON.stringify({email: e || ""}));
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

  async function trySignIn() {
    if (authLock.current) return;
    if (!emailFmt(email)) { setEmailError("Enter a valid email address."); return; }
    if (!password) { setPasswordError("Enter your password."); return; }
    authLock.current = true; setAuthBusy(true); setPasswordError("");
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const adminAccess = await resolveAdminAccess(result.user, true);
      if ((showAdminLogin || result.user.email?.toLowerCase() === ADMIN_EMAIL) && !adminAccess) {
        await signOut(auth); throw new Error("Administrator access could not be verified. Use the latest integrated version and check the active admin role in the configured database.");
      }
      if (adminAccess) removeDeviceAccount(result.user.email || "");
      if (rememberMe) localStorage.setItem("bingo_remember", JSON.stringify({email: email.trim()}));
      else localStorage.removeItem("bingo_remember");
      localStorage.removeItem("bingo_users");
      const name = result.user.displayName || result.user.email?.split("@")[0] || "Resident";
      localStorage.setItem("bingo_username", name);
      localStorage.setItem("bingo_user_email", result.user.email || "");
      onDone(adminAccess, name);
    } catch (error) {
      const code = (error as {code?: string}).code;
      setPasswordError(showAdminLogin && (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") ? "Administrator sign-in failed. Check that the account exists in Firebase Authentication and use its current password."
        : code === "auth/operation-not-allowed" ? "Email sign-in is not enabled. Use Google or contact the project owner."
        : code?.startsWith("auth/") ? "Sign-in failed. Check your credentials and try again." : error instanceof Error ? error.message : "Sign-in failed.");
    } finally { authLock.current = false; setAuthBusy(false); }
  }
  async function registerAccount() {
    if (authLock.current) return;
    if (!agreeTerms) { setTermsAttempted(true); return; }
    if (!regValid) return;
    authLock.current = true; setAuthBusy(true); setRegEmailError("");
    try {
      const result = await createUserWithEmailAndPassword(auth, regEmail.trim(), regPassword);
      await updateProfile(result.user, {displayName: regName.trim()});
      await syncUserProfileToDb({name: regName.trim(), email: result.user.email || "", phone: regPhone, zone: "", area: ""});
      localStorage.setItem("bingo_username", regName.trim());
      localStorage.removeItem("bingo_users");
      onDone(false, regName.trim());
    } catch (error) {
      const code = (error as {code?: string}).code;
      setRegEmailError(code === "auth/email-already-in-use" ? "This email is already registered. Sign in instead."
        : code === "auth/operation-not-allowed" ? "Email/password registration is disabled in the connected Firebase project. Ask the project owner to enable it in Authentication → Sign-in method."
        : auth.currentUser ? "Your account was created, but profile setup failed. Sign in to finish your profile; you do not need to register again."
        : "Account setup could not be completed. Please try again.");
    } finally { authLock.current = false; setAuthBusy(false); }
  }

  function tryPhoneOtp() { setPasswordError("SMS sign-in is not configured. Please use email or Google."); setLoginMethod("email"); }


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
      zone: "",
      area: "",
      phone: user.phoneNumber || "",
      collectionDays: "",
      provider: "google",
      lastLoginAt: Date.now(),
    };

    const adminAccess = await resolveAdminAccess(user, true);
    if (adminAccess) {
      removeDeviceAccount(account.email);
      setDeviceAccounts(getDeviceAccounts());
      setShowGoogleModal(false);
      onDone(true, name);
      return;
    }
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
      {/* ── Screen: Forgot Password ── */}
      {localizeText(screen === "forgot" && (
        <>
          <AuthHero />
          <div className="flex-1 px-6 pt-5 pb-6 flex flex-col overflow-y-auto bg-slate-50">
            <div className="flex items-center gap-2 mb-4">
              <BackButton onClick={() => setScreen("login")} />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight"><L>{"Forgot Password"}</L></h2>
            </div>
            <p className="text-xs text-slate-600 mt-1 mb-5"><L>{"Enter your registered email and we'll send you a password recovery link."}</L></p>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block"><L>{"Email Address"}</L></label>
            <div className="relative mb-5">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                aria-label={localizeText("Password reset email")} autoComplete="email" value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                placeholder={localizeText("name@email.com")}
                className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-xs outline-none focus:border-emerald-600"
              />
            </div>
            {localizeText(forgotSent ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-700 mx-auto mb-1" />
                <p className="text-xs font-bold text-emerald-900"><L>{"Recovery link sent!"}</L></p>
                <p className="text-[11px] text-emerald-700 mt-0.5"><L>{"Please check your inbox or spam folder."}</L></p>
              </div>
            ) : (
              <button
                type="button"
                disabled={!forgotValid || authBusy}
                onClick={async () => { if (authLock.current) return; authLock.current = true; setAuthBusy(true); try { await sendPasswordResetEmail(auth, forgotEmail.trim()); setForgotSent(true); } catch { setEmailError("Could not send the recovery email. Try again."); } finally {authLock.current = false; setAuthBusy(false);} }}
                className={`w-full py-3 rounded-xl text-xs font-semibold shadow-xs ${forgotValid ? "bg-emerald-700 text-white hover:bg-emerald-800" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
              >
                {localizeText(authBusy ? "Sending…" : "Send Recovery Link")}
              </button>
            ))}
            {localizeText(emailError && <p role="alert" className="text-xs text-red-700 mt-2">{localizeText(emailError)}</p>)}

          </div>
        </>
      ))}

      {/* ── Screen: Create Account (Register) ── */}
      {localizeText(screen === "register" && (
        <>
          <AuthHero />
          <div className="flex-1 px-6 pt-5 pb-6 flex flex-col overflow-y-auto bg-slate-50">
            <div className="flex items-center gap-2 mb-4">
              <BackButton onClick={() => setScreen("login")} />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight"><L>{"Create Account"}</L></h2>
            </div>
            <p className="text-xs text-slate-600 mb-4"><L>{"Start recycling with BinGo."}</L></p>
            
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1 block"><L>{"Full Name"}</L></label>
            <div className="relative mb-1">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.8} />
              <input type="text" aria-label={localizeText("Full name")} autoComplete="name" value={regName} onChange={e => { setRegName(e.target.value); if (regNameError) setRegNameError(""); }}
                onBlur={() => { if (!regName.trim()) setRegNameError("Full name is required."); else if (regName.trim().length < 2) setRegNameError("Name must be at least 2 characters."); else setRegNameError(""); }}
                placeholder={localizeText("Enter your full name")}
                className={`w-full h-11 bg-white border rounded-xl pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs leading-normal ${regNameError ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"}`} />
            </div>
            {localizeText(regNameError ? <p className="text-[11px] font-medium text-red-600 mb-2 flex items-center gap-1"><X className="w-3 h-3 shrink-0" strokeWidth={2.5} />{localizeText(regNameError)}</p> : <div className="mb-2" />)}

            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1 block"><L>{"Email Address"}</L></label>
            <div className="relative mb-1">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.8} />
              <input type="text" aria-label={localizeText("Registration email")} autoComplete="email" value={regEmail} onChange={e => { setRegEmail(e.target.value.replace(/\s/g, "")); if (regEmailError) setRegEmailError(""); }}
                onBlur={() => { if (!regEmail.trim()) setRegEmailError("Email is required."); else if (!emailFmt(regEmail)) setRegEmailError(emailErrMsg(regEmail)); else if (regEmail.trim().toLowerCase() === "admin123@bingo.com") setRegEmailError("This email address cannot be registered."); else setRegEmailError(""); }}
                placeholder={localizeText("your@email.com")}
                className={`w-full h-11 bg-white border rounded-xl pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs leading-normal ${regEmailError ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"}`} />
            </div>
            {localizeText(regEmailError ? <p className="text-[11px] font-medium text-red-600 mb-2 flex items-center gap-1"><X className="w-3 h-3 shrink-0" strokeWidth={2.5} />{localizeText(regEmailError)}</p> : <div className="mb-2" />)}

            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1 block"><L>{"Phone Number"}</L></label>
            <div className="flex gap-2 mb-1">
              <div className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex items-center gap-1.5 shrink-0 shadow-xs">
                <span className="text-xs">🇲🇾</span><span className="text-xs font-semibold text-slate-700">+60</span>
              </div>
              <input type="tel" inputMode="numeric" aria-label={localizeText("Registration phone")} autoComplete="tel-national" value={regPhone}
                onKeyDown={e => { if (!/[\d]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab"].includes(e.key)) e.preventDefault(); }}
                onChange={e => { setRegPhone(fmtPhone(e.target.value)); if (regPhoneError) setRegPhoneError(""); }}
                onBlur={() => { const d = regPhone.replace(/\D/g, ""); if (!regPhone.trim()) setRegPhoneError("Phone number is required."); else if (d.length < 9 || d.length > 10) setRegPhoneError("Must be a valid Malaysian phone number."); else setRegPhoneError(""); }}
                placeholder={localizeText("12-3456789")}
                className={`flex-1 h-11 bg-white border rounded-xl px-3.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs leading-normal ${regPhoneError ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"}`} />
            </div>
            {localizeText(regPhoneError ? <p className="text-[11px] font-medium text-red-600 mb-2 flex items-center gap-1"><X className="w-3 h-3 shrink-0" strokeWidth={2.5} />{localizeText(regPhoneError)}</p> : <div className="mb-2" />)}

            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1 block"><L>{"Password"}</L></label>
            <div className="relative mb-1">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.8} />
              <input type={regShowPw ? "text" : "password"} aria-label={localizeText("Create password")} autoComplete="new-password" value={regPassword}
                onChange={e => { setRegPassword(e.target.value.replace(/\s/g, "")); if (regPasswordError) setRegPasswordError(""); }}
                onBlur={() => { if (!regPassword) setRegPasswordError("Password is required."); else if (!regPwValid(regPassword)) setRegPasswordError("Must be 8-12 characters with at least one symbol."); else setRegPasswordError(""); }}
                placeholder={localizeText("8-12 characters + symbol")}
                className={`w-full h-11 bg-white border rounded-xl pl-10 pr-14 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs leading-normal ${regPasswordError ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"}`} />
              <button type="button" aria-label={localizeText(regShowPw ? "Hide password" : "Show password")} onClick={() => setRegShowPw(v => !v)} className="icon-button password-toggle absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <AnimatedIcon name={regShowPw ? "eyeOff" : "eye"} className="w-4 h-4" />
              </button>
            </div>
            {localizeText(regPasswordError ? <p className="text-[11px] font-medium text-red-600 mb-2 flex items-center gap-1"><X className="w-3 h-3 shrink-0" strokeWidth={2.5} />{localizeText(regPasswordError)}</p> : <div className="mb-2" />)}

            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1 block"><L>{"Confirm Password"}</L></label>
            <div className="relative mb-1">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.8} />
              <input type={regShowConfirmPw ? "text" : "password"} aria-label={localizeText("Confirm password")} autoComplete="new-password" value={regConfirmPw}
                onChange={e => { setRegConfirmPw(e.target.value.replace(/\s/g, "")); if (regConfirmPwError) setRegConfirmPwError(""); }}
                onBlur={() => { if (!regConfirmPw) setRegConfirmPwError("Please confirm your password."); else if (regConfirmPw !== regPassword) setRegConfirmPwError("Passwords do not match."); else setRegConfirmPwError(""); }}
                placeholder={localizeText("Re-enter your password")}
                className={`w-full h-11 bg-white border rounded-xl pl-10 pr-14 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs leading-normal ${regConfirmPwError ? "border-red-400 bg-red-50/20" : regConfirmPw && regConfirmPw === regPassword ? "border-emerald-500" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"}`} />
              <button type="button" aria-label={localizeText(regShowConfirmPw ? "Hide confirmation password" : "Show confirmation password")} onClick={() => setRegShowConfirmPw(v => !v)} className="icon-button password-toggle absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <AnimatedIcon name={regShowConfirmPw ? "eyeOff" : "eye"} className="w-4 h-4" />
              </button>
            </div>
            {localizeText(regConfirmPwError ? <p className="text-[11px] font-medium text-red-600 mb-3 flex items-center gap-1"><X className="w-3 h-3 shrink-0" strokeWidth={2.5} />{localizeText(regConfirmPwError)}</p>
              : regConfirmPw && regConfirmPw === regPassword ? <p className="text-[11px] font-medium text-emerald-700 mb-3 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} /><L>{"Passwords match"}</L></p>
              : <div className="mb-3" />)}

            <label className="flex items-start gap-2.5 mb-2 cursor-pointer">
              <input type="checkbox" checked={agreeTerms}
                onChange={event => { setAgreeTerms(event.target.checked); setTermsAttempted(false); }}
                aria-invalid={termsAttempted && !agreeTerms}
                className="w-5 h-5 mt-0.5 shrink-0 accent-emerald-700" />
              <span className={`text-xs leading-snug ${termsAttempted && !agreeTerms ? "text-red-600 font-medium" : "text-slate-600"}`}><L>{"I agree to the "}</L><strong className="text-slate-900"><L>{"Terms of Service"}</L></strong><L>{" and "}</L><strong className="text-slate-900"><L>{"Privacy Policy"}</L></strong>
              </span>
            </label>
            {localizeText(termsAttempted && !agreeTerms && <p className="text-[11px] font-medium text-red-600 mb-3 flex items-center gap-1"><X className="w-3 h-3 shrink-0" strokeWidth={2.5} /><L>{"You must accept terms to proceed."}</L></p>)}

            <button disabled={authBusy} onClick={registerAccount}
              className={`w-full py-3 rounded-xl text-xs font-semibold transition-all mb-2 shadow-sm ${regValid ? "bg-emerald-700 text-white hover:bg-emerald-800" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}><L>{"Create Account"}</L></button>
            <OrDivider />
            <GoogleButton onClick={handleGoogleSignIn} loading={googleLoading} />
            <p className="text-xs text-slate-600 text-center mt-3"><L>{"Already registered?"}</L>{localizeText(" ")}<button onClick={() => setScreen("login")} className="font-semibold text-emerald-700 hover:underline"><L>{"Sign In"}</L></button></p>
          </div>
        </>
      ))}

      {/* ── Screen: Main Login Screen ── */}
      {localizeText(screen === "login" && (
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
                  <span><L>{"Email"}</L></span>
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
                  <span><L>{"Phone"}</L></span>
                </button>
              </div>

              {/* ── SIGN IN COLUMN: EMAIL OPTION ── */}
              {localizeText(loginMethod === "email" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#1e5d3c] mb-1.5 block"><L>{"EMAIL"}</L></label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800 pointer-events-none" strokeWidth={1.8} />
                      <input
                        type="email"
                        aria-label={localizeText("Email address")} autoComplete="username" value={email}
                        onChange={e => {
                          setEmail(e.target.value.replace(/\s/g, ""));
                          if (emailError) setEmailError("");
                        }}
                        placeholder={localizeText("your@email.com")}
                        className={`w-full h-12 bg-white border rounded-2xl pl-11 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs ${
                          emailError ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                        }`}
                      />
                    </div>
                    {localizeText(emailError && <p className="text-[11px] font-medium text-red-600 mt-1">{localizeText(emailError)}</p>)}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#1e5d3c] mb-1.5 block"><L>{"PASSWORD"}</L></label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800 pointer-events-none" strokeWidth={1.8} />
                      <input
                        type={showPw ? "text" : "password"}
                        aria-label={localizeText("Password")} autoComplete="current-password" value={password}
                        onChange={e => {
                          setPassword(e.target.value);
                          if (passwordError) setPasswordError("");
                        }}
                        onKeyDown={e => {
                          if (e.key === "Enter") trySignIn();
                        }}
                        placeholder={localizeText("••••••••")}
                        className={`w-full h-12 bg-white border rounded-2xl pl-11 pr-14 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs ${
                          passwordError ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                        }`}
                      />
                      <button
                        type="button"
                        aria-label={localizeText(showPw ? "Hide password" : "Show password")} onClick={() => setShowPw(v => !v)}
                        className="icon-button password-toggle absolute right-1 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        <AnimatedIcon name={showPw ? "eyeOff" : "eye"} className="w-4 h-4" />
                      </button>
                    </div>
                    {localizeText(passwordError && <p className="text-[11px] font-medium text-red-600 mt-1">{localizeText(passwordError)}</p>)}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer text-[#1e5d3c] font-semibold text-xs select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer accent-emerald-700"
                      />
                      <span><L>{"Remember me"}</L></span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setScreen("forgot")}
                      className="text-xs font-bold text-[#1e5d3c] hover:underline cursor-pointer"
                    ><L>{"Forgot password?"}</L></button>
                  </div>

                  <button
                    type="button"
                    disabled={authBusy} onClick={trySignIn}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-xs bg-[#15803D] hover:bg-[#166534] text-white cursor-pointer"
                  >
                    <span><L>{"Sign In →"}</L></span>
                  </button>
                </div>
              ))}

              {/* ── SIGN IN COLUMN: PHONE OPTION ── */}
              {localizeText(loginMethod === "phone" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#1e5d3c] mb-1.5 block"><L>{"PHONE NUMBER (MY)"}</L></label>
                    <div className="flex gap-2">
                      <div className="h-12 bg-white border border-slate-200 rounded-2xl px-3.5 flex items-center gap-1.5 shrink-0 shadow-2xs">
                        <span className="text-sm">🇲🇾</span>
                        <span className="text-xs font-bold text-slate-800">+60</span>
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        aria-label={localizeText("Malaysian mobile number")} autoComplete="tel-national" value={phone}
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
                        placeholder={localizeText("12-3456789")}
                        className={`flex-1 h-12 bg-white border rounded-2xl px-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs ${
                          phoneError ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                        }`}
                      />
                    </div>
                    {localizeText(phoneError && <p className="text-[11px] font-medium text-red-600 mt-1">{localizeText(phoneError)}</p>)}
                  </div>

                  <button
                    type="button"
                    onClick={tryPhoneOtp}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-xs bg-[#15803D] hover:bg-[#166534] text-white cursor-pointer"
                  >
                    <span><L>{"Sign In →"}</L></span>
                  </button>
                </div>
              ))}

              {/* ── OR DIVIDER ── */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] text-slate-400 font-medium tracking-wider"><L>{"OR"}</L></span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* ── CONTINUE WITH GOOGLE BUTTON (Exact match to image) ── */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 rounded-2xl py-3.5 text-sm font-semibold text-slate-800 shadow-xs transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {localizeText(googleLoading ? (
                  <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <GoogleIcon size={5} />
                ))}
                <span>{localizeText(googleLoading ? "Connecting to Google..." : "Continue with Google")}</span>
              </button>

              <button type="button" disabled={authBusy || googleLoading} onClick={() => { if (authLock.current) return; authLock.current=true; setAuthBusy(true); void onDemo().finally(() => {authLock.current=false;setAuthBusy(false);}); }} className="w-full mt-3 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold cursor-pointer"><L>Try demo account</L></button>
              <p className="text-[10px] text-center text-slate-500 mt-1"><L>Explore sample reports, recycling history and collections. No password needed.</L></p>

              {/* ── NEW TO BINGO? CREATE ACCOUNT ── */}
              <div className="mt-4 text-center">
                <span className="text-xs text-slate-700 font-medium"><L>{"New to BinGo? "}</L></span>
                <button
                  type="button"
                  onClick={() => setScreen("register")}
                  className="text-xs font-bold text-[#15803D] hover:underline cursor-pointer"
                ><L>{"Create account"}</L></button>
              </div>

              {/* Municipal Staff Login Section */}
              <div className="mt-5 pt-3.5 border-t border-slate-200">
                {localizeText(!showAdminLogin ? (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowAdminLogin(true)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3" />
                      <span><L>{"Municipal Staff Login"}</L></span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-700" />
                        <span><L>{"Municipal Administration"}</L></span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAdminLogin(false)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
                      ><L>{"Hide"}</L></button>
                    </div>

                    <div>
                      <input
                        type="email"
                        aria-label={localizeText("Email address")} autoComplete="username" value={email}
                        onChange={e => { setEmail(e.target.value.replace(/\s/g, "")); if (emailError) setEmailError(""); }}
                        placeholder={localizeText("admin123@bingo.com")}
                        className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        aria-label={localizeText("Password")} autoComplete="current-password" value={password}
                        onChange={e => { setPassword(e.target.value); if (passwordError) setPasswordError(""); }}
                        placeholder={localizeText("••••••••")}
                        className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs outline-none focus:border-emerald-600"
                      />
                    </div>
                    {localizeText(passwordError && <p className="text-[10px] text-red-600">{localizeText(passwordError)}</p>)}
                    <p className="text-[10px] text-slate-500"><L>Use a Firebase account assigned an administrator role. A sample email alone does not grant access.</L></p>
                    <button
                      type="button"
                      disabled={authBusy} onClick={trySignIn}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                    ><L>{"Enter Municipal Panel"}</L></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom info */}
            <div className="pt-3 text-center">
              <p className="text-[11px] text-slate-500 leading-snug"><L>{"Your recycling, in one place."}</L></p>
            </div>
          </div>
        </>
      ))}

      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onMouseDown={event => { if (event.target === event.currentTarget && !googleLoading) setShowGoogleModal(false); }}>
          <section ref={googleDialogRef} role="dialog" aria-modal="true" aria-labelledby="google-dialog-title"
            aria-describedby="google-dialog-description" onKeyDown={handleGoogleDialogKeys}
            className="w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="flex items-center gap-2 font-bold text-emerald-800"><Leaf className="w-5 h-5" /><L>{"BinGo"}</L></span>
              <button type="button" aria-label={localizeText("Close account picker")} disabled={googleLoading}
                onClick={() => setShowGoogleModal(false)} className="icon-button touch-target rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <h2 id="google-dialog-title" className="text-xl font-bold"><L>{"Continue with Google"}</L></h2>
            <p id="google-dialog-description" className="mt-2 text-sm leading-relaxed text-slate-600">{localizeText(googleAccounts.length ? "Choose a saved account." : "Continue to Google to sign in.")}</p>
            {localizeText(googleModalError && <div role="alert" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-950">{localizeText(googleModalError)}</div>)}
            <div className="my-4 space-y-2">
              {googleAccounts.map(account => (
                  <button key={account.id} type="button" disabled={googleLoading}
                    onClick={() => handleSelectGoogleAccount(account)}
                    className="w-full flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-left hover:border-emerald-600 hover:bg-emerald-50 disabled:opacity-50">
                    <span aria-hidden="true" className="w-10 h-10 shrink-0 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">{localizeText(account.name.charAt(0).toUpperCase())}</span>
                    <span className="min-w-0 flex-1"><span className="block font-semibold truncate">{localizeText(account.name)}</span><span className="block text-sm text-slate-600 break-all">{account.email}</span></span>
                    <ChevronDown aria-hidden="true" className="w-4 h-4 -rotate-90 shrink-0" />
                  </button>
                ))}
            </div>
            <button type="button" disabled={googleLoading} onClick={() => completeGoogleSignIn()}
              className="w-full min-h-12 rounded-xl border border-slate-300 px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
              <GoogleIcon size={5} />{localizeText(googleLoading ? "Connecting to Google…" : googleAccounts.length ? "Use another Google account" : "Continue to Google")}
            </button>
            <DetailsDisclosure label={localizeText("Account history")}><p><L>{"Saved accounts stay on this browser. A different device or site address has its own history."}</L></p></DetailsDisclosure>
          </section>
        </div>
      )}
    </AuthShell>
  );
}
