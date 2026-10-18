type Kind = "bottle" | "can" | "glass" | "jug" | "sofa" | "fridge" | "phone" | "laptop";
const items: {kind: Kind; color: string; label: string}[] = [
  {kind:"bottle",color:"#D6E7DF",label:"Plastic bottle"}, {kind:"can",color:"#E3EBD7",label:"Aluminium tin"},
  {kind:"glass",color:"#CDE2D1",label:"Glass bottle"}, {kind:"jug",color:"#DFEBCF",label:"Plastic container"},
  {kind:"sofa",color:"#CBDDCC",label:"Sofa"}, {kind:"fridge",color:"#E4EBDF",label:"Refrigerator"},
  {kind:"bottle",color:"#E0ECE2",label:"Plastic water bottle"}, {kind:"can",color:"#DBE6D3",label:"Metal can"},
  {kind:"phone",color:"#CCDDD4",label:"Mobile phone"}, {kind:"jug",color:"#E8EEDB",label:"Detergent bottle"},
  {kind:"laptop",color:"#D6E5DC",label:"Laptop"},
];
function ItemArt({kind, color}: {kind: Kind; color: string}) {
  const ink="#789581";
  return <svg viewBox="0 0 48 88" fill="none" stroke={ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="24" cy="83" rx={kind === "sofa" || kind === "laptop" ? 22 : 14} ry="2" fill="#2E6542" fillOpacity=".08" stroke="none" />
    {kind === "bottle" && <><path d="M19 29v8c0 5-8 7-8 15v23c0 5 4 7 13 7s13-2 13-7V52c0-8-8-10-8-15v-8" fill={color}/><rect x="18" y="24" width="12" height="6" rx="2" fill="#A0BBA6"/><path d="M12 56h24v16H12" fill="#F9FBF1"/><path d="m20 61 4-3 4 3m-4-3v10m-4-3 4 3 4-3" stroke="#9CB69E"/><path d="M16 47v5m0 22v3" stroke="white" strokeWidth="2.5"/></>}
    {kind === "can" && <><path d="M12 47h24v31c0 5-24 5-24 0Z" fill={color}/><ellipse cx="24" cy="47" rx="12" ry="3.5" fill="#F0F1E7"/><ellipse cx="24" cy="47" rx="4" ry="1.5" fill="#BECDBB"/><path d="M12 75h24M16 53v17" stroke="#F8FAEE" strokeWidth="2"/><path d="m20 58 4-3 4 3m-8 7 4 3 4-3" stroke="#91A78A"/></>}
    {kind === "glass" && <><path d="M20 21v20c0 6-8 10-8 17v18c0 8 24 8 24 0V58c0-7-8-11-8-17V21Z" fill={color}/><rect x="19" y="17" width="10" height="5" rx="1.5" fill="#9AB59D"/><path d="M13 61h22v13H13" fill="#F0F4E7"/><path d="M17 47v10m0 20v1" stroke="#D7ECCF" strokeWidth="2.5"/><path d="m23 65-3 4h7" stroke="#B2C3A4"/></>}
    {kind === "jug" && <><path d="M14 38h15l8 14v23c0 5-4 7-9 7H15c-5 0-7-3-7-7V53c0-6 6-9 6-15Z" fill={color}/><rect x="13" y="32" width="17" height="7" rx="2" fill="#A2B7A0"/><path d="M29 46c4 3 5 7 5 13h-6V48" fill="#FAFCF4"/><rect x="12" y="59" width="18" height="16" rx="3" fill="#FAFCF4"/><path d="m17 67 4-4 4 4-4 4Z" fill="#BECEAD" stroke="none"/></>}
    {kind === "sofa" && <><path d="M6 59v-8c0-5 4-8 8-8h20c5 0 8 3 8 8v9" fill={color}/><path d="M4 59c0-5 8-5 8 0v6h24v-6c0-5 8-5 8 0v17H4Z" fill={color}/><path d="M12 65h24v7H12m12-25v18"/><path d="M9 76v6m30-6v6" strokeWidth="3"/><path d="M10 49h9m10 0h7" stroke="#D8E5D4"/></>}
    {kind === "fridge" && <><rect x="10" y="10" width="29" height="71" rx="4" fill={color}/><path d="M11 34h27M15 81v3m19-3v3"/><path d="M15 22v6m0 14v13" strokeWidth="2.5"/><rect x="26" y="17" width="7" height="8" rx="1" fill="#CDDAC1" stroke="none"/><path d="M14 14h18" stroke="#F7F9F0" strokeWidth="2"/></>}
    {kind === "phone" && <><rect x="13" y="39" width="23" height="43" rx="4" fill={color}/><rect x="16" y="44" width="17" height="30" rx="1.5" fill="#EDF4E4"/><path d="m18 66 11-17" stroke="#D4E4D0" strokeWidth="4"/><path d="M23 78h3" stroke="#E6EDDA" strokeWidth="2"/></>}
    {kind === "laptop" && <><rect x="6" y="48" width="36" height="28" rx="3" fill={color}/><rect x="10" y="52" width="28" height="20" rx="1" fill="#E9F1DF"/><path d="m2 76 4 6h36l4-6Z" fill="#C8D5D1"/><path d="M20 79h8m-12-19 7-4" stroke="#B3C9B6" strokeWidth="2"/></>}
  </svg>;
}
export default function LoadingItems() {
  return <div className="loading-items" aria-hidden="true"><div className="loading-item-row">{items.map((item,index) => <span className="loading-item" key={`${item.kind}-${index}`} data-item={item.label}><ItemArt kind={item.kind} color={item.color}/></span>)}</div><span className="loading-baseline" /></div>;
}
