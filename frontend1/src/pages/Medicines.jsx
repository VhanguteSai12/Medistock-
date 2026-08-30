import React, { useState, useEffect } from "react";
import axios from "axios";

import "./../css/Medicines.css";
import Sidebar from "../components/Sidebar";

function Medicines() {

    // ================= API URL =================
    const API_URL = import.meta.env.VITE_API_URL;

    // ================= LOGGED IN USER =================
    const user_id = localStorage.getItem("user_id");

    console.log("Medicines page user_id:", user_id);

    // ================= FORM STATES =================
    const [medicine_name, setMedicineName] = useState("");
    const [company_name, setCompanyName] = useState("");
    const [batch_no, setBatchNo] = useState("");
    const [expiry_date, setExpiryDate] = useState("");
    const [quantity, setQuantity] = useState("");
    const [price, setPrice] = useState("");

    // ================= MEDICINES LIST =================
    const [medicines, setMedicines] = useState([]);

    // ================= LOW STOCK MEDICINES =================
    const [lowStock, setLowStock] = useState([]);

    // ================= UPDATE MEDICINE =================
    const [editingId, setEditingId] = useState(null);


    // ================= LOAD DATA =================
    useEffect(() => {

        getMedicines();
        getLowStock();

    }, []);


    // ================= GET MEDICINES =================
    const getMedicines = async () => {

        try {

            const response = await axios.get(
                `${API_URL}/medicines/${user_id}`
            );

            setMedicines(response.data);

        } catch (error) {

            console.log("Get Medicines Error:", error);

        }

    };


    // ================= GET LOW STOCK =================
    const getLowStock = async () => {

        try {

            const response = await axios.get(
                `${API_URL}/medicines/low-stock/${user_id}`
            );

            setLowStock(response.data);

        } catch (error) {

            console.log("Low Stock Error:", error);

        }

    };


    // ================= ADD MEDICINE =================
    const handleAddMedicine = async (e) => {

        e.preventDefault();

        try {

            // Step 1: Check whether medicine already exists
            const checkResponse = await axios.get(
                `${API_URL}/medicines/search/${user_id}/${medicine_name}`
            );

            if (checkResponse.data.found) {

                alert("Medicine already exists in stock.");

                // Fill form with existing data
                const medicine = checkResponse.data.medicine;

                setMedicineName(medicine.medicine_name);
                setCompanyName(medicine.company_name);
                setBatchNo(medicine.batch_no);

                setExpiryDate(
                    medicine.expiry_date.substring(0, 10)
                );

                setQuantity(medicine.quantity);
                setPrice(medicine.price);

                return;
            }


            // Step 2: Add new medicine
            const response = await axios.post(
                `${API_URL}/medicines`,
                {
                    user_id,
                    medicine_name,
                    company_name,
                    batch_no,
                    expiry_date,
                    quantity,
                    price
                }
            );

            alert(response.data.message);

            // Clear form
            setMedicineName("");
            setCompanyName("");
            setBatchNo("");
            setExpiryDate("");
            setQuantity("");
            setPrice("");

            // Refresh data
            getMedicines();
            getLowStock();

        } catch (error) {

            if (error.response) {

                alert(
                    error.response.data.message ||
                    "Failed to add medicine"
                );

            } else {

                alert("Server is not connected");

            }

        }

    };


    // ================= EDIT MEDICINE =================
    const editMedicine = (medicine) => {

        setEditingId(medicine.medicine_id);

        setMedicineName(medicine.medicine_name);
        setCompanyName(medicine.company_name);
        setBatchNo(medicine.batch_no);

        setExpiryDate(
            medicine.expiry_date.substring(0, 10)
        );

        setQuantity(medicine.quantity);
        setPrice(medicine.price);

    };


    // ================= UPDATE MEDICINE =================
    const handleUpdate = async () => {

        try {

            const response = await axios.put(
                `${API_URL}/medicines/${user_id}/${editingId}`,
                {
                    medicine_name,
                    company_name,
                    batch_no,
                    expiry_date,
                    quantity,
                    price
                }
            );

            alert(response.data.message);

            setEditingId(null);

            // Clear form
            setMedicineName("");
            setCompanyName("");
            setBatchNo("");
            setExpiryDate("");
            setQuantity("");
            setPrice("");

            // Refresh data
            getMedicines();
            getLowStock();

        } catch (error) {

            if (error.response) {

                alert(
                    error.response.data.message ||
                    "Failed to update medicine"
                );

            } else {

                alert("Server not connected");

            }

        }

    };


    // ================= DELETE MEDICINE =================
    const handleDelete = async (medicine_id) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this medicine?"
        );

        if (!confirmDelete) return;

        try {

            const response = await axios.delete(
                `${API_URL}/medicines/${user_id}/${medicine_id}`
            );

            alert(response.data.message);

            // Refresh medicines
            getMedicines();

            // Refresh low stock
            getLowStock();

        } catch (error) {

            if (error.response) {

                alert(
                    error.response.data.message ||
                    "Failed to delete medicine"
                );

            } else {

                alert("Server is not connected");

            }

        }

    };


    // ================= UI =================
    return (
        <div className="dashboard-layout">
            <Sidebar />

            <div className="medicine-container">

                {/* ================= HEADING ================= */}
                <div className="heading">

                    <h1>Medicines Management</h1>

                    <p>
                        Manage your pharmacy medicines efficiently.
                    </p>

                </div>


                {/* ================= ADD MEDICINE FORM ================= */}
                <form
                    className="medicine-form"
                    onSubmit={handleAddMedicine}
                >

                    <input
                        type="text"
                        placeholder="Medicine Name"
                        value={medicine_name}
                        onChange={(e) =>
                            setMedicineName(e.target.value)
                        }
                        required
                    />

                    <input
                        type="text"
                        placeholder="Company Name"
                        value={company_name}
                        onChange={(e) =>
                            setCompanyName(e.target.value)
                        }
                        required
                    />

                    <input
                        type="text"
                        placeholder="Batch No"
                        value={batch_no}
                        onChange={(e) =>
                            setBatchNo(e.target.value)
                        }
                        required
                    />

                    <input
                        type="date"
                        value={expiry_date}
                        onChange={(e) =>
                            setExpiryDate(e.target.value)
                        }
                        required
                    />

                    <input
                        type="number"
                        placeholder="Quantity"
                        value={quantity}
                        onChange={(e) =>
                            setQuantity(e.target.value)
                        }
                        required
                    />

                    <input
                        type="number"
                        placeholder="Price"
                        value={price}
                        onChange={(e) =>
                            setPrice(e.target.value)
                        }
                        required
                    />

                    <button type="submit">
                        Add Medicine
                    </button>


                    {/* ================= UPDATE BUTTON ================= */}
                    {editingId && (

                        <button
                            type="button"
                            onClick={handleUpdate}
                        >
                            Update Medicine
                        </button>

                    )}

                </form>


                {/* ================= MEDICINES TABLE ================= */}
                <div className="medicine-table">

                    <table>

                        <thead>

                            <tr>

                                <th>Medicine Name</th>
                                <th>Company Name</th>
                                <th>Batch No</th>
                                <th>Expiry Date</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Action</th>

                            </tr>

                        </thead>


                        <tbody>

                            {medicines.length > 0 ?

                                medicines.map((medicine) => (

                                    <tr
                                        key={medicine.medicine_id}
                                    >

                                        <td>
                                            {medicine.medicine_name}
                                        </td>

                                        <td>
                                            {medicine.company_name}
                                        </td>

                                        <td>
                                            {medicine.batch_no}
                                        </td>

                                        <td>
                                            {medicine.expiry_date?.substring(0, 10)}
                                        </td>

                                        <td>
                                            {medicine.quantity}
                                        </td>

                                        <td>
                                            ₹ {medicine.price}
                                        </td>

                                        <td>

                                            <button
                                                type="button"
                                                className="edit-btn"
                                                onClick={() =>
                                                    editMedicine(medicine)
                                                }
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                className="delete-btn"
                                                onClick={() =>
                                                    handleDelete(
                                                        medicine.medicine_id
                                                    )
                                                }
                                            >
                                                Delete
                                            </button>

                                        </td>

                                    </tr>

                                ))

                                :

                                <tr>

                                    <td colSpan="7">
                                        No Medicines Found
                                    </td>

                                </tr>

                            }

                        </tbody>

                    </table>

                </div>


                {/* ================= LOW STOCK ================= */}
                <div className="low-stock">

                    <h2>
                        Low Stock Medicines
                    </h2>

                    <table>

                        <thead>

                            <tr>

                                <th>Medicine Name</th>
                                <th>Quantity</th>

                            </tr>

                        </thead>

                        <tbody>

                            {lowStock.length > 0 ?

                                lowStock.map((medicine) => (

                                    <tr
                                        key={medicine.medicine_id}
                                    >

                                        <td>
                                            {medicine.medicine_name}
                                        </td>

                                        <td>
                                            {medicine.quantity}
                                        </td>

                                    </tr>

                                ))

                                :

                                <tr>

                                    <td colSpan="2">
                                        No Low Stock Medicines
                                    </td>

                                </tr>

                            }

                        </tbody>

                    </table>

                </div>

            </div>


            {/* ================= FOOTER ================= */}
            <footer>
                <p>
                    &copy; 2026 MediStock Inventory System
                </p>
            </footer>

        </div>
    );
}

export default Medicines;