import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getAllBunks } from "../services/bunkService";
import BunkMarker from "./BunkMarker";
import UserMarker from "./UserMarker";
import { DEFAULT_CENTER } from "../utils/constants";
import LoadingSpinner from "../components/LoadingSpinner";

const MapView = ({ onOrderClick }) => {
  const [bunks, setBunks] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [center, setCenter] = useState([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]);
  const [loading, setLoading] = useState(true);

  // Get user geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setCenter(loc);
        },
        () => {
          // Use default center if denied
          setCenter([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]);
        }
      );
    }
  }, []);

  // Fetch bunk data
  useEffect(() => {
    const fetchBunks = async () => {
      try {
        const data = await getAllBunks();
        setBunks(data);
      } catch (err) {
        console.error("Failed to load bunks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBunks();
  }, []);

  if (loading) {
    return (
      <div className="map-loading">
        <LoadingSpinner />
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="leaflet-map"
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <UserMarker position={userLocation} />

      {bunks.map((bunk) => (
        <BunkMarker
          key={bunk.id}
          bunk={bunk}
          onOrderClick={onOrderClick}
          userLocation={userLocation}
        />
      ))}

      {/* Overlay shown when no stations have been registered yet */}
      {bunks.length === 0 && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <div style={{
            background: "rgba(13,13,13,0.88)", backdropFilter: "blur(8px)",
            border: "1px solid #2a2a2a", borderRadius: 16,
            padding: "24px 32px", textAlign: "center", maxWidth: 340,
          }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>⛽</div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 6 }}>
              No stations registered yet
            </h3>
            <p style={{ fontSize: 13, color: "#a0a0a0", lineHeight: 1.5 }}>
              Station managers need to add their bunk via the <strong style={{ color: "#FF9800" }}>Inventory</strong> page. Stations will appear here once added.
            </p>
          </div>
        </div>
      )}
    </MapContainer>
  );
};

export default MapView;
