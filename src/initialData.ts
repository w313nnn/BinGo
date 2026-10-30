import {auth,db,resolveAdminAccess} from './firebase';
import {requireLiveSession} from './demoSession';
import {doc,runTransaction,serverTimestamp} from 'firebase/firestore';
import {SIME_DARBY_COLLECTION_POINTS} from './simeDarbyData';
export function initialDemoRecords(now=new Date()):Record<string,Record<string,unknown>>{
 const dateAt=(offset:number)=>{const date=new Date(now);date.setDate(date.getDate()+offset);return date;};
 const dateString=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
 const schedule=(offset:number,type:string,time:string)=>{const date=dateAt(offset);return {day:date.toLocaleDateString('en-GB',{weekday:'long'}),date:String(date.getDate()),month:date.toLocaleDateString('en-GB',{month:'short'}),rawDate:dateString(date),time,zone:'City of Elmina',type,status:'Upcoming'};};
 return {'schedules/demo-general':schedule(1,'General Waste','7:30 AM'),'schedules/demo-recycling':schedule(3,'Recyclables (Paper/Plastics)','8:30 AM'),'schedules/demo-bulky':schedule(5,'Bulk & Garden Waste','9:00 AM'),
 'notices/demo-welcome':{title:'Hackathon demonstration',body:'Sample schedules, fleet and rewards for demonstration only.',date:dateString(now),pinned:true},
 'fleetUpdates/demo-truck':{date:dateString(now),time:'7:45 AM',location:'City of Elmina (sample)',eta:'11 min',progress:68,plate:'DEMO-001',route:'Sample route',status:'En route',lat:3.1868,lng:101.5042},
 'rewards/demo-tote':{name:'Demo Eco Tote Bag',points:100,category:'Merchandise',icon:'♻️',maxRedemptions:50,redeemed:0,banned:false,description:'Sample reward only. No real voucher.',terms:'Hackathon demonstration only.'}};
}
export async function addInitialDemoData(includeCapacities=false){requireLiveSession();const user=auth.currentUser;if(!user||!await resolveAdminAccess(user,true))throw Error('Administrator authorization is required.');
 const records=initialDemoRecords();if(includeCapacities)for(const point of SIME_DARBY_COLLECTION_POINTS)records['binCapacities/'+point.id]={fillPercentage:35,updatedAt:serverTimestamp(),updatedBy:user.uid};
 return runTransaction(db,async tx=>{const entries=Object.entries(records);const snapshots=await Promise.all(entries.map(([path])=>tx.get(doc(db,...path.split('/') as [string,string]))));if(auth.currentUser?.uid!==user.uid)throw Error('Your sign-in session changed.');let created=0;entries.forEach(([path,value],i)=>{if(!snapshots[i].exists()){tx.set(doc(db,...path.split('/') as [string,string]),value);created++;}});return created;});
}
