import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { DashNav } from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import { Field, Select } from "./Register";
import LocationButton from "../components/LocationButton";

/* =========================================================
   COMMON HELPERS
========================================================= */

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN")}`;

function Shell({ children }) {
  return (
    <main className="app-shell">
      <DashNav />
      {children}
    </main>
  );
}

/* =========================================================
   DASHBOARD HOME
========================================================= */

export function DashboardHome() {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chosen, setChosen] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [productToRemove, setProductToRemove] = useState(null);
  const [removingProduct, setRemovingProduct] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const [actionSuccess, setActionSuccess] = useState(null);
  const removalInFlight = useRef(false);

  const isFarmer = user?.role === "FARMER";

  const loadDashboard = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const requests = [
        api.get("/products"),
        api.get("/orders"),
        api.get("/notifications"),
      ];

      const results = await Promise.allSettled(requests);

      if (results[0].status === "fulfilled") {
        setProducts(
          results[0].value.data.products ||
            results[0].value.data ||
            []
        );
      }

      if (results[1].status === "fulfilled") {
        setOrders(
          results[1].value.data.orders ||
            results[1].value.data ||
            []
        );
      }

      if (results[2].status === "fulfilled") {
        setNotifications(
          results[2].value.data.notifications ||
            results[2].value.data ||
            []
        );
      }
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    loadDashboard();

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        loadDashboard(true);
      }
    };
    const refreshTimer = window.setInterval(() => loadDashboard(true), 15000);

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadDashboard, user?.id]);

  const myProducts = useMemo(() => {
    if (!isFarmer) return [];

    return products.filter(
      (product) =>
        product.farmerId === user?.id ||
        product.farmer?.id === user?.id ||
        product.ownerId === user?.id
    );
  }, [products, user, isFarmer]);

  const isMyProduct = (product) =>
    product?.farmerId === user?.id ||
    product?.farmer?.id === user?.id ||
    product?.ownerId === user?.id;

  const removeProduct = async (product) => {
    if (!isFarmer || !isMyProduct(product)) return;

    setRemoveError("");
    setProductToRemove(product);
  };

  const confirmRemoveProduct = async () => {
    if (!productToRemove || removalInFlight.current) return;

    removalInFlight.current = true;
    setRemovingProduct(true);
    setRemoveError("");

    try {
      await api.delete(`/products/${productToRemove.id}`);
      setProducts((current) =>
        current.filter((item) => item.id !== productToRemove.id)
      );
      setProductToRemove(null);
      setActionSuccess({
        title: "Product Removed Successfully!",
        message: "Your product has been removed successfully.",
      });
    } catch (error) {
      console.error("Product removal error:", error);
      setRemoveError(
        error.response?.data?.message ||
          "Could not remove this product. Please try again."
      );
    } finally {
      removalInFlight.current = false;
      setRemovingProduct(false);
    }
  };

  const availableProducts = products.filter(
    (product) =>
      Number(
        product.quantity ??
          product.quantityKg ??
          product.stock ??
          0
      ) > 0
  );

  const pendingOrders = orders.filter((order) =>
    [
      "PENDING",
      "PLACED",
      "REQUESTED",
      "FARMER_ACCEPTED",
    ].includes(
      String(order.status || "").toUpperCase()
    )
  );

  const unreadNotifications =
    notifications.filter(
      (notification) =>
        !notification.read &&
        !notification.isRead
    );

  if (loading) {
    return (
      <main className="dashboard-page">
        <DashNav />

        <section className="dashboard-loading">
          <div className="loading-spinner"></div>

          <h2>Loading your market...</h2>

          <p>
            Please wait while we prepare your
            Farm2Market dashboard.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <DashNav />

      <section className="dashboard-content">

        {/* HEADER */}

        <div className="dashboard-header">
          <div>
            <div className="eyebrow green">
              {isFarmer
                ? "FARMER MARKET"
                : "BUYER MARKET"}
            </div>

            <h1>
              Hello, {user?.name || "User"} 👋
            </h1>

            <p>
              {isFarmer
                ? "Manage your fresh products and direct deals."
                : "Discover fresh products directly from farmers."}
            </p>
          </div>

          <div className="role-badge">
            {isFarmer
              ? "🌱 FARMER"
              : "🛒 BUYER"}
          </div>
        </div>

        {/* STAT CARDS */}

        <div className="stats-grid">

          {isFarmer ? (
            <>
              <StatCard
                icon="🥬"
                title="My Products"
                value={myProducts.length}
                text="Products listed by you"
              />

              <StatCard
                icon="📦"
                title="Available Stock"
                value={myProducts.reduce(
                  (total, product) =>
                    total +
                    Number(
                      product.quantity ??
                        product.quantityKg ??
                        product.stock ??
                        0
                    ),
                  0
                )}
                text="Total quantity available"
              />

              <StatCard
                icon="🤝"
                title="Active Deals"
                value={pendingOrders.length}
                text="Orders waiting for action"
              />

              <StatCard
                icon="🔔"
                title="Notifications"
                value={unreadNotifications.length}
                text="Unread notifications"
              />
            </>
          ) : (
            <>
              <StatCard
                icon="🌾"
                title="Fresh Products"
                value={availableProducts.length}
                text="Products available"
              />

              <StatCard
                icon="🛒"
                title="My Orders"
                value={orders.length}
                text="Orders placed by you"
              />

              <StatCard
                icon="🤝"
                title="Active Orders"
                value={pendingOrders.length}
                text="Orders waiting for action"
              />

              <StatCard
                icon="🔔"
                title="Notifications"
                value={unreadNotifications.length}
                text="Unread notifications"
              />
            </>
          )}

        </div>

        {/* QUICK ACTIONS */}

        <section className="dashboard-section">

          <div className="section-heading">
            <div>
              <div className="eyebrow green">
                QUICK ACTIONS
              </div>

              <h2>
                {isFarmer
                  ? "Manage your farm market"
                  : "Explore the fresh market"}
              </h2>
            </div>
          </div>

          <div className="quick-actions">

            {isFarmer ? (
              <>
                <Link
                  to="/farmer/products"
                  className="quick-card"
                >
                  <span className="quick-icon">
                    📸
                  </span>

                  <div>
                    <h3>
                      Add / Manage Products
                    </h3>

                    <p>
                      Upload your farm products,
                      quantity and price.
                    </p>
                  </div>

                  <span className="arrow">
                    →
                  </span>
                </Link>

                <Link
                  to="/farmer/orders"
                  className="quick-card"
                >
                  <span className="quick-icon">
                    🤝
                  </span>

                  <div>
                    <h3>View Deals</h3>

                    <p>
                      Accept buyer requests and
                      manage your deals.
                    </p>
                  </div>

                  <span className="arrow">
                    →
                  </span>
                </Link>

                <Link
                  to="/farmer/notifications"
                  className="quick-card"
                >
                  <span className="quick-icon">
                    🔔
                  </span>

                  <div>
                    <h3>Notifications</h3>

                    <p>
                      Check buyer requests and
                      deal updates.
                    </p>
                  </div>

                  <span className="arrow">
                    →
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/buyer/products"
                  className="quick-card"
                >
                  <span className="quick-icon">
                    🥕
                  </span>

                  <div>
                    <h3>Browse Products</h3>

                    <p>
                      Find fresh products directly
                      from farmers.
                    </p>
                  </div>

                  <span className="arrow">
                    →
                  </span>
                </Link>

                <Link
                  to="/buyer/orders"
                  className="quick-card"
                >
                  <span className="quick-icon">
                    🛒
                  </span>

                  <div>
                    <h3>My Orders</h3>

                    <p>
                      Track your placed orders
                      and deals.
                    </p>
                  </div>

                  <span className="arrow">
                    →
                  </span>
                </Link>

                <Link
                  to="/buyer/notifications"
                  className="quick-card"
                >
                  <span className="quick-icon">
                    🔔
                  </span>

                  <div>
                    <h3>Notifications</h3>

                    <p>
                      Check farmer responses and
                      order updates.
                    </p>
                  </div>

                  <span className="arrow">
                    →
                  </span>
                </Link>
              </>
            )}

          </div>
        </section>

        {/* PRODUCTS */}

        <section className="dashboard-section">

          <div className="section-heading">
            <div>
              <div className="eyebrow green">
                {isFarmer
                  ? "YOUR LISTINGS"
                  : "FRESH FROM FARMS"}
              </div>

              <h2>
                {isFarmer
                  ? "Your latest products"
                  : "Available products"}
              </h2>
            </div>

            <Link
              to={
                isFarmer
                  ? "/farmer/products"
                  : "/buyer/products"
              }
              className="section-link"
            >
              View all →
            </Link>
          </div>

          {(isFarmer ? myProducts : availableProducts).length === 0 ? (
            <EmptyState
              icon="🌱"
              title={
                isFarmer
                  ? "No products added yet"
                  : "No products available"
              }
              text={
                isFarmer
                  ? "Add your first farm product to start selling."
                  : "Farmers have not listed products yet."
              }
              link={
                isFarmer
                  ? "/farmer/products"
                  : "/buyer/products"
              }
              linkText={
                isFarmer
                  ? "Add Product"
                  : "Browse Products"
              }
            />
          ) : (
            <div
              className={
                isFarmer
                  ? "product-preview-grid"
                  : "product-preview-grid buyer-product-preview-grid"
              }
            >

              {(isFarmer
                ? myProducts
                : availableProducts
              )
                .slice(0, 6)
                .map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    own={isFarmer && isMyProduct(product)}
                    showQuantityLabel={isFarmer}
                    onSelect={setChosen}
                    onRemove={
                      isFarmer && isMyProduct(product)
                        ? removeProduct
                        : undefined
                    }
                  />
                ))}

            </div>
          )}

        </section>

        {/* ORDERS */}

        <section className="dashboard-section">

          <div className="section-heading">
            <div>
              <div className="eyebrow green">
                RECENT ACTIVITY
              </div>

              <h2>Recent orders</h2>
            </div>

            <Link
              to={
                isFarmer
                  ? "/farmer/orders"
                  : "/buyer/orders"
              }
              className="section-link"
            >
              View orders →
            </Link>
          </div>

          {orders.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No orders yet"
              text={
                isFarmer
                  ? "Buyer orders will appear here."
                  : "Your placed orders will appear here."
              }
            />
          ) : (
            <div className="orders-preview">

              {orders
                .slice(0, 5)
                .map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                  />
                ))}

            </div>
          )}

        </section>

        {/* NOTIFICATIONS */}

        {unreadNotifications.length > 0 && (
          <section className="dashboard-section notification-highlight">

            <div>
              <div className="eyebrow green">
                NEEDS YOUR ATTENTION
              </div>

              <h2>
                You have{" "}
                {unreadNotifications.length}{" "}
                new notification
                {unreadNotifications.length > 1
                  ? "s"
                  : ""}
              </h2>

              <p>
                Check your notifications for
                new buyer/farmer deal updates.
              </p>
            </div>

            <Link
              to={
                isFarmer
                  ? "/farmer/notifications"
                  : "/buyer/notifications"
              }
              className="button"
            >
              View notifications
            </Link>

          </section>
        )}

        {chosen && (
          <ProductModal
            product={chosen}
            close={() => setChosen(null)}
            refresh={() => loadDashboard(true)}
            onOrderPlaced={() => setOrderPlaced(true)}
          />
        )}

        {orderPlaced && (
          <SuccessModal
            title="Order Placed Successfully!"
            message="Your order has been submitted successfully. The farmer will review your order shortly."
            close={() => setOrderPlaced(false)}
          />
        )}

        {productToRemove && (
          <DeleteProductModal
            close={() => {
              if (!removingProduct) {
                setProductToRemove(null);
                setRemoveError("");
              }
            }}
            error={removeError}
            removing={removingProduct}
            remove={confirmRemoveProduct}
          />
        )}

        {actionSuccess && (
          <SuccessModal
            {...actionSuccess}
            close={() => setActionSuccess(null)}
          />
        )}

      </section>
    </main>
  );
}

/* =========================================================
   MARKET
========================================================= */

export function Market({ farmerOnly = false }) {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    minPrice: "",
    minQuantity: "",
    location: "",
  });

  const [chosen, setChosen] = useState(null);
  const [edit, setEdit] = useState(null);
  const [add, setAdd] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [productToRemove, setProductToRemove] = useState(null);
  const [removingProduct, setRemovingProduct] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const [actionSuccess, setActionSuccess] = useState(null);
  const removalInFlight = useRef(false);

  const isFarmer = user?.role === "FARMER";

  const isMyProduct = (product) =>
    product?.farmerId === user?.id ||
    product?.farmer?.id === user?.id ||
    product?.ownerId === user?.id;

  const fetchProducts = async () => {
    try {
      const params = {
        ...filters,
      };

      if (farmerOnly) {
        params.mine = "true";
      }

      const q = new URLSearchParams(
        Object.entries(params).filter(
          ([, value]) =>
            value !== "" &&
            value !== undefined &&
            value !== null
        )
      );

      const response = await api.get(
        `/products?${q.toString()}`
      );

      const loadedProducts =
        response.data.products ||
        response.data ||
        [];

      setProducts(
        farmerOnly
          ? loadedProducts.filter(
              (product) =>
                isMyProduct(product) &&
                String(product.status || "ACTIVE").toUpperCase() !==
                  "INACTIVE"
            )
          : loadedProducts
      );
    } catch (error) {
      console.error(
        "Product loading error:",
        error
      );
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response =
          await api.get("/categories");

        setCategories(
          response.data.categories ||
            response.data ||
            []
        );
      } catch (error) {
        console.error(
          "Category loading error:",
          error
        );
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (user?.id) fetchProducts();
  }, [farmerOnly, user?.id]);

  const change = (event) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value,
    });
  };

  const removeProduct = async (product) => {
    if (!isFarmer || !isMyProduct(product)) return;

    setRemoveError("");
    setProductToRemove(product);
  };

  const confirmRemoveProduct = async () => {
    if (!productToRemove || removalInFlight.current) return;

    removalInFlight.current = true;
    setRemovingProduct(true);
    setRemoveError("");

    try {
      await api.delete(`/products/${productToRemove.id}`);
      setProducts((current) =>
        current.filter((item) => item.id !== productToRemove.id)
      );
      setProductToRemove(null);
      setActionSuccess({
        title: "Product Removed Successfully!",
        message: "Your product has been removed successfully.",
      });
    } catch (error) {
      console.error("Product removal error:", error);
      setRemoveError(
        error.response?.data?.message ||
          "Could not remove this product. Please try again."
      );
    } finally {
      removalInFlight.current = false;
      setRemovingProduct(false);
    }
  };

  return (
    <Shell>

      <section className="dashboard-head">

        <div>
          <div className="eyebrow green">
            {farmerOnly
              ? "MY PRODUCT MANAGEMENT"
              : "LIVE MARKETPLACE"}
          </div>

          <h1>
            {farmerOnly
              ? "Manage your harvest."
              : isFarmer
              ? "The community marketplace."
              : "Find fresh supply, directly."}
          </h1>

          <p>
            {farmerOnly
              ? "Update your active listings and prices as the market changes."
              : "Explore active products from Farm2Market growers."}
          </p>
        </div>

        {isFarmer && farmerOnly && (
          <button
            className="button"
            onClick={() => setAdd(true)}
          >
            ＋ Add product
          </button>
        )}

      </section>

      {/* FILTERS */}

      {!farmerOnly && (
        <div className="filter-bar market-filter-bar">

          <input
            className="filter-search-input"
            name="search"
            value={filters.search}
            onChange={change}
            placeholder="Search produce"
          />

          <select
            name="category"
            value={filters.category}
            onChange={change}
          >
            <option value="">
              All categories
            </option>

            {categories.map((category) => (
              <option
                value={category.id}
                key={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>

          <input
            name="minPrice"
            value={filters.minPrice}
            onChange={change}
            type="number"
            placeholder="Min ₹/kg"
          />

          <input
            name="minQuantity"
            value={filters.minQuantity}
            onChange={change}
            type="number"
            placeholder="Min kg"
          />

          <input
            name="location"
            value={filters.location}
            onChange={change}
            placeholder="Land location"
          />

          <button
            className="small-button"
            onClick={fetchProducts}
          >
            Apply filters
          </button>

        </div>
      )}

      {/* PRODUCTS */}

      <section className="products-grid">

        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            own={isFarmer && isMyProduct(product)}
            onSelect={setChosen}
            onEdit={setEdit}
            onRemove={
              isFarmer && isMyProduct(product)
                ? removeProduct
                : undefined
            }
          />
        ))}

        {!products.length && (
          <div className="empty-state">
            <div className="empty-icon">
              🌱
            </div>

            <h3>
              No products found
            </h3>

            <p>
              No products match this view yet.
            </p>
          </div>
        )}

      </section>

      {/* BUY PRODUCT */}

      {chosen && (
        <ProductModal
          product={chosen}
          close={() => setChosen(null)}
          refresh={fetchProducts}
          onOrderPlaced={() => setOrderPlaced(true)}
        />
      )}

      {/* EDIT PRODUCT */}

      {edit && (
        <EditModal
          product={edit}
          close={() => setEdit(null)}
          refresh={fetchProducts}
          onPriceUpdated={() =>
            setActionSuccess({
              title: "Price Updated Successfully!",
              message: "Your product price has been updated successfully.",
            })
          }
        />
      )}

      {/* ADD PRODUCT */}

      {add && (
        <AddModal
          categories={categories}
          close={() => setAdd(false)}
          refresh={fetchProducts}
          onProductAdded={() =>
            setActionSuccess({
              title: "Product Added Successfully!",
              message: "Your product has been added to the marketplace successfully.",
            })
          }
        />
      )}

      {orderPlaced && (
        <SuccessModal
          title="Order Placed Successfully!"
          message="Your order has been submitted successfully. The farmer will review your order shortly."
          close={() => setOrderPlaced(false)}
        />
      )}

      {productToRemove && (
        <DeleteProductModal
          close={() => {
            if (!removingProduct) {
              setProductToRemove(null);
              setRemoveError("");
            }
          }}
          error={removeError}
          removing={removingProduct}
          remove={confirmRemoveProduct}
        />
      )}

      {actionSuccess && (
        <SuccessModal
          {...actionSuccess}
          close={() => setActionSuccess(null)}
        />
      )}

    </Shell>
  );
}

/* =========================================================
   PRODUCT MODAL
========================================================= */

function ProductModal({
  product,
  close,
  refresh,
  onOrderPlaced,
}) {
  const { user } = useAuth();

  const [qty, setQty] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const orderInFlight = useRef(false);

  const isBuyer = user?.role === "BUYER";

  const availableQuantity =
    Number(
      product.quantityKg ??
        product.quantity ??
        product.stock ??
        0
    );

  const pricePerKg =
    Number(
      product.pricePerKg ??
        product.price ??
        0
    );

  const total =
    Number(qty || 0) *
    pricePerKg;

  const order = async () => {

    if (orderInFlight.current) return;

    if (!qty) {
      setError(
        "Please enter the quantity."
      );
      return;
    }

    if (Number(qty) <= 0) {
      setError(
        "Quantity must be greater than 0."
      );
      return;
    }

    if (
      Number(qty) >
      availableQuantity
    ) {
      setError(
        "Requested quantity is greater than available stock."
      );
      return;
    }

    orderInFlight.current = true;
    setSaving(true);

    try {

      await api.post("/orders", {
        productId: product.id,
        quantityKg: Number(qty),
      });

      close();
      onOrderPlaced?.();
      void refresh?.();

    } catch (error) {

      orderInFlight.current = false;

      setError(
        error.response?.data?.message ||
          "Order could not be placed."
      );

    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">

      <section className="modal">

        <button
          className="close"
          onClick={close}
        >
          ×
        </button>

        {/* IMAGE */}

        <div className="modal-image">

          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
            />
          ) : (
            "🌿"
          )}

        </div>

        <div className="tiny-label">
          {product.category?.name ||
            "FARM PRODUCT"}
        </div>

        <h2>
          {product.name}
        </h2>

        <p>
          Farmed by{" "}
          <b>
            {product.farmer?.name ||
              "Farmer"}
          </b>
          {" · "}
          {product.farmer?.farmerProfile
            ?.landDetails ||
            "Location shared after confirmation"}
        </p>

        <div className="deal-facts">

          <span>
            <b>
              {availableQuantity} kg
            </b>{" "}
            available
          </span>

          <span>
            <b>
              ₹{pricePerKg}
            </b>{" "}
            per kg
          </span>

        </div>

        {isBuyer && (
          <div className="order-panel">

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <Field
              label={`Quantity (up to ${availableQuantity} kg)`}
              type="number"
              min="1"
              max={availableQuantity}
              value={qty}
              onChange={(e) =>
                setQty(e.target.value)
              }
            />

            <p>
              Total:{" "}
              <b>
                {money(total)}
              </b>
            </p>

            <p className="muted">
              Location sharing becomes
              available when the farmer
              accepts this deal.
            </p>

            <button
              className="button full"
              disabled={
                !qty ||
                Number(qty) <= 0 ||
                Number(qty) >
                  availableQuantity ||
                saving
              }
              onClick={order}
            >
              {saving
                ? "Placing order…"
                : "Place order"}
            </button>

          </div>
        )}

      </section>

    </div>
  );
}

function SuccessModal({ title, message, close }) {
  return (
    <div className="modal-backdrop order-success-backdrop" role="presentation">
      <section
        className="modal order-success-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-success-title"
      >
        <div className="order-success-icon" aria-hidden="true">✓</div>
        <div className="eyebrow green">SUCCESS</div>
        <h2 id="order-success-title">{title}</h2>
        <p>{message}</p>
        <button className="button full" type="button" onClick={close}>
          Continue
        </button>
      </section>
    </div>
  );
}

function DeleteProductModal({ close, error, removing, remove }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="modal remove-confirmation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-product-title"
      >
        <div className="remove-warning-icon" aria-hidden="true">!</div>
        <h2 id="remove-product-title">Remove Product?</h2>
        <p>Are you sure you want to remove this product?</p>

        {error && <div className="form-error">{error}</div>}

        <div className="remove-confirmation-actions">
          <button
            className="small-button secondary"
            type="button"
            disabled={removing}
            onClick={close}
          >
            Cancel
          </button>
          <button
            className="remove-product-button remove-confirm-button"
            type="button"
            disabled={removing}
            onClick={remove}
          >
            {removing ? "Removing productâ€¦" : "Remove Product"}
          </button>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   ADD PRODUCT
========================================================= */

function AddModal({
  categories,
  close,
  refresh,
  onProductAdded,
}) {
  const [form, setForm] =
    useState({
      name: "",
      categoryId: "",
      quantityKg: "",
      pricePerKg: "",
      description: "",
    });

  const [image, setImage] =
    useState(null);

  const [preview, setPreview] =
    useState("");

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const submissionInFlight = useRef(false);

  const submit = async (event) => {

    event.preventDefault();

    if (submissionInFlight.current) return;

    if (
      Number(form.quantityKg) < 50
    ) {
      setError(
        "Minimum listing quantity is 50 kg."
      );
      return;
    }

    if (
      !form.name ||
      !form.categoryId ||
      !form.quantityKg ||
      !form.pricePerKg
    ) {
      setError(
        "Please fill all required fields."
      );
      return;
    }

    const data =
      new FormData();

    Object.entries(form).forEach(
      ([key, value]) => {
        data.append(key, value);
      }
    );

    if (image) {
      data.append(
        "image",
        image
      );
    }

    submissionInFlight.current = true;
    setSaving(true);

    try {

      await api.post(
        "/products",
        data
      );

      await refresh?.();
      close();
      onProductAdded?.();

    } catch (error) {

      submissionInFlight.current = false;

      setError(
        error.response?.data?.message ||
          "Could not add product."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleImage = (event) => {

    const file =
      event.target.files?.[0];

    if (!file) return;

    setImage(file);

    setPreview(
      URL.createObjectURL(file)
    );
  };

  return (
    <div className="modal-backdrop">

      <form
        className="modal"
        onSubmit={submit}
      >

        <button
          className="close"
          type="button"
          onClick={close}
        >
          ×
        </button>

        <h2>
          Add a fresh listing
        </h2>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        {/* PHOTO */}

        <label className="upload-zone">

          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImage}
          />

          {preview ? (
            <img
              src={preview}
              alt="Product preview"
            />
          ) : (
            <>
              <span>⌾</span>

              <b>
                Camera or photo upload
              </b>

              <small>
                Select or take a product
                photo
              </small>
            </>
          )}

        </label>

        {/* PRODUCT NAME */}

        <Field
          label="Product name"
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value,
            })
          }
          required
        />

        {/* CATEGORY */}

        <Select
          label="Category"
          value={form.categoryId}
          onChange={(e) =>
            setForm({
              ...form,
              categoryId:
                e.target.value,
            })
          }
          required
          options={categories.map(
            (category) => [
              category.id,
              category.name,
            ]
          )}
        />

        {/* QUANTITY + PRICE */}

        <div className="field-grid">

          <Field
            label="Quantity (kg, minimum 50)"
            type="number"
            min="50"
            value={form.quantityKg}
            onChange={(e) =>
              setForm({
                ...form,
                quantityKg:
                  e.target.value,
              })
            }
            required
          />

          <Field
            label="Price per kg (₹)"
            type="number"
            min="0.01"
            step="0.01"
            value={form.pricePerKg}
            onChange={(e) =>
              setForm({
                ...form,
                pricePerKg:
                  e.target.value,
              })
            }
            required
          />

        </div>

        {/* DESCRIPTION */}

        <label className="field">

          <span>
            Description (optional)
          </span>

          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description:
                  e.target.value,
              })
            }
          />

        </label>

        <button
          className="button full"
          type="submit"
          disabled={saving}
        >
          {saving ? "Adding productâ€¦" : "Upload / add product"}
        </button>

      </form>
    </div>
  );
}

/* =========================================================
   EDIT PRODUCT PRICE
========================================================= */

function EditModal({
  product,
  close,
  refresh,
  onPriceUpdated,
}) {
  const [price, setPrice] =
    useState(
      product.pricePerKg ??
        product.price ??
        ""
    );

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const updateInFlight = useRef(false);

  const save = async () => {

    if (updateInFlight.current) return;

    if (
      !price ||
      Number(price) <= 0
    ) {
      setError(
        "Please enter a valid price."
      );
      return;
    }

    updateInFlight.current = true;
    setSaving(true);

    try {

      await api.put(
        `/products/${product.id}`,
        {
          pricePerKg:
            Number(price),
        }
      );

      await refresh?.();
      close();
      onPriceUpdated?.();

    } catch (error) {

      updateInFlight.current = false;

      setError(
        error.response?.data?.message ||
          "Could not update price."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">

      <section className="modal compact">

        <button
          className="close"
          onClick={close}
        >
          ×
        </button>

        <h2>
          Update current price
        </h2>

        <p>
          Existing orders keep their
          agreed price.
        </p>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <Field
          label="Price per kg (₹)"
          type="number"
          min="0.01"
          step="0.01"
          value={price}
          onChange={(e) =>
            setPrice(e.target.value)
          }
        />

        <button
          className="button full"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving priceâ€¦" : "Save price"}
        </button>

      </section>

    </div>
  );
}

/* =========================================================
   ORDERS
========================================================= */

export function Orders() {
  const { user } = useAuth();

  const isBuyerLocationShareableStatus = (status) =>
    ["FARMER_ACCEPTED", "CONFIRMED"].includes(
      String(status).toUpperCase()
    );

  const hasValidLocation = (latitude, longitude) =>
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined &&
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude)) &&
    Number(latitude) >= -90 &&
    Number(latitude) <= 90 &&
    Number(longitude) >= -180 &&
    Number(longitude) <= 180;

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [trackingOrderIds, setTrackingOrderIds] =
    useState([]);

  const [locationErrors, setLocationErrors] =
    useState({});

  const load = async (silent = false) => {

    try {

      if (!silent) setLoading(true);

      const response =
        await api.get("/orders");

      const nextOrders =
        response.data.orders ||
        response.data ||
        [];

      setOrders(nextOrders);

      if (user?.role === "BUYER") {
        const sharedActiveOrderIds = nextOrders
          .filter((order) =>
            isBuyerLocationShareableStatus(order.status) &&
            hasValidLocation(
              order.buyerLatitude,
              order.buyerLongitude
            )
          )
          .map((order) => order.id);
        if (sharedActiveOrderIds.length) {
          setTrackingOrderIds((current) => [
            ...new Set([...current, ...sharedActiveOrderIds]),
          ]);
        }
      }

    } catch (error) {

      console.error(
        "Orders loading error:",
        error
      );

    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== "FARMER" || !orders.some((order) => isBuyerLocationShareableStatus(order.status))) return;
    const interval = window.setInterval(() => load(true), 15000);
    return () => window.clearInterval(interval);
  }, [orders, user?.role]);

  useEffect(() => {
    if (user?.role === "FARMER" || trackingOrderIds.length === 0 || !navigator.geolocation) return;

    const activeIds = trackingOrderIds.filter((id) =>
      orders.some((order) =>
        order.id === id && isBuyerLocationShareableStatus(order.status)
      )
    );
    if (activeIds.length !== trackingOrderIds.length) setTrackingOrderIds(activeIds);

    const watchIds = activeIds.map((id) => navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const response = await api.put(`/orders/${id}/buyer-location`, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setOrders((current) => current.map((order) => order.id === id ? response.data.order : order));
          setLocationErrors((current) => ({ ...current, [id]: "" }));
        } catch (error) {
          setLocationErrors((current) => ({ ...current, [id]: error.response?.data?.message || "Could not update your location." }));
          if ([403, 404, 409].includes(error.response?.status)) {
            setTrackingOrderIds((current) => current.filter((orderId) => orderId !== id));
            load(true);
          }
        }
      },
      (error) => {
        const messages = {
          1: "Location permission was denied. Enable it in your browser and try again.",
          2: "Your location is currently unavailable. Please try again.",
          3: "Location updates timed out. Please try again.",
        };
        setLocationErrors((current) => ({ ...current, [id]: messages[error.code] || "Could not update your location." }));
        if (error.code === 1) setTrackingOrderIds((current) => current.filter((orderId) => orderId !== id));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    ));

    return () => watchIds.forEach((watchId) => navigator.geolocation.clearWatch(watchId));
  }, [orders, trackingOrderIds, user?.role]);

  const act = async (
    id,
    action
  ) => {

    try {

      await api.put(
        `/orders/${id}/${action}`,
        {}
      );

      await load();

    } catch (error) {

      alert(
        error.response?.data
          ?.message ||
          "Action failed."
      );
    }
  };

  const shareFarmerLocation = async (
    id,
    position
  ) => {
    await api.put(
      `/orders/${id}/location`,
      position
    );

    await load();
  };

  const shareBuyerLocation = async (id, position) => {
    const response = await api.put(`/orders/${id}/buyer-location`, position);
    setOrders((current) => current.map((order) => order.id === id ? response.data.order : order));
    setLocationErrors((current) => ({ ...current, [id]: "" }));
    setTrackingOrderIds((current) => current.includes(id) ? current : [...current, id]);
    await load(true);
  };

  return (
    <Shell>

      <section className="dashboard-head">

        <div>

          <div className="eyebrow green">
            ORDERS & DEALS
          </div>

          <h1>
            Keep every agreement clear.
          </h1>

          <p>
            Manage farmer-buyer orders,
            deal confirmations and
            location sharing.
          </p>

        </div>

      </section>

      <section
        className={
          user?.role === "FARMER"
            ? "orders-list farmer-orders-list"
            : "orders-list"
        }
      >

        {loading ? (
          <div className="dashboard-loading">
            <div className="loading-spinner"></div>

            <h3>
              Loading orders...
            </h3>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">

            <div className="empty-icon">
              📦
            </div>

            <h3>
              No orders yet.
            </h3>

            <p>
              Orders and deals will
              appear here.
            </p>

          </div>
        ) : (
          orders.map((order) => {

            const isFarmer =
              user?.role === "FARMER";

            const status =
              String(
                order.status ||
                  "PENDING"
              ).toUpperCase();

            const canShareBuyerLocation =
              !isFarmer &&
              isBuyerLocationShareableStatus(status);

            const farmerLocationUrl =
              hasValidLocation(
                order.farmerLatitude,
                order.farmerLongitude
              )
                ? `https://www.google.com/maps?q=${order.farmerLatitude},${order.farmerLongitude}`
                : null;

            const buyerLocationUrl =
              hasValidLocation(
                order.buyerLatitude,
                order.buyerLongitude
              )
                ? `https://www.google.com/maps?q=${order.buyerLatitude},${order.buyerLongitude}`
                : null;

            const showsLocationStatus =
              status === "FARMER_ACCEPTED" ||
              status === "CONFIRMED";

            const productName =
              order.product?.name ||
              order.productName ||
              "Product";

            const requestedQuantity =
              order.requestedQuantityKg ??
              order.quantityKg ??
              order.quantity ??
              0;

            const agreedPrice =
              order.agreedPricePerKg ??
              order.pricePerKg ??
              order.product
                ?.pricePerKg ??
              0;

            const totalAmount =
              order.totalAmount ??
              Number(
                requestedQuantity
              ) *
                Number(
                  agreedPrice
                );

            return (
              <article
                className={
                  isFarmer
                    ? "order-row farmer-order-card"
                    : "order-row"
                }
                key={order.id}
              >

                {/* BASIC INFO */}

                <div className="order-card-header">

                  <span
                    className={`status ${status.toLowerCase()}`}
                  >
                    {status.replaceAll(
                      "_",
                      " "
                    )}
                  </span>

                  <h3>
                    {productName}{" "}

                    <span className="muted order-id-badge">
                      #
                      {String(
                        order.id
                      ).slice(-7)}
                    </span>
                  </h3>

                  <p className="order-party">

                    {isFarmer
                      ? `${
                          order.buyer
                            ?.name ||
                          "Buyer"
                        } · ${
                          order.buyer
                            ?.buyerProfile
                            ?.businessType
                            ?.replaceAll(
                              "_",
                              " "
                            ) ||
                          "Buyer"
                        }`
                      : `${
                          order.farmer
                            ?.name ||
                          "Farmer"
                        } · ${
                          order.farmer
                            ?.farmerProfile
                            ?.landDetails ||
                          "Farm location"
                        }`}

                  </p>

                </div>

                {/* ORDER FACTS */}

                <div className="order-facts">

                  <span>
                    {requestedQuantity} kg
                  </span>

                  <span>
                    ₹{agreedPrice}/kg
                  </span>

                  <b>
                    {money(
                      totalAmount
                    )}
                  </b>

                </div>

                {/* ACTIONS */}

                <div className="order-actions">

                  {/* LOCATION */}

                  {isFarmer && (
                    <section className="order-location-panel">
                      <span className="order-panel-title">
                        Location sharing
                      </span>

                      <div className="location-statuses">
                        <span>
                          Farmer: {farmerLocationUrl ? "Location shared \u2713" : "Pending"}
                        </span>

                        <span>
                          Buyer: {buyerLocationUrl ? "Location shared \u2713" : "Pending"}
                        </span>
                      </div>

                      <div className="location-actions">
                        <LocationButton
                          label={
                            farmerLocationUrl
                              ? "Update location"
                              : "Share location"
                          }
                          onLocation={(position) =>
                            shareFarmerLocation(
                              order.id,
                              position
                            )
                          }
                        />
                      </div>
                    </section>
                  )}

                  {canShareBuyerLocation && (
                    <LocationButton
                      label={
                        buyerLocationUrl
                          ? "Update location"
                          : "Share my location"
                      }
                      onLocation={(position) =>
                        shareBuyerLocation(
                          order.id,
                          position
                        )
                      }
                      onError={(message) =>
                        setLocationErrors((current) => ({
                          ...current,
                          [order.id]: message,
                        }))
                      }
                    />
                  )}

                  {!isFarmer && buyerLocationUrl && (
                    <span className="location-detail">
                      Location shared ✓
                    </span>
                  )}

                  {locationErrors[order.id] && (
                    <span className="location-detail">
                      {locationErrors[order.id]}
                    </span>
                  )}

                  {!isFarmer &&
                    farmerLocationUrl && (
                      <a
                        className="location-detail"
                        href={farmerLocationUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View farmer location
                      </a>
                    )}

                  {isFarmer &&
                    buyerLocationUrl && (
                      <a
                        className="location-detail"
                        href={buyerLocationUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View buyer location 📍
                      </a>
                    )}

                  {/* FARMER ACCEPT / REJECT */}

                  {isFarmer && (
                    <div className="order-deal-actions">
                      {status === "PENDING" && (
                        <>
                        <button
                          className="small-button green-button"
                          onClick={() =>
                            act(
                              order.id,
                              "accept"
                            )
                          }
                        >
                          Accept
                        </button>

                        <button
                          className="small-button danger"
                          onClick={() =>
                            act(
                              order.id,
                              "reject"
                            )
                          }
                        >
                          Reject
                        </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* BUYER ACCEPT / REJECT */}

                  {!isFarmer &&
                    status ===
                      "FARMER_ACCEPTED" && (
                      <div className="buyer-order-deal-actions">
                        <button
                          className="small-button green-button"
                          onClick={() =>
                            act(
                              order.id,
                              "buyer-accept"
                            )
                          }
                        >
                          Accept deal
                        </button>

                        <button
                          className="small-button danger"
                          onClick={() =>
                            act(
                              order.id,
                              "buyer-reject"
                            )
                          }
                        >
                          Decline
                        </button>
                      </div>
                    )}

                  {/* LOCATION STATUS */}

                  {!isFarmer && showsLocationStatus && (
                    <span className="location-detail">

                      ⌖ Locations shared

                      <br />

                      Farmer:{" "}
                      {farmerLocationUrl
                        ? "Location shared ✓"
                        : "Pending"}

                      <br />

                      Buyer:{" "}
                      {buyerLocationUrl
                        ? "Location shared ✓"
                        : "Pending"}

                    </span>
                  )}

                </div>

              </article>
            );
          })
        )}

      </section>

    </Shell>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  title,
  value,
  text,
}) {
  return (
    <div className="stat-card">

      <div className="stat-icon">
        {icon}
      </div>

      <div className="stat-info">

        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {text}
        </small>

      </div>

    </div>
  );
}

/* =========================================================
   ORDER ROW
========================================================= */

function OrderRow({
  order,
}) {
  const status =
    String(
      order.status ||
        "PENDING"
    ).toUpperCase();

  const productName =
    order.product?.name ||
    order.productName ||
    "Product";

  const quantity =
    order.requestedQuantityKg ??
    order.quantityKg ??
    order.quantity ??
    0;

  return (
    <div className="order-row">

      <div className="order-product-icon">
        📦
      </div>

      <div className="order-details">

        <strong>
          {productName}
        </strong>

        <span>
          Quantity: {quantity} kg
        </span>

      </div>

      <span
        className={`order-status status-${status.toLowerCase()}`}
      >
        {status.replaceAll(
          "_",
          " "
        )}
      </span>

    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  icon,
  title,
  text,
  link,
  linkText,
}) {
  return (
    <div className="empty-state">

      <div className="empty-icon">
        {icon}
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>

      {link && (
        <Link
          to={link}
          className="button"
        >
          {linkText}
        </Link>
      )}

    </div>
  );
}
