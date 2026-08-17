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

        <li>
          <FaTachometerAlt color="white" />
          <Link to="/dashboard">
              Dashboard
          </Link>
        </li>

     
      </ul>


    </nav>

  );

}

export default Navbar;