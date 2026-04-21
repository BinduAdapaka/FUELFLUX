import React, { useState } from "react";
import { formatCurrency } from "../utils/formatCurrency";
import { FUEL_TYPES, PAYMENT_METHODS } from "../utils/constants";
import { createOrder } from "../services/orderService";
import { updateBunkStock } from "../services/bunkService";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const OrderForm = ({ bunk, onClose, onOrderPlaced }) => {
  const { user } = useAuth();
  const [fuelType, setFuelType] = useState("Petrol");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);

  const price = fuelType === "Petrol" ? bunk.pricePetrol : bunk.priceDiesel;
  const stock = fuelType === "Petrol" ? bunk.petrolStock : bunk.dieselStock;
  const totalPrice = price * quantity;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (quantity > stock) {
      toast.error(`Only ${stock}L available for ${fuelType}`);
      return;
    }
    if (quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      const orderId = await createOrder({
        userId: user.uid,
        bunkId: bunk.id,
        bunkName: bunk.name,
        fuelType,
        quantity: Number(quantity),
        totalPrice,
        paymentMethod,
      });
      await updateBunkStock(bunk.id, fuelType, Number(quantity));
      toast.success("Order placed successfully! 🎉");
      onOrderPlaced(orderId);
      onClose();
    } catch (err) {
      toast.error("Failed to place order: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card order-form" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="order-form-header">
          <span className="order-form-icon">⛽</span>
          <div>
            <h2 className="order-form-title">Order Fuel</h2>
            <p className="order-form-bunk">{bunk.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form">
          {/* Fuel Type */}
          <div className="form-group">
            <label className="form-label">Fuel Type</label>
            <div className="fuel-type-selector">
              {FUEL_TYPES.map((type) => (
                <button
                  type="button"
                  key={type}
                  className={`fuel-type-btn ${fuelType === type ? "active" : ""}`}
                  onClick={() => setFuelType(type)}
                >
                  {type === "Petrol" ? "🔴" : "🟡"} {type}
                  <span className="fuel-price">
                    {formatCurrency(type === "Petrol" ? bunk.pricePetrol : bunk.priceDiesel)}/L
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Stock info */}
          <div className="stock-info">
            <span className={`stock-badge ${stock < 100 ? "low" : "ok"}`}>
              📦 {stock}L available
            </span>
          </div>

          {/* Quantity */}
          <div className="form-group">
            <label className="form-label" htmlFor="quantity">
              Quantity (Litres)
            </label>
            <input
              id="quantity"
              type="number"
              className="form-input"
              min="1"
              max={stock}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          {/* Payment Method */}
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <div className="payment-selector">
              {PAYMENT_METHODS.map((method) => (
                <button
                  type="button"
                  key={method}
                  className={`payment-btn ${paymentMethod === method ? "active" : ""}`}
                  onClick={() => setPaymentMethod(method)}
                >
                  {method === "COD" ? "💵" : "💳"} {method}
                </button>
              ))}
            </div>
          </div>

          {/* Price summary */}
          <div className="price-summary">
            <div className="price-row">
              <span>Unit Price</span>
              <span>{formatCurrency(price)}/L</span>
            </div>
            <div className="price-row">
              <span>Quantity</span>
              <span>{quantity}L</span>
            </div>
            <div className="price-row total">
              <span>Total Amount</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary full-width"
            disabled={loading}
          >
            {loading ? "Placing Order..." : `Confirm Order · ${formatCurrency(totalPrice)}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;
