import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import api from "../services/api";
import { PublicNav } from "../components/Navbar";

const base = {
  name: "",
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
  dob: "",
  gender: "",
  role: "",
};

export default function Register() {
  const { role } = useParams();

  if (!role) {
    return <RoleChoose />;
  }

  return <RegistrationForm role={role} />;
}

function RoleChoose() {
  return (
    <main className="soft-page">
      <PublicNav />

      <section className="register-choice">
        <div className="eyebrow green">JOIN FARM2MARKET</div>

        <h1>Choose how you grow the market.</h1>

        <p>
          Set up the account that matches your role in the fresh-produce
          chain.
        </p>

        <div className="role-cards">
          <Link to="/farmer/auth" className="role-card">
            <span>🌱</span>
            <h2>Farmer</h2>
            <p>
              List produce and agree direct deals with business buyers.
            </p>
            <b>Register as a farmer →</b>
          </Link>

          <Link to="/buyer/auth" className="role-card">
            <span>▣</span>
            <h2>Buyer</h2>
            <p>
              Source from growers for your supermarket, shop or market.
            </p>
            <b>Register as a buyer →</b>
          </Link>
        </div>
      </section>
    </main>
  );
}

export function RegistrationForm({ role, embedded = false, onLogin }) {
  const isFarmer = role === "farmer";

  const [form, setForm] = useState({
    ...base,
    role: isFarmer ? "FARMER" : "BUYER",
    ...(isFarmer
      ? {
          landDetails: "",
          landAcres: "",
        }
      : {
          shopNumber: "",
          businessType: "",
        }),
  });

  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const navigate = useNavigate();

  const change = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    const issues = {};

    if (!form.role) {
      issues.role = "Select your role identification.";
    }

    if (Object.keys(issues).length) {
      return setErrors(issues);
    }

    setSending(true);

    try {
      const generatedCredentials = {
        username: `${isFarmer ? "farmer" : "buyer"}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        password: "Farm2MarketBuyer2026",
      };

      const { confirmPassword, ...payload } = {
        ...form,
        ...generatedCredentials,
      };

      const r = await api.post(
        `/auth/register/${role}`,
        payload
      );

      sessionStorage.setItem(
        "registration",
        JSON.stringify(r.data.user)
      );

      navigate("/registration-success");
    } catch (err) {
      const data = err.response?.data;

      setErrors({
        form:
          data?.message ||
          "We could not complete registration.",
      });
    } finally {
      setSending(false);
    }
  };

  const content = (
    <section className={embedded ? "role-registration" : "form-wrap"}>
        <div className="form-intro">
          <div className="eyebrow green">
            {isFarmer ? "FARMER ACCOUNT" : "BUYER ACCOUNT"}
          </div>

          <h1>
            {embedded
              ? `Create your ${isFarmer ? "farmer" : "buyer"} account.`
              : "Tell us about your work."}
          </h1>

          <p>
            Your login code will be generated after registration
            and emailed to you.
          </p>
        </div>

        <form
          className="registration-form"
          onSubmit={submit}
        >
          {errors.form && (
            <div className="form-error">
              {errors.form}
            </div>
          )}

          <div className="field-grid">
            <Field
              label="Full name"
              name="name"
              value={form.name}
              onChange={change}
              required
            />

            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={change}
              required
            />

            <Field
              label="Date of birth"
              name="dob"
              type="date"
              value={form.dob}
              onChange={change}
              required
            />

            <Select
              label="Gender"
              name="gender"
              value={form.gender}
              onChange={change}
              required
              options={[
                "Female",
                "Male",
                "Non-binary",
                "Prefer not to say",
              ]}
            />

            {isFarmer ? (
              <>
                <Field
                  label="Land details / location"
                  name="landDetails"
                  value={form.landDetails}
                  onChange={change}
                  required
                />

                <Field
                  label="Land area in acres"
                  name="landAcres"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.landAcres}
                  onChange={change}
                  required
                />
              </>
            ) : (
              <>
                <Field
                  label="Shop number"
                  name="shopNumber"
                  value={form.shopNumber}
                  onChange={change}
                  required
                />

                <Select
                  label="Business type"
                  name="businessType"
                  value={form.businessType}
                  onChange={change}
                  required
                  options={[
                    ["SUPER_MARKET", "Super Market"],
                    ["MINI_MARKET", "Mini Market"],
                    ["VEGETABLE_SHOP", "Vegetable Shop"],
                  ]}
                />
              </>
            )}

            <Select
              label="Final role identification"
              name="role"
              value={form.role}
              onChange={change}
              error={errors.role}
              required
              options={["FARMER", "BUYER"]}
            />
          </div>

          <div className="form-foot">
            <span>
              Already have your code?{" "}
              {onLogin ? (
                <button
                  className="role-auth-link"
                  type="button"
                  onClick={onLogin}
                >
                  Log in as {isFarmer ? "Farmer" : "Buyer"}
                </button>
              ) : (
                <Link to="/login">Log in</Link>
              )}
            </span>

            <button
              className="button"
              disabled={sending}
            >
              {sending
                ? "Creating account…"
                : "Complete registration"}
            </button>
          </div>
        </form>
    </section>
  );

  if (embedded) {
    return content;
  }

  return (
    <main className="soft-page">
      <PublicNav />
      {content}
    </main>
  );
}

export function Field({
  label,
  error,
  ...props
}) {
  return (
    <label className="field">
      <span>{label}</span>

      <input {...props} />

      {error && <small>{error}</small>}
    </label>
  );
}

export function Select({
  label,
  options,
  error,
  ...props
}) {
  return (
    <label className="field">
      <span>{label}</span>

      <select {...props}>
        <option value="">
          Select {label.toLowerCase()}
        </option>

        {options.map((x) =>
          Array.isArray(x) ? (
            <option
              key={x[0]}
              value={x[0]}
            >
              {x[1]}
            </option>
          ) : (
            <option
              key={x}
              value={x}
            >
              {x}
            </option>
          )
        )}
      </select>

      {error && <small>{error}</small>}
    </label>
  );
}
