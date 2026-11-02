import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { PublicNav } from "../components/Navbar";
import { RegistrationForm } from "./Register";

export function Login() {
  const [email, setEmail] = useState("");
  const [loginCode, setCode] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    try {
      const r = await api.post("/auth/login", {
        email,
        loginCode,
      });

      login(r.data);

      nav(
        `/${r.data.user.role.toLowerCase()}/dashboard`
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not log you in."
      );
    }
  };

  return (
    <main className="soft-page login-page">
      <PublicNav />

      <div className="login-page-content">
        <section className="auth-card">
        <div className="eyebrow green">
          WELCOME BACK
        </div>

        <h1>Enter your market.</h1>

        <p>
          Log in with your registered email and
          Farm2Market code.
        </p>

        <form onSubmit={submit}>
          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <Field
            label="Registered email"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <Field
            label="Farm2Market code"
            placeholder="FM-XXXXXXXX"
            value={loginCode}
            onChange={(e) =>
              setCode(
                e.target.value.toUpperCase()
              )
            }
            required
          />

          <button
            className="button full"
            type="submit"
          >
            Login securely
          </button>
        </form>

        <p className="auth-foot">
          New here?{" "}
          <Link to="/register">
            Create an account
          </Link>
        </p>
        </section>
      </div>
    </main>
  );
}

export function LoginSelection() {
  return (
    <main className="soft-page">
      <PublicNav />

      <section className="register-choice">
        <div className="eyebrow green">WELCOME BACK</div>

        <h1>Choose how you enter the market.</h1>

        <p>
          Select the account type you use to access Farm2Market.
        </p>

        <div className="role-cards">
          <Link
            to="/farmer/auth"
            state={{ authMode: "login" }}
            className="role-card"
          >
            <span>🌱</span>
            <h2>Farmer</h2>
            <p>
              Log in to manage your produce and connect with business buyers.
            </p>
            <b>Login as a farmer →</b>
          </Link>

          <Link
            to="/buyer/auth"
            state={{ authMode: "login" }}
            className="role-card"
          >
            <span>▣</span>
            <h2>Buyer</h2>
            <p>
              Log in to find fresh supply for your business.
            </p>
            <b>Login as a buyer →</b>
          </Link>
        </div>
      </section>
    </main>
  );
}

export function RoleAuth({ role }) {
  const location = useLocation();
  const [mode, setMode] = useState(
    location.state?.authMode === "login" ? "login" : "register"
  );
  const isFarmer = role === "farmer";
  const roleName = isFarmer ? "Farmer" : "Buyer";

  useEffect(() => {
    if (location.state?.authMode === "login") {
      setMode("login");
    }
  }, [location.state]);

  return (
    <main className={`soft-page role-auth-page ${role}-auth-page`}>
      <PublicNav />

      <section className="role-auth-shell">
        <aside className="role-auth-intro">
          <span className="role-auth-icon" aria-hidden="true">
            {isFarmer ? "🌱" : "🛒"}
          </span>
          <div className="eyebrow">FARM2MARKET {roleName.toUpperCase()}</div>
          <h1>{isFarmer ? "Grow your reach." : "Source with confidence."}</h1>
          <p>
            {isFarmer
              ? "Manage your produce and connect directly with business buyers."
              : "Find fresh produce and build direct relationships with growers."}
          </p>
          <span className="role-auth-note">{roleName} access</span>
        </aside>

        <div className="role-auth-panel">
          <div className="role-auth-tabs" role="tablist" aria-label={`${roleName} authentication`}>
            <button
              className={mode === "login" ? "active" : ""}
              type="button"
              onClick={() => setMode("login")}
              role="tab"
              aria-selected={mode === "login"}
            >
              {roleName} Login
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              type="button"
              onClick={() => setMode("register")}
              role="tab"
              aria-selected={mode === "register"}
            >
              {roleName} Register
            </button>
          </div>

          {mode === "login" ? (
            <RoleLogin roleName={roleName} />
          ) : (
            <RegistrationForm role={role} embedded onLogin={() => setMode("login")} />
          )}
        </div>
      </section>
    </main>
  );
}

function RoleLogin({ roleName }) {
  const [email, setEmail] = useState("");
  const [loginCode, setCode] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    try {
      const r = await api.post("/auth/login", { email, loginCode });
      login(r.data);
      nav(`/${r.data.user.role.toLowerCase()}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not log you in.");
    }
  };

  return (
    <div className="role-login-form">
      <div className="eyebrow green">{roleName} LOGIN</div>
      <h2>Welcome back.</h2>
      <p>Use your registered email and Farm2Market code to continue.</p>

      <form onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}
        <Field
          label="Registered email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Field
          label="Farm2Market code"
          placeholder={roleName === "Buyer" ? "BUY-XXXXXXXXX" : "FM-XXXXXXXX"}
          value={loginCode}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
        />
        <button className="button full" type="submit">
          Continue as {roleName}
        </button>
      </form>
    </div>
  );
}

export function Success() {
  const user = JSON.parse(
    sessionStorage.getItem("registration") ||
      "null"
  );

  const nav = useNavigate();

  if (!user) {
    return (
      <main className="soft-page">
        <PublicNav />

        <div className="center-page">
          No recent registration was found.{" "}
          <Link to="/register">
            Register now
          </Link>
        </div>
      </main>
    );
  }

  const extra =
    user.role === "FARMER"
      ? `${user.farmerProfile?.landAcres} acres · ${user.farmerProfile?.landDetails}`
      : `${user.buyerProfile?.businessType?.replaceAll(
          "_",
          " "
        )} · Shop ${user.buyerProfile?.shopNumber}`;

  return (
    <main className="soft-page">
      <PublicNav />

      <section className="success-card">
        <div className="success-icon">
          ✓
        </div>

        <div className="eyebrow green">
          REGISTRATION COMPLETE
        </div>

        <h1>
          Welcome to the market, {user.name}.
        </h1>

        <p>
          {user.email} · @{user.username} ·{" "}
          {user.role}
        </p>

        <p className="muted">
          {extra}
        </p>

        <div className="code-box">
          <span>
            YOUR FARM2MARKET LOGIN CODE
          </span>

          <strong>
            {user.loginCode}
          </strong>
        </div>

        <p className="warning">
          Keep this code safe. You will need
          your registered email and this code
          to log in.
        </p>

        <button
          className="button"
          onClick={() => nav(`/${user.role.toLowerCase()}/auth`)}
        >
          Login now
        </button>
      </section>
    </main>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>

      <input {...props} />
    </label>
  );
}
