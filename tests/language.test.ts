import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const storage=new Map<string,string>();
Object.assign(globalThis,{document:{documentElement:{lang:"en"}},localStorage:{getItem:(key:string)=>storage.get(key)||null,setItem:(key:string,value:string)=>storage.set(key,value)}});
const {localizeText,setAppLanguage,currentLocale}=await import("../src/i18n.tsx");
const dictionary=JSON.parse(readFileSync(new URL("../src/locales/ms.json",import.meta.url),"utf8"));
setAppLanguage("en");
for(const text of Object.keys(dictionary)) assert.equal(localizeText(text),text,"English text must remain exact");
assert.equal(currentLocale("en-US"),"en-US");
setAppLanguage("ms");
assert.equal(document.documentElement.lang,"ms");assert.equal(storage.get("bingo_language"),"ms");
for(const [text,translation] of Object.entries(dictionary)) assert.equal(localizeText(text),translation,"Malay phrase: "+text);
assert.equal(localizeText("Ganjaran: 0 green points"),"Ganjaran: 0 Mata Hijau");
assert.equal(localizeText("7:00 AM"),"7:00 pagi");assert.equal(localizeText("8:30 PM"),"8:30 malam");assert.equal(localizeText("12:00 PM"),"12:00 tengah hari");
assert.equal(currentLocale("en-US"),"ms-MY");
assert.equal(localizeText("Wei En Lee"),"Wei En Lee");assert.equal(localizeText("admin123@bingo.com"),"admin123@bingo.com");
assert.equal(localizeText(42),42);assert.deepEqual(localizeText({status:"Requested"}),{status:"Requested"});
const canonical=["Requested","Approved","Assigned","Collected","Cancelled"];
assert.deepEqual(localizeText(canonical),["Dimohon","Diluluskan","Ditugaskan","Dikutip","Dibatalkan"]);assert.equal(canonical[0],"Requested");
const source=readFileSync(new URL("../src/App.tsx",import.meta.url),"utf8");
const guide=source.slice(source.indexOf("export const MANUAL_GUIDE_ITEMS"),source.indexOf("export default function App"));
for(const field of ["name","rule","bin","route"]){
 for(const match of guide.matchAll(new RegExp(field+': "([^"\\n]+)"',"g"))) assert.ok(dictionary[match[1]],"Missing material translation: "+match[1]);
}
setAppLanguage("en");assert.equal(localizeText("Sorting rule"),"Sorting rule");
console.log(`PASS: ${Object.keys(dictionary).length} Malay phrases, exact English fallback, locale persistence, time labels, immutable stored statuses, and material-field coverage.`);
