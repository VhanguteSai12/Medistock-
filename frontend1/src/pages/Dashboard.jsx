import React, { useEffect, useState } from "react";
import axios from "axios";

import "./../css/Dashboard.css";
import Sidebar from "../components/Sidebar";

import {
  FaUsers,
  FaPills,
  FaFileInvoice,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaCalendarTimes
} from "react-icons/fa";

function Dashboard() {

  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [expiredMedicines, setExpiredMedicines] = useState(0);

  // ================= API URL =================
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {

    const user_id = localStorage.getItem("user_id");

    if (!user_id) {
      console.log("User ID not found");
      return;
    }

    // ================= TOTAL CUSTOMERS =================
    axios
      .get(`${API_URL}/dashboard/total-customers/${user_id}`)
      .then((response) => {
        setTotalCustomers(response.data.total_customers);
      })
      .catch((error) => {
        console.log("Total Customers Error:", error);
      });

    // ================= TOTAL MEDICINES =================
    axios
      .get(`${API_URL}/dashboard/total-medicines/${user_id}`)
      .then((response) => {
        setTotalMedicines(response.data.total_medicines);
      })
      .catch((error) => {
        console.log("Total Medicines Error:", error);
      });

    // ================= TOTAL INVOICES =================
    axios
      .get(`${API_URL}/dashboard/total-invoices/${user_id}`)
      .then((response) => {
        setTotalInvoices(response.data.total_invoices);
      })
      .catch((error) => {
        console.log("Total Invoices Error:", error);
      });

    // ================= TOTAL SALES =================
    axios
      .get(`${API_URL}/dashboard/total-sales/${user_id}`)
      .then((response) => {
        setTotalSales(response.data.total_sales);
      })
      .catch((error) => {
        console.log("Total Sales Error:", error);
      });

    // ================= LOW STOCK MEDICINES =================
    axios
      .get(`${API_URL}/dashboard/low-stock/${user_id}`)
      .then((response) => {
        setLowStock(response.data.low_stock);
      })
      .catch((error) => {
        console.log("Low Stock Error:", error);
      });

    // ================= EXPIRED MEDICINES =================
    axios
      .get(`${API_URL}/dashboard/expired-medicines/${user_id}`)
      .then((response) => {
        setExpiredMedicines(
          response.data.expired_medicines
        );
      })
      .catch((error) => {
        console.log("Expired Medicines Error:", error);
      });

  }, []);

  return (

    <div className="dashboard-layout">

      {/* ================= LEFT SIDEBAR ================= */}
      <Sidebar />

      {/* ================= MAIN DASHBOARD ================= */}
      <main className="dashboard-main">

        <div className="dashboard-page">

          {/* ================= HEADER ================= */}
          <div className="dashboard-header">

            <h1>MediStock Dashboard</h1>

            <p>
              Overview of your medical store inventory and sales
            </p>

          </div>

          {/* ================= CARDS ================= */}
          <div className="dashboard-cards">

            {/* Total Customers */}
            <div className="dashboard-card">

              <div className="card-icon">
                <FaUsers />
              </div>

              <div className="card-content">

                <h3>Total Customers</h3>

                <h2>
                  {totalCustomers}
                </h2>

              </div>

            </div>

            {/* Total Medicines */}
            <div className="dashboard-card">

              <div className="card-icon">
                <FaPills />
              </div>

              <div className="card-content">

                <h3>Total Medicines</h3>

                <h2>
                  {totalMedicines}
                </h2>

              </div>

            </div>

            {/* Total Invoices */}
            <div className="dashboard-card">

              <div className="card-icon">
                <FaFileInvoice />
              </div>

              <div className="card-content">

                <h3>Total Invoices</h3>

                <h2>
                  {totalInvoices}
                </h2>

              </div>

            </div>

            {/* Total Sales */}
            <div className="dashboard-card">

              <div className="card-icon">
                <FaMoneyBillWave />
              </div>

              <div className="card-content">

                <h3>Total Sales</h3>

                <h2>
                  ₹ {Number(totalSales).toFixed(2)}
                </h2>

              </div>

            </div>

            {/* Low Stock */}
            <div className="dashboard-card low-stock-card">

              <div className="card-icon">
                <FaExclamationTriangle />
              </div>

              <div className="card-content">

                <h3>Low Stock Medicines</h3>

                <h2>
                  {lowStock}
                </h2>

              </div>

            </div>

            {/* Expired Medicines */}
            <div className="dashboard-card expired-card">

              <div className="card-icon">
                <FaCalendarTimes />
              </div>

              <div className="card-content">

                <h3>Expired Medicines</h3>

                <h2>
                  {expiredMedicines}
                </h2>

              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default Dashboard;