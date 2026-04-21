import React, { useState } from "react";
import MapView from "../map/MapView";
import OrderForm from "../components/OrderForm";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import toast from "react-hot-toast";

const HomePage = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [selectedBunk, setSelectedBunk] = useState(null);
  const [lastOrderId, setLastOrderId] = useState(null);

  // Redirect non-user roles to their dashboards
  if (role === "manager") return <Navigate to="/inventory" replace />;
  if (role === "admin")   return <Navigate to="/admin"     replace />;

  const handleOrderClick = (bunk) => {
    if (!user) {
      toast.error("Please login to order fuel");
      navigate("/login");
      return;
    }
    setSelectedBunk(bunk);
  };

  const handleOrderPlaced = (orderId) => {
    setLastOrderId(orderId);
    setSelectedBunk(null);
  };

  return (
    <div className="home-page">
      {/* Hero banner */}
      <div className="map-header">
        <div className="map-header-content">
          <h1 className="map-title">
            <span className="gradient-text">Fuel at Your Doorstep</span>
          </h1>
          <p className="map-subtitle">
            Find nearby petrol bunks, check prices, and order fuel in minutes.
          </p>
        </div>

        {lastOrderId && (
          <div className="order-success-banner">
            ✅ Order placed!{" "}
            <button
              className="btn-text"
              onClick={() => navigate(`/track/${lastOrderId}`)}
            >
              Track delivery →
            </button>
          </div>
        )}
      </div>

      <div className="map-container">
        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-icon user">●</span> Your Location
          </div>
          <div className="legend-item">
            <span className="legend-icon bunk">⛽</span> Petrol Bunk
          </div>
          <div className="legend-item">
            <span className="legend-icon vehicle">🚚</span> Delivery
          </div>
        </div>
        <MapView onOrderClick={handleOrderClick} />
      </div>

      {selectedBunk && (
        <OrderForm
          bunk={selectedBunk}
          onClose={() => setSelectedBunk(null)}
          onOrderPlaced={handleOrderPlaced}
        />
      )}
    </div>
  );
};

export default HomePage;
