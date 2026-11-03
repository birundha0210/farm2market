import React, { useState } from "react";
import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export function Brand() {
  return (
    <Link to="/" className="brand">
      <span>✦</span> Farm2Market
    </Link>
  );
}

export function PublicNav() {
  return (
    <nav className="public-nav">
      <Brand />

      <div>
        <Link to="/login">Login</Link>

        <Link className="nav-register" to="/register">
          Register
        </Link>
      </div>
    </nav>
  );
}

export function DashNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  const base = `/${user.role.toLowerCase()}`;

  const links =
    user.role === "FARMER"
      ? [
          ["Dashboard", "dashboard"],
          ["Products", "marketplace"],
          ["My Products", "products"],
          ["Orders / Deals", "orders"],
          ["Notifications", "notifications"],
          ["Profile", "profile"],
        ]
      : [
          ["Dashboard", "dashboard"],
          ["Products", "products"],
          ["Orders", "orders"],
          ["Notifications", "notifications"],
          ["Profile", "profile"],
        ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="dash-nav">
      <Brand />

      <button
        className="dash-menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      <div className={`dash-links ${menuOpen ? "open" : ""}`}>
        {links.map(([label, path]) => (
          <NavLink
            key={path}
            to={`${base}/${path}`}
            onClick={() => setMenuOpen(false)}
          >
            {label}
          </NavLink>
        ))}

        <button
          className="text-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}