import React, { useState } from "react";
import axios from "axios";

import "../css/Login.css";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ================= API URL =================
  const API_URL = import.meta.env.VITE_API_URL;

  // ================= GMAIL VALIDATION =================
  const validateEmail = (email) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return gmailRegex.test(email);
  };

  // ================= EMAIL CLICK =================
  const handleEmailClick = () => {
    // Email click validation can remain empty
  };

  // ================= PASSWORD CLICK =================
  const handlePasswordClick = () => {
    if (email.trim() === "") {
      alert("Please enter email first");
      return;
    }

    if (!validateEmail(email.trim())) {
      alert("Please enter a valid Gmail address first");
    }
  };

  // ================= LOGIN =================
  const handleLogin = async (e) => {
    e.preventDefault();

    console.log("Login button clicked");

    // ================= EMAIL =================
    if (email.trim() === "") {
      alert("Please enter your email");
      return;
    }

    if (!validateEmail(email.trim())) {
      alert("Email must be in format example@gmail.com");
      return;
    }

    // ================= PASSWORD =================
    if (password.length < 8) {
      alert("Password must contain minimum 8 characters");
      return;
    }

    // ================= API REQUEST =================
    try {
      const response = await axios.post(
        `${API_URL}/login`,
        {
          email: email.trim(),
          password: password,
        }
      );

      console.log(response.data);

      // ================= SAVE USER ID =================
      if (response.data.user && response.data.user.user_id) {
        localStorage.setItem(
          "user_id",
          response.data.user.user_id
        );

        alert(response.data.message || "Login Successful");

        setEmail("");
        setPassword("");
      }

    } catch (error) {

      // ================= BACKEND RESPONSE ERROR =================
      if (error.response) {
        alert(
          error.response.data.message ||
          "Login failed"
        );
      }

      // ================= SERVER CONNECTION ERROR =================
      else {
        alert("Server is not connected");
      }
    }
  };

  return (
    <div className="login-page">

      <Navbar />

      <div className="login-overlay">

        <div className="login-box">

          <h1>MediStock</h1>

          <p className="login-title">
            Stock Manager Login
          </p>

          <form onSubmit={handleLogin}>

            {/* ================= EMAIL ================= */}
            <div className="input-group">

              <label>Email</label>

              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                autoComplete="new-email"
                onClick={handleEmailClick}
                onChange={(e) => setEmail(e.target.value)}
              />

            </div>

            {/* ================= PASSWORD ================= */}
            <div className="input-group">

              <label>Password</label>

              <div className="password-box">

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  autoComplete="new-password"
                  onClick={handlePasswordClick}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

              </div>

            </div>

            {/* ================= LOGIN BUTTON ================= */}
            <button type="submit">
              Login
            </button>

          </form>

          {/* ================= REGISTER LINK ================= */}
          <div className="register-link">

            <p>
              Don't have an account?{" "}

              <Link to="/register">
                Register
              </Link>

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;