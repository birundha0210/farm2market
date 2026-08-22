import React from 'react';
import { motion } from 'framer-motion';

export default function ProductCard({
  product,
  own,
  onSelect,
  onEdit,
  onRemove,
  showQuantityLabel = false
}) {
  if (!product) return null;

  // Category can be object or string
  const categoryName =
    typeof product.category === 'object' && product.category !== null
      ? product.category.name
      : product.category || 'Fresh Produce';

  // Farmer can be object or string
  const farmerName =
    typeof product.farmer === 'object' && product.farmer !== null
      ? product.farmer.name
      : product.farmer || 'Unknown Farmer';

  // Support both possible backend field names
  const quantity =
    product.quantityKg ??
    product.quantity ??
    0;

  const price =
    product.pricePerKg ??
    product.price ??
    0;

  const status = product.status || 'AVAILABLE';

  return (
    <motion.article
      className="product-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >

      {/* PRODUCT IMAGE */}
      <button
        type="button"
        className="product-image"
        onClick={() => onSelect?.(product)}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name || 'Farm product'}
          />
        ) : (
          <span>🌿</span>
        )}
      </button>

      {/* PRODUCT DETAILS */}
      <div className="product-copy">

        {/* CATEGORY */}
        <div className="tiny-label">
          {categoryName}
        </div>

        {/* PRODUCT NAME */}
        <h3>
          {product.name || 'Unnamed Product'}
        </h3>

        {/* QUANTITY + PRICE */}
        <p>
          {showQuantityLabel ? "Available: " : ""}
          {quantity} kg
          <span> · </span>
          ₹{price}/kg
        </p>

        {/* FARMER */}
        <p className="muted">
          {own
            ? `Farmed by ${farmerName} · Your listing`
            : `Farmed by ${farmerName}`}
        </p>

        {/* BOTTOM ACTIONS */}
        <div className="card-bottom">

          <span
            className={`status ${String(status).toLowerCase()}`}
          >
            {String(status).replaceAll('_', ' ')}
          </span>

          <div className="card-actions">
            {own && onEdit ? (
              <button
                type="button"
                className="small-button"
                onClick={() => onEdit(product)}
              >
                Edit price
              </button>
            ) : (
              <button
                type="button"
                className="small-button"
                onClick={() => onSelect?.(product)}
              >
                View deal
              </button>
            )}

            {own && onRemove && (
              <button
                type="button"
                className="remove-product-button"
                onClick={() => onRemove(product)}
              >
                Remove product
              </button>
            )}
          </div>

        </div>

      </div>
    </motion.article>
  );
}
