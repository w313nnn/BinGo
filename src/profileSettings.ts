import {auth,db} from './firebase';
import {requireLiveSession} from './demoSession';
import {doc,setDoc,serverTimestamp} from 'firebase/firestore';
import {getFunctions,httpsCallable} from 'firebase/functions';
import {reload,getIdToken,updateProfile} from 'firebase/auth';
export function validateProfile(name:string,address:string,zone:string){
 const value={name:name.trim(),area:address.trim(),zone:zone.trim()};
 if(!value.name||value.name.length>100)throw Error('Enter a name of 1 to 100 characters.');
 if(!value.area||value.area.length>500)throw Error('Enter an address of 1 to 500 characters.');
 if(value.zone.length>100)throw Error('The zone must be at most 100 characters.');
 return value;
}
export async function saveResidentProfile(name:string,address:string,zone:string){requireLiveSession();const user=auth.currentUser;if(!user)throw Error('Sign in to edit your profile.');const values=validateProfile(name,address,zone);await setDoc(doc(db,'users',user.uid),{...values,updatedAt:serverTimestamp()},{merge:true});if(auth.currentUser?.uid!==user.uid)throw Error('Your sign-in session changed.');try{await updateProfile(user,{displayName:values.name});}catch{/* Firestore is the authoritative resident display name. */}return values;}
export async function syncVerifiedContact(kind:'email'|'phone',expectedUid=auth.currentUser?.uid){requireLiveSession();const user=auth.currentUser;if(!user||user.uid!==expectedUid)throw Error('Your sign-in session changed.');await reload(user);await getIdToken(user,true);if(auth.currentUser?.uid!==user.uid)throw Error('Your sign-in session changed.');if(kind==='email'&&!user.emailVerified)throw Error('Email verification is required.');if(kind==='phone'&&!user.phoneNumber)throw Error('Phone verification is required.');const value=kind==='email'?{email:user.email!}:{phone:user.phoneNumber!};await setDoc(doc(db,'users',user.uid),{...value,updatedAt:serverTimestamp()},{merge:true});return value;}
// These functions must be deployed on a trusted server. Codes are never generated or checked in the browser.
export async function sendEmailChangeCode(email:string){requireLiveSession();const fn=httpsCallable<{email:string},{challengeId:string}>(getFunctions(auth.app,'asia-southeast1'),'requestProfileEmailOtp');const result=await fn({email:email.trim()});return result.data.challengeId;}
export async function confirmEmailChangeCode(challengeId:string,code:string){requireLiveSession();const fn=httpsCallable(getFunctions(auth.app,'asia-southeast1'),'confirmProfileEmailOtp');const uid=auth.currentUser?.uid;await fn({challengeId,code});return syncVerifiedContact('email',uid);}
