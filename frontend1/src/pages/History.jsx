import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/History.css";
import Sidebar from "../components/Sidebar";

function History() {

    // ==========================
    // API URL
    // ==========================
    const API_URL = import.meta.env.VITE_API_URL;

    const user_id = localStorage.getItem("user_id");

    // ==========================
    // States
    // ==========================

    const [history, setHistory] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const [totalBills, setTotalBills] = useState(0);
    const [todayBills, setTodayBills] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);

    // ==========================
    // Load History
    // ==========================

    useEffect(() => {

        if (!user_id) {
            console.log("User ID not found");
            setLoading(false);
            return;
        }

        loadHistory();

    }, []);

    // ==========================
    // Calculate Cards
    // ==========================

    const calculateCards = (data) => {

        // Total Bills
        setTotalBills(data.length);

        // Today's date
        const today = new Date()
            .toISOString()
            .split("T")[0];

        // Today's Bills
        const todayCount = data.filter((bill) => {

            return bill.visit_date?.substring(0, 10) === today;

        }).length;

        setTodayBills(todayCount);

        // Total Revenue
        const revenue = data.reduce((total, bill) => {

            return total + Number(bill.grand_total || 0);

        }, 0);

        setTotalRevenue(revenue);

    };

    // ==========================
    // Get History
    // ==========================

    const loadHistory = async () => {

        setLoading(true);

        try {

            const res = await axios.get(
                `${API_URL}/customers/history/${user_id}`
            );

            setHistory(res.data);

            calculateCards(res.data);

        }

        catch (err) {

            console.log("History Error:", err);

            alert("Unable To Load History");

        }

        finally {

            setLoading(false);

        }

    };

    // ==========================
    // Live Search
    // ==========================

    const searchHistory = async (keyword) => {

        setSearch(keyword);

        try {

            if (keyword.trim() === "") {

                loadHistory();

                return;

            }

            const res = await axios.get(

                `${API_URL}/customers/history/search/${user_id}/${encodeURIComponent(keyword)}`

            );

            setHistory(res.data);

            calculateCards(res.data);

        }

        catch (err) {

            console.log("Search History Error:", err);

        }

    };

    return (

        <>

            <Sidebar />

            <div className="history-container">

                <h2 className="history-title">

                    Customer Billing History

                </h2>

                {/* ========================= */}
                {/* Search */}
                {/* ========================= */}

                <div className="search-box">

                    <input

                        type="text"

                        placeholder="Search by Invoice No / Customer ID / Customer Name / Mobile"

                        value={search}

                        onChange={(e) =>
                            searchHistory(e.target.value)
                        }

                    />

                </div>

                {/* ========================= */}
                {/* Table */}
                {/* ========================= */}

                <div className="history-table">

                    <table>

                        <thead>

                            <tr>

                                <th>Invoice No</th>

                                <th>Customer ID</th>

                                <th>Customer Name</th>

                                <th>Mobile</th>

                                <th>Doctor</th>

                                <th>Visit Date</th>

                                <th>Grand Total</th>

                                <th>Status</th>

                            </tr>

                        </thead>

                        <tbody>

                            {

                                loading ?

                                (

                                    <tr>

                                        <td colSpan="8">

                                            Loading...

                                        </td>

                                    </tr>

                                )

                                :

                                history.length === 0 ?

                                (

                                    <tr>

                                        <td colSpan="8">

                                            No History Found

                                        </td>

                                    </tr>

                                )

                                :

                                history.map((bill) => (

                                    <tr
                                        key={bill.invoice_no}
                                    >

                                        <td>
                                            {bill.invoice_no}
                                        </td>

                                        <td>
                                            {bill.customer_id}
                                        </td>

                                        <td>
                                            {bill.customer_name}
                                        </td>

                                        <td>
                                            {bill.mobile}
                                        </td>

                                        <td>
                                            {bill.doctor_name}
                                        </td>

                                        <td>
                                            {bill.visit_date}
                                        </td>

                                        <td>
                                            ₹ {Number(
                                                bill.grand_total || 0
                                            ).toFixed(2)}
                                        </td>

                                        <td>

                                            <span

                                                className={

                                                    bill.bill_status === "OPEN"

                                                        ? "status-open"

                                                        : "status-paid"

                                                }

                                            >

                                                {bill.bill_status}

                                            </span>

                                        </td>

                                    </tr>

                                ))

                            }

                        </tbody>

                    </table>

                </div>

            </div>

        </>

    );

}

export default History;