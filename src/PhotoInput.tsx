import { L, localizeText } from "./i18n";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, Upload, ImagePlus, Check, X } from "lucide-react";
import DetailsDisclosure from "./DetailsDisclosure";

type Props = { photo: string; onReady: (photo: string) => void; onClear: () => void };
export default function PhotoInput({ photo, onReady, onClear }: Props) {
  const upload = useRef<HTMLInputElement>(null), camera = useRef<HTMLInputElement>(null);
  const reader = useRef<FileReader | null>(null), generation = useRef(0);
  const [progress, setProgress] = useState(0), [busy, setBusy] = useState(false);
  const [error, setError] = useState(""), [name, setName] = useState("");
  useEffect(() => () => { generation.current++; reader.current?.abort(); }, []);
  const clear = () => { generation.current++; reader.current?.abort(); setBusy(false); setProgress(0); setError(""); setName(""); onClear(); };
  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Choose a JPG, PNG or WebP photo."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Choose a photo 5 MB or smaller."); return; }
    reader.current?.abort(); const token = ++generation.current;
    setError(""); setName(file.name); setBusy(true); setProgress(0); onClear();
    const next = new FileReader(); reader.current = next;
    next.onprogress = event => { if (token === generation.current && event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 90)); };
    next.onerror = () => { if (token === generation.current) { setError("Could not read this photo. Try again."); setBusy(false); } };
    next.onload = () => {
      if (token !== generation.current) return;
      setProgress(90);
      const result = String(next.result), image = new Image();
      image.onload = () => { if (token === generation.current) { setProgress(100); setBusy(false); onReady(result); } };
      image.onerror = () => { if (token === generation.current) { setError("This photo could not be opened."); setBusy(false); } };
      image.src = result;
    };
    next.readAsDataURL(file);
  }
  return <div className="space-y-3">
    <input ref={upload} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label={localizeText("Upload photo")} onChange={choose} />
    <input ref={camera} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" aria-label={localizeText("Take photo")} onChange={choose} />
    {localizeText(photo ? <div className="photo-preview"><img src={photo} alt={localizeText("Selected item")} /><button type="button" className="icon-button photo-remove" aria-label={localizeText("Remove photo")} onClick={clear}><X size={18} /></button><span className="photo-ready"><Check size={14} /><L>{"Ready"}</L></span></div>
      : <div className="photo-empty"><ImagePlus size={32} strokeWidth={1.5} /><p className="font-semibold"><L>{"Add an item photo"}</L></p><span className="text-xs text-slate-500"><L>{"One item. Good lighting."}</L></span></div>)}
    {localizeText(busy && <div className="photo-progress" role="progressbar" aria-label={localizeText("Preparing photo")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div><span><L>{"Preparing photo"}</L></span><span>{localizeText(progress)}%</span></div><div className="photo-progress-track"><span style={{ transform: `scaleX(${progress / 100})` }} /></div><p className="truncate text-xs text-slate-500 mt-2">{localizeText(name)}</p></div>)}
    <div className="grid grid-cols-2 gap-2"><button type="button" disabled={busy} onClick={() => camera.current?.click()} className="photo-choice"><Camera size={18} /><L>{"Take photo"}</L></button><button type="button" disabled={busy} onClick={() => upload.current?.click()} className="photo-choice"><Upload size={18} /><L>{"Upload"}</L></button></div>
    {localizeText(busy && <button type="button" onClick={clear} className="text-sm text-slate-600 underline"><L>{"Cancel"}</L></button>)}
    {localizeText(error && <p role="alert" className="text-sm text-red-700">{localizeText(error)}</p>)}
    <DetailsDisclosure label={localizeText("Photo tips")}><p><L>{"Use a clear photo of one item. JPG, PNG or WebP, up to 5 MB. Camera access depends on your browser. Photos are prepared on your device."}</L></p></DetailsDisclosure>
  </div>;
}
