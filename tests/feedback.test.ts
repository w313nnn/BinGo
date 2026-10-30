import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { transformSync } = require("esbuild");
const source = readFileSync(new URL("../src/firebase.ts", import.meta.url), "utf8");
const js = transformSync(source.slice(source.indexOf("export interface ResidentFeedback")).replace(/export /g, ""), {loader:"ts",format:"cjs"}).code;
const auth: any = { currentUser: null }; let saved: any; let failure: any; let success: any; let stopped = false;
const api = new Function("requireLiveSession", "auth", "db", "collection", "addDoc", "serverTimestamp", "onSnapshot", js + ";return {submitFeedbackToDb,subscribeToFeedback};")(
 () => {}, auth, {}, (_: any, path: string) => path,
 async (path: string, data: any) => { saved = {path,data}; }, () => "SERVER_TIME",
 (_: any, next: any, error: any) => {success=next;failure=error;return()=>{stopped=true;};});
await assert.rejects(api.submitFeedbackToDb(5,"hello"), /Sign in/);
auth.currentUser={uid:"resident-A",displayName:"Resident A",email:"a@example.invalid"};
for(const rating of [0,6,1.5,NaN]) await assert.rejects(api.submitFeedbackToDb(rating,"hello"), /rating/);
await assert.rejects(api.submitFeedbackToDb(5,"a".repeat(1001)),/1,000/);
await api.submitFeedbackToDb(4,"  Useful app  ");
assert.deepEqual(saved,{path:"feedback",data:{ownerUid:"resident-A",name:"Resident A",rating:4,text:"Useful app",createdAt:"SERVER_TIME"}});
let items:any;let error:any;
const unsubscribe=api.subscribeToFeedback((value:any)=>items=value,(value:any)=>error=value);
success({docs:[{id:"old",data:()=>({name:"A",rating:3,text:"old",createdAt:{toMillis:()=>1}})},{id:"new",data:()=>({name:"B",rating:5,text:"new",createdAt:{toMillis:()=>2}})}]});
assert.deepEqual(items.map((item:any)=>item.id),["new","old"]);
const denied=new Error("permission-denied"); failure(denied);assert.equal(error,denied);unsubscribe();assert.equal(stopped,true);
console.log("PASS: feedback authentication, validation, ownership, timestamp, sorting, error propagation and cleanup (mocked Firestore).");
