import {getDocsFromServer,onSnapshot,type Query,type DocumentData,type QuerySnapshot} from 'firebase/firestore';
type Entry={query:Query<DocumentData>;next:(snapshot:QuerySnapshot<DocumentData>)=>void;revision:number};
const active=new Set<Entry>();
/** Reuse the exact dashboard mapping for listener events and explicit server reads. */
export function subscribeDashboardCollection(query:Query<DocumentData>,next:(snapshot:QuerySnapshot<DocumentData>)=>void,error?:(error:any)=>void){
 const entry:Entry={query,next,revision:0};active.add(entry);
 const stop=onSnapshot(query,snapshot=>{entry.revision++;next(snapshot);},error);
 return()=>{active.delete(entry);stop();};
}
export async function refreshDashboardSubscriptions(isCurrentSession:()=>boolean){
 const entries=[...active];if(!entries.length)throw Error('Dashboard data is not ready. Try again shortly.');
 const result=await Promise.allSettled(entries.map(async entry=>{const revision=entry.revision;const snapshot=await getDocsFromServer(entry.query);if(!isCurrentSession())throw Error('Your sign-in session changed.');if(active.has(entry)&&entry.revision===revision)entry.next(snapshot);}));
 if(!isCurrentSession())throw Error('Your sign-in session changed.');
 if(result.some(item=>item.status==='rejected'))throw Error('Some dashboard data could not refresh. Check your connection and permissions.');
 return new Date();
}
