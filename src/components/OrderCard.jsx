import React from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../utils/formatCurrency";
import { STATUS_COLORS } from "../utils/constants";

const OrderCard = ({ order }) => {
  const statusColor = STATUS_COLORS[order.status] || "#888";

  const formattedDate = order.createdAt?.toDate
    ? order.createdAt.toDate().toLocaleString("en-IN")
    : "Processing...";

  return (
    <div className="order-card">
      <div className="order-card-header">
        <div>
          <h3 className="order-bunk-name">{order.bunkName || "Petrol Bunk"}</h3>
          <span className="order-date">{formattedDate}</span>
        </div>
        <span
          className="status-badge"
          style={{ backgroundColor: statusColor + "22", color: statusColor, borderColor: statusColor }}
        >
          {order.status}
        </span>
      </div>

      <div className="order-card-body">
        <div className="order-detail">
          <span className="detail-label">Fuel</span>
          <span className="detail-value">
            {order.fuelType === "Petrol" ? "🔴" : "🟡"} {order.fuelType}
          </span>
        </div>
        <div className="order-detail">
          <span className="detail-label">Quantity</span>
          <span className="detail-value">{order.quantity}L</span>
        </div>
        <div className="order-detail">
          <span className="detail-label">Total</span>
          <span className="detail-value total">{formatCurrency(order.totalPrice)}</span>
        </div>
        <div className="order-detail">
          <span className="detail-label">Payment</span>
          <span className="detail-value">{order.paymentMethod}</span>
        </div>
      </div>

      {order.status !== "Delivered" && (
        <Link to={`/track/${order.id}`} className="btn-track">
          📍 Track Delivery
        </Link>
      )}
    </div>
  );
};

export default OrderCard;
