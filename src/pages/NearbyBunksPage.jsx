import React, { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getAllBunks } from "../services/bunkService";
import BunkMarker from "../map/BunkMarker";
import UserMarker from "../map/UserMarker";
import { calculateDistance, formatDistance } from "../utils/calculateDistance";
import { formatCurrency } from "../utils/formatCurrency";
import { DEFAULT_CENTER } from "../utils/constants";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

/** Re-centre the map whenever the centre prop changes */
const MapCenterer = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

const RADIUS_OPTIONS = [
  { label: "2 km",  value: 2 },
  { label: "5 km",  value: 5 },
  { label: "10 km", value: 10 },
  { label: "25 km", value: 25 },
  { label: "All",   value: 9999 },
];

const FUEL_FILTERS = [
  { label: "All",    value: "all" },
  { label: "⛽ Petrol", value: "petrol" },
  { label: "🟡 Diesel", value: "diesel" },
];

const NearbyBunksPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bunks, setBunks]               = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [loadingLoc, setLoadingLoc]     = useState(true);
  const [loadingBunks, setLoadingBunks] = useState(true);
  const [radius, setRadius]             = useState(10);
  const [fuelFilter, setFuelFilter]     = useState("all");
  const [sortBy, setSortBy]             = useState("distance");
  const [mapCenter, setMapCenter]       = useState([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]);

  // ── Geolocation ──────────────────────────────────────────────────────────
  const acquireLocation = useCallback(() => {
    setLoadingLoc(true);
    setLocationError(false);
    if (!navigator.geolocation) {
      setLocationError(true);
      setLoadingLoc(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setMapCenter(loc);
        setLoadingLoc(false);
      },
      () => {
        setLocationError(true);
        setLoadingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => { acquireLocation(); }, [acquireLocation]);

  // ── Fetch bunks ───────────────────────────────────────────────────────────
  useEffect(() => {
    getAllBunks()
      .then(setBunks)
      .catch(() => toast.error("Failed to load bunk data"))
      .finally(() => setLoadingBunks(false));
  }, []);

  // ── Derived: bunks enriched with distance ────────────────────────────────
  const enrichedBunks = bunks.map((b) => {
    const dist = userLocation
      ? calculateDistance(
          userLocation[0], userLocation[1],
          b.location.lat, b.location.lng
        )
      : null;
    return { ...b, distance: dist };
  });

  const filtered = enrichedBunks
    .filter((b) => {
      if (b.distance === null) return true;
      return b.distance <= radius;
    })
    .filter((b) => {
      if (fuelFilter === "petrol") return b.petrolStock > 0;
      if (fuelFilter === "diesel") return b.dieselStock > 0;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "distance") {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      }
      if (sortBy === "petrol") return a.pricePetrol - b.pricePetrol;
      if (sortBy === "diesel") return a.priceDiesel - b.priceDiesel;
      return 0;
    });

  const handleOrderClick = (bunk) => {
    if (!user) {
      toast.error("Please login to order fuel");
      navigate("/login");
      return;
    }
    // Navigate to /order with this bunk pre-selected
    navigate("/order", { state: { selectedBunk: bunk } });
  };

  const handleFlyTo = (bunk) => {
    setMapCenter([bunk.location.lat, bunk.location.lng]);
  };

  const openDirections = (bunk) => {
    if (!userLocation) { toast.error("Location not available"); return; }
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${bunk.location.lat},${bunk.location.lng}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const isLoading = loadingLoc || loadingBunks;

  // ── Stock badge helper ────────────────────────────────────────────────────
  const StockBadge = ({ value }) =>
    value < 100
      ? <span className="nb-stock-badge nb-stock-badge--low">⚠ Low</span>
      : <span className="nb-stock-badge nb-stock-badge--ok">✓ In Stock</span>;

  return (
    <div className="nb-page">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="nb-header">
        <div className="nb-header-text">
          <h1 className="nb-title">
            <span className="gradient-text">Nearby Petrol Bunks</span>
          </h1>
          <p className="nb-subtitle">
            {userLocation
              ? `Showing bunks within ${radius === 9999 ? "any" : radius + " km"} of your location`
              : locationError
              ? "Using default location — grant permission for accurate results"
              : "Detecting your location…"}
          </p>
        </div>

        {/* Location status pill */}
        <div className={`nb-loc-pill ${userLocation ? "nb-loc-pill--ok" : locationError ? "nb-loc-pill--err" : "nb-loc-pill--wait"}`}>
          {userLocation
            ? <>📍 Location detected</>
            : locationError
            ? <><span style={{ cursor: "pointer" }} onClick={acquireLocation}>🔄 Retry location</span></>
            : <>⏳ Locating…</>}
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="nb-toolbar">
        {/* Radius */}
        <div className="nb-toolbar-group">
          <span className="nb-toolbar-label">📍 Radius</span>
          <div className="nb-chip-row">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r.value}
                className={`nb-chip ${radius === r.value ? "nb-chip--active" : ""}`}
                onClick={() => setRadius(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fuel filter */}
        <div className="nb-toolbar-group">
          <span className="nb-toolbar-label">⛽ Fuel</span>
          <div className="nb-chip-row">
            {FUEL_FILTERS.map((f) => (
              <button
                key={f.value}
                className={`nb-chip ${fuelFilter === f.value ? "nb-chip--active" : ""}`}
                onClick={() => setFuelFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="nb-toolbar-group">
          <span className="nb-toolbar-label">↕ Sort by</span>
          <div className="nb-chip-row">
            {[
              { label: "Nearest", value: "distance" },
              { label: "Petrol ₹", value: "petrol" },
              { label: "Diesel ₹", value: "diesel" },
            ].map((s) => (
              <button
                key={s.value}
                className={`nb-chip ${sortBy === s.value ? "nb-chip--active" : ""}`}
                onClick={() => setSortBy(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="nb-count-pill">
          {isLoading ? "Loading…" : `${filtered.length} bunk${filtered.length !== 1 ? "s" : ""} found`}
        </div>
      </div>

      {/* ── Main layout: map + list ─────────────────────────────────────── */}
      <div className="nb-body">

        {/* MAP */}
        <div className="nb-map-wrap">
          {isLoading ? (
            <div className="nb-map-loading">
              <LoadingSpinner />
              <p>Loading map…</p>
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={13}
              className="nb-leaflet-map"
              zoomControl
            >
              <MapCenterer center={mapCenter} zoom={13} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {/* Radius circle */}
              {userLocation && radius < 9999 && (
                <Circle
                  center={userLocation}
                  radius={radius * 1000}
                  pathOptions={{
                    color: "#FF9800",
                    fillColor: "#FF9800",
                    fillOpacity: 0.05,
                    weight: 1.5,
                    dashArray: "6 4",
                  }}
                />
              )}

              <UserMarker position={userLocation} />

              {filtered.map((bunk) => (
                <BunkMarker
                  key={bunk.id}
                  bunk={bunk}
                  onOrderClick={handleOrderClick}
                  userLocation={userLocation}
                />
              ))}
            </MapContainer>
          )}

          {/* Map legend */}
          <div className="nb-map-legend">
            <div className="legend-item"><span className="legend-icon user">●</span> You</div>
            <div className="legend-item"><span className="legend-icon bunk">⛽</span> Bunk</div>
            {radius < 9999 && (
              <div className="legend-item"><span style={{ color: "#FF9800" }}>◯</span> Radius</div>
            )}
          </div>
        </div>

        {/* BUNK LIST */}
        <div className="nb-list">
          {isLoading ? (
            <div className="nb-list-loading">
              <LoadingSpinner />
              <p>Finding nearby bunks…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⛽</div>
              <h3>{bunks.length === 0 ? "No stations registered yet" : "No bunks in range"}</h3>
              <p style={{ marginTop: 8, fontSize: 13 }}>
                {bunks.length === 0
                  ? "Station managers need to add their bunk via the Inventory page. Once added, they'll appear here."
                  : "Try increasing the search radius or change your fuel filter."}
              </p>
              {bunks.length > 0 && (
                <button
                  className="btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={() => setRadius(9999)}
                >
                  Show All Bunks
                </button>
              )}
            </div>
          ) : (
            filtered.map((bunk, idx) => (
              <div
                key={bunk.id}
                className="nb-bunk-card"
                onClick={() => handleFlyTo(bunk)}
              >
                {/* Rank badge */}
                <div className={`nb-rank-badge ${idx === 0 ? "nb-rank-badge--first" : ""}`}>
                  {idx === 0 ? "⭐" : `#${idx + 1}`}
                </div>

                {/* Top row */}
                <div className="nb-card-top">
                  <div className="nb-card-icon">⛽</div>
                  <div className="nb-card-title-wrap">
                    <h3 className="nb-card-name">{bunk.name}</h3>
                    {bunk.address && (
                      <p className="nb-card-address">📍 {bunk.address}</p>
                    )}
                  </div>
                  {bunk.distance !== null && (
                    <div className="nb-dist-badge">
                      <span className="nb-dist-value">{formatDistance(bunk.distance)}</span>
                      <span className="nb-dist-label">away</span>
                    </div>
                  )}
                </div>

                {/* Prices grid */}
                <div className="nb-prices">
                  <div className="nb-price-box nb-price-box--petrol">
                    <span className="nb-price-fuel">🔴 Petrol</span>
                    <span className="nb-price-amount">{formatCurrency(bunk.pricePetrol)}<span className="nb-price-per">/L</span></span>
                    <StockBadge value={bunk.petrolStock} />
                    <span className="nb-price-stock-val">{bunk.petrolStock}L stock</span>
                  </div>
                  <div className="nb-price-box nb-price-box--diesel">
                    <span className="nb-price-fuel">🟡 Diesel</span>
                    <span className="nb-price-amount">{formatCurrency(bunk.priceDiesel)}<span className="nb-price-per">/L</span></span>
                    <StockBadge value={bunk.dieselStock} />
                    <span className="nb-price-stock-val">{bunk.dieselStock}L stock</span>
                  </div>
                </div>

                {/* Hours (if available) */}
                {(bunk.openTime || bunk.closeTime) && (
                  <div className="nb-card-hours">
                    🕐 {bunk.openTime || "?"} – {bunk.closeTime || "?"}
                  </div>
                )}

                {/* Action buttons */}
                <div className="nb-card-actions">
                  <button
                    className="nb-btn-order"
                    onClick={(e) => { e.stopPropagation(); handleOrderClick(bunk); }}
                  >
                    🛒 Order Fuel
                  </button>
                  <button
                    className="nb-btn-dir"
                    onClick={(e) => { e.stopPropagation(); openDirections(bunk); }}
                    title="Open directions in Google Maps"
                  >
                    🗺 Directions
                  </button>
                  <button
                    className="nb-btn-fly"
                    onClick={(e) => { e.stopPropagation(); handleFlyTo(bunk); }}
                    title="Focus on map"
                  >
                    📍
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NearbyBunksPage;
