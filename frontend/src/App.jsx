import React from "react";
import { Route, Routes, Navigate, useParams } from "react-router-dom";

import Home from "./pages/Home";
import Register from "./pages/Register";
import { LoginSelection, RoleAuth, Success } from "./pages/Auth";

import {
  DashboardHome,
  Market,
  Orders,
} from "./pages/Dashboard";

import {
  Notifications,
  Profile,
} from "./pages/Account";

import ProtectedRoute from "./components/ProtectedRoute";

const Farmer = ({ children }) => (
  <ProtectedRoute role="FARMER">
    {children}
  </ProtectedRoute>
);

const Buyer = ({ children }) => (
  <ProtectedRoute role="BUYER">
    {children}
  </ProtectedRoute>
);

export default function App() {
  return (
    <Routes>

      {/* Public Routes */}
      <Route path="/" element={<Home />} />

      <Route path="/register" element={<Register />} />

      <Route
        path="/register/:role"
        element={<RoleAuthRoute />}
      />

      <Route path="/farmer/auth" element={<RoleAuth role="farmer" />} />

      <Route path="/buyer/auth" element={<RoleAuth role="buyer" />} />

      <Route
        path="/registration-success"
        element={<Success />}
      />

      <Route
        path="/login"
        element={<LoginSelection />}
      />

      {/* ================= FARMER ================= */}

      <Route
        path="/farmer/dashboard"
        element={
          <Farmer>
            <DashboardHome />
          </Farmer>
        }
      />

      <Route
        path="/farmer/products"
        element={
          <Farmer>
            <Market farmerOnly />
          </Farmer>
        }
      />

      <Route
        path="/farmer/marketplace"
        element={
          <Farmer>
            <Market />
          </Farmer>
        }
      />

      <Route
        path="/farmer/orders"
        element={
          <Farmer>
            <Orders />
          </Farmer>
        }
      />

      <Route
        path="/farmer/notifications"
        element={
          <Farmer>
            <Notifications />
          </Farmer>
        }
      />

      <Route
        path="/farmer/profile"
        element={
          <Farmer>
            <Profile />
          </Farmer>
        }
      />

      {/* ================= BUYER ================= */}

      <Route
        path="/buyer/dashboard"
        element={
          <Buyer>
            <DashboardHome />
          </Buyer>
        }
      />

      <Route
        path="/buyer/products"
        element={
          <Buyer>
            <Market />
          </Buyer>
        }
      />

      <Route
        path="/buyer/orders"
        element={
          <Buyer>
            <Orders />
          </Buyer>
        }
      />

      <Route
        path="/buyer/notifications"
        element={
          <Buyer>
            <Notifications />
          </Buyer>
        }
      />

      <Route
        path="/buyer/profile"
        element={
          <Buyer>
            <Profile />
          </Buyer>
        }
      />

      {/* Unknown Route */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}

function RoleAuthRoute() {
  const { role } = useParams();

  return <RoleAuth role={role === "farmer" ? "farmer" : "buyer"} />;
}
