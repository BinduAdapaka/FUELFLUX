import React, { useEffect, useState, useCallback } from "react";
import {
  getBunksByManager,
  updateBunkInventory,
  registerBunk,
} from "../services/bunkService";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatCurrency } from "../utils/formatCurrency";
import toast from "react-hot-toast";

// ─── Add Station Form ────────────────────────────────────────────────────────
const AddStationForm = ({ managerId, onAdded, onCancel }) => {
  const [saving,     setSaving]     = useState(false);
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
      toast.error("Geolocation is not supported by this browser");
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
        toast.success("📍 Location captured!");
      },
      () => {
        toast.error("GPS denied — enter coordinates manually");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())      { toast.error("Station name is required"); return; }
    if (!form.lat || !form.lng) { toast.error("GPS location is required — click Detect or enter manually"); return; }
    if (isNaN(+form.lat) || isNaN(+form.lng)) { toast.error("Invalid coordinates"); return; }

    setSaving(true);
    try {
      const id = await registerBunk(managerId, form);
      toast.success(`🎉 "${form.name}" is now live on the map for users!`);
      onAdded({
        id,
        managerId,
        name:        form.name,
        address:     form.address,
        phone:       form.phone,
        openTime:    form.openTime,
        closeTime:   form.closeTime,
        location:    { lat: +form.lat, lng: +form.lng },
        petrolStock: +form.petrolStock,
        dieselStock: +form.dieselStock,
        pricePetrol: +form.pricePetrol,
        priceDiesel: +form.priceDiesel,
      });
    } catch (err) {
      toast.error("Failed to add station: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rb-form-card">
      <div className="rb-form-header">
        <span className="rb-form-icon">⛽</span>
        <div>
          <h2 className="rb-form-title">Add New Petrol Station</h2>
          <p className="rb-form-subtitle">
            Once saved, your station appears <strong>live on the nearby-bunks map</strong> for all users immediately.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rb-form">

        {/* ── Station details ── */}
        <div className="rb-section-label">🏪 Station Details</div>
        <div className="form-group">
          <label className="form-label">Station Name <span className="required">*</span></label>
          <input
            className="form-input" value={form.name} onChange={set("name")} required
            placeholder="e.g. HP Petrol Bunk — Banjara Hills"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <textarea
            className="form-input textarea" rows={2}
            value={form.address} onChange={set("address")}
            placeholder="Plot 12, Road 4, Banjara Hills, Hyderabad - 500034"
          />
        </div>
        <div className="rb-two-col">
          <div className="form-group">
            <label className="form-label">Contact Phone</label>
            <input className="form-input" type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
          </div>
          <div className="form-group">
            <label className="form-label">Opening Hours</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input className="form-input" type="time" value={form.openTime}  onChange={set("openTime")}  style={{ flex: 1 }} />
              <span style={{ color: "var(--text2)", fontSize: 13 }}>to</span>
              <input className="form-input" type="time" value={form.closeTime} onChange={set("closeTime")} style={{ flex: 1 }} />
            </div>
          </div>
        </div>

        {/* ── GPS ── */}
        <div className="rb-section-label">📍 GPS Location <span className="required">*</span></div>
        <div className="rb-gps-row">
          <button
            type="button"
            className={`rb-gps-btn ${gpsLoading ? "rb-gps-btn--loading" : ""}`}
            onClick={detectGPS}
            disabled={gpsLoading}
          >
            {gpsLoading ? <><span className="spinner-ring small" /> Detecting…</> : <>📍 Auto-detect my location</>}
          </button>
          {form.lat && form.lng && (
            <span className="rb-gps-detected">✅ {(+form.lat).toFixed(5)}, {(+form.lng).toFixed(5)}</span>
          )}
        </div>
        <div className="rb-two-col">
          <div className="form-group">
            <label className="form-label">Latitude</label>
            <input className="form-input" type="number" step="0.000001" placeholder="e.g. 17.412600" value={form.lat} onChange={set("lat")} />
          </div>
          <div className="form-group">
            <label className="form-label">Longitude</label>
            <input className="form-input" type="number" step="0.000001" placeholder="e.g. 78.447500" value={form.lng} onChange={set("lng")} />
          </div>
        </div>

        {/* ── Inventory ── */}
        <div className="rb-section-label">📦 Initial Inventory & Prices</div>
        <div className="rb-four-col">
          {[
            { key: "petrolStock", label: "🔴 Petrol Stock", suffix: "L",   step: "1",    prefix: "" },
            { key: "dieselStock", label: "🟡 Diesel Stock", suffix: "L",   step: "1",    prefix: "" },
            { key: "pricePetrol", label: "🔴 Petrol Price", suffix: "/L",  step: "0.01", prefix: "₹" },
            { key: "priceDiesel", label: "🟡 Diesel Price", suffix: "/L",  step: "0.01", prefix: "₹" },
          ].map(({ key, label, suffix, step, prefix }) => (
            <div className="form-group" key={key}>
              <label className="form-label">{label}</label>
              <div className="inv-input-wrap">
                {prefix && <span className="inv-prefix">{prefix}</span>}
                <input
                  type="number"
                  className={`form-input inv-input ${prefix ? "with-prefix" : ""}`}
                  value={form[key]} step={step} min={step === "0.01" ? "0.01" : "0"}
                  onChange={set(key)}
                />
              </div>
              <span className="field-hint">{suffix}</span>
            </div>
          ))}
        </div>

        <div className="rb-actions">
          <button type="button" className="btn-back" onClick={onCancel} disabled={saving}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <><span className="spinner-ring small" /> Saving…</> : "🚀 Add Station & Go Live"}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Inventory Card ───────────────────────────────────────────────────────────
const InventoryCard = ({ bunk, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({
    petrolStock: bunk.petrolStock,
    dieselStock: bunk.dieselStock,
    pricePetrol: bunk.pricePetrol,
    priceDiesel: bunk.priceDiesel,
  });

  const changed =
    Number(form.petrolStock) !== bunk.petrolStock ||
    Number(form.dieselStock) !== bunk.dieselStock ||
    Number(form.pricePetrol) !== bunk.pricePetrol ||
    Number(form.priceDiesel) !== bunk.priceDiesel;

  const handleSave = async () => {
    if (Number(form.petrolStock) < 0 || Number(form.dieselStock) < 0) {
      toast.error("Stock cannot be negative"); return;
    }
    if (Number(form.pricePetrol) <= 0 || Number(form.priceDiesel) <= 0) {
      toast.error("Price must be greater than 0"); return;
    }
    setSaving(true);
    try {
      await onSave(bunk.id, form);
      setEditing(false);
      toast.success(`✅ ${bunk.name} updated`);
    } catch {
      toast.error("Update failed — check Firestore permissions");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      petrolStock: bunk.petrolStock, dieselStock: bunk.dieselStock,
      pricePetrol: bunk.pricePetrol, priceDiesel: bunk.priceDiesel,
    });
    setEditing(false);
  };

  const stockPct = (v) => Math.min(100, Math.max(0, (v / 1500) * 100));

  return (
    <div className={`inv-card ${editing ? "editing" : ""}`}>
      <div className="inv-card-header">
        <div className="inv-bunk-info">
          <span className="inv-bunk-icon">⛽</span>
          <div>
            <h3 className="inv-bunk-name">{bunk.name}</h3>
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
                disabled={saving || !changed}
              >
                {saving ? <><span className="spinner-ring small" /> Saving…</> : "💾 Save"}
              </button>
            </>
          )}
        </div>
      </div>

      {!editing && (
        <div className="inv-stock-bars">
          {[["petrol", "🔴 Petrol", bunk.petrolStock], ["diesel", "🟡 Diesel", bunk.dieselStock]].map(
            ([type, label, val]) => (
              <div key={type} className="inv-bar-row">
                <span className="inv-bar-label">{label}</span>
                <div className="inv-bar-track">
                  <div className={`inv-bar-fill ${type} ${val < 100 ? "low" : ""}`} style={{ width: `${stockPct(val)}%` }} />
                </div>
                <span className={`inv-bar-val ${val < 100 ? "inv-low" : ""}`}>{val}L</span>
              </div>
            )
          )}
        </div>
      )}

      <div className="inv-fields-grid">
        {[
          { key: "petrolStock", label: "🔴 Petrol Stock (L)", prefix: "",  step: "1" },
          { key: "dieselStock", label: "🟡 Diesel Stock (L)", prefix: "",  step: "1" },
          { key: "pricePetrol", label: "🔴 Petrol Price/L",  prefix: "₹", step: "0.01" },
          { key: "priceDiesel", label: "🟡 Diesel Price/L",  prefix: "₹", step: "0.01" },
        ].map(({ key, label, prefix, step }) => (
          <div key={key} className="inv-field">
            <label className="inv-field-label">{label}</label>
            {editing ? (
              <div className="inv-input-wrap">
                {prefix && <span className="inv-prefix">{prefix}</span>}
                <input
                  type="number"
                  className={`form-input inv-input ${prefix ? "with-prefix" : ""}`}
                  value={form[key]}
                  min={step === "0.01" ? "0.01" : "0"}
                  step={step}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ) : (
              <span className={`inv-value ${
                (key === "petrolStock" || key === "dieselStock") && Number(form[key]) < 100 ? "inv-low" : ""
              }`}>
                {prefix}{Number(form[key]).toLocaleString("en-IN")}
                {key.includes("Stock") ? " L" : "/L"}
              </span>
            )}
          </div>
        ))}
      </div>

      {editing && changed && <div className="inv-unsaved-note">⚠ Unsaved changes</div>}
    </div>
  );
};

// ─── Inventory Page ───────────────────────────────────────────────────────────
const InventoryPage = () => {
  const { user } = useAuth();
  const [bunks,        setBunks]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [showAddForm,  setShowAddForm]  = useState(false);

  const loadBunks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBunksByManager(user.uid);
      // Only show this manager's own stations
      const mine = data.filter((b) => b.managerId === user.uid);
      setBunks(mine);
    } catch (err) {
      toast.error("Failed to load stations: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadBunks(); }, [loadBunks]);

  const handleSave = async (bunkId, form) => {
    await updateBunkInventory(bunkId, form);
    setBunks((prev) =>
      prev.map((b) =>
        b.id === bunkId
          ? { ...b, ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, Number(v)])) }
          : b
      )
    );
  };

  const handleAdded = (newBunk) => {
    setBunks((prev) => [newBunk, ...prev]);
    setShowAddForm(false);
  };

  const lowStockCount = bunks.filter((b) => b.petrolStock < 100 || b.dieselStock < 100).length;
  const filtered = bunks.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header mv-header">
        <div>
          <h1 className="page-title">⛽ Inventory Management</h1>
          <p className="page-subtitle">Add your stations and manage fuel stock & prices</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn-primary small"
            onClick={() => setShowAddForm((v) => !v)}
          >
            {showAddForm ? "✕ Cancel" : "➕ Add New Station"}
          </button>
          <button
            className="btn-primary small"
            style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text2)" }}
            onClick={loadBunks}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Add Station Form */}
      {showAddForm && (
        <AddStationForm
          managerId={user.uid}
          onAdded={handleAdded}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* No stations yet — nudge */}
      {!loading && !showAddForm && bunks.length === 0 && (
        <div className="rb-no-bunk-banner">
          <span style={{ fontSize: 36 }}>📍</span>
          <div>
            <strong>You haven't added any stations yet</strong>
            <p>Add your first petrol station so it appears on the nearby-bunks map for users.</p>
          </div>
          <button className="btn-primary small" onClick={() => setShowAddForm(true)}>
            ➕ Add Station Now
          </button>
        </div>
      )}

      {/* Summary bar */}
      {!showAddForm && bunks.length > 0 && (
        <>
          <div className="inv-summary-bar">
            <div className="inv-summary-item">
              <span className="inv-summary-val">{bunks.length}</span>
              <span className="inv-summary-label">Stations</span>
            </div>
            <div className={`inv-summary-item ${lowStockCount > 0 ? "low" : ""}`}>
              <span className="inv-summary-val">{lowStockCount}</span>
              <span className="inv-summary-label">Low Stock (&lt;100L)</span>
            </div>
            <div className="inv-summary-item">
              <span className="inv-summary-val">
                {bunks.reduce((s, b) => s + b.petrolStock + b.dieselStock, 0).toLocaleString("en-IN")}L
              </span>
              <span className="inv-summary-label">Total Stock</span>
            </div>
          </div>

          {lowStockCount > 0 && (
            <div className="inv-alert-banner" style={{ marginBottom: 16 }}>
              ⚠ {lowStockCount} station{lowStockCount > 1 ? "s" : ""} running low — please restock soon
            </div>
          )}

          <div className="inv-toolbar">
            <input
              type="text"
              className="form-input inv-search"
              placeholder="🔍  Search stations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </>
      )}

      {/* Grid */}
      {!showAddForm && (
        loading ? (
          <div className="centered" style={{ height: 300 }}><LoadingSpinner /></div>
        ) : (
          <div className="inv-grid">
            {filtered.map((bunk) => (
              <InventoryCard key={bunk.id} bunk={bunk} onSave={handleSave} />
            ))}
            {filtered.length === 0 && bunks.length > 0 && (
              <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                <div className="empty-icon">🔍</div>
                <h3>No stations match your search</h3>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default InventoryPage;
