import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserVehicles, addUserVehicle, deleteUserVehicle } from "../services/userVehicleService";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const VEHICLE_TYPES = ["Car", "Bike", "SUV", "Truck", "Auto", "Van", "Other"];
const VEHICLE_ICONS = {
  Car: "🚗", Bike: "🏍️", SUV: "🚙", Truck: "🚛",
  Auto: "🛺", Van: "🚐", Other: "🚘",
};

const EMPTY_FORM = {
  type: "Car",
  make: "",
  model: "",
  regNumber: "",
  color: "",
  fuelType: "Petrol",
};

const MyVehiclesPage = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [submitting, setSubmitting]   = useState(false);
  const [deletingId, setDeletingId]   = useState(null);
  const [errors, setErrors]           = useState({});

  const loadVehicles = async () => {
    try {
      const data = await getUserVehicles(user.uid);
      setVehicles(data);
    } catch (err) {
      toast.error("Failed to load vehicles: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadVehicles();
  }, [user]);

  const validate = () => {
    const e = {};
    if (!form.make.trim())      e.make      = "Brand / Make is required";
    if (!form.model.trim())     e.model     = "Model is required";
    if (!form.regNumber.trim()) e.regNumber = "Registration number is required";
    else if (!/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/i.test(form.regNumber.replace(/\s/g, "")))
      e.regNumber = "Enter a valid Indian reg. number (e.g. TS09AB1234)";
    return e;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const id = await addUserVehicle(user.uid, form);
      setVehicles((prev) => [...prev, { id, userId: user.uid, ...form }]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setErrors({});
      toast.success("🚗 Vehicle added!");
    } catch (err) {
      toast.error("Failed to add vehicle: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!confirm("Remove this vehicle?")) return;
    setDeletingId(vehicleId);
    try {
      await deleteUserVehicle(vehicleId);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
      toast.success("Vehicle removed");
    } catch (err) {
      toast.error("Failed to remove: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const fieldErr = (key) =>
    errors[key] ? <span className="field-error">{errors[key]}</span> : null;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header mv-header">
        <div>
          <h1 className="page-title">🚗 My Vehicles</h1>
          <p className="page-subtitle">
            Register your vehicles so drivers know exactly where to deliver fuel
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => { setShowForm((v) => !v); setErrors({}); setForm(EMPTY_FORM); }}
          id="add-vehicle-btn"
        >
          {showForm ? "✕ Cancel" : "+ Add Vehicle"}
        </button>
      </div>

      {/* Add Vehicle Form */}
      {showForm && (
        <div className="mv-form-card">
          <h3 className="mv-form-title">Add New Vehicle</h3>
          <form className="mv-form" onSubmit={handleAdd}>

            {/* Vehicle Type */}
            <div className="form-group">
              <label className="form-label">Vehicle Type</label>
              <div className="vtype-grid">
                {VEHICLE_TYPES.map((t) => (
                  <button
                    key={t} type="button"
                    className={`vtype-btn ${form.type === t ? "active" : ""}`}
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                  >
                    <span className="vtype-icon">{VEHICLE_ICONS[t]}</span>
                    <span>{t}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mv-form-row">
              {/* Make / Brand */}
              <div className="form-group">
                <label className="form-label" htmlFor="make">
                  Brand / Make <span className="required">*</span>
                </label>
                <input
                  id="make" className={`form-input ${errors.make ? "input-error" : ""}`}
                  placeholder="e.g. Maruti, Honda, TVS…"
                  value={form.make}
                  onChange={(e) => { setForm((f) => ({ ...f, make: e.target.value })); setErrors((er) => ({ ...er, make: "" })); }}
                />
                {fieldErr("make")}
              </div>

              {/* Model */}
              <div className="form-group">
                <label className="form-label" htmlFor="model">
                  Model <span className="required">*</span>
                </label>
                <input
                  id="model" className={`form-input ${errors.model ? "input-error" : ""}`}
                  placeholder="e.g. Swift, Activa, Apache…"
                  value={form.model}
                  onChange={(e) => { setForm((f) => ({ ...f, model: e.target.value })); setErrors((er) => ({ ...er, model: "" })); }}
                />
                {fieldErr("model")}
              </div>
            </div>

            <div className="mv-form-row">
              {/* Registration Number */}
              <div className="form-group">
                <label className="form-label" htmlFor="regNumber">
                  Registration Number <span className="required">*</span>
                </label>
                <input
                  id="regNumber"
                  className={`form-input reg-input ${errors.regNumber ? "input-error" : ""}`}
                  placeholder="e.g. TS09AB1234"
                  value={form.regNumber}
                  maxLength={12}
                  onChange={(e) => { setForm((f) => ({ ...f, regNumber: e.target.value.toUpperCase() })); setErrors((er) => ({ ...er, regNumber: "" })); }}
                />
                {fieldErr("regNumber")}
              </div>

              {/* Color */}
              <div className="form-group">
                <label className="form-label" htmlFor="color">Color</label>
                <input
                  id="color" className="form-input"
                  placeholder="e.g. White, Red, Black…"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                />
              </div>
            </div>

            {/* Fuel Type */}
            <div className="form-group">
              <label className="form-label">Fuel Type</label>
              <div className="fuel-type-selector">
                {["Petrol", "Diesel"].map((ft) => (
                  <button
                    key={ft} type="button"
                    className={`fuel-type-btn ${form.fuelType === ft ? "active" : ""}`}
                    onClick={() => setForm((f) => ({ ...f, fuelType: ft }))}
                  >
                    <span>{ft === "Petrol" ? "🔴" : "🟡"} {ft}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={submitting} id="save-vehicle-btn">
              {submitting ? <><div className="spinner-ring small" /> Saving…</> : "Save Vehicle"}
            </button>
          </form>
        </div>
      )}

      {/* Vehicles list */}
      {loading ? (
        <div className="centered" style={{ height: 300 }}><LoadingSpinner /></div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚗</div>
          <h3>No vehicles yet</h3>
          <p>Add your first vehicle to make fuel ordering faster and more accurate.</p>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
            + Add Vehicle
          </button>
        </div>
      ) : (
        <div className="mv-grid">
          {vehicles.map((v) => (
            <div className="mv-card" key={v.id}>
              <div className="mv-card-top">
                <div className="mv-icon-wrap">
                  <span className="mv-icon">{VEHICLE_ICONS[v.type] || "🚘"}</span>
                </div>
                <div className="mv-card-info">
                  <h3 className="mv-vehicle-name">{v.make} {v.model}</h3>
                  <span className="mv-reg">{v.regNumber}</span>
                </div>
                <button
                  className="mv-delete-btn"
                  onClick={() => handleDelete(v.id)}
                  disabled={deletingId === v.id}
                  aria-label="Delete vehicle"
                >
                  {deletingId === v.id ? "…" : "🗑"}
                </button>
              </div>

              <div className="mv-card-tags">
                <span className="mv-tag type">{v.type}</span>
                {v.color && <span className="mv-tag color">🎨 {v.color}</span>}
                <span className={`mv-tag fuel ${v.fuelType === "Petrol" ? "petrol" : "diesel"}`}>
                  {v.fuelType === "Petrol" ? "🔴" : "🟡"} {v.fuelType}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyVehiclesPage;
