import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { formatCurrency } from "../utils/formatCurrency";

// Simple, reliable fuel station icon — no CSS rotation tricks
const bunkIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:42px;height:42px;
      background:linear-gradient(135deg,#f59e0b,#fb923c);
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:22px;
      box-shadow:0 2px 10px rgba(245,158,11,0.7);
      border:3px solid #fff;
      cursor:pointer;
    ">⛽</div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -46],
});

const BunkMarker = ({ bunk, onOrderClick }) => {
  return (
    <Marker position={[bunk.location.lat, bunk.location.lng]} icon={bunkIcon}>
      <Popup className="bunk-popup" minWidth={230}>
        <div className="popup-content">
          <h3 className="popup-name">⛽ {bunk.name}</h3>

          <div className="popup-prices">
            <div className="popup-price-item petrol">
              <span className="price-label">🔴 Petrol</span>
              <span className="price-value">{formatCurrency(bunk.pricePetrol)}/L</span>
            </div>
            <div className="popup-price-item diesel">
              <span className="price-label">🟡 Diesel</span>
              <span className="price-value">{formatCurrency(bunk.priceDiesel)}/L</span>
            </div>
          </div>

          <div className="popup-stock">
            <div className="stock-item">
              <span>Petrol Stock</span>
              <span className={bunk.petrolStock < 100 ? "stock-low" : "stock-ok"}>
                {bunk.petrolStock}L
              </span>
            </div>
            <div className="stock-item">
              <span>Diesel Stock</span>
              <span className={bunk.dieselStock < 100 ? "stock-low" : "stock-ok"}>
                {bunk.dieselStock}L
              </span>
            </div>
          </div>

          <button className="popup-order-btn" onClick={() => onOrderClick(bunk)}>
            🛒 Order Fuel
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

export default BunkMarker;
