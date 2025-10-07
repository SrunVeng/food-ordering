// src/components/MapPreview.jsx
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";

// Marker icon fix (re-use same assets once in your project if you prefer)
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker1x from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: marker2x,
    iconUrl: marker1x,
    shadowUrl: markerShadow,
});

export default function MapPreview({
                                       point,         // { lat, lng }
                                       height = 180,
                                       zoom = 15,
                                       className = "",
                                   }) {
    if (!point?.lat || !point?.lng) return null;
    return (
        <div className={`overflow-hidden rounded-xl border ${className}`}>
            <MapContainer
                center={[point.lat, point.lng]}
                zoom={zoom}
                style={{ height }}
                dragging={false}
                touchZoom={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                boxZoom={false}
                keyboard={false}
                attributionControl={false}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; OSM'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[point.lat, point.lng]} />
            </MapContainer>
        </div>
    );
}
