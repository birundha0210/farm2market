import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DashNav } from '../components/Navbar';
import ProductCard from '../components/ProductCard';

const Shell = ({ children }) => (
  <main className="app-shell">
    <DashNav />
    {children}
  </main>
);

export function Notifications() {
  const [items, setItems] = useState([]);

  const load = () =>
    api
      .get('/notifications')
      .then((r) => setItems(r.data.notifications));

  useEffect(() => {
    load();
  }, []);

  const all = async () => {
    await api.put('/notifications/read-all');
    load();
  };

  const read = async (id) => {
    await api.put(`/notifications/${id}/read`);
    load();
  };

  return (
    <Shell>
      <section className="dashboard-head">
        <div>
          <div className="eyebrow green">NOTIFICATION CENTER</div>
          <h1>Stay in the loop.</h1>
        </div>

        <button
          type="button"
          className="small-button"
          onClick={all}
        >
          Mark all as read
        </button>
      </section>

      <section className="notifications">
        {items.map((n) => (
          <button
            type="button"
            className={`notification ${n.isRead ? 'read' : ''}`}
            key={n.id}
            onClick={() => read(n.id)}
          >
            <span className="notification-dot" />

            <div>
              <b>{n.title}</b>

              <p>{n.message}</p>

              <small>
                {new Date(n.createdAt).toLocaleString()}
              </small>
            </div>
          </button>
        ))}

        {!items.length && (
          <div className="empty-state">
            Your notifications will appear here.
          </div>
        )}
      </section>
    </Shell>
  );
}

export function Profile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);

  // Add Project form state
  const [showProjectForm, setShowProjectForm] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    api
      .get(`/profiles/${user.id}`)
      .then((r) => setProfile(r.data.user));
  }, [user]);

  if (!profile) {
    return (
      <Shell>
        <div className="center-page">
          Loading profile…
        </div>
      </Shell>
    );
  }

  const farmer = profile.role === 'FARMER';

  const p = farmer
    ? profile.farmerProfile
    : profile.buyerProfile;

  return (
    <Shell>
      {/* PROFILE HEADER */}
      <section className="profile-card">
        <div className="profile-avatar">
          {profile.name?.[0]?.toUpperCase()}
        </div>

        <div>
          <div className="eyebrow green">
            {farmer ? 'FARMER' : 'BUYER'} PROFILE
          </div>

          <h1>{profile.name}</h1>

          <p>
            {profile.email} · @{profile.username}
          </p>

          <div className="code-inline">
            Farm2Market code{' '}
            <b>{profile.loginCode}</b>
          </div>
        </div>
      </section>

      {/* PROFILE DETAILS */}
      <section className="profile-details">
        <div>
          <span>Date of birth</span>

          <b>
            {profile.dob
              ? new Date(profile.dob).toLocaleDateString()
              : '-'}
          </b>
        </div>

        <div>
          <span>Gender</span>

          <b>{profile.gender || '-'}</b>
        </div>

        {farmer ? (
          <>
            <div>
              <span>Land details</span>
              <b>{p?.landDetails || '-'}</b>
            </div>

            <div>
              <span>Acres owned</span>
              <b>{p?.landAcres ?? '-'}</b>
            </div>
          </>
        ) : (
          <>
            <div>
              <span>Shop number</span>
              <b>{p?.shopNumber || '-'}</b>
            </div>

            <div>
              <span>Business type</span>

              <b>
                {p?.businessType
                  ? String(p.businessType).replaceAll('_', ' ')
                  : '-'}
              </b>
            </div>
          </>
        )}
      </section>

      {/* FARMER PRODUCTS */}
      {farmer && (
        <>
          {/* SECTION HEADER */}
          <section className="section-title">
            <div>
              <div className="eyebrow green">
                YOUR HISTORY
              </div>

              <h2>Your products</h2>
            </div>

            {/* ADD PROJECT BUTTON */}
            <button
              type="button"
              className="button"
              onClick={() => setShowProjectForm(true)}
            >
              + Add Product
            </button>
          </section>

          {/* ADD PROJECT FORM */}
          {showProjectForm && (
            <section className="project-form-card">
              <div className="project-form-header">
                <div>
                  <div className="eyebrow green">
                    NEW PROJECT
                  </div>

                  <h2>Add Project</h2>
                </div>

                <button
                  type="button"
                  className="close-button"
                  onClick={() => setShowProjectForm(false)}
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowProjectForm(false);
                }}
              >
                <label className="field">
                  <span>Project Name</span>

                  <input
                    type="text"
                    name="projectName"
                    placeholder="Enter project name"
                    required
                  />
                </label>

                <label className="field">
                  <span>Project Description</span>

                  <textarea
                    name="projectDescription"
                    placeholder="Enter project description"
                    rows="4"
                  />
                </label>

                <label className="field">
                  <span>Technologies Used</span>

                  <input
                    type="text"
                    name="technologies"
                    placeholder="React, Node.js, MySQL"
                  />
                </label>

                <label className="field">
                  <span>Project Link</span>

                  <input
                    type="url"
                    name="projectLink"
                    placeholder="https://github.com/..."
                  />
                </label>

                <div className="project-form-actions">
                  <button
                    type="button"
                    className="small-button"
                    onClick={() => setShowProjectForm(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="button"
                  >
                    Add Project
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* EXISTING PRODUCTS */}
          <section className="products-grid">
            {profile.products?.map((x) => (
              <ProductCard
                key={x.id}
                product={x}
                own
              />
            ))}

            {!profile.products?.length && (
              <div className="empty-state">
                Your listed products will appear here.
              </div>
            )}
          </section>
        </>
      )}
    </Shell>
  );
}
