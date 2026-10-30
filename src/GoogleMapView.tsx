import { L, localizeText } from "./i18n";
import CapacityIndicator from "./CapacityIndicator";
import React, { useState, useEffect } from "react";
import {
  APIProvider, Map, AdvancedMarker, InfoWindow, useMap
} from "@vis.gl/react-google-maps";
import {
  Navigation, MapPin, Truck, Sparkles, Clock, CheckCircle,
  ExternalLink, Crosshair, AlertCircle
} from "lucide-react";
import {
  SIME_DARBY_COLLECTION_POINTS,
  SimeDarbyCollectionPoint,
  getGoogleMapsNavigationUrl,
  calculateDistanceKm,
} from "./simeDarbyData";
import type { BinCapacityRecord } from "./firebase";
import { isCapacityStale } from "./binCapacity";

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export interface MapFleetPoint { id: string; plate: string; township: string; route: string; lat: number; lng: number; eta: string; status: string; }

interface GoogleMapViewProps {
  userAddress?: string;
  userZone?: string;
  selectedStationId?: number;
  onSelectStation?: (station: SimeDarbyCollectionPoint) => void;
  categoryFilter?: string;
  fleet?: MapFleetPoint[];
  capacities?: Record<string, BinCapacityRecord>;
  capacityLoading?: boolean;
  compactFallback?: boolean;
  className?: string;
}

// React Error Boundary to catch any Maps initialization crashes safely
class MapErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("Caught inside MapErrorBoundary:", error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
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
  categoryFilter,
  fleet = [],
  capacities = {},
  capacityLoading = false,
  compactFallback = false,
  className = "w-full h-full min-h-[360px] rounded-2xl overflow-hidden",
}) => {
  const [activeStation, setActiveStation] = useState<SimeDarbyCollectionPoint | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 3.14, lng: 101.55 });
  const [locating, setLocating] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const [locationError, setLocationError] = useState("");
  const trucks = fleet.filter(t => Number.isFinite(t.lat) && Number.isFinite(t.lng) && Math.abs(t.lat) <= 90 && Math.abs(t.lng) <= 180);
  const [selectedTruck, setSelectedTruck] = useState<typeof trucks[0] | null>(null);

  // Listen for Google Maps quota exceeded & auth error events
  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    const handleAuthFail = () => setMapError(true);
    window.addEventListener("gmp-quota-exceeded", handleQuota);
    window.addEventListener("gmp-auth-failed", handleAuthFail);
    return () => {
      window.removeEventListener("gmp-quota-exceeded", handleQuota);
      window.removeEventListener("gmp-auth-failed", handleAuthFail);
    };
  }, []);

  // Filter collection points according to category filter
  const collectionPointsWithCapacity = SIME_DARBY_COLLECTION_POINTS.map(station => {
    const capacity = capacities[String(station.id)];
    const stale = capacity ? isCapacityStale(capacity.updatedAtMs) : false;
    return { ...station, fill: capacity && !stale ? capacity.fillPercentage : undefined, capacityStale: stale };
  });
  const displayedStations = categoryFilter && categoryFilter !== "All"
    ? collectionPointsWithCapacity.filter(s => (categoryFilter === "General" ? ["General", "Organic"].includes(s.category) : s.category.toLowerCase() === categoryFilter.toLowerCase()))
    : collectionPointsWithCapacity;

  // Sync initial selection
  useEffect(() => {
    if (selectedStationId) {
      const match = displayedStations.find(s => s.id === selectedStationId);
      if (!match) setActiveStation(null);
      if (match) {
        setActiveStation(match);
        setMapCenter({ lat: match.lat, lng: match.lng });
      }
    }
  }, [selectedStationId, categoryFilter, capacities]);

  useEffect(() => {
    if (selectedStationId || !activeStation) return;
    const updated = displayedStations.find(station => station.id === activeStation.id);
    if (updated) setActiveStation(updated);
  }, [capacities, categoryFilter, selectedStationId]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {setLocationError("Location is unavailable on this device."); return;}
    setLocationError("");
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
        setLocationError("Location unavailable. You can still choose a collection point.");
      }, {timeout: 10000, maximumAge: 60000, enableHighAccuracy: false}
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

  // Graceful Fallback Directory when Map script/auth is restricted
  const renderFallbackDirectory = () => compactFallback ? (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 gap-2 bg-emerald-50/40 text-center">
      <MapPin className="w-8 h-8 text-emerald-700" aria-hidden="true" />
      <p className="text-sm font-semibold text-slate-800"><L>{"Choose a collection point below"}</L></p>
      <p className="text-xs text-slate-600"><L>{"Map unavailable. Directions still work."}</L></p>
    </div>
  ) : (
    <div className="absolute inset-0 w-full p-4 overflow-y-auto space-y-3 bg-slate-50">
      <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-bold text-emerald-950"><L>{"Collection points"}</L></p>
          <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed"><L>{"Map unavailable. Choose a point to open directions."}</L></p>
        </div>
      </div>

      {/* Live Fleet Quick View */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-1">
          <span className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-amber-600" />
            <span><L>{"Collection fleet"}</L></span>
          </span>
          <span className="text-[10px] text-slate-500 font-normal">{localizeText(trucks.length ? "Published locations" : "No locations available")}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {localizeText(trucks.map(truck => (
            <div
              key={truck.id}
              className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{localizeText(truck.id)} ({localizeText(truck.plate)})</span>
                <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.5 rounded-md font-extrabold"><L>{"ETA "}</L>{localizeText(truck.eta)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{localizeText(truck.route)}</p>
              <p className="text-[10px] text-emerald-700 font-medium">{localizeText(truck.status)}</p>
            </div>
          )))}
        </div>
      </div>

      {/* Stations List with 1-click Navigation */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-1">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <span><L>{"Community Drop-off Stations"}</L></span>
          </span>
          <span className="text-[10px] text-slate-500 font-normal">{localizeText(displayedStations.length)}<L>{" locations"}</L></span>
        </div>
        <div className="space-y-2">
          {displayedStations.map(station => (
            <div
              key={station.id}
              onClick={() => {
                setActiveStation(station);
                if (onSelectStation) onSelectStation(station);
              }}
              className={`bg-white p-3 rounded-2xl border transition-all cursor-pointer ${
                activeStation?.id === station.id
                  ? "border-emerald-600 ring-2 ring-emerald-100 shadow-xs"
                  : "border-slate-200 hover:border-slate-300 shadow-2xs"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    {localizeText(station.townshipName)}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">{localizeText(station.name)}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{station.address}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                  {localizeText(station.category)}
                </span>
              </div>

              <CapacityIndicator value={station.fill} stale={station.capacityStale} loading={capacityLoading} label={localizeText(station.name)} updatedAtMs={capacities[String(station.id)]?.updatedAtMs} />
              <div className="mt-2.5 flex items-center justify-between pt-1">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                  +{localizeText(station.pointsPerKg)}<L>{" pts/kg"}</L></span>
                <a
                  href={getGoogleMapsNavigationUrl(station.lat, station.lng, userLocation?.lat, userLocation?.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  aria-label={localizeText(`Directions to ${station.name}`)} className="icon-button w-10 h-10 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
                >
                  <Navigation className="w-3 h-3" />

                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`relative flex flex-col ${className} bg-slate-100 border border-slate-200 shadow-sm`}>
        {/* Legend Overlay */}
        <div className="map-legend" aria-label={localizeText("Map legend")}>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span className="text-slate-700 font-medium"><L>{"Recycling Hub"}</L></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
            <span className="text-slate-700 font-medium"><L>{"E-Waste Depot"}</L></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-700 font-medium"><L>{"Collection fleet"}</L></span>
          </div>
        </div>
      {/* Quota Exceeded Banner (Section 8 Case A Mandate) */}
      {localizeText(locationError && <p role="status" className="p-2 text-xs text-slate-700 bg-white">{localizeText(locationError)}</p>)}
      {localizeText(quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-3 py-2 text-[11px] text-center sticky top-0 z-50 shadow-sm">
          <span><L>{"Google Maps Platform quota reached. If you are the app owner, visit"}</L>{localizeText(" ")}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            ><L>{"maps developer site"}</L></a>{localizeText(" ")}<L>{"for instructions to update your account."}</L></span>
        </div>
      ))}



      {/* Map Container or Resilient Fallback Directory */}
      <div className="relative flex-1 w-full min-h-[300px]">
        {mapError || quotaExceeded || !GOOGLE_MAPS_KEY ? (
          renderFallbackDirectory()
        ) : (
          <MapErrorBoundary fallback={renderFallbackDirectory()}>
            <APIProvider
              apiKey={GOOGLE_MAPS_KEY}
              onError={(err) => {
                console.warn("APIProvider failed to load:", err);
                setMapError(true);
              }}
            >
              <Map
                mapId="DEMO_MAP_ID"
                defaultCenter={mapCenter}
                defaultZoom={11}
                style={{ width: "100%", height: "100%" }}
                internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                mapTypeControl={false}
                streetViewControl={false}
                fullscreenControl={false}
                zoomControl={true}
              >
                <MapPanController targetCoords={mapCenter} />

            {/* Collection Points Markers */}
            {localizeText(displayedStations.map((station) => (
              <AdvancedMarker
                key={station.id}
                position={{ lat: station.lat, lng: station.lng }}
                onClick={() => {
                  setActiveStation(station);
                  setSelectedTruck(null);
                  if (onSelectStation) onSelectStation(station);
                }}
                title={localizeText(station.name)}
              >
                <div
                  className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-transform duration-200 hover:scale-110 cursor-pointer shadow-md ${getPinColor(
                    station.category
                  )} ${activeStation?.id === station.id ? "scale-125 ring-3 ring-emerald-400" : ""}`}
                >
                  <MapPin className="w-4 h-4 fill-current" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white text-emerald-800 text-[9px] font-black flex items-center justify-center border border-slate-200 shadow-xs">
                    {station.fill === undefined ? "—" : `${localizeText(station.fill)}%`}
                  </span>
                </div>
              </AdvancedMarker>
            )))}

            {/* Live Garbage Truck Fleet Markers */}
            {localizeText(trucks.map((truck) => (
              <AdvancedMarker
                key={truck.id}
                position={{ lat: truck.lat, lng: truck.lng }}
                onClick={() => {
                  setSelectedTruck(truck);
                  setActiveStation(null);
                }}
                title={localizeText(`Garbage Truck ${truck.plate} – ${truck.township}`)}
              >
                <div className="flex items-center gap-1 bg-amber-500 text-slate-950 font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white animate-pulse cursor-pointer">
                  <Truck className="w-3.5 h-3.5 text-slate-900" />
                  <span className="text-[10px] font-extrabold">{localizeText(truck.eta)}</span>
                </div>
              </AdvancedMarker>
            )))}

            {/* User GPS Marker */}
            {localizeText(userLocation && (
              <AdvancedMarker position={userLocation} title={localizeText("Your Current Location")}>
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-6 h-6 rounded-full bg-blue-500/30 animate-ping" />
                  <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md" />
                </div>
              </AdvancedMarker>
            ))}

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
                        {localizeText(activeStation.townshipName)}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {localizeText(activeStation.name)}
                      </h4>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                      {localizeText(activeStation.status)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    {activeStation.address}
                  </p>

                  {/* Fill Level */}
                  <div className="space-y-0.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-700">
                      <span><L>{"Bin Capacity Fill:"}</L></span>

                    </div>
                    <CapacityIndicator value={activeStation.fill} stale={Boolean(capacities[String(activeStation.id)] && isCapacityStale(capacities[String(activeStation.id)].updatedAtMs))} loading={capacityLoading} label={localizeText(activeStation.name)} updatedAtMs={capacities[String(activeStation.id)]?.updatedAtMs} />
                  </div>

                  {/* Materials & Points */}
                  <div className="flex items-center justify-between text-[10px] text-slate-600">
                    <span className="flex items-center gap-1 font-medium text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {localizeText(activeStation.operatingHours)}
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      +{localizeText(activeStation.pointsPerKg)}<L>{" pts/kg"}</L></span>
                  </div>

                  {/* Direct Google Maps Directions */}
                  <div className="pt-1 flex justify-end">
                    <a
                      href={getGoogleMapsNavigationUrl(activeStation.lat, activeStation.lng, userLocation?.lat, userLocation?.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="map-directions icon-button" aria-label={localizeText(`Directions to ${activeStation.name} in Google Maps`)} title={localizeText("Open directions")}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </InfoWindow>
            )}

            {/* Truck InfoWindow Popup */}
            {localizeText(selectedTruck && (
              <InfoWindow
                position={{ lat: selectedTruck.lat, lng: selectedTruck.lng }}
                onCloseClick={() => setSelectedTruck(null)}
              >
                <div className="p-1 max-w-[220px] text-slate-900 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-amber-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {localizeText(selectedTruck.id)} ({localizeText(selectedTruck.plate)})
                      </h4>
                      <p className="text-[10px] text-slate-500">{localizeText(selectedTruck.township)}</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-200/80 text-[10px] space-y-0.5">
                    <p className="font-medium text-amber-900"><L>{"Status: "}</L><span className="font-normal">{localizeText(selectedTruck.status)}</span>
                    </p>
                    <p className="font-medium text-amber-900"><L>{"Route: "}</L><span className="font-normal">{localizeText(selectedTruck.route)}</span>
                    </p>
                    <p className="font-bold text-emerald-800 text-[11px] pt-0.5"><L>{"Estimated Arrival: "}</L>{localizeText(selectedTruck.eta)}
                    </p>
                  </div>
                </div>
              </InfoWindow>
            ))}
          </Map>
        </APIProvider>

        {/* Locate Me Floating Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="absolute bottom-3 right-3 z-10 p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-lg border border-slate-200 transition active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
          title={localizeText("Center on my location")}
        >
          <Crosshair className={`w-4 h-4 text-emerald-700 ${locating ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline"><L>{"My Location"}</L></span>
        </button>

      </MapErrorBoundary>
        )}
      </div>
    </div>
  );
};
