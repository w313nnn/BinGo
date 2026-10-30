import { L, localizeText } from "./i18n";
import React, { useState } from "react";
import AnimatedIcon from "./AnimatedIcon";
import {
  MapPin, Crosshair, AlertTriangle, CheckCircle2, ChevronDown,
  Building2, Home, Search, X, ExternalLink
} from "lucide-react";
import {
  SIME_DARBY_TOWNSHIPS,
  checkSimeDarbyLocation,
  LocationCheckResult,
  SimeDarbyTownship,
  SimeDarbyPropertyItem,
} from "./simeDarbyData";

interface SimeDarbyAddressPickerProps {
  currentAddress: string;
  currentZone: string;
  onAddressChange: (newAddress: string, newZone: string) => void;
  label?: string;
  placeholder?: string;
  compact?: boolean;
}

export const SimeDarbyAddressPicker: React.FC<SimeDarbyAddressPickerProps> = ({
  currentAddress,
  currentZone,
  onAddressChange,
  label = "Sime Darby Property Residential Address",
  placeholder = "e.g. Kanopi Residences, City of Elmina, Shah Alam",
  compact = false,
}) => {
  const [detecting, setDetecting] = useState(false);
  const [showOutsideModal, setShowOutsideModal] = useState(false);
  const [locationResult, setLocationResult] = useState<LocationCheckResult | null>(null);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedTownshipId, setSelectedTownshipId] = useState<string>("all");
  const [inputVal, setInputVal] = useState(currentAddress);

  // Sync with prop changes
  React.useEffect(() => {
    setInputVal(currentAddress);
  }, [currentAddress]);

  // One-click Auto Determine GPS
  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser. Please select or type your Sime Darby Property address manually.");
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetecting(false);
        const { latitude, longitude } = pos.coords;
        const result = checkSimeDarbyLocation(latitude, longitude);
        setLocationResult(result);

        if (result.isAuthorized && result.township && result.suggestedAddress) {
          setInputVal(result.suggestedAddress);
          onAddressChange(result.suggestedAddress, result.township.zone);
        } else {
          // Trigger the required popup alerting the user that current location is wrong / outside authorized area
          setShowOutsideModal(true);
        }
      },
      (err) => {
        setDetecting(false);
        // For testing/fallback in restricted environments or when permission denied
        console.warn("GPS error / restricted:", err.message);
        // Simulate checking typical location or show outside alert
        const fallbackCheck = checkSimeDarbyLocation(3.1412, 101.6865); // KL Golden Triangle (outside Sime Darby)
        setLocationResult(fallbackCheck);
        setShowOutsideModal(true);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectProperty = (township: SimeDarbyTownship, prop: SimeDarbyPropertyItem) => {
    const fullAddr = prop.addressExample;
    setInputVal(fullAddr);
    onAddressChange(fullAddr, township.zone);
    setShowCatalogModal(false);
    setShowOutsideModal(false);
  };

  const isVerifiedSimeDarby = SIME_DARBY_TOWNSHIPS.some(t =>
    inputVal.toLowerCase().includes(t.name.toLowerCase()) ||
    t.properties.some(p => inputVal.toLowerCase().includes(p.name.toLowerCase()))
  );

  return (
    <div className="space-y-2">
      {localizeText(label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            {localizeText(label)}
          </label>
          {localizeText(isVerifiedSimeDarby && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /><L>{"Sime Darby Authorised"}</L></span>
          ))}
        </div>
      ))}

      {/* Input & Action Bar */}
      <div className="relative">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                onAddressChange(e.target.value, currentZone);
              }}
              placeholder={localizeText(placeholder)}
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition shadow-sm"
            />
            {localizeText(inputVal && (
              <button
                type="button"
                onClick={() => {
                  setInputVal("");
                  onAddressChange("", currentZone);
                }}
                className="icon-button absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          {/* Auto Determine GPS Button */}
          <button
            type="button"
            onClick={handleAutoDetect}
            disabled={detecting}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition active:scale-95 whitespace-nowrap shadow-sm disabled:opacity-60"
            title={localizeText("Auto-detect address using device GPS")}
          >
            <Crosshair className={`w-3.5 h-3.5 text-emerald-700 ${detecting ? "animate-spin" : ""}`} />
            <span>{localizeText(detecting ? "Tracking..." : "GPS Auto")}</span>
          </button>

          {/* Choose from official catalog button */}
          <button
            type="button"
            onClick={() => setShowCatalogModal(true)}
            className="flex items-center gap-1 px-2.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition active:scale-95 whitespace-nowrap shadow-sm"
            title={localizeText("Browse official Sime Darby Property townships and residences")}
          >
            <Home className="w-3.5 h-3.5 text-slate-600" />
            <AnimatedIcon name={showCatalogModal ? "up" : "down"} className="w-3 h-3 text-slate-500" />
          </button>
        </div>

        {/* Quick Helper Subtext */}
        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
          <span><L>{"Use GPS or choose an address"}</L></span>
          <a
            href="https://www.simedarbyproperty.com/home/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-0.5"
          ><L>{"Official Directory "}</L><ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* POPUP MODAL: Current Location is Wrong / Outside Sime Darby Property Authorised Area */}
      {localizeText(showOutsideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden text-center p-5 space-y-4">
            <div className="icon-container w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900"><L>{"Location Outside Authorised Area"}</L></h3>
              <p className="text-xs text-slate-600 leading-relaxed text-left bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                ⚠️ <span className="font-semibold text-red-700"><L>{"Your detected GPS location is wrong or not in a Sime Darby Property authorised township."}</L></span>
                <br /><br /><L>{"BinGo is exclusively deployed for Sime Darby Property residents (such as City of Elmina, Bandar Bukit Raja, Ara Damansara, Putra Heights, Subang Jaya, KL East, Bukit Jelutong, Serenia City, and Nilai Impian)."}</L></p>
              {localizeText(locationResult && (
                <div className="text-[11px] text-slate-500 text-left px-1"><L>{"Nearest Sime Darby Township: "}</L><span className="font-semibold text-slate-700">{localizeText(locationResult.township?.name)}</span> ({localizeText(locationResult.distanceKm)}<L>{" km away)"}</L></div>
              ))}
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowOutsideModal(false);
                  setShowCatalogModal(true);
                }}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-700/20 flex items-center justify-center gap-1.5"
              >
                <Building2 className="w-4 h-4" /><L>{"Select Sime Darby Residence"}</L></button>

              <button
                type="button"
                onClick={() => setShowOutsideModal(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              ><L>{"Key In Address Manually"}</L></button>
            </div>
          </div>
        </div>
      ))}

      {/* MODAL: Full Official Sime Darby Property Township & Residence Directory */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-sm"><L>{"SD"}</L></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900"><L>{"Sime Darby Property Residences"}</L></h3>
                  <p className="text-[10px] text-slate-500"><L>{"Official townships, condominiums & landed housing"}</L></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="icon-button p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter and Search */}
            <div className="p-3 border-b border-slate-100 space-y-2 bg-white">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={localizeText("Search township or property (e.g. Kanopi, Elmina, Cantara, Lyra)...")}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Township pill selector */}
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedTownshipId("all")}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                    selectedTownshipId === "all"
                      ? "bg-emerald-700 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                ><L>{"All Townships"}</L></button>
                {localizeText(SIME_DARBY_TOWNSHIPS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTownshipId(t.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                      selectedTownshipId === t.id
                        ? "bg-emerald-700 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {localizeText(t.name)}
                  </button>
                )))}
              </div>
            </div>

            {/* List of Properties */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {SIME_DARBY_TOWNSHIPS
                .filter(t => selectedTownshipId === "all" || t.id === selectedTownshipId)
                .map((township) => {
                  const matchingProps = township.properties.filter(p =>
                    !searchFilter ||
                    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                    p.type.toLowerCase().includes(searchFilter.toLowerCase()) ||
                    township.name.toLowerCase().includes(searchFilter.toLowerCase())
                  );

                  if (matchingProps.length === 0) return null;

                  return (
                    <div key={township.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-900">{localizeText(township.name)}</span>
                          <span className="text-[10px] text-slate-500 ml-1.5 font-normal">({localizeText(township.state)})</span>
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                          {localizeText(township.zone)}
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100 bg-white">
                        {matchingProps.map((prop) => (
                          <div
                            key={prop.id}
                            onClick={() => handleSelectProperty(township, prop)}
                            className="p-2.5 hover:bg-emerald-50/60 cursor-pointer transition flex items-center justify-between group"
                          >
                            <div className="space-y-0.5 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-800">
                                  {localizeText(prop.name)}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                  prop.type.includes("Condo") || prop.type.includes("Serviced")
                                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                                    : "bg-amber-50 text-amber-800 border border-amber-200"
                                }`}>
                                  {localizeText(prop.type)}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 line-clamp-1">
                                {prop.addressExample}
                              </p>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-700 shrink-0 group-hover:translate-x-0.5 transition"><L>{"Select →"}</L></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span><L>{"Can't find your unit? You can type it directly in the input box."}</L></span>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs"
              ><L>{"Done"}</L></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
