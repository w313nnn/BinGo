// Run only in a trusted project-owner environment. Never include this in the browser app.
import {readFile} from "node:fs/promises";
const args=process.argv.slice(2);
if(args.includes("--help")) {
  console.log("Usage: node grant-admin.mjs --email admin123@bingo.com [--grant]\nWithout --grant this only checks the account. Uses Application Default Credentials. Create the account in Firebase Authentication first; no passwords are read or stored by this script.");
  process.exit(0);
}
const email=args[args.indexOf("--email")+1];
if(!args.includes("--email")||!email||!email.includes("@")) throw new Error("Provide --email with the exact administrator account.");
const config=JSON.parse(await readFile(new URL("../../firebase-applet-config.json",import.meta.url),"utf8"));
const {initializeApp,applicationDefault}=await import("firebase-admin/app");
const {getAuth}=await import("firebase-admin/auth");
initializeApp({credential:applicationDefault(),projectId:config.projectId});
const auth=getAuth();
let user;
try { user=await auth.getUserByEmail(email); }
catch(error) { if(error.code==="auth/user-not-found") throw new Error("This account does not exist. In Firebase Console → Authentication → Users, create the administrator account, then rerun this command.");throw error; }
if(user.disabled) throw new Error("The administrator account is disabled. Review it in Firebase Console first.");
console.log(`Project: ${config.projectId}\nAccount: ${user.email}\nUID: ${user.uid}\nAdmin claim: ${user.customClaims?.admin===true}`);
if(args.includes("--grant")) {
  await auth.setCustomUserClaims(user.uid,{...user.customClaims,admin:true});
  const verified=await auth.getUser(user.uid);
  if(verified.customClaims?.admin!==true)throw new Error("Admin claim could not be confirmed.");
  console.log("Admin role confirmed. Sign out of BinGo, then sign in using this account's current password.");
} else console.log("Read-only check. Add --grant to assign the administrator role to this exact account.");
