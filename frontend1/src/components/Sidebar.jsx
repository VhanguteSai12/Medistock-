import React from "react";
import { Link, useLocation } from "react-router-dom";

import {
  FaTachometerAlt,
  FaPills,
  FaUsers,
  FaHistory,
  FaUserCircle,
  FaSignOutAlt,
  FaRobot
} from "react-icons/fa";

import "../css/Sidebar.css";

function Sidebar() {

  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("user_id");
    window.location.href = "/login";
  };

  return (
    <aside className="sidebar">

      {/* Logo / Title */}
      <div className="sidebar-logo">

        <div className="sidebar-logo-icon">
            <img src="/logo2.png" alt="MediStock Logo" />
        </div>

        <div>
          <h2>MediStock</h2>
          <p>Inventory System</p>
        </div>

      </div>


      {/* Navigation */}
      <div className="sidebar-menu">

        <p className="menu-title">MAIN MENU</p>


        {/* Dashboard */}
        <Link
          to="/dashboard"
          className={
            location.pathname === "/dashboard"
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <FaTachometerAlt />
          <span>Dashboard</span>
        </Link>


        {/* Medicines */}
        <Link
          to="/medicines"
          className={
            location.pathname === "/medicines"
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <FaPills />
          <span>Medicines</span>
        </Link>


        {/* Customers */}
        <Link
          to="/customers"
          className={
            location.pathname === "/customers"
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <FaUsers />
          <span>Customers</span>
        </Link>


        {/* History */}
        <Link
          to="/history"
          className={
            location.pathname === "/history"
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <FaHistory />
          <span>History</span>
        </Link>

         <Link
          to="/chatbot"
          className={
            location.pathname === "/chatbot"
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <FaRobot />
          <span>Chatbot</span>
        </Link>



        {/* Profile */}
        <Link
          to="/profile"
          className={
            location.pathname === "/profile"
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <FaUserCircle />
          <span>Profile</span>
        </Link>


        
      </div>


      {/* Bottom */}
      <div className="sidebar-bottom">

        <button
          className="sidebar-logout"
          onClick={logout}
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;