import React from "react";
import { Link } from "react-router-dom";

import {
  FaPills,
  FaBoxes,
  FaUsers,
  FaFileInvoice,
  FaHistory,
  FaShieldAlt,
  FaCheckCircle,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt
} from "react-icons/fa";

import Navbar from "../components/Navbar";
import "../css/HomePage.css";

function Home() {
  return (
    <>
      {/* ================= NAVBAR ================= */}
      <Navbar />

      <div className="home-page">

        {/* ================= HERO ================= */}
        <section className="home-hero">
          <img
            src="/bannerfinal.png"
            alt="MediStock Inventory System"
            className="home-banner"
          />
        </section>

        {/* ================= INTRODUCTION ================= */}
        <section className="home-intro">
          <h2>
            Everything You Need to Manage Your Medical Store
          </h2>

          <p>
            MediStock is designed for medical shopkeepers and stock managers
            to simplify medicine inventory, customer records, stock monitoring
            and store management from one professional system.
          </p>
        </section>

        {/* ================= FEATURES ================= */}
        <section className="home-features">

          <h2>
            Powerful Features for Your Medical Store
          </h2>

          <p className="section-text">
            Manage your complete medical store inventory with simple
            and professional tools.
          </p>

          <div className="feature-grid">

            <div className="feature-box">
              <FaPills className="feature-icon" />
              <h3>Medicine Management</h3>
              <p>
                Add, update, search and manage medicines while keeping
                track of available stock.
              </p>
            </div>

            <div className="feature-box">
              <FaBoxes className="feature-icon" />
              <h3>Stock Monitoring</h3>
              <p>
                Monitor medicine quantities and quickly identify
                low-stock medicines.
              </p>
            </div>

            <div className="feature-box">
              <FaUsers className="feature-icon" />
              <h3>Customer Management</h3>
              <p>
                Maintain customer information and manage
                medicine-related customer records.
              </p>
            </div>

            <div className="feature-box">
              <FaFileInvoice className="feature-icon" />
              <h3>Billing & Invoices</h3>
              <p>
                Manage invoices and keep customer purchase
                records organized.
              </p>
            </div>

            <div className="feature-box">
              <FaHistory className="feature-icon" />
              <h3>Customer History</h3>
              <p>
                Search customer history using invoice number
                and customer name.
              </p>
            </div>

            <div className="feature-box">
              <FaShieldAlt className="feature-icon" />
              <h3>Secure Store Management</h3>
              <p>
                Keep your store data organized and associated
                with the correct stock manager.
              </p>
            </div>

          </div>
        </section>

        {/* ================= HOW MEDISTOCK WORKS ================= */}
        <section className="home-how">

          <h2>How MediStock Works</h2>

          <p className="section-text">
            Get started with MediStock in four simple steps.
          </p>

          <div className="steps-grid">

            <div className="work-step">
              <span>01</span>
              <h3>Register</h3>
              <p>
                Create your MediStock account.
              </p>
            </div>

            <div className="work-step">
              <span>02</span>
              <h3>Add Medicines</h3>
              <p>
                Add and maintain your medical store inventory.
              </p>
            </div>

            <div className="work-step">
              <span>03</span>
              <h3>Manage Customers</h3>
              <p>
                Record customer and medicine information.
              </p>
            </div>

            <div className="work-step">
              <span>04</span>
              <h3>Monitor Your Store</h3>
              <p>
                Track stock, customers and store activity from one place.
              </p>
            </div>

          </div>
        </section>

        {/* ================= BENEFITS ================= */}
        <section className="home-benefits">

          <h2>Why Choose MediStock?</h2>

          <div className="benefit-grid">

            <div className="benefit-box">
              <FaCheckCircle />
              <span>Easy Inventory Management</span>
            </div>

            <div className="benefit-box">
              <FaCheckCircle />
              <span>Faster Stock Monitoring</span>
            </div>

            <div className="benefit-box">
              <FaCheckCircle />
              <span>Organized Customer Records</span>
            </div>

            <div className="benefit-box">
              <FaCheckCircle />
              <span>Simple Professional Interface</span>
            </div>

          </div>
        </section>

        {/* ================= CTA ================= */}
        <section className="home-cta">

          <div className="cta-content">

            <h2>
              Manage Your Medical Store Smarter
            </h2>

            <p>
              Keep your medicines, customers and inventory organized
              with MediStock.
            </p>

            <Link
              to="/register"
              className="cta-button"
            >
              Create Your Account
            </Link>

          </div>
        </section>

        {/* ================= FOOTER ================= */}
        <div className="home-footer">

          <div className="footer-main">

            {/* BRAND */}
            <div className="footer-column footer-brand">

              <h2>MediStock</h2>

              <p className="footer-tagline">
                Smart Inventory Management for Medical Stores.
              </p>

              <p className="footer-description">
                A simple and professional solution for managing
                medicines, stock and customer records efficiently.
              </p>

            </div>

            {/* QUICK LINKS */}
            <div className="footer-column">

              <h3>Quick Links</h3>

              <div className="footer-link-grid">

                <Link to="/register">Register</Link>
                <Link to="/login">Login</Link>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/medicines">Medicines</Link>
                <Link to="/customers">Customers</Link>
                <Link to="/history">History</Link>
                <Link to="/profile">Profile</Link>

              </div>

            </div>

            {/* CONTACT */}
            <div className="footer-column">

              <h3>Contact Us</h3>

              <div className="contact-item">
                <FaEnvelope />
                <span>medistock@gmail.com</span>
              </div>

              <div className="contact-item">
                <FaPhone />
                <span>+91 98765 43210</span>
              </div>

              <div className="contact-item">
                <FaMapMarkerAlt />
                <span>
                  Medical Store Inventory Support
                </span>
              </div>

            </div>

          </div>

          {/* COPYRIGHT */}
          <div className="footer-bottom">

            <p>
              © 2026 MediStock Inventory System.
              All rights reserved.
            </p>

          </div>

        </div>

      </div>
    </>
  );
}

export default Home;