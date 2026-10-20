import {useEffect,useState} from 'react';
import {registerCollector,listCollectors,type CollectorRecord} from './collectionWorkflow';
import {L,localizeText} from './i18n';
export default function CollectorManagement(){
 const [items,setItems]=useState<CollectorRecord[]>([]),[uid,setUid]=useState(''),[name,setName]=useState(''),[collectorId,setCollectorId]=useState(''),[search,setSearch]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function load(){try{setItems(await listCollectors());}catch(e){setError((e as Error).message);}}useEffect(()=>{void load();},[]);
 async function save(id:string,label:string,active:boolean,staffId:string){if(busy)return;setBusy(true);setError('');try{await registerCollector(id.trim(),label,active,staffId);setUid('');setName('');setCollectorId('');await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <section className="p-4 space-y-3"><h2 className="text-sm font-bold"><L>Collectors</L></h2><p className="text-xs text-slate-500"><L>Use the collector ID to assign pickups. Link each account once during setup.</L></p>
 {error&&<p role="alert" className="text-xs text-red-700">{localizeText(error)}</p>}
 <input aria-label={localizeText('Search collectors')} placeholder={localizeText('Search collector ID or name')} value={search} onChange={e=>setSearch(e.target.value)} className="w-full border bg-white rounded-xl p-2 text-xs"/>
 <details className="bg-white border rounded-2xl p-4 space-y-3" open={!!uid}><summary className="text-sm font-semibold"><L>Link collector account</L></summary><p className="text-xs text-slate-500"><L>C250001 means collector, joined in 2025, number 0001. Use the actual joining year.</L></p>
 <label className="block text-xs"><L>Collector ID</L><input placeholder="C250001" maxLength={7} className="w-full border bg-white rounded-xl p-2 mt-1" value={collectorId} onChange={e=>setCollectorId(e.target.value.toUpperCase())}/></label>
 <label className="block text-xs"><L>Name</L><input className="w-full border bg-white rounded-xl p-2 mt-1" value={name} onChange={e=>setName(e.target.value)}/></label>
 <label className="block text-xs"><L>Firebase UID (one-time setup)</L><input className="w-full border bg-white rounded-xl p-2 mt-1" value={uid} onChange={e=>setUid(e.target.value)}/></label>
 <button disabled={busy||!uid.trim()||!name.trim()||!collectorId.trim()} onClick={()=>void save(uid,name,true,collectorId)} className="p-3 bg-emerald-700 text-white text-xs rounded-xl disabled:opacity-50"><L>Save collector</L></button></details>
 {items.filter(c=>`${c.collectorId} ${c.name}`.toLowerCase().includes(search.toLowerCase())).map(c=><article key={c.uid} className="bg-white border rounded-2xl p-4 space-y-2"><strong className="text-sm">{c.name}</strong><p className="text-xs">{c.collectorId||localizeText('Collector ID pending')}</p><p className="text-xs">{localizeText(c.active?'Active':'Inactive')}</p>{!c.collectorId?<button disabled={busy} onClick={()=>{setUid(c.uid);setName(c.name);setCollectorId('');}} className="text-xs text-emerald-700 underline"><L>Link collector ID</L></button>:<button disabled={busy} onClick={()=>void save(c.uid,c.name,!c.active,c.collectorId)} className="text-xs text-emerald-700 underline">{localizeText(c.active?'Deactivate':'Activate')}</button>}</article>)}
 </section>;
}
