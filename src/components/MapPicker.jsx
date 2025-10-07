// src/components/MapPicker.jsx
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import {
    LocateFixed,
    Eraser,
    MapPin,
    UtensilsCrossed,
    Info,
    Loader2,
} from "lucide-react";

// Fix default marker icons for bundlers (Vite/CRA)
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker1x from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: marker2x,
    iconUrl: marker1x,
    shadowUrl: markerShadow,
});

function ClickCapture({ onPick }) {
    useMapEvents({
        click(e) {
            onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return null;
}

/**
 * Props:
 *  - purpose: "meeting" | "restaurant"  (default "meeting")
 *  - value: { lat, lng, label }
 *  - onChange(next: { lat, lng, label } | null)
 *  - height: number (px)
 *  - readOnly: boolean
 *  - defaultCenter: { lat, lng }
 *  - defaultZoom: number
 */
export default function MapPicker({
                                      purpose = "meeting",
                                      value,
                                      onChange,
                                      height = 280,
                                      readOnly = false,
                                      defaultCenter = { lat: 11.5564, lng: 104.9282 }, // Phnom Penh
                                      defaultZoom = 13,
                                      className = "",
                                  }) {
    const [label, setLabel] = useState(value?.label || "");
    const [locating, setLocating] = useState(false);
    const [geoErr, setGeoErr] = useState("");

    const center = useMemo(
        () =>
            value?.lat && value?.lng
                ? { lat: value.lat, lng: value.lng }
                : defaultCenter,
        [value, defaultCenter]
    );

    useEffect(() => {
        setLabel(value?.label || "");
    }, [value?.label]);

    function setPoint(pt) {
        onChange?.({ ...(value || {}), ...pt, label: value?.label || "" });
    }

    function clearPoint() {
        onChange?.(null);
    }

    async function useMyLocation() {
        setGeoErr("");
        if (!navigator.geolocation) {
            setGeoErr("Geolocation is not available in this browser.");
            return;
        }
        try {
            setLocating(true);
            await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const { latitude, longitude } = pos.coords;
                        setPoint({ lat: latitude, lng: longitude });
                        resolve();
                    },
                    (err) => reject(err),
                    { enableHighAccuracy: true, timeout: 10000 }
                );
            });
        } catch {
            setGeoErr("Couldn’t get your location. Check permissions and try again.");
        } finally {
            setLocating(false);
        }
    }

    const chip = purpose === "restaurant" ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[12px] text-orange-700">
      <UtensilsCrossed className="size-3.5" />
      Pin purpose: Restaurant location
    </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[12px] text-emerald-700">
      <MapPin className="size-3.5" />
      Pin purpose: Meeting / gathering place
    </span>
    );

    const helper =
        purpose === "restaurant"
            ? "Drop a pin where the restaurant is located."
            : "Drop a pin where people will meet up (not the restaurant).";

    return (
        <div className={className}>
            {/* Purpose chip + helper text */}
            <div className="mb-2 flex items-center justify-between gap-2">
                {chip}
                {!readOnly && (
                    <div className="hidden sm:flex items-center gap-1 text-xs text-neutral-500">
                        <Info className="size-3.5" />
                        {helper}
                    </div>
                )}
            </div>

            {!readOnly && (
                <div className="mb-2 flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={useMyLocation}
                        disabled={locating}
                        className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-60"
                    >
                        {locating ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Locating…
                            </>
                        ) : (
                            <>
                                <LocateFixed className="size-4" />
                                Use my location
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={clearPoint}
                        className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-60"
                        disabled={!value?.lat}
                        title="Clear pin"
                    >
                        <Eraser className="size-4" />
                        Clear pin
                    </button>
                </div>
            )}

            {/* Map */}
            <div className="overflow-hidden rounded-xl border">
                <MapContainer
                    center={[center.lat, center.lng]}
                    zoom={defaultZoom}
                    style={{ height }}
                    scrollWheelZoom={!readOnly}
                    dragging={!readOnly}
                    doubleClickZoom={!readOnly}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {value?.lat && value?.lng ? (
                        <Marker position={[value.lat, value.lng]} />
                    ) : null}
                    {!readOnly ? <ClickCapture onPick={setPoint} /> : null}
                </MapContainer>
            </div>

            {/* Geolocation error (if any) */}
            {geoErr && (
                <div
                    className="mt-2 text-xs text-red-600"
                    role="status"
                    aria-live="polite"
                >
                    {geoErr}
                </div>
            )}

            {/* Label input */}
            {!readOnly && (
                <div className="mt-2 grid gap-1">
                    <label className="text-xs text-neutral-600 inline-flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {purpose === "restaurant" ? "Location label (optional)" : "Meeting place label (optional)"}
                    </label>
                    <input
                        className="input"
                        placeholder={
                            purpose === "restaurant"
                                ? "e.g., Pho House front door"
                                : "e.g., Office lobby, Front gate, Building B"
                        }
                        value={label}
                        onChange={(e) => {
                            setLabel(e.target.value);
                            if (value?.lat && value?.lng) {
                                onChange?.({ ...value, label: e.target.value });
                            }
                        }}
                        onBlur={() => {
                            if (value?.lat && value?.lng) {
                                onChange?.({ ...value, label });
                            }
                        }}
                    />
                    <div className="text-xs text-neutral-500">
                        Click the map to drop a pin. We use free OpenStreetMap tiles (no Google billing).
                    </div>
                </div>
            )}
        </div>
    );
}
