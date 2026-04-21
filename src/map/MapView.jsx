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
    </MapContainer>
  );
};

export default MapView;
