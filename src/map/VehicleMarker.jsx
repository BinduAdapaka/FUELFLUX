import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const vehicleIcon = L.divIcon({
  className: "",
  html: `<div class="vehicle-marker-icon">🚚</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -46],
});

const VehicleMarker = ({ vehicle }) => {
  if (!vehicle?.currentLocation) return null;
  const { lat, lng } = vehicle.currentLocation;

  return (
    <Marker position={[lat, lng]} icon={vehicleIcon}>
      <Popup>
        <div className="popup-content">
          <strong>🚚 {vehicle.driverName}</strong>
          <p style={{ margin: "4px 0 0", color: "#22c55e" }}>
            {vehicle.status}
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

export default VehicleMarker;
