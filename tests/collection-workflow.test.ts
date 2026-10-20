import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import * as policy from '../src/reviewPolicy';
const require=createRequire(import.meta.url);const {transformSync}=require('esbuild');
const docs=new Map<string,any>();const auth:any={currentUser:{uid:'collector-A'}};let admin=false;let denyCommit=false;
const clone=(v:any)=>structuredClone(v);let writes=0;
const fs:any={doc:(_:any,c:string,id:string)=>`${c}/${id}`,serverTimestamp:()=>12345,
 getDocFromServer:async(ref:string)=>({exists:()=>docs.has(ref),data:()=>clone(docs.get(ref))}),
 runTransaction:async(_:any,fn:any)=>{const pending:any[]=[];const result=await fn({get:async(ref:string)=>({exists:()=>docs.has(ref),data:()=>clone(docs.get(ref))}),set:(ref:string,value:any)=>pending.push({ref,value,merge:false}),update:(ref:string,value:any)=>pending.push({ref,value,merge:true})});if(denyCommit)throw Error('permission-denied');for(const w of pending){docs.set(w.ref,w.merge?{...docs.get(w.ref),...w.value}:w.value);writes++;}return result;}};
const source=readFileSync(new URL('../src/collectionWorkflow.ts',import.meta.url),'utf8');const js=transformSync(source,{loader:'ts',format:'cjs'}).code;
const module={exports:{} as any};new Function('require','module','exports',js)((id:string)=>id==='./firebase'?{auth,db:{},resolveAdminAccess:async()=>admin}:id==='./demoSession'?{requireLiveSession:()=>{}}:id==='./reviewPolicy'?policy:id==='firebase/firestore'?fs:(()=>{throw Error(id)})(),module,module.exports);const api=module.exports;
for(const value of [-1,1.5,NaN,100001,'5'])assert.throws(()=>policy.validPoints(value));
const booking={status:'Assigned',ownerUid:'resident-A',assignedCollectorUid:'collector-A',recyclingSubmissionId:'s1'};
docs.set('collectors/collector-A',{active:true});docs.set('pickupBookings/s1',booking);docs.set('recycleSessions/s1',{ownerUid:'resident-A',collectionMethod:'collector_pickup',status:'Pending Verification',verified:false,pointsPending:40});
await assert.rejects(api.submitCollectorEvidence('s1','data:image/jpeg;base64,AAAA','',false),/confirm/);assert.equal(writes,0);
auth.currentUser={uid:'collector-B'};docs.set('collectors/collector-B',{active:true});await assert.rejects(api.submitCollectorEvidence('s1','data:image/jpeg;base64,AAAA','',true),/assigned collector/);assert.equal(writes,0);
auth.currentUser={uid:'collector-A'};await api.submitCollectorEvidence('s1','data:image/jpeg;base64,AAAA','Collected safely',true);assert.equal(docs.get('pickupBookings/s1').status,'Collected');assert.equal(docs.get('recycleSessions/s1').verified,false);assert.equal(docs.has('residentNotifications/recycling_s1'),false);
await assert.rejects(api.submitCollectorEvidence('s1','data:image/jpeg;base64,AAAA','',true),/already submitted/);
await assert.rejects(api.reviewRecycling('s1',{status:'Verified',verified:true,pointsApproved:40}),/Administrator/);
admin=true;auth.currentUser={uid:'admin-A'};denyCommit=true;await assert.rejects(api.reviewRecycling('s1',{status:'Verified',verified:true,pointsApproved:40}),/permission-denied/);assert.equal(docs.get('recycleSessions/s1').verified,false);denyCommit=false;
await api.reviewRecycling('s1',{status:'Verified',verified:true,pointsApproved:40});assert.equal(docs.get('recycleSessions/s1').pointsApproved,40);assert.equal(docs.get('residentNotifications/recycling_s1').ownerUid,'resident-A');
await assert.rejects(api.reviewRecycling('s1',{status:'Verified',verified:true,pointsApproved:80}),/already been reviewed/);assert.equal(docs.get('recycleSessions/s1').pointsApproved,40);
docs.set('recycleSessions/s2',{ownerUid:'resident-A',collectionMethod:'collector_pickup',status:'Pending Verification'});await assert.rejects(api.reviewRecycling('s2',{status:'Verified',verified:true,pointsApproved:10}),/evidence/);
docs.set('reports/r1',{authorUid:'resident-A',status:'Pending',points:0});await api.reviewReport('r1',{status:'Completed'});assert.equal(docs.get('reports/r1').points,8);assert.equal(docs.get('residentNotifications/report_r1').points,8);const notification=clone(docs.get('residentNotifications/report_r1'));await api.reviewReport('r1',{status:'Completed'});assert.deepEqual(docs.get('residentNotifications/report_r1'),notification);await assert.rejects(api.reviewReport('r1',{status:'Rejected'}),/cannot change/);
console.log('PASS: collector assignment, evidence validation, atomic submissions, no collector points, admin-only approval, missing evidence, atomic notifications and idempotent report/recycling awards.');

assert.equal(api.normalizeCollectorId(' c250001 '),'C250001');
for(const id of ['C250000','C251','X250001','C2500001'])assert.throws(()=>api.normalizeCollectorId(id));
await api.registerCollector('collector-A','Collector A',true,'C250001');
assert.equal(docs.get('collectorIds/C250001').uid,'collector-A');
assert.equal(await api.resolveCollectorId('c250001'),'collector-A');
await assert.rejects(api.registerCollector('collector-B','Collector B',true,'C250001'),/already linked/);
await assert.rejects(api.registerCollector('collector-A','Collector A',true,'C260001'),/cannot be changed/);
await api.registerCollector('collector-A','Collector A',false,'C250001');
await assert.rejects(api.resolveCollectorId('C250001'),/inactive/);
admin=false;await assert.rejects(api.registerCollector('collector-C','C',true,'C260001'),/Administrator/);
console.log('PASS: collector ID format, normalisation, unique atomic links, immutable IDs, inactive assignment and admin-only registration.');
