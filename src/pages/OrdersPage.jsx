import React, { useEffect, useState } from "react";
import { getUserOrders } from "../services/orderService";
import { useAuth } from "../context/AuthContext";
import OrderCard from "../components/OrderCard";
import LoadingSpinner from "../components/LoadingSpinner";

const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getUserOrders(user.uid);
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchOrders();
  }, [user]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📋 My Orders</h1>
        <p className="page-subtitle">
          Track and manage all your fuel delivery orders
        </p>
      </div>

      {loading ? (
        <div className="centered">
          <LoadingSpinner />
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛵</div>
          <h3>No orders yet</h3>
          <p>Head to the map to find nearby petrol bunks and place your first order.</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
