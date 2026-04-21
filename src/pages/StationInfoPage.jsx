import React, { useEffect, useState, useCallback } from "react";
import {
  getBunksByManager,
  updateBunkInfo,
  registerBunk,
} from "../services/bunkService";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

// ── Register Bunk Form ────────────────────────────────────────────────────────
const RegisterBunkForm = ({ managerId, onRegistered, onCancel }) => {
  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [form, setForm] = useState({
    name:        "",
    address:     "",
    phone:       "",
    openTime:    "06:00",
    closeTime:   "22:00",
    lat:         "",
    lng:         "",
    petrolStock: "500",
    dieselStock: "500",
    pricePetrol: "102.00",
    priceDiesel: "89.00",
  });

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const detectGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by this browser");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        setGpsLoading(false);
        toast.success("📍 GPS location detected!");
      },
      () => {
        toast.error("Could not get GPS location. Enter coordinates manually.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())        { toast.error("Station name is required"); return; }
    if (!form.lat || !form.lng)   { toast.error("GPS coordinates are required — use Detect or enter manually"); return; }
    if (isNaN(Number(form.lat)) || isNaN(Number(form.lng))) {
      toast.error("Invalid GPS coordinates"); return;
    }

    setSaving(true);
    try {
      const id = await registerBunk(managerId, form);
      toast.success(`🎉 "${form.name}" is now live on the map!`);
      onRegistered(id, form);
    } catch (err) {
      toast.error("Failed to register bunk: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rb-form-card">
      <div className="rb-form-header">
        <span className="rb-form-icon">⛽</span>
        <div>
          <h2 className="rb-form-title">Register Your Petrol Bunk</h2>
          <p className="rb-form-subtitle">
            Once registered, your bunk will appear live on the nearby-bunks map for all users.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rb-form">

        {/* ── Basic Info ── */}
        <div className="rb-section-label">🏪 Station Details</div>

        <div className="form-group">
          <label className="form-label">Station Name <span className="required">*</span></label>
          <input
            className="form-input"
            placeholder="e.g. HP Petrol Bunk — Banjara Hills"
            value={form.name}
            onChange={set("name")}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Address</label>
          <textarea
            className="form-input textarea"
            placeholder="Plot 12, Road 4, Banjara Hills, Hyderabad - 500034"
            value={form.address}
            onChange={set("address")}
            rows={2}
          />
        </div>

        <div className="rb-two-col">
          <div className="form-group">
            <label className="form-label">Contact Phone</label>
            <input
              className="form-input"
              type="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={set("phone")}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Opening Hours</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input className="form-input" type="time" value={form.openTime} onChange={set("openTime")} style={{ flex: 1 }} />
              <span style={{ color: "var(--text2)", fontSize: 13 }}>to</span>
              <input className="form-input" type="time" value={form.closeTime} onChange={set("closeTime")} style={{ flex: 1 }} />
            </div>
          </div>
        </div>

        {/* ── GPS Location ── */}
        <div className="rb-section-label">📍 GPS Location <span className="required">*</span></div>

        <div className="rb-gps-row">
          <button
            type="button"
            className={`rb-gps-btn ${gpsLoading ? "rb-gps-btn--loading" : ""}`}
            onClick={detectGPS}
            disabled={gpsLoading}
          >
            {gpsLoading
              ? <><span className="spinner-ring small" /> Detecting…</>
              : <>📍 Auto-detect my location</>}
          </button>
          {form.lat && form.lng && (
            <span className="rb-gps-detected">
              ✅ {Number(form.lat).toFixed(5)}, {Number(form.lng).toFixed(5)}
            </span>
          )}
        </div>

        <div className="rb-two-col">
          <div className="form-group">
            <label className="form-label">Latitude</label>
            <input
              className="form-input"
              type="number"
              step="0.000001"
              placeholder="e.g. 17.412600"
              value={form.lat}
              onChange={set("lat")}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Longitude</label>
            <input
              className="form-input"
              type="number"
              step="0.000001"
              placeholder="e.g. 78.447500"
              value={form.lng}
              onChange={set("lng")}
            />
          </div>
        </div>

        {/* ── Initial Inventory ── */}
        <div className="rb-section-label">📦 Initial Inventory</div>

        <div className="rb-four-col">
          {[
            { key: "petrolStock", label: "🔴 Petrol Stock", suffix: "L", step: "1" },
            { key: "dieselStock", label: "🟡 Diesel Stock", suffix: "L", step: "1" },
            { key: "pricePetrol", label: "🔴 Petrol Price", prefix: "₹", suffix: "/L", step: "0.01" },
            { key: "priceDiesel", label: "🟡 Diesel Price", prefix: "₹", suffix: "/L", step: "0.01" },
          ].map(({ key, label, prefix, suffix, step }) => (
            <div className="form-group" key={key}>
              <label className="form-label">{label}</label>
              <div className="inv-input-wrap">
                {prefix && <span className="inv-prefix">{prefix}</span>}
                <input
                  type="number"
                  className={`form-input inv-input ${prefix ? "with-prefix" : ""}`}
                  value={form[key]}
                  step={step}
                  min={step === "0.01" ? "0.01" : "0"}
                  onChange={set(key)}
                />
              </div>
              <span className="field-hint">{suffix}</span>
            </div>
          ))}
        </div>

        {/* ── Actions ── */}
        <div className="rb-actions">
          <button
            type="button"
            className="btn-back"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
          >
            {saving
              ? <><span className="spinner-ring small" /> Registering…</>
              : "🚀 Register Bunk & Go Live"}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Station Card ─────────────────────────────────────────────────────────────
const StationCard = ({ bunk, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({
    name:      bunk.name      ?? "",
    address:   bunk.address   ?? "",
    phone:     bunk.phone     ?? "",
    openTime:  bunk.openTime  ?? "06:00",
    closeTime: bunk.closeTime ?? "22:00",
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Station name is required"); return; }
    setSaving(true);
    try {
      await onSave(bunk.id, form);
      setEditing(false);
      toast.success(`✅ ${form.name} updated`);
    } catch {
      toast.error("Update failed — check Firestore permissions");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name:      bunk.name      ?? "",
      address:   bunk.address   ?? "",
      phone:     bunk.phone     ?? "",
      openTime:  bunk.openTime  ?? "06:00",
      closeTime: bunk.closeTime ?? "22:00",
    });
    setEditing(false);
  };

  return (
    <div className="inv-card" style={{ borderRadius: 16 }}>
      <div className="inv-card-header">
        <div className="inv-bunk-info">
          <span className="inv-bunk-icon">🏪</span>
          <div>
            <h3 className="inv-bunk-name">{form.name || "Unnamed Station"}</h3>
            <span className="inv-bunk-id">ID: {bunk.id.slice(-8)}</span>
          </div>
        </div>
        <div className="inv-actions">
          {!editing ? (
            <button className="inv-edit-btn" onClick={() => setEditing(true)}>✏️ Edit</button>
          ) : (
            <>
              <button className="inv-cancel-btn" onClick={handleCancel} disabled={saving}>Cancel</button>
              <button
                className="btn-primary small inv-save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <><span className="spinner-ring small" /> Saving…</> : "💾 Save"}
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
        <div className="inv-field" style={{ gridColumn: "1 / -1" }}>
          <label className="inv-field-label">🏪 Station Name</label>
          {editing ? (
            <input type="text" className="form-input" value={form.name} onChange={set("name")} placeholder="e.g. HP Petrol Bunk - Banjara Hills" />
          ) : (
            <span className="inv-value">{form.name || <em style={{ color: "var(--text2)" }}>Not set</em>}</span>
          )}
        </div>

        <div className="inv-field" style={{ gridColumn: "1 / -1" }}>
          <label className="inv-field-label">📍 Station Address</label>
          {editing ? (
            <textarea
              className="form-input"
              style={{ resize: "vertical", minHeight: 70, fontFamily: "inherit" }}
              value={form.address}
              onChange={set("address")}
              placeholder="e.g. Plot 12, Road 4, Banjara Hills, Hyderabad - 500034"
            />
          ) : (
            <span className="inv-value" style={{ whiteSpace: "pre-wrap" }}>
              {form.address || <em style={{ color: "var(--text2)" }}>No address added</em>}
            </span>
          )}
        </div>

        <div className="inv-field">
          <label className="inv-field-label">📞 Contact Phone</label>
          {editing ? (
            <input type="tel" className="form-input" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
          ) : (
            <span className="inv-value">{form.phone || <em style={{ color: "var(--text2)" }}>Not set</em>}</span>
          )}
        </div>

        <div className="inv-field">
          <label className="inv-field-label">🕐 Opening Hours</label>
          {editing ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="time" className="form-input" value={form.openTime} onChange={set("openTime")} style={{ flex: 1 }} />
              <span style={{ color: "var(--text2)", fontSize: "0.8rem" }}>to</span>
              <input type="time" className="form-input" value={form.closeTime} onChange={set("closeTime")} style={{ flex: 1 }} />
            </div>
          ) : (
            <span className="inv-value">
              {form.openTime && form.closeTime
                ? `${form.openTime} – ${form.closeTime}`
                : <em style={{ color: "var(--text2)" }}>Not set</em>}
            </span>
          )}
        </div>

        {bunk.location && (
          <div className="inv-field" style={{ gridColumn: "1 / -1" }}>
            <label className="inv-field-label">🗺️ GPS Coordinates</label>
            <span className="inv-value" style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
              {bunk.location.lat?.toFixed(6)}, {bunk.location.lng?.toFixed(6)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Station Info Page ─────────────────────────────────────────────────────────
const StationInfoPage = () => {
  const { user } = useAuth();
  const [bunks,         setBunks]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [showRegister,  setShowRegister]  = useState(false);

  const loadBunks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBunksByManager(user.uid);
      // Only show bunks belonging to this manager (not the seed fallback)
      const mine = data.filter(
        (b) => b.managerId === user.uid || b.id?.startsWith("local-")
      );
      setBunks(mine.length > 0 ? mine : data);
    } catch (err) {
      toast.error("Failed to load stations: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadBunks(); }, [loadBunks]);

  const handleSave = async (bunkId, form) => {
    await updateBunkInfo(bunkId, form);
    setBunks((prev) => prev.map((b) => (b.id === bunkId ? { ...b, ...form } : b)));
  };

  const handleRegistered = (newId, formData) => {
    // Add the freshly-created bunk to the local list immediately
    const newBunk = {
      id:          newId,
      managerId:   user.uid,
      name:        formData.name,
      address:     formData.address,
      phone:       formData.phone,
      openTime:    formData.openTime,
      closeTime:   formData.closeTime,
      location:    { lat: Number(formData.lat), lng: Number(formData.lng) },
      petrolStock: Number(formData.petrolStock),
      dieselStock: Number(formData.dieselStock),
      pricePetrol: Number(formData.pricePetrol),
      priceDiesel: Number(formData.priceDiesel),
    };
    setBunks((prev) => [newBunk, ...prev]);
    setShowRegister(false);
  };

  const myBunks = bunks.filter((b) => b.managerId === user.uid);
  const filtered = bunks.filter((b) =>
    (b.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (b.address ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header mv-header">
        <div>
          <h1 className="page-title">🏪 Station Information</h1>
          <p className="page-subtitle">
            Manage station details — or register a new bunk to go live on the map
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-primary small" onClick={() => setShowRegister((v) => !v)}>
            {showRegister ? "✕ Cancel" : "➕ Register New Bunk"}
          </button>
          <button className="btn-primary small" style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text2)" }} onClick={loadBunks} disabled={loading}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ── Register form ── */}
      {showRegister && (
        <RegisterBunkForm
          managerId={user.uid}
          onRegistered={handleRegistered}
          onCancel={() => setShowRegister(false)}
        />
      )}

      {/* ── "No bunks yet" nudge ── */}
      {!loading && !showRegister && myBunks.length === 0 && (
        <div className="rb-no-bunk-banner">
          <span style={{ fontSize: 32 }}>📍</span>
          <div>
            <strong>Your bunk isn't on the map yet!</strong>
            <p>Register your petrol station so customers can find you nearby.</p>
          </div>
          <button className="btn-primary small" onClick={() => setShowRegister(true)}>
            ➕ Register Now
          </button>
        </div>
      )}

      {/* ── Summary bar ── */}
      {!showRegister && (
        <>
          <div className="inv-summary-bar">
            <div className="inv-summary-item">
              <span className="inv-summary-val">{bunks.length}</span>
              <span className="inv-summary-label">Total Stations</span>
            </div>
            <div className="inv-summary-item">
              <span className="inv-summary-val">{bunks.filter((b) => b.address).length}</span>
              <span className="inv-summary-label">With Address</span>
            </div>
            <div className="inv-summary-item">
              <span className="inv-summary-val">{bunks.filter((b) => b.phone).length}</span>
              <span className="inv-summary-label">With Phone</span>
            </div>
          </div>

          <div className="inv-toolbar">
            <input
              type="text"
              className="form-input inv-search"
              placeholder="🔍  Search by name or address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="centered" style={{ height: 300 }}><LoadingSpinner /></div>
          ) : (
            <div className="inv-grid">
              {filtered.map((bunk) => (
                <StationCard key={bunk.id} bunk={bunk} onSave={handleSave} />
              ))}
              {filtered.length === 0 && (
                <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                  <div className="empty-icon">🏪</div>
                  <h3>No stations found</h3>
                  <p>Register your first bunk using the button above.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StationInfoPage;
