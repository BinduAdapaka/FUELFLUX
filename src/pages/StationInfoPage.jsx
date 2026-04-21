import React, { useEffect, useState, useCallback } from "react";
import { getBunksByManager, updateBunkInfo } from "../services/bunkService";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

// ── Station Card ─────────────────────────────────────────────────────────────
const StationCard = ({ bunk, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
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
    <div className="inv-card" style={{ borderRadius: "16px" }}>
      {/* Header */}
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

      {/* Info grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
        {/* Station Name */}
        <div className="inv-field" style={{ gridColumn: "1 / -1" }}>
          <label className="inv-field-label">🏪 Station Name</label>
          {editing ? (
            <input type="text" className="form-input" value={form.name} onChange={set("name")} placeholder="e.g. HP Petrol Bunk - Banjara Hills" />
          ) : (
            <span className="inv-value">{form.name || <em style={{ color: "var(--text-muted)" }}>Not set</em>}</span>
          )}
        </div>

        {/* Address */}
        <div className="inv-field" style={{ gridColumn: "1 / -1" }}>
          <label className="inv-field-label">📍 Station Address</label>
          {editing ? (
            <textarea
              className="form-input"
              style={{ resize: "vertical", minHeight: "70px", fontFamily: "inherit" }}
              value={form.address}
              onChange={set("address")}
              placeholder="e.g. Plot 12, Road 4, Banjara Hills, Hyderabad - 500034"
            />
          ) : (
            <span className="inv-value" style={{ whiteSpace: "pre-wrap" }}>
              {form.address || <em style={{ color: "var(--text-muted)" }}>No address added</em>}
            </span>
          )}
        </div>

        {/* Phone */}
        <div className="inv-field">
          <label className="inv-field-label">📞 Contact Phone</label>
          {editing ? (
            <input type="tel" className="form-input" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
          ) : (
            <span className="inv-value">{form.phone || <em style={{ color: "var(--text-muted)" }}>Not set</em>}</span>
          )}
        </div>

        {/* Opening Hours */}
        <div className="inv-field">
          <label className="inv-field-label">🕐 Opening Hours</label>
          {editing ? (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input type="time" className="form-input" value={form.openTime} onChange={set("openTime")} style={{ flex: 1 }} />
              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>to</span>
              <input type="time" className="form-input" value={form.closeTime} onChange={set("closeTime")} style={{ flex: 1 }} />
            </div>
          ) : (
            <span className="inv-value">
              {form.openTime && form.closeTime
                ? `${form.openTime} – ${form.closeTime}`
                : <em style={{ color: "var(--text-muted)" }}>Not set</em>}
            </span>
          )}
        </div>

        {/* Map Location (read-only coords) */}
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
  const [bunks, setBunks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadBunks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBunksByManager(user.uid);
      setBunks(data);
    } catch (err) {
      toast.error("Failed to load stations: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadBunks(); }, [loadBunks]);

  const handleSave = async (bunkId, form) => {
    await updateBunkInfo(bunkId, form);
    setBunks((prev) =>
      prev.map((b) => (b.id === bunkId ? { ...b, ...form } : b))
    );
  };

  const filtered = bunks.filter((b) =>
    (b.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (b.address ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header mv-header">
        <div>
          <h1 className="page-title">🏪 Station Information</h1>
          <p className="page-subtitle">Manage station names, addresses, contact details and opening hours</p>
        </div>
        <button className="btn-primary small" onClick={loadBunks} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="inv-summary-bar">
        <div className="inv-summary-item">
          <span className="inv-summary-val">{bunks.length}</span>
          <span className="inv-summary-label">Total Stations</span>
        </div>
        <div className="inv-summary-item">
          <span className="inv-summary-val">
            {bunks.filter((b) => b.address).length}
          </span>
          <span className="inv-summary-label">With Address</span>
        </div>
        <div className="inv-summary-item">
          <span className="inv-summary-val">
            {bunks.filter((b) => b.phone).length}
          </span>
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StationInfoPage;
