import React, { useEffect, useState, useCallback } from "react";
import { getBunksByManager, updateBunkInventory } from "../services/bunkService";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatCurrency } from "../utils/formatCurrency";
import toast from "react-hot-toast";

// ── Inline-editable Inventory Card ──────────────────────────────────────────
const InventoryCard = ({ bunk, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({
    petrolStock:  bunk.petrolStock,
    dieselStock:  bunk.dieselStock,
    pricePetrol:  bunk.pricePetrol,
    priceDiesel:  bunk.priceDiesel,
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
      {/* Header */}
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

      {/* Stock progress bars (view mode) */}
      {!editing && (
        <div className="inv-stock-bars">
          {[["petrol", "🔴 Petrol", bunk.petrolStock], ["diesel", "🟡 Diesel", bunk.dieselStock]].map(
            ([type, label, val]) => (
              <div key={type} className="inv-bar-row">
                <span className="inv-bar-label">{label}</span>
                <div className="inv-bar-track">
                  <div
                    className={`inv-bar-fill ${type} ${val < 100 ? "low" : ""}`}
                    style={{ width: `${stockPct(val)}%` }}
                  />
                </div>
                <span className={`inv-bar-val ${val < 100 ? "inv-low" : ""}`}>{val}L</span>
              </div>
            )
          )}
        </div>
      )}

      {/* Fields grid */}
      <div className="inv-fields-grid">
        {[
          { key: "petrolStock", label: "🔴 Petrol Stock (L)", prefix: "", step: "1" },
          { key: "dieselStock", label: "🟡 Diesel Stock (L)", prefix: "", step: "1" },
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
                (key === "petrolStock" || key === "dieselStock") && Number(form[key]) < 100
                  ? "inv-low" : ""
              }`}>
                {prefix}{Number(form[key]).toLocaleString("en-IN")}
                {key.includes("Stock") ? " L" : "/L"}
              </span>
            )}
          </div>
        ))}
      </div>

      {editing && changed && (
        <div className="inv-unsaved-note">⚠ Unsaved changes</div>
      )}
    </div>
  );
};

// ── Inventory Page ────────────────────────────────────────────────────────────
const InventoryPage = () => {
  const { user } = useAuth();
  const [bunks,   setBunks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

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
    await updateBunkInventory(bunkId, form);
    setBunks((prev) =>
      prev.map((b) =>
        b.id === bunkId
          ? { ...b, ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, Number(v)])) }
          : b
      )
    );
  };

  const lowStockCount = bunks.filter((b) => b.petrolStock < 100 || b.dieselStock < 100).length;
  const filtered = bunks.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-container">
      <div className="page-header mv-header">
        <div>
          <h1 className="page-title">⛽ Inventory Management</h1>
          <p className="page-subtitle">Update fuel stock levels and prices for each petrol station</p>
        </div>
        <button className="btn-primary small" onClick={loadBunks} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {/* Summary bar */}
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

      {loading ? (
        <div className="centered" style={{ height: 300 }}><LoadingSpinner /></div>
      ) : (
        <div className="inv-grid">
          {filtered.map((bunk) => (
            <InventoryCard key={bunk.id} bunk={bunk} onSave={handleSave} />
          ))}
          {filtered.length === 0 && (
            <div className="empty-state" style={{ gridColumn: "1/-1" }}>
              <div className="empty-icon">⛽</div>
              <h3>No stations found</h3>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
