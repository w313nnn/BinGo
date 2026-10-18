import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { validatePickupBooking, pickupBookingFailure, PickupBookingError } from '../src/pickupBookingSupport.ts';
const require = createRequire(new URL('../package.json',import.meta.url));
const { transformSync } = require('esbuild');
const dir = new URL('../',import.meta.url);
for (const file of ['src/firebase.ts','src/App.tsx','src/pickupBookingSupport.ts']) transformSync(readFileSync(new URL(file,dir),'utf8'),{loader:file.endsWith('tsx')?'tsx':'ts',format:'esm'});
const source=readFileSync(new URL('src/firebase.ts',dir),'utf8').replace(/\r\n/g,'\n');
const chunk=source.slice(source.indexOf('export async function addPickupBookingToDb('),source.indexOf('/**\n * Retrieve all pickup requests'));
const js=transformSync(chunk.replace(/export /g,''),{loader:'ts',format:'cjs'}).code;
let auth:any={currentUser:{uid:'resident-A'}};
let docs=new Map<string,any>(), writes=0, denyRead=false,denyCommit=false,lastQuery:any, subscriptionError:any;
const denied=()=>Object.assign(new Error('Missing or insufficient permissions.'),{code:'permission-denied'});
const bindings:any={auth,db:{},app:{options:{projectId:'test-project'}},bookingDatabaseId:'named-test-db',validatePickupBooking,pickupBookingFailure,
 doc:(_:any,path:string,id:string)=>`${path}/${id}`,
 serverTimestamp:()=>({serverTimestamp:true}),
 runTransaction:async(_:any,fn:any)=>{let pending:any[]=[];const result=await fn({get:async(ref:string)=>{if(denyRead)throw denied();return {exists:()=>docs.has(ref),data:()=>docs.get(ref)};},set:(ref:string,value:any)=>pending.push([ref,value])});if(denyCommit)throw denied();for(const [ref,value]of pending){docs.set(ref,value);writes++;}return result;},
 collection:(_:any,path:string)=>path,where:(...args:any[])=>args,query:(...args:any[])=>args,
 getDocs:async(q:any)=>{lastQuery=q;return{docs:[]};},
 onSnapshot:(q:any,_success:any,error:any)=>{lastQuery=q;subscriptionError=error;return()=>{};},mapPickupBookingFromFirestore:()=>({})};
const factory=new Function(...Object.keys(bindings),js+';return {addPickupBookingToDb,getPickupBookingsForResident,subscribeToPickupBookingsForResident};');
const api=factory(...Object.values(bindings));
const booking={residentName:'Test Resident',residentEmail:'test@example.invalid',recyclingSubmissionId:'submission-1',pickupAddress:'  Test Address  ',pickupDate:'2026-10-20',pickupTime:'09:30'};
let passed=0;
const check=(fn:()=>void)=>{fn();passed++;};
check(()=>assert.equal(validatePickupBooking('submission-1',booking).pickupAddress,'Test Address'));
for(const [id,change]of [['bad/id',{}],['wrong-id',{}],['submission-1',{pickupAddress:' '}],['submission-1',{pickupAddress:'a'.repeat(501)}],['submission-1',{pickupDate:'2026-02-30'}],['submission-1',{pickupDate:'20/10/2026'}],['submission-1',{pickupTime:'24:30'}],['submission-1',{pickupTime:'9:30'}]] as const) check(()=>assert.throws(()=>validatePickupBooking(id,{...booking,...change})));
async function tests(){
 const errors:any[]=[];const original=console.error;console.error=(...args:any[])=>{errors.push(args);};
 try{
  auth.currentUser=null;await assert.rejects(api.addPickupBookingToDb('submission-1',booking),/Firebase Authentication/);passed++;
  auth.currentUser={uid:'resident-A'};
  denyRead=true;await assert.rejects(api.addPickupBookingToDb('submission-1',booking),(error:any)=>error instanceof PickupBookingError&&error.phase==='get'&&error.code==='permission-denied');check(()=>assert.equal(writes,0));denyRead=false;
  denyCommit=true;await assert.rejects(api.addPickupBookingToDb('submission-1',booking),(error:any)=>error.phase==='create'&&error.code==='permission-denied');check(()=>assert.equal(docs.size,0));denyCommit=false;
  check(()=>assert.deepEqual(lastQuery,undefined));
  const first=await api.addPickupBookingToDb('submission-1',booking);check(()=>assert.deepEqual(first,{id:'submission-1',created:true}));
  check(()=>assert.equal(docs.get('pickupBookings/submission-1').ownerUid,'resident-A'));
  check(()=>assert.equal(docs.get('pickupBookings/submission-1').status,'Requested'));
  const again=await api.addPickupBookingToDb('submission-1',booking);check(()=>assert.equal(again.created,false));check(()=>assert.equal(writes,1));
  await assert.rejects(api.addPickupBookingToDb('submission-1',{...booking,pickupTime:'10:00'}),/different ownership or request details/);passed++;
  check(()=>assert.equal(docs.get('pickupBookings/submission-1').pickupTime,'09:30'));
  await api.getPickupBookingsForResident('resident-A');check(()=>assert.deepEqual(lastQuery,['pickupBookings',['ownerUid','==','resident-A']]));
  check(()=>assert.throws(()=>api.subscribeToPickupBookingsForResident('resident-B',()=>{},()=>{}),/currently authenticated/));
  let subscriptionFailure:any;api.subscribeToPickupBookingsForResident('resident-A',()=>{},(error:any)=>{subscriptionFailure=error;});subscriptionError(denied());check(()=>assert.equal(subscriptionFailure.phase,'list'));
  check(()=>assert.equal(subscriptionFailure.databaseId,'named-test-db'));
  check(()=>assert(!JSON.stringify(errors).includes('test@example.invalid')));
  console.error=original;console.log(`PASS: ${passed} checks; original transaction/list functions exercised with mocked Firestore. All three TS/TSX files parse successfully.`);
 }finally{console.error=original;}
}
tests().catch(error=>{console.error(error);process.exitCode=1;});
