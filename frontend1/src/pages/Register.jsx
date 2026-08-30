import React, { useState } from "react";
import axios from "axios";

import "../css/Register.css";
import Navbar from "../components/Navbar";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ================= API URL =================
  const API_URL = import.meta.env.VITE_API_URL;

  // ================= GMAIL VALIDATION =================
  const validateEmail = (email) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return gmailRegex.test(email);
  };

  // ================= EMAIL CLICK =================
  const handleEmailClick = () => {
    if (name.trim() === "") {
      alert("Please enter your full name first");
    }
  };

  // ================= PASSWORD CLICK =================
  const handlePasswordClick = () => {
    if (name.trim() === "") {
      alert("Please enter your full name first");
      return;
    }

    if (!validateEmail(email.trim())) {
      alert("Please enter a valid Gmail address first");
    }
  };

  // ================= REGISTER =================
  const handleRegister = async (e) => {
    e.preventDefault();

    // Prevent double submit
    if (isSubmitting) return;

    // ================= NAME =================
    if (name.trim() === "") {
      alert("Please enter your full name");
      return;
    }

    // ================= EMAIL =================
    if (!validateEmail(email.trim())) {
      alert("Email must be in format example@gmail.com");
      return;
    }

    // ================= PASSWORD =================
    if (password.length < 8) {
      alert("Password must contain minimum 8 characters");
      return;
    }

    // ================= CONFIRM PASSWORD =================
    if (password !== confirmPassword) {
      alert("Password and Confirm Password do not match");
      return;
    }

    // ================= API REQUEST =================
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${API_URL}/register`,
        {
          name: name.trim(),
          email: email.trim(),
          password: password
        }
      );

      // ================= SUCCESS =================
      if (response.status === 201) {
        alert(response.data.message);

        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }

    } catch (error) {

      // ================= USER ALREADY EXISTS =================
      if (error.response && error.response.status === 409) {
        alert("User already exists");
      }

      // ================= BACKEND ERROR =================
      else if (error.response) {
        alert(
          error.response.data.message || "Registration failed"
        );
      }

      // ================= SERVER ERROR =================
      else {
        alert("Server is not connected");
      }

    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page">

      <Navbar />

      <div className="register-overlay">

        <div className="register-box">

          <h1>MediStock</h1>

          <p className="register-title">
            Stock Manager Registration
          </p>

          <form onSubmit={handleRegister}>

            {/* ================= FULL NAME ================= */}
            <div className="input-group">

              <label>Full Name</label>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

            </div>

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
                  type="password"
                  placeholder="Create password"
                  value={password}
                  autoComplete="new-password"
                  onClick={handlePasswordClick}
                  onChange={(e) => setPassword(e.target.value)}
                />

              </div>

            </div>

            {/* ================= CONFIRM PASSWORD ================= */}
            <div className="input-group">

              <label>Confirm Password</label>

              <div className="password-box">

                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                />

              </div>

            </div>

            {/* ================= REGISTER BUTTON ================= */}
            <button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Registering..."
                : "Register"}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}

export default Register;