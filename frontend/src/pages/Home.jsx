import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PublicNav } from "../components/Navbar";

const words = "From farm to market. Directly fresh.".split(" ");

export default function Home() {
  return (
    <main className="home">
      <PublicNav />

      <div className="leaf leaf-a">✦</div>
      <div className="leaf leaf-b">❋</div>

      <section className="hero">
        <div className="eyebrow">DIRECT B2B AGRICULTURE</div>

        <h1>
          {words.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, x: 85 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.85,
                delay: 0.22 + i * 0.18,
                ease: "easeOut",
              }}
            >
              {word}&nbsp;
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          A clear, trusted market where growers sell fresh produce directly
          to supermarkets, mini markets and vegetable shops.
        </motion.p>

        <motion.div
          className="hero-actions"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.45 }}
        >
          <Link className="button light" to="/farmer/auth">
            Register as Farmer
          </Link>

          <Link className="button outline-light" to="/buyer/auth">
            Register as Buyer
          </Link>

          <Link className="plain-link" to="/login">
            Login →
          </Link>
        </motion.div>

        <div className="hero-pills">
          <span>Fresh listings</span>
          <span>Verified buyers</span>
          <span>Fair deals</span>
        </div>
      </section>

      <section className="how">
        <div>
          <b>01</b>
          <h3>Growers list</h3>
          <p>Add crops, quantity and your price.</p>
        </div>

        <div>
          <b>02</b>
          <h3>Buyers discover</h3>
          <p>Find fresh supply that fits the business.</p>
        </div>

        <div>
          <b>03</b>
          <h3>Both confirm</h3>
          <p>Agree, share location and move goods.</p>
        </div>
      </section>
    </main>
  );
}
