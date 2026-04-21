import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const userIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:22px;height:22px;
      background:#3b82f6;
      border-radius:50%;
      border:3px solid #fff;
      box-shadow:0 0 0 5px rgba(59,130,246,0.3), 0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -16],
});

const UserMarker = ({ position }) => {
  if (!position) return null;
  return (
    <Marker position={position} icon={userIcon}>
      <Popup>
        <div style={{ textAlign: "center", fontWeight: 600, padding: "2px 4px" }}>
          📍 Your Location
        </div>
      </Popup>
    </Marker>
  );
};

export default UserMarker;
