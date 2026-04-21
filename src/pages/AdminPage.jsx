import React, { useEffect, useState, useCallback } from "react";
import { getAllOrders, updateOrderStatus } from "../services/orderService";
import { getAllVehicles, assignVehicle, addVehicle, freeVehicle } from "../services/vehicleService";
import { setUserRole } from "../services/authService";
import { db } from "../firebase/firebaseConfig";
import { doc, updateDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import { STATUS_COLORS, ORDER_STATUS } from "../utils/constants";
import { formatCurrency } from "../utils/formatCurrency";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";

// ── helpers ──────────────────────────────────────────────────────────────────
const pct = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 100));

const StatusBadge = ({ status }) => (
  <span className="status-badge small" style={{
    backgroundColor: (STATUS_COLORS[status] ?? "#64748b") + "22",
    color: STATUS_COLORS[status] ?? "#64748b",
    borderColor: (STATUS_COLORS[status] ?? "#64748b") + "55",
  }}>{status}</span>
);

// ── ANALYTICS TAB ─────────────────────────────────────────────────────────────
const CHART_TOOLTIP_STYLE = {
  contentStyle: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, fontSize: 12 },
  labelStyle: { color: "#fff", fontWeight: 700 },
  itemStyle: { color: "#a0a0a0" },
};

const AnalyticsTab = ({ orders, vehicles, users }) => {
  const delivered  = orders.filter(o => o.status === "Delivered");
  const pending    = orders.filter(o => o.status === "Pending");
  const dispatched = orders.filter(o => o.status === "Dispatched");
  const revenue    = delivered.reduce((s, o) => s + (o.totalPrice ?? 0), 0);
  const petrolOrds = orders.filter(o => o.fuelType === "Petrol");
  const dieselOrds = orders.filter(o => o.fuelType === "Diesel");
  const petrolQty  = petrolOrds.reduce((s, o) => s + (o.quantity ?? 0), 0);
  const dieselQty  = dieselOrds.reduce((s, o) => s + (o.quantity ?? 0), 0);

  // Fuel pie chart data
  const fuelPieData = [
    { name: "Petrol", value: petrolOrds.length, qty: petrolQty, color: "#ef4444" },
    { name: "Diesel", value: dieselOrds.length, qty: dieselQty, color: "#FF9800" },
  ].filter(f => f.value > 0);

  // Orders last 7 days — bar chart
  const now = Date.now();
  const barData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * 864e5);
    return { day: d.toLocaleDateString("en-IN", { weekday: "short" }), orders: 0, revenue: 0 };
  });
  orders.forEach(o => {
    const t = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : null;
    if (!t) return;
    const idx = barData.findIndex((_, i) => {
      const start = new Date(now - (6 - i) * 864e5).setHours(0,0,0,0);
      const end   = start + 864e5;
      return t >= start && t < end;
    });
    if (idx >= 0) {
      barData[idx].orders++;
      barData[idx].revenue += o.totalPrice ?? 0;
    }
  });

  // Status breakdown pie
  const statusData = [
    { name: "Delivered",  value: delivered.length,  color: "#22c55e" },
    { name: "Dispatched", value: dispatched.length,  color: "#3b82f6" },
    { name: "Pending",    value: pending.length,     color: "#FF9800" },
    { name: "Cancelled",  value: orders.filter(o => o.status === "Cancelled").length, color: "#ef4444" },
  ].filter(s => s.value > 0);

  // Top stations
  const stationMap = {};
  orders.forEach(o => { if (o.bunkName) stationMap[o.bunkName] = (stationMap[o.bunkName] ?? 0) + 1; });
  const topStations = Object.entries(stationMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, count]) => ({ name: name.length > 18 ? name.slice(0, 18) + "…" : name, count }));

  const KPI = ({ val, label, color, sub }) => (
    <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <span className="stat-value" style={{ color }}>{val}</span>
      <span className="stat-label">{label}</span>
      {sub && <span style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{sub}</span>}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* KPI row */}
      <div className="stats-grid">
        <KPI val={orders.length}          label="Total Orders"    color="#6366f1" />
        <KPI val={formatCurrency(revenue)} label="Total Revenue"   color="#22c55e" sub="delivered only" />
        <KPI val={pending.length}          label="Pending"         color="#FF9800" />
        <KPI val={dispatched.length}       label="Dispatched"      color="#3b82f6" />
        <KPI val={delivered.length}        label="Delivered"       color="#10b981" />
        <KPI val={users.length}            label="Registered Users" color="#a78bfa" />
      </div>

      {/* Row 1: 7-day orders bar chart + status pie */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "1.25rem" }}>
        {/* Orders last 7 days */}
        <div className="inv-card" style={{ padding: "1.25rem" }}>
          <h3 style={{ marginBottom: "1.25rem", fontSize: "0.9rem", color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
            📈 Orders — Last 7 Days
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#a0a0a0", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#a0a0a0", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [v, "Orders"]} />
              <Bar dataKey="orders" fill="url(#ordersGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#6366f140" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status pie */}
        <div className="inv-card" style={{ padding: "1.25rem" }}>
          <h3 style={{ marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--text)" }}>
            🥧 Order Status
          </h3>
          {statusData.length === 0 ? (
            <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 40, textAlign: "center" }}>No orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="45%" innerRadius={50} outerRadius={75}
                  dataKey="value" paddingAngle={3} stroke="none">
                  {statusData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v, n) => [v, n]} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v, e) => <span style={{ fontSize: 11, color: "#a0a0a0" }}>{v} ({e.payload.value})</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2: Revenue area chart + Fuel type pie */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "1.25rem" }}>
        {/* Revenue area chart */}
        <div className="inv-card" style={{ padding: "1.25rem" }}>
          <h3 style={{ marginBottom: "1.25rem", fontSize: "0.9rem", color: "var(--text)" }}>
            💰 Revenue — Last 7 Days
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={barData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#a0a0a0", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#a0a0a0", fontSize: 11 }} axisLine={false} tickLine={false} width={40}
                tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} />
              <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2}
                fill="url(#revenueGrad)" dot={{ fill: "#22c55e", r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Fuel type pie */}
        <div className="inv-card" style={{ padding: "1.25rem" }}>
          <h3 style={{ marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--text)" }}>
            ⛽ Fuel Breakdown
          </h3>
          {fuelPieData.length === 0 ? (
            <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 40, textAlign: "center" }}>No orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={fuelPieData} cx="50%" cy="45%" innerRadius={50} outerRadius={75}
                  dataKey="value" paddingAngle={3} stroke="none">
                  {fuelPieData.map((f, i) => <Cell key={i} fill={f.color} />)}
                </Pie>
                <Tooltip {...CHART_TOOLTIP_STYLE}
                  formatter={(v, n, p) => [`${v} orders · ${p.payload.qty}L`, n]} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v, e) => <span style={{ fontSize: 11, color: "#a0a0a0" }}>{v} ({e.payload.value})</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Stations horizontal bar chart */}
      <div className="inv-card" style={{ padding: "1.25rem" }}>
        <h3 style={{ marginBottom: "1.25rem", fontSize: "0.9rem", color: "var(--text)" }}>
          🏆 Top Stations by Orders
        </h3>
        {topStations.length === 0 ? (
          <p style={{ color: "var(--text2)", fontSize: 13 }}>No order data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(140, topStations.length * 44)}>
            <BarChart data={topStations} layout="vertical" barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fill: "#a0a0a0", fontSize: 11 }}
                axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fill: "#a0a0a0", fontSize: 11 }}
                axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [v, "Orders"]} />
              <Bar dataKey="count" fill="url(#stationGrad)" radius={[0, 6, 6, 0]} />
              <defs>
                <linearGradient id="stationGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#FF9800" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// ── ORDERS TAB ────────────────────────────────────────────────────────────────
const OrdersTab = ({ orders, vehicles, onAssign, onFree, onStatusChange }) => {
  const [filter, setFilter]       = useState("All");
  const [search, setSearch]       = useState("");
  const [assignMap, setAssignMap] = useState({});
  const statuses = ["All", "Pending", "Dispatched", "Delivered", "Cancelled"];

  const filtered = orders
    .filter(o => filter === "All" || o.status === filter)
    .filter(o =>
      o.id?.includes(search) ||
      (o.bunkName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (o.fuelType ?? "").toLowerCase().includes(search.toLowerCase())
    );

  const availVehicles = vehicles.filter(v => v.status === "Available");

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{
              padding: "4px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer",
              border: `1px solid ${filter === s ? "var(--accent)" : "var(--border)"}`,
              background: filter === s ? "var(--accent)" : "transparent",
              color: filter === s ? "#fff" : "var(--text)", transition: "all .2s",
            }}>{s}</button>
        ))}
        <input className="form-input" style={{ marginLeft: "auto", maxWidth: 220, padding: "6px 12px", fontSize: 13 }}
          placeholder="🔍 Search orders…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="admin-orders-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th><th>Station</th><th>Fuel</th><th>Qty</th>
              <th>Total</th><th>Status</th><th>Assign Delivery</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id}>
                <td className="order-id">#{o.id.slice(-6)}</td>
                <td>{o.bunkName ?? "—"}</td>
                <td>{o.fuelType}</td>
                <td>{o.quantity}L</td>
                <td>{formatCurrency(o.totalPrice)}</td>
                <td><StatusBadge status={o.status} /></td>
                <td>
                  {o.status === "Pending" ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <select className="form-input small" style={{ fontSize: 12 }}
                        value={assignMap[o.id] ?? ""}
                        onChange={e => setAssignMap(m => ({ ...m, [o.id]: e.target.value }))}>
                        <option value="">Select driver…</option>
                        {availVehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.driverName}</option>
                        ))}
                      </select>
                      <button className="btn-primary small" disabled={!assignMap[o.id]}
                        onClick={() => { onAssign(assignMap[o.id], o.id); setAssignMap(m => ({ ...m, [o.id]: "" })); }}>
                        Assign
                      </button>
                    </div>
                  ) : o.status === "Dispatched" ? (
                    <button className="btn-danger small" onClick={() => {
                      const v = vehicles.find(v => v.assignedOrderId === o.id);
                      if (v) onFree(v.id, o.id);
                      else onStatusChange(o.id, "Delivered");
                    }}>✅ Mark Delivered</button>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
                No orders found
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── DELIVERY BOYS TAB ─────────────────────────────────────────────────────────
const DeliveryTab = ({ vehicles, orders, onAssign, onFree, onAdd }) => {
  const [driverName, setDriverName] = useState("");
  const [adding, setAdding]         = useState(false);
  const [assignMap, setAssignMap]   = useState({});
  const pendingOrders = orders.filter(o => o.status === "Pending");

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!driverName.trim()) return;
    setAdding(true);
    try { await onAdd(driverName); setDriverName(""); }
    finally { setAdding(false); }
  };

  return (
    <div>
      <form onSubmit={handleAdd} style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <input className="form-input" placeholder="Driver name…" value={driverName}
          onChange={e => setDriverName(e.target.value)} id="new-driver-input" />
        <button className="btn-primary" disabled={adding} id="add-vehicle-btn">
          {adding ? "Adding…" : "+ Add Driver"}
        </button>
      </form>

      <div className="vehicles-grid">
        {vehicles.map(v => {
          const assignedOrder = orders.find(o => o.id === v.assignedOrderId);
          return (
            <div key={v.id} className="vehicle-card">
              <div className="vehicle-card-header">
                <span className="vehicle-icon">🚚</span>
                <div>
                  <h3 className="vehicle-name">{v.driverName}</h3>
                  <StatusBadge status={v.status} />
                </div>
              </div>
              {v.status === "Available" ? (
                <div className="vehicle-assign" style={{ marginTop: "0.75rem" }}>
                  <select className="form-input small" value={assignMap[v.id] ?? ""}
                    onChange={e => setAssignMap(m => ({ ...m, [v.id]: e.target.value }))}>
                    <option value="">Select order…</option>
                    {pendingOrders.map(o => (
                      <option key={o.id} value={o.id}>
                        #{o.id.slice(-6)} — {o.bunkName} ({o.fuelType} {o.quantity}L)
                      </option>
                    ))}
                  </select>
                  <button className="btn-primary small" disabled={!assignMap[v.id]}
                    onClick={() => { onAssign(v.id, assignMap[v.id]); setAssignMap(m => ({ ...m, [v.id]: "" })); }}>
                    Assign
                  </button>
                </div>
              ) : (
                <div className="vehicle-busy-info" style={{ marginTop: "0.75rem" }}>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Delivering: #{v.assignedOrderId?.slice(-6)} {assignedOrder ? `· ${assignedOrder.bunkName}` : ""}
                  </p>
                  <button className="btn-danger small" style={{ marginTop: 6 }}
                    onClick={() => onFree(v.id, v.assignedOrderId)}>
                    ✅ Mark Delivered
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {vehicles.length === 0 && (
          <p style={{ color: "var(--text-muted)", gridColumn: "1/-1" }}>No drivers yet — add one above.</p>
        )}
      </div>
    </div>
  );
};

// ── USERS TAB ─────────────────────────────────────────────────────────────────
const UsersTab = ({ users, onRoleChange, updatingUid }) => {
  const [search, setSearch] = useState("");
  const filtered = users.filter(u =>
    (u.displayName ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const roleColors = { admin: "#f59e0b", manager: "#3b82f6", user: "#94a3b8" };

  return (
    <div>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "center" }}>
        <input className="form-input inv-search" placeholder="🔍 Search users…" value={search}
          onChange={e => setSearch(e.target.value)} />
        <span style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          {users.length} users
        </span>
      </div>
      <div className="admin-orders-table">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Joined</th><th>Role</th><th>Change Role</th></tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.displayName || "—"}</td>
                <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{u.email}</td>
                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString("en-IN") : "—"}
                </td>
                <td>
                  <span className="status-badge small" style={{
                    backgroundColor: (roleColors[u.role] ?? "#94a3b8") + "22",
                    color: roleColors[u.role] ?? "#94a3b8",
                    borderColor: (roleColors[u.role] ?? "#94a3b8") + "55",
                    textTransform: "capitalize",
                  }}>{u.role || "user"}</span>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <select className="form-input small" value={u.role || "user"}
                      disabled={updatingUid === u.id}
                      onChange={e => onRoleChange(u.id, e.target.value)}
                      style={{ maxWidth: 130 }}>
                      <option value="user">user</option>
                      <option value="manager">manager</option>
                      <option value="admin">admin</option>
                    </select>
                    {updatingUid === u.id && <span className="spinner-ring small" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── ADMIN PAGE ────────────────────────────────────────────────────────────────
const AdminPage = () => {
  const [orders,      setOrders]      = useState([]);
  const [vehicles,    setVehicles]    = useState([]);
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("analytics");
  const [updatingUid, setUpdatingUid] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [o, v] = await Promise.all([getAllOrders(), getAllVehicles()]);
      const usersSnap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
      setOrders(o);
      setVehicles(v);
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      toast.error("Failed to load data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAssign = async (vehicleId, orderId) => {
    try {
      await assignVehicle(vehicleId, orderId);
      await updateOrderStatus(orderId, ORDER_STATUS.DISPATCHED);
      await updateDoc(doc(db, "orders", orderId), { vehicleId });
      toast.success("Driver assigned & order dispatched!");
      fetchData();
    } catch (err) { toast.error("Assignment failed: " + err.message); }
  };

  const handleFree = async (vehicleId, orderId) => {
    try {
      await freeVehicle(vehicleId);
      if (orderId) await updateOrderStatus(orderId, ORDER_STATUS.DELIVERED);
      toast.success("Order marked as delivered!");
      fetchData();
    } catch (err) { toast.error("Failed: " + err.message); }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success(`Order marked as ${status}`);
      fetchData();
    } catch (err) { toast.error("Failed: " + err.message); }
  };

  const handleAddDriver = async (name) => {
    await addVehicle({ driverName: name });
    toast.success("Driver added!");
    fetchData();
  };

  const handleRoleChange = async (uid, newRole) => {
    setUpdatingUid(uid);
    try {
      await setUserRole(uid, newRole);
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, role: newRole } : u));
      toast.success(`Role updated to ${newRole}`);
    } catch (err) { toast.error("Failed: " + err.message); }
    finally { setUpdatingUid(null); }
  };

  const pending    = orders.filter(o => o.status === "Pending").length;
  const dispatched = orders.filter(o => o.status === "Dispatched").length;

  const TABS = [
    { id: "analytics", label: "📊 Analytics" },
    { id: "orders",    label: `📋 Orders (${orders.length})`, alert: pending > 0 ? `${pending} pending` : null },
    { id: "delivery",  label: `🚚 Drivers (${vehicles.length})`, alert: dispatched > 0 ? `${dispatched} active` : null },
    { id: "users",     label: `👥 Users (${users.length})` },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Admin Dashboard</h1>
          <p className="page-subtitle">Analytics, order management, delivery allocation & user control</p>
        </div>
        <button className="btn-primary small" onClick={fetchData} disabled={loading}>🔄 Refresh</button>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
            {t.alert && <span className="tab-alert">{t.alert}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="centered" style={{ paddingTop: 60 }}><LoadingSpinner /></div>
      ) : activeTab === "analytics" ? (
        <AnalyticsTab orders={orders} vehicles={vehicles} users={users} />
      ) : activeTab === "orders" ? (
        <OrdersTab orders={orders} vehicles={vehicles}
          onAssign={handleAssign} onFree={handleFree} onStatusChange={handleStatusChange} />
      ) : activeTab === "delivery" ? (
        <DeliveryTab vehicles={vehicles} orders={orders}
          onAssign={handleAssign} onFree={handleFree} onAdd={handleAddDriver} />
      ) : (
        <UsersTab users={users} onRoleChange={handleRoleChange} updatingUid={updatingUid} />
      )}
    </div>
  );
};

export default AdminPage;
