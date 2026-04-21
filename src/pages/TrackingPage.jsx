import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapContainer, TileLayer, Polyline, Marker, Popup, useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { subscribeToOrder } from "../services/orderService";
import { subscribeToVehicle } from "../services/vehicleService";
import { getBunkById } from "../services/bunkService";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatCurrency } from "../utils/formatCurrency";
import { STATUS_COLORS, DEFAULT_CENTER } from "../utils/constants";

// ── Icons ──────────────────────────────────────────────────────────────────────
const makeIcon = (emoji, bg, size = 42) => L.divIcon({
  className: "",
  html: `<div style="
    width:${size}px;height:${size}px;
    background:${bg};
    border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    font-size:${Math.round(size * 0.5)}px;
    box-shadow:0 2px 12px rgba(0,0,0,0.4);
    border:3px solid #fff;
  ">${emoji}</div>`,
  iconSize: [size, size],
  iconAnchor: [size / 2, size],
  popupAnchor: [0, -(size + 4)],
});

const bunkIcon     = makeIcon("⛽", "linear-gradient(135deg,#f59e0b,#fb923c)", 44);
const deliveryIcon = makeIcon("📍", "linear-gradient(135deg,#3b82f6,#6366f1)", 38);
const vehicleIcon  = makeIcon("🚚", "linear-gradient(135deg,#22c55e,#16a34a)", 44);

// ── Auto-fit bounds ────────────────────────────────────────────────────────────
const FitBounds = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length < 2) return;
    try {
      const bounds = L.latLngBounds(points);
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [60, 60] });
    } catch {
      // Ignore invalid bounds
    }
  }, [points, map]);
  return null;
};

// ── OSRM routing ───────────────────────────────────────────────────────────────
const fetchRoute = async (from, to) => {
  // OSRM expects [lng, lat]
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from[1]},${from[0]};${to[1]},${to[0]}` +
    `?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("OSRM error");
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) throw new Error("No route");
  const route = data.routes[0];
  // GeoJSON coords are [lng, lat] — flip to [lat, lng] for Leaflet
  const polyline = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  const steps = route.legs[0]?.steps?.map((s) => ({
    instruction: s.maneuver?.type,
    name: s.name,
    distance: s.distance,
    duration: s.duration,
  })) ?? [];
  return { polyline, distance: route.distance, duration: route.duration, steps };
};

// ── Main Component ─────────────────────────────────────────────────────────────
const TrackingPage = () => {
  const { orderId } = useParams();
  const navigate    = useNavigate();

  const [order,        setOrder]        = useState(null);
  const [vehicle,      setVehicle]      = useState(null);
  const [bunk,         setBunk]         = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading,      setLoading]      = useState(true);

  // Route data
  const [routePoints,  setRoutePoints]  = useState(null);  // [[lat,lng], ...]
  const [routeMeta,    setRouteMeta]    = useState(null);   // {distance, duration, steps}
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError,   setRouteError]   = useState(false);
  const [showSteps,    setShowSteps]    = useState(false);

  // Geolocation
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, []);

  // Subscribe to order
  useEffect(() => {
    const unsub = subscribeToOrder(orderId, (data) => {
      setOrder(data);
      setLoading(false);
    });
    return unsub;
  }, [orderId]);

  // Fetch bunk info
  useEffect(() => {
    if (!order?.bunkId) return;
    getBunkById(order.bunkId).then(setBunk).catch(() => {
      if (order.bunkLocation) setBunk({ location: order.bunkLocation, name: order.bunkName });
    });
  }, [order?.bunkId, order?.bunkLocation, order?.bunkName]);

  // Subscribe to vehicle
  useEffect(() => {
    if (!order?.vehicleId) return;
    const unsub = subscribeToVehicle(order.vehicleId, setVehicle);
    return unsub;
  }, [order?.vehicleId]);

  // Build coordinate points
  const bunkPos = bunk?.location
    ? [bunk.location.lat, bunk.location.lng]
    : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];

  const vehiclePos = vehicle?.currentLocation
    ? [vehicle.currentLocation.lat, vehicle.currentLocation.lng]
    : null;

  const deliveryPos = userLocation || [bunkPos[0] + 0.018, bunkPos[1] + 0.015];

  const routeOrigin = vehiclePos || bunkPos;

  const routeOriginStr = useMemo(() => JSON.stringify(routeOrigin), [routeOrigin]);
  const deliveryPosStr = useMemo(() => JSON.stringify(deliveryPos), [deliveryPos]);

  // Fetch live road route whenever origin/dest are ready
  const loadRoute = useCallback(async () => {
    setRouteLoading(true);
    setRouteError(false);
    try {
      const result = await fetchRoute(routeOrigin, deliveryPos);
      setRoutePoints(result.polyline);
      setRouteMeta({ distance: result.distance, duration: result.duration, steps: result.steps });
    } catch {
      setRouteError(true);
      // Fall back to straight line
      setRoutePoints([routeOrigin, deliveryPos]);
    } finally {
      setRouteLoading(false);
    }
  }, [routeOrigin, deliveryPos, routeOriginStr, deliveryPosStr]);

  useEffect(() => {
    if (!bunk) return;
    loadRoute();
  }, [loadRoute, bunk]);

  if (loading) {
    return (
      <div className="centered" style={{ height: "60vh" }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">❓</div>
          <h3>Order not found</h3>
          <button className="btn-primary" onClick={() => navigate("/orders")}>Back to Orders</button>
        </div>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[order.status] || "#888";
  const mapCenter   = bunkPos;

  // Format helpers
  const fmtDist = (m) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
  const fmtTime = (s) => {
    const mins = Math.round(s / 60);
    return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  // Maneuver emoji map
  const maneuverIcon = (type) => ({
    turn: "↩️", "new name": "➡️", depart: "🚦", arrive: "🏁",
    merge: "🔀", "on ramp": "⬆️", "off ramp": "⬇️",
    fork: "🍴", "end of road": "🔚", roundabout: "🔄", rotary: "🔄",
  }[type] || "➡️");

  return (
    <div className="tracking-page">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div className="tracking-sidebar">
        <button className="btn-back" onClick={() => navigate("/orders")}>← Back</button>

        <div className="tracking-card">
          <h2 className="tracking-title">📍 Live Tracking</h2>

          {/* Status badge */}
          <div className="order-status-section">
            <span className="status-badge large" style={{
              backgroundColor: statusColor + "22", color: statusColor, borderColor: statusColor,
            }}>
              {order.status}
            </span>
          </div>

          {/* Progress steps */}
          <div className="tracking-steps">
            {["Pending", "Dispatched", "Delivered"].map((step, i) => {
              const idx   = ["Pending", "Dispatched", "Delivered"].indexOf(order.status);
              const isDone = i <= idx;
              return (
                <div key={step} className={`tracking-step ${isDone ? "done" : ""}`}>
                  <div className="step-dot" />
                  <span className="step-label">{step}</span>
                </div>
              );
            })}
          </div>

          {/* Route info card */}
          {routeMeta && !routeError && (
            <div className="route-info-card">
              <div className="route-info-row">
                <span className="route-info-item">
                  <span className="route-info-icon">📏</span>
                  <span>{fmtDist(routeMeta.distance)}</span>
                </span>
                <span className="route-info-divider" />
                <span className="route-info-item">
                  <span className="route-info-icon">⏱</span>
                  <span>{fmtTime(routeMeta.duration)}</span>
                </span>
              </div>

              {/* Toggle turn-by-turn directions */}
              {routeMeta.steps?.length > 0 && (
                <>
                  <button
                    className="directions-toggle-btn"
                    onClick={() => setShowSteps((v) => !v)}
                  >
                    {showSteps ? "▲ Hide directions" : "▼ Show directions"}
                  </button>

                  {showSteps && (
                    <div className="directions-list">
                      {routeMeta.steps
                        .filter((s) => s.instruction && s.name !== undefined)
                        .map((step, i) => (
                          <div key={i} className="direction-step">
                            <span className="direction-icon">
                              {maneuverIcon(step.instruction)}
                            </span>
                            <span className="direction-text">
                              {step.name ? (
                                <>
                                  <strong>{step.instruction.replace(/-/g, " ")}</strong>
                                  {" onto "}
                                  <em>{step.name}</em>
                                </>
                              ) : (
                                <strong>{step.instruction.replace(/-/g, " ")}</strong>
                              )}
                            </span>
                            <span className="direction-dist">{fmtDist(step.distance)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {routeLoading && (
            <div className="route-loading">
              <div className="spinner-ring small" style={{ margin: "0 auto" }} />
              <span>Calculating route…</span>
            </div>
          )}

          {routeError && (
            <div className="route-error-note">
              ⚠ Could not load road route. Showing straight-line path.
            </div>
          )}

          {/* Order summary */}
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-row"><span>Bunk</span><span>{order.bunkName}</span></div>
            <div className="summary-row"><span>Fuel</span><span>{order.fuelType}</span></div>
            <div className="summary-row"><span>Quantity</span><span>{order.quantity}L</span></div>
            <div className="summary-row"><span>Total</span><span className="summary-total">{formatCurrency(order.totalPrice)}</span></div>
            <div className="summary-row"><span>Payment</span><span>{order.paymentMethod}</span></div>
          </div>

          {/* Driver info */}
          {vehicle && (
            <div className="driver-info">
              <h3>🚚 Driver</h3>
              <p className="driver-name">{vehicle.driverName}</p>
              <p className="driver-status" style={{ color: statusColor }}>{vehicle.status}</p>
            </div>
          )}

          {order.status === "Pending" && (
            <div className="pending-note">
              ⏳ Waiting for dispatch. A driver will be assigned shortly.
            </div>
          )}
          {order.status === "Delivered" && (
            <div className="delivered-banner">🎉 Fuel delivered successfully!</div>
          )}
        </div>
      </div>

      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <div className="tracking-map-wrapper">
        <MapContainer center={mapCenter} zoom={13} className="leaflet-map">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Auto-fit bounds once route loads */}
          {routePoints && <FitBounds points={routePoints} />}

          {/* ⛽ Bunk / origin marker */}
          <Marker position={bunkPos} icon={bunkIcon}>
            <Popup>
              <div style={{ textAlign: "center", fontWeight: 600, padding: "4px 6px" }}>
                ⛽ {order.bunkName}
                <br />
                <span style={{ fontWeight: 400, fontSize: 12, color: "#888" }}>Dispatch point</span>
              </div>
            </Popup>
          </Marker>

          {/* 📍 Delivery destination marker */}
          <Marker position={deliveryPos} icon={deliveryIcon}>
            <Popup>
              <div style={{ textAlign: "center", fontWeight: 600, padding: "4px 6px" }}>
                📍 Delivery Location
                {!userLocation && (
                  <>
                    <br />
                    <span style={{ fontWeight: 400, fontSize: 11, color: "#f59e0b" }}>
                      ⚠ Enable location for exact pin
                    </span>
                  </>
                )}
              </div>
            </Popup>
          </Marker>

          {/* 🚚 Vehicle marker (when dispatched) */}
          {vehiclePos && (
            <Marker position={vehiclePos} icon={vehicleIcon}>
              <Popup>
                <div style={{ textAlign: "center", fontWeight: 600, padding: "4px 6px" }}>
                  🚚 {vehicle?.driverName}
                  <br />
                  <span style={{ color: "#22c55e", fontWeight: 400, fontSize: 12 }}>En route</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Road route polyline */}
          {routePoints && (
            <Polyline
              positions={routePoints}
              pathOptions={{
                color: routeError ? "#f59e0b" : "#3b82f6",
                weight: routeError ? 3 : 5,
                opacity: 0.85,
                dashArray: routeError ? "10,7" : undefined,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          )}

          {/* Route highlight (glow effect underneath) */}
          {routePoints && !routeError && (
            <Polyline
              positions={routePoints}
              pathOptions={{
                color: "#60a5fa",
                weight: 10,
                opacity: 0.25,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          )}
        </MapContainer>

        {/* Map legend */}
        <div className="tracking-map-legend">
          <div className="tml-item"><span>⛽</span> Fuel Station</div>
          <div className="tml-item"><span>📍</span> Your Location</div>
          {vehiclePos && <div className="tml-item"><span>🚚</span> Driver</div>}
          <div className="tml-item">
            <span style={{ display: "inline-block", width: 24, height: 4, background: "#3b82f6", borderRadius: 2, verticalAlign: "middle" }} />
            {" "}Route
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
