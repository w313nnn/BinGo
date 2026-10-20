/** Labels and remembered-account cleanup only. Email addresses never grant roles. */
export const STAFF_EMAILS = {administrator:'tslc@admin-bingo.com',collector:'aiman-c250001@collect-bingo.com'} as const;
export type StaffPortal = keyof typeof STAFF_EMAILS;
export function isReservedStaffEmail(email:string){return [...Object.values(STAFF_EMAILS),'admin123@bingo.com','collector123@bingo.com'].some(value=>value===email.trim().toLowerCase());}
export function assertStaffPortal(portal:StaffPortal,admin:boolean,collector:boolean){
  if(portal==='administrator'&&!admin)throw new Error('This account cannot access the Administrator portal. Sign in with an authorised administrator account.');
  if(portal==='collector'&&(!collector||admin))throw new Error('This account cannot access the Collector portal. Sign in with an active collector account.');
}
