import React from "react";
import { Link } from "react-router-dom";
import {
  FaHome,
  FaSignInAlt,
  FaUserPlus,
  FaRobot,
  FaTachometerAlt
} from "react-icons/fa";

import "../css/Navbar.css";

function Navbar() {

  const isLoggedIn = !!localStorage.getItem("user_id");

  return (

    <nav className="navbar">


      {/* Left Logo Section */}
      <div className="brand">


        <img 
          src="/logo1.png" 
          alt="MediStock Logo"
          className="logo-img"
        />



      </div>



      {/* Navigation Links */}
      <ul className="nav-links">

        <li>
          <FaHome color="white" />
          <Link to="/home">
              Home
          </Link>
        </li>

        {/* Show Login/Register only when NOT logged in */}
        {!isLoggedIn && (
          <>
            <li>
              <FaUserPlus color="white" />
              <Link to="/register">
                  Register
              </Link>
            </li>

            <li>
              <FaSignInAlt color="white" />
              <Link to="/login">
                  Login
              </Link>
            </li>
          </>
        )}

        {/* Show Dashboard only when logged in */}
        {isLoggedIn && (
          <li>
            <FaTachometerAlt color="white" />
            <Link to="/dashboard">
                Dashboard
            </Link>
          </li>
        )}

     
      </ul>


    </nav>

  );

}

export default Navbar;