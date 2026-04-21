import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OrdersPage from "./pages/OrdersPage";
import TrackingPage from "./pages/TrackingPage";
import AdminPage from "./pages/AdminPage";
import OrderFuelPage from "./pages/OrderFuelPage";
import MyVehiclesPage from "./pages/MyVehiclesPage";
import InventoryPage from "./pages/InventoryPage";
import StationInfoPage from "./pages/StationInfoPage";
import "./index.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Navbar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/order"
                element={
                  <ProtectedRoute>
                    <OrderFuelPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vehicles"
                element={
                  <ProtectedRoute>
                    <MyVehiclesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/track/:orderId"
                element={
                  <ProtectedRoute>
                    <TrackingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute managerOnly>
                    <InventoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/station"
                element={
                  <ProtectedRoute managerOnly>
                    <StationInfoPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>

          <Footer />


          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1a1a1a",
                color: "#ffffff",
                border: "1px solid #333",
                borderRadius: "12px",
                fontSize: "14px",
              },
              success: { iconTheme: { primary: "#FF9800", secondary: "#fff" } },
              error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
            }}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
