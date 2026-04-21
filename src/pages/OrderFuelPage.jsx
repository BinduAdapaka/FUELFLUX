import React, { useEffect, useState } from "react";
import { getAllBunks } from "../services/bunkService";
import { createOrder } from "../services/orderService";
import { updateBunkStock } from "../services/bunkService";
import { getUserVehicles } from "../services/userVehicleService";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils/formatCurrency";
import { calculateDistance, formatDistance } from "../utils/calculateDistance";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";


const RAZORPAY_KEY_ID = "rzp_test_SfjfcIYZtkVBBi";

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const FUEL_TYPES = ["Petrol", "Diesel"];
const STEPS = ["Select Bunk", "Fuel & Delivery", "Payment"];

const OrderFuelPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data
  const [bunks, setBunks] = useState([]);
  const [loadingBunks, setLoadingBunks] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  // Step
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [selectedBunk, setSelectedBunk] = useState(null);
  const [fuelType, setFuelType] = useState("Petrol");
  const [quantity, setQuantity] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // User vehicles
  const [userVehicles, setUserVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // Search/filter
  const [search, setSearch] = useState("");
  const [fuelFilter, setFuelFilter] = useState("All");

  // Get geolocation
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { }
    );
  }, []);

  // Fetch bunks
  useEffect(() => {
    getAllBunks()
      .then(setBunks)
      .catch(console.error)
      .finally(() => setLoadingBunks(false));
  }, []);

  // Fetch user's registered vehicles
  useEffect(() => {
    if (!user) return;
    getUserVehicles(user.uid)
      .then((v) => { setUserVehicles(v); if (v.length === 1) setSelectedVehicle(v[0]); })
      .catch(console.error)
      .finally(() => setLoadingVehicles(false));
  }, [user]);

  // Derived values
  const price = selectedBunk
    ? fuelType === "Petrol"
      ? selectedBunk.pricePetrol
      : selectedBunk.priceDiesel
    : 0;
  const stock = selectedBunk
    ? fuelType === "Petrol"
      ? selectedBunk.petrolStock
      : selectedBunk.dieselStock
    : 0;
  const qty = parseFloat(quantity) || 0;
  const subtotal = qty * price;
  const deliveryFee = subtotal > 500 ? 0 : 49;
  const total = subtotal + deliveryFee;

  const filteredBunks = bunks
    .filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    .filter((b) => {
      if (fuelFilter === "Petrol") return b.petrolStock > 0;
      if (fuelFilter === "Diesel") return b.dieselStock > 0;
      return true;
    })
    .sort((a, b2) => {
      if (!userLocation) return 0;
      return (
        calculateDistance(userLocation.lat, userLocation.lng, a.location.lat, a.location.lng) -
        calculateDistance(userLocation.lat, userLocation.lng, b2.location.lat, b2.location.lng)
      );
    });

  // Validation per step
  const canProceedStep0 = !!selectedBunk;
  const canProceedStep1 =
    selectedBunk &&
    qty > 0 &&
    qty <= stock &&
    address.trim().length >= 10 &&
    phone.trim().length === 10;

  // Step 0 → 1
  const goToStep1 = () => {
    if (!canProceedStep0) return;
    setStep(1);
  };

  // Step 1 → 2
  const goToStep2 = () => {
    if (!canProceedStep1) {
      if (qty <= 0) toast.error("Enter a valid quantity");
      else if (qty > stock) toast.error(`Only ${stock}L available`);
      else if (address.trim().length < 10) toast.error("Enter a complete delivery address");
      else if (phone.trim().length !== 10) toast.error("Enter a valid 10-digit phone number");
      return;
    }
    setStep(2);
  };

  // Razorpay payment
  const handleRazorpay = async () => {
    const loaded = await loadRazorpay();
    if (!loaded) {
      toast.error("Failed to load Razorpay. Check internet connection.");
      return;
    }

    return new Promise((resolve, reject) => {
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: Math.round(total * 100), // paise
        currency: "INR",
        name: "Fuel Flux",
        description: `${fuelType} — ${qty}L from ${selectedBunk.name}`,
        image: "https://via.placeholder.com/80x80/f59e0b/000?text=⛽",
        prefill: {
          name: user?.displayName || "",
          email: user?.email || "",
          contact: phone,
        },
        theme: { color: "#f59e0b" },
        modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        handler: (response) => resolve(response),
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  };

  // Final submission
  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      let razorpayPaymentId = null;

      if (paymentMethod === "Card") {
        try {
          const response = await handleRazorpay();
          razorpayPaymentId = response.razorpay_payment_id;
          toast.success("Payment successful! 💳");
        } catch (err) {
          if (err.message === "Payment cancelled") {
            toast.error("Payment cancelled");
          } else {
            toast.error("Payment failed: " + err.message);
          }
          setSubmitting(false);
          return;
        }
      }

      const orderId = await createOrder({
        userId: user.uid,
        bunkId: selectedBunk.id,
        bunkName: selectedBunk.name,
        bunkLocation: selectedBunk.location,
        fuelType,
        quantity: qty,
        totalPrice: total,
        subtotal,
        deliveryFee,
        paymentMethod,
        razorpayPaymentId,
        deliveryAddress: address,
        landmark,
        phone,
        // Customer vehicle details
        vehicle: selectedVehicle
          ? {
              type: selectedVehicle.type,
              make: selectedVehicle.make,
              model: selectedVehicle.model,
              regNumber: selectedVehicle.regNumber,
              color: selectedVehicle.color || "",
              fuelType: selectedVehicle.fuelType,
            }
          : null,
      });

      await updateBunkStock(selectedBunk.id, fuelType, qty);

      toast.success("🎉 Order placed successfully!");
      navigate(`/track/${orderId}`);
    } catch (err) {
      toast.error("Order failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="order-fuel-page">
      {/* Page Header */}
      <div className="ofp-header">
        <div className="ofp-header-content">
          <h1 className="page-title">⛽ Order Fuel</h1>
          <p className="page-subtitle">Fuel delivered to your doorstep in minutes</p>
        </div>
      </div>

      <div className="ofp-body">
        {/* Stepper */}
        <div className="stepper">
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div className={`stepper-item ${i <= step ? "active" : ""} ${i < step ? "done" : ""}`}>
                <div className="stepper-circle">
                  {i < step ? "✓" : i + 1}
                </div>
                <span className="stepper-label">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`stepper-line ${i < step ? "done" : ""}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="ofp-content">
          {/* ───── STEP 0: SELECT BUNK ───── */}
          {step === 0 && (
            <div className="step-panel">
              <h2 className="step-title">Choose a Petrol Bunk</h2>

              <div className="order-page-filters">
                <div className="search-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    id="bunk-search"
                    type="text"
                    className="form-input search-input"
                    placeholder="Search petrol bunks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="fuel-filter-tabs">
                  {["All", "Petrol", "Diesel"].map((f) => (
                    <button
                      key={f}
                      className={`filter-tab ${fuelFilter === f ? "active" : ""}`}
                      onClick={() => setFuelFilter(f)}
                    >
                      {f === "Petrol" ? "🔴 " : f === "Diesel" ? "🟡 " : ""}
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {loadingBunks ? (
                <div className="centered" style={{ height: 240 }}>
                  <LoadingSpinner />
                </div>
              ) : filteredBunks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <h3>No bunks found</h3>
                </div>
              ) : (
                <div className="bunk-select-grid">
                  {filteredBunks.map((bunk) => {
                    const dist = userLocation
                      ? calculateDistance(
                        userLocation.lat, userLocation.lng,
                        bunk.location.lat, bunk.location.lng
                      )
                      : null;
                    const isSelected = selectedBunk?.id === bunk.id;
                    const outOfStock = bunk.petrolStock === 0 && bunk.dieselStock === 0;

                    return (
                      <button
                        key={bunk.id}
                        className={`bunk-select-card ${isSelected ? "selected" : ""} ${outOfStock ? "disabled" : ""}`}
                        onClick={() => !outOfStock && setSelectedBunk(bunk)}
                        disabled={outOfStock}
                      >
                        {isSelected && <span className="bunk-selected-check">✓</span>}
                        <div className="bsc-top">
                          <span className="bsc-icon">⛽</span>
                          <div>
                            <p className="bsc-name">{bunk.name}</p>
                            {dist !== null && (
                              <span className="bsc-dist">📍 {formatDistance(dist)}</span>
                            )}
                          </div>
                        </div>
                        <div className="bsc-prices">
                          <span className="bsc-price-tag petrol">
                            🔴 {formatCurrency(bunk.pricePetrol)}/L
                            <span className={`bsc-stock ${bunk.petrolStock < 100 ? "low" : ""}`}>
                              {bunk.petrolStock}L
                            </span>
                          </span>
                          <span className="bsc-price-tag diesel">
                            🟡 {formatCurrency(bunk.priceDiesel)}/L
                            <span className={`bsc-stock ${bunk.dieselStock < 100 ? "low" : ""}`}>
                              {bunk.dieselStock}L
                            </span>
                          </span>
                        </div>
                        {outOfStock && <p className="bsc-oos">Out of Stock</p>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Vehicle Selector ── */}
              <div className="vehicle-picker-section">
                <div className="vpc-header">
                  <h3 className="vpc-title">🚗 Select Your Vehicle</h3>
                  <Link to="/vehicles" className="btn-text" style={{ fontSize: 13 }}>
                    + Manage Vehicles
                  </Link>
                </div>

                {loadingVehicles ? (
                  <div className="centered" style={{ height: 60 }}><LoadingSpinner /></div>
                ) : userVehicles.length === 0 ? (
                  <div className="vpc-empty">
                    <span>No vehicles registered.</span>
                    <Link to="/vehicles" className="btn-text" style={{ fontSize: 13, marginLeft: 8 }}>
                      Add one →
                    </Link>
                  </div>
                ) : (
                  <div className="vpc-grid">
                    {userVehicles.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className={`vpc-card ${selectedVehicle?.id === v.id ? "selected" : ""}`}
                        onClick={() => setSelectedVehicle(selectedVehicle?.id === v.id ? null : v)}
                      >
                        {selectedVehicle?.id === v.id && <span className="vpc-check">✓</span>}
                        <span className="vpc-icon">
                          {{ Car:"🚗", Bike:"🏍️", SUV:"🚙", Truck:"🚛", Auto:"🛺", Van:"🚐", Other:"🚘" }[v.type] || "🚘"}
                        </span>
                        <div className="vpc-info">
                          <span className="vpc-name">{v.make} {v.model}</span>
                          <span className="vpc-reg">{v.regNumber}</span>
                        </div>
                        <span className={`vpc-fuel ${v.fuelType === "Petrol" ? "petrol" : "diesel"}`}>
                          {v.fuelType === "Petrol" ? "🔴" : "🟡"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="step-actions">
                <button
                  className="btn-primary"
                  onClick={goToStep1}
                  disabled={!canProceedStep0}
                  id="step0-next"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ───── STEP 1: FUEL + DELIVERY ADDRESS ───── */}
          {step === 1 && (
            <div className="step-panel">
              <h2 className="step-title">Fuel Details & Delivery Address</h2>

              {/* Selected bunk summary */}
              <div className="selected-bunk-banner">
                <span>⛽</span>
                <div>
                  <strong>{selectedBunk.name}</strong>
                  <button className="btn-text" onClick={() => setStep(0)}>
                    Change bunk
                  </button>
                </div>
              </div>

              <div className="step-two-grid">
                {/* Left: Fuel config */}
                <div className="step-section">
                  <h3 className="section-heading">Fuel Configuration</h3>

                  <div className="form-group">
                    <label className="form-label">Fuel Type</label>
                    <div className="fuel-type-selector">
                      {FUEL_TYPES.map((type) => {
                        const typeStock = type === "Petrol" ? selectedBunk.petrolStock : selectedBunk.dieselStock;
                        return (
                          <button
                            key={type}
                            type="button"
                            className={`fuel-type-btn ${fuelType === type ? "active" : ""} ${typeStock === 0 ? "disabled" : ""}`}
                            onClick={() => typeStock > 0 && setFuelType(type)}
                            disabled={typeStock === 0}
                          >
                            <span>{type === "Petrol" ? "🔴" : "🟡"} {type}</span>
                            <span className="fuel-price">
                              {formatCurrency(type === "Petrol" ? selectedBunk.pricePetrol : selectedBunk.priceDiesel)}/L
                            </span>
                            <span className={`fuel-type-stock ${typeStock < 100 ? "low" : ""}`}>
                              {typeStock}L available
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="quantity">
                      Quantity (Litres)
                    </label>
                    <div className="qty-input-row">
                      <button
                        className="qty-btn"
                        onClick={() => setQuantity((q) => Math.max(1, (parseFloat(q) || 1) - 1).toString())}
                      >−</button>
                      <input
                        id="quantity"
                        type="number"
                        className="form-input qty-input"
                        min="1"
                        max={stock}
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="0"
                      />
                      <button
                        className="qty-btn"
                        onClick={() => setQuantity((q) => Math.min(stock, (parseFloat(q) || 0) + 1).toString())}
                      >+</button>
                    </div>
                    <div className="qty-presets">
                      {[5, 10, 20, 50].map((n) => (
                        <button
                          key={n}
                          className={`preset-btn ${quantity === n.toString() ? "active" : ""}`}
                          onClick={() => setQuantity(n.toString())}
                          disabled={n > stock}
                        >
                          {n}L
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  {qty > 0 && (
                    <div className="cost-breakdown">
                      <h4 className="cost-title">💰 Cost Breakdown</h4>
                      <div className="cost-row">
                        <span>{fuelType} × {qty}L</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="cost-row">
                        <span>Delivery fee {deliveryFee === 0 && <span className="free-badge">FREE</span>}</span>
                        <span>{deliveryFee === 0 ? "₹0" : formatCurrency(deliveryFee)}</span>
                      </div>
                      {deliveryFee > 0 && (
                        <p className="free-delivery-hint">🎁 Order ₹500+ for free delivery</p>
                      )}
                      <div className="cost-row total">
                        <span>Total Payable</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Delivery address */}
                <div className="step-section">
                  <h3 className="section-heading">Delivery Address</h3>

                  <div className="form-group">
                    <label className="form-label" htmlFor="address">
                      Full Address <span className="required">*</span>
                    </label>
                    <textarea
                      id="address"
                      className="form-input textarea"
                      rows={3}
                      placeholder="House/Flat No., Street, Area, City..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    <span className="field-hint">{address.length}/200 chars · min 10</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="landmark">
                      Landmark (optional)
                    </label>
                    <input
                      id="landmark"
                      type="text"
                      className="form-input"
                      placeholder="Near temple, opposite mall..."
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">
                      Phone Number <span className="required">*</span>
                    </label>
                    <div className="phone-input-wrapper">
                      <span className="phone-prefix">+91</span>
                      <input
                        id="phone"
                        type="tel"
                        className="form-input phone-input"
                        placeholder="10-digit mobile number"
                        value={phone}
                        maxLength={10}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="step-actions">
                <button className="btn-back" onClick={() => setStep(0)}>← Back</button>
                <button
                  className="btn-primary"
                  onClick={goToStep2}
                  id="step1-next"
                >
                  Proceed to Payment →
                </button>
              </div>
            </div>
          )}

          {/* ───── STEP 2: PAYMENT ───── */}
          {step === 2 && (
            <div className="step-panel">
              <h2 className="step-title">Payment</h2>

              <div className="payment-review-grid">
                {/* Order summary */}
                <div className="order-review-card">
                  <h3 className="section-heading">Order Summary</h3>

                  <div className="review-row">
                    <span className="review-label">Bunk</span>
                    <span className="review-value">{selectedBunk.name}</span>
                  </div>
                  <div className="review-row">
                    <span className="review-label">Fuel</span>
                    <span className="review-value">
                      {fuelType === "Petrol" ? "🔴" : "🟡"} {fuelType}
                    </span>
                  </div>
                  <div className="review-row">
                    <span className="review-label">Quantity</span>
                    <span className="review-value">{qty} Litres</span>
                  </div>
                  <div className="review-row">
                    <span className="review-label">Rate</span>
                    <span className="review-value">{formatCurrency(price)}/L</span>
                  </div>
                  <div className="review-row">
                    <span className="review-label">Subtotal</span>
                    <span className="review-value">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="review-row">
                    <span className="review-label">Delivery</span>
                    <span className="review-value" style={{ color: deliveryFee === 0 ? "var(--green)" : undefined }}>
                      {deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee)}
                    </span>
                  </div>
                  <div className="review-divider" />
                  <div className="review-row total-row">
                    <span>Total</span>
                    <span className="review-total">{formatCurrency(total)}</span>
                  </div>

                  <div className="review-address">
                    <span className="review-label">📍 Delivery to</span>
                    <p className="review-address-text">{address}{landmark ? `, ${landmark}` : ""}</p>
                    <p className="review-phone">📞 +91 {phone}</p>
                  </div>
                </div>

                {/* Payment method */}
                <div className="payment-method-card">
                  <h3 className="section-heading">Select Payment Method</h3>

                  <div className="payment-options">
                    {/* Razorpay / Card */}
                    <label className={`payment-option ${paymentMethod === "Card" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="payment"
                        value="Card"
                        checked={paymentMethod === "Card"}
                        onChange={() => setPaymentMethod("Card")}
                      />
                      <div className="payment-option-body">
                        <div className="payment-option-header">
                          <span className="payment-option-icon">💳</span>
                          <div>
                            <p className="payment-option-title">Pay Online</p>
                            <p className="payment-option-sub">UPI, Cards, Net Banking via Razorpay</p>
                          </div>
                          <span className="razorpay-badge">Razorpay</span>
                        </div>
                        <div className="payment-icons-row">
                          <span className="picon">💳 Visa</span>
                          <span className="picon">💳 Mastercard</span>
                          <span className="picon">📱 UPI</span>
                          <span className="picon">🏦 Net Banking</span>
                        </div>
                      </div>
                    </label>

                    {/* COD */}
                    <label className={`payment-option ${paymentMethod === "COD" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="payment"
                        value="COD"
                        checked={paymentMethod === "COD"}
                        onChange={() => setPaymentMethod("COD")}
                      />
                      <div className="payment-option-body">
                        <div className="payment-option-header">
                          <span className="payment-option-icon">💵</span>
                          <div>
                            <p className="payment-option-title">Cash on Delivery</p>
                            <p className="payment-option-sub">Pay in cash when fuel arrives</p>
                          </div>
                        </div>
                        <p className="cod-note">⚠️ Keep exact change ready: {formatCurrency(total)}</p>
                      </div>
                    </label>
                  </div>

                  <button
                    className="btn-primary full-width place-order-btn"
                    onClick={handlePlaceOrder}
                    disabled={submitting}
                    id="place-order-btn"
                  >
                    {submitting ? (
                      <><LoadingSpinner /> Processing…</>
                    ) : paymentMethod === "Card" ? (
                      `Pay ${formatCurrency(total)} via Razorpay`
                    ) : (
                      `Place Order · ${formatCurrency(total)} COD`
                    )}
                  </button>

                  <p className="secure-note">🔒 Secured by 256-bit SSL encryption</p>
                </div>
              </div>

              <div className="step-actions">
                <button className="btn-back" onClick={() => setStep(1)}>← Back</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderFuelPage;
