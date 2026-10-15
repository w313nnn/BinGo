import React, { useState, useEffect } from "react";
import {
  APIProvider, Map, AdvancedMarker, InfoWindow, useMap
} from "@vis.gl/react-google-maps";
import {
  Navigation, MapPin, Truck, Sparkles, Clock, CheckCircle,
  ExternalLink, Layers, Crosshair, AlertCircle
} from "lucide-react";
import {
  SIME_DARBY_COLLECTION_POINTS,
  SIME_DARBY_TOWNSHIPS,
  SimeDarbyCollectionPoint,
  getGoogleMapsNavigationUrl,
  calculateDistanceKm,
} from "./simeDarbyData";

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyAbFOuY1cWTDIrHAikdUu-6MnqcfLUCs2I";

interface GoogleMapViewProps {
  userAddress?: string;
  userZone?: string;
  selectedStationId?: number;
  onSelectStation?: (station: SimeDarbyCollectionPoint) => void;
  className?: string;
}

// Inner controller component to handle camera pan / zoom via useMap
const MapPanController: React.FC<{ targetCoords: { lat: number; lng: number } | null }> = ({ targetCoords }) => {
  const map = useMap();
  useEffect(() => {
    if (map && targetCoords) {
      map.panTo(targetCoords);
      map.setZoom(14);
    }
  }, [map, targetCoords]);
  return null;
};

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  userAddress,
  userZone,
  selectedStationId,
  onSelectStation,
  className = "w-full h-full min-h-[360px] rounded-2xl overflow-hidden",
}) => {
  const [activeStation, setActiveStation] = useState<SimeDarbyCollectionPoint | null>(null);
  const [activeTownshipFilter, setActiveTownshipFilter] = useState<string>("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 3.14, lng: 101.55 });
  const [locating, setLocating] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Live truck positions
  const [trucks] = useState([
    {
      id: "SDP-TK01",
      plate: "WXY 8192",
      township: "City of Elmina",
      route: "Persiaran Elmina – Elmina Valley & Ridge",
      lat: 3.1872,
      lng: 101.5058,
      eta: "11 min",
      status: "Collecting General Waste",
    },
    {
      id: "SDP-TK02",
      plate: "BND 4432",
      township: "Bandar Bukit Raja",
      route: "Persiaran Bukit Raja 1 – Casira & Lyra",
      lat: 3.0862,
      lng: 101.4455,
      eta: "24 min",
      status: "Collecting Recyclables",
    },
  ]);
  const [selectedTruck, setSelectedTruck] = useState<typeof trucks[0] | null>(null);

  // Listen for Google Maps quota exceeded event
  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener("gmp-quota-exceeded", handleQuota);
    return () => window.removeEventListener("gmp-quota-exceeded", handleQuota);
  }, []);

  // Filter stations by township
  const displayedStations = activeTownshipFilter === "all"
    ? SIME_DARBY_COLLECTION_POINTS
    : SIME_DARBY_COLLECTION_POINTS.filter(s => s.townshipId === activeTownshipFilter);

  // Sync initial selection
  useEffect(() => {
    if (selectedStationId) {
      const match = SIME_DARBY_COLLECTION_POINTS.find(s => s.id === selectedStationId);
      if (match) {
        setActiveStation(match);
        setMapCenter({ lat: match.lat, lng: match.lng });
      }
    }
  }, [selectedStationId]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setMapCenter(coords);
      },
      () => {
        setLocating(false);
        // Default to City of Elmina center as friendly fallback
        const fallback = { lat: 3.1856, lng: 101.5034 };
        setUserLocation(fallback);
        setMapCenter(fallback);
      }
    );
  };

  const getPinColor = (category: string) => {
    switch (category) {
      case "E-Waste":
        return "bg-sky-600 border-sky-400 text-white shadow-sky-500/30";
      case "Organic":
        return "bg-amber-600 border-amber-400 text-white shadow-amber-500/30";
      case "Recycling":
      default:
        return "bg-emerald-600 border-emerald-400 text-white shadow-emerald-500/30";
    }
  };

  return (
    <div className={`relative flex flex-col ${className} bg-slate-100 border border-slate-200 shadow-sm`}>
      {/* Quota Exceeded Banner (Section 8 Case A Mandate) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-3 py-2 text-[11px] text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{" "}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{" "}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Township Navigation Filter Bar */}
      <div className="p-2.5 bg-white/95 backdrop-blur-sm border-b border-slate-200 z-10 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap pl-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-emerald-600" />
          Township:
        </span>
        <button
          type="button"
          onClick={() => {
            setActiveTownshipFilter("all");
            setMapCenter({ lat: 3.14, lng: 101.55 });
          }}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTownshipFilter === "all"
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All Sime Darby ({SIME_DARBY_COLLECTION_POINTS.length})
        </button>
        {SIME_DARBY_TOWNSHIPS.map((t) => {
          const hasPoints = SIME_DARBY_COLLECTION_POINTS.some(p => p.townshipId === t.id);
          if (!hasPoints) return null;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTownshipFilter(t.id);
                setMapCenter(t.center);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTownshipFilter === t.id
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.name}
            </button>
          );
        })}
      </div>

      {/* Map Container */}
      <div className="relative flex-1 w-full min-h-[300px]">
        <APIProvider apiKey={GOOGLE_MAPS_KEY}>
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={mapCenter}
            defaultZoom={11}
            style={{ width: "100%", height: "100%" }}
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            options={{
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              zoomControl: true,
            }}
          >
            <MapPanController targetCoords={mapCenter} />

            {/* Collection Points Markers */}
            {displayedStations.map((station) => (
              <AdvancedMarker
                key={station.id}
                position={{ lat: station.lat, lng: station.lng }}
                onClick={() => {
                  setActiveStation(station);
                  setSelectedTruck(null);
                  if (onSelectStation) onSelectStation(station);
                }}
                title={station.name}
              >
                <div
                  className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-transform duration-200 hover:scale-110 cursor-pointer shadow-md ${getPinColor(
                    station.category
                  )} ${activeStation?.id === station.id ? "scale-125 ring-3 ring-emerald-400" : ""}`}
                >
                  <MapPin className="w-4 h-4 fill-current" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white text-emerald-800 text-[9px] font-black flex items-center justify-center border border-slate-200 shadow-xs">
                    {station.fill}%
                  </span>
                </div>
              </AdvancedMarker>
            ))}

            {/* Live Garbage Truck Fleet Markers */}
            {trucks.map((truck) => (
              <AdvancedMarker
                key={truck.id}
                position={{ lat: truck.lat, lng: truck.lng }}
                onClick={() => {
                  setSelectedTruck(truck);
                  setActiveStation(null);
                }}
                title={`Garbage Truck ${truck.plate} – ${truck.township}`}
              >
                <div className="flex items-center gap-1 bg-amber-500 text-slate-950 font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white animate-pulse cursor-pointer">
                  <Truck className="w-3.5 h-3.5 text-slate-900" />
                  <span className="text-[10px] font-extrabold">{truck.eta}</span>
                </div>
              </AdvancedMarker>
            ))}

            {/* User GPS Marker */}
            {userLocation && (
              <AdvancedMarker position={userLocation} title="Your Current Location">
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-6 h-6 rounded-full bg-blue-500/30 animate-ping" />
                  <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md" />
                </div>
              </AdvancedMarker>
            )}

            {/* Station InfoWindow Popup */}
            {activeStation && (
              <InfoWindow
                position={{ lat: activeStation.lat, lng: activeStation.lng }}
                onCloseClick={() => setActiveStation(null)}
              >
                <div className="p-1 max-w-[260px] text-slate-900 space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        {activeStation.townshipName}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {activeStation.name}
                      </h4>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                      {activeStation.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    {activeStation.address}
                  </p>

                  {/* Fill Level */}
                  <div className="space-y-0.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-700">
                      <span>Bin Capacity Fill:</span>
                      <span className={activeStation.fill > 75 ? "text-red-600" : "text-emerald-700"}>
                        {activeStation.fill}% Full
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          activeStation.fill > 75
                            ? "bg-red-500"
                            : activeStation.fill > 50
                            ? "bg-amber-500"
                            : "bg-emerald-600"
                        }`}
                        style={{ width: `${activeStation.fill}%` }}
                      />
                    </div>
                  </div>

                  {/* Materials & Points */}
                  <div className="flex items-center justify-between text-[10px] text-slate-600">
                    <span className="flex items-center gap-1 font-medium text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {activeStation.operatingHours}
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      +{activeStation.pointsPerKg} pts/kg
                    </span>
                  </div>

                  {/* Navigation Button (Direct Google Maps Link) */}
                  <div className="pt-1 flex gap-1.5">
                    <a
                      href={getGoogleMapsNavigationUrl(activeStation.lat, activeStation.lng, userLocation?.lat, userLocation?.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-center text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-xs"
                    >
                      <Navigation className="w-3 h-3" />
                      Navigate in Google Maps
                    </a>
                    {onSelectStation && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectStation(activeStation);
                          setActiveStation(null);
                        }}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition"
                      >
                        Select
                      </button>
                    )}
                  </div>
                </div>
              </InfoWindow>
            )}

            {/* Truck InfoWindow Popup */}
            {selectedTruck && (
              <InfoWindow
                position={{ lat: selectedTruck.lat, lng: selectedTruck.lng }}
                onCloseClick={() => setSelectedTruck(null)}
              >
                <div className="p-1 max-w-[220px] text-slate-900 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-amber-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {selectedTruck.id} ({selectedTruck.plate})
                      </h4>
                      <p className="text-[10px] text-slate-500">{selectedTruck.township}</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-200/80 text-[10px] space-y-0.5">
                    <p className="font-medium text-amber-900">
                      Status: <span className="font-normal">{selectedTruck.status}</span>
                    </p>
                    <p className="font-medium text-amber-900">
                      Route: <span className="font-normal">{selectedTruck.route}</span>
                    </p>
                    <p className="font-bold text-emerald-800 text-[11px] pt-0.5">
                      Estimated Arrival: {selectedTruck.eta}
                    </p>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>

        {/* Locate Me Floating Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="absolute bottom-3 right-3 z-10 p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-lg border border-slate-200 transition active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
          title="Center on my location"
        >
          <Crosshair className={`w-4 h-4 text-emerald-700 ${locating ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">My Location</span>
        </button>

        {/* Legend Overlay */}
        <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-md text-[10px] space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span className="text-slate-700 font-medium">Recycling Hub</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
            <span className="text-slate-700 font-medium">E-Waste Depot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-700 font-medium">Live Truck (ETA)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
