import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/Customers.css";
import Select from "react-select";
import Sidebar from "../components/Sidebar";

function Customers() {

    // ================= API URL =================
    const API_URL = import.meta.env.VITE_API_URL;

    // ================= LOGGED USER =================
    const user_id = localStorage.getItem("user_id");

    // ================= CUSTOMER DETAILS =================
    const [customerId, setCustomerId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [mobile, setMobile] = useState("");
    const [doctorName, setDoctorName] = useState("");
    const [visitDate, setVisitDate] = useState("");

    // ================= EXISTING CUSTOMER LOCK =================
    // true = customer ID found in DB → ID & Name are locked (readonly)
    const [isExistingCustomer, setIsExistingCustomer] = useState(false);

    // ================= MEDICINE DETAILS =================
    const [medicines, setMedicines] = useState([]);
    const [medicineId, setMedicineId] = useState("");
    const [quantity, setQuantity] = useState("");

    // ================= BILL DETAILS =================
    const [billItems, setBillItems] = useState([]);
    const [grandTotal, setGrandTotal] = useState(0);

    const [loading, setLoading] = useState(false);
    const [medicineLoading, setMedicineLoading] = useState(false);

    // ================= TODAY DATE =================
    const today = new Date().toISOString().split("T")[0];

    // =====================================================
    // LOAD MEDICINES
    // =====================================================
    useEffect(() => {

        if (!user_id) {
            alert("User not logged in");
            return;
        }

        if (!API_URL) {
            alert("API URL is not configured");
            console.error("VITE_API_URL is missing");
            return;
        }

        loadMedicines();

    }, []);

    // =====================================================
    // MEDICINE OPTIONS
    // =====================================================
    const medicineOptions = medicines.map((medicine) => ({
        value: medicine.medicine_id,
        label: `${medicine.medicine_name} | ₹${medicine.price} | Stock: ${medicine.quantity}`
    }));

    // =====================================================
    // LOAD MEDICINES
    // =====================================================
    const loadMedicines = async () => {

        setMedicineLoading(true);

        try {

            const response = await axios.get(
                `${API_URL}/medicines/${user_id}`
            );

            if (Array.isArray(response.data)) {

                setMedicines(response.data);

            } else {

                console.error("Invalid medicines response:", response.data);

                setMedicines([]);

                alert("Unable to load medicines");

            }

        } catch (error) {

            console.error(
                "Load Medicines Error:",
                error.response?.data || error.message
            );

            setMedicines([]);

            alert(
                error.response?.data?.message ||
                "Unable to load medicines"
            );

        } finally {

            setMedicineLoading(false);

        }
    };

    // =====================================================
    // SEARCH EXISTING CUSTOMER
    // =====================================================
    const searchCustomer = async () => {

        if (!customerId.trim()) {
            return;
        }

        try {

            const response = await axios.get(
                `${API_URL}/customer/${user_id}/${encodeURIComponent(customerId.trim())}`
            );

            console.log("Customer Search Response:", response.data);

            if (response.data?.exists && response.data?.customer) {

                const customer = response.data.customer;

                // Lock Customer ID & Name — they match DB record
                setCustomerName(customer.customer_name || "");
                setIsExistingCustomer(true);

                // Pre-fill other fields (user can still edit these)
                setMobile(customer.mobile || "");
                setDoctorName(customer.doctor_name || "");

                if (customer.visit_date) {
                    const date = String(customer.visit_date).substring(0, 10);
                    setVisitDate(date);
                }

            } else {

                // New customer — unlock all fields
                setIsExistingCustomer(false);
                setCustomerName("");
                setMobile("");
                setDoctorName("");

            }

        } catch (error) {

            console.error(
                "Customer Search Error:",
                error.response?.data || error.message
            );

            setIsExistingCustomer(false);
            setCustomerName("");
            setMobile("");
            setDoctorName("");

        }
    };

    // =====================================================
    // MOBILE VALIDATION
    // =====================================================
    const validateMobile = () => {

        const regex = /^[6-9][0-9]{9}$/;

        return regex.test(mobile);

    };

    // =====================================================
    // CALCULATE GRAND TOTAL
    // =====================================================
    const calculateGrandTotal = (items) => {

        const total = items.reduce(
            (sum, item) => {
                return sum + Number(item.total_amount || 0);
            },
            0
        );

        setGrandTotal(total);

    };

    // =====================================================
    // FORM VALIDATION
    // =====================================================
    const validateForm = () => {

        if (!customerId.trim()) {
            alert("Please Enter Customer ID");
            return false;
        }

        if (!customerName.trim()) {
            alert("Please Enter Customer Name");
            return false;
        }

        if (!mobile.trim()) {
            alert("Please Enter Mobile Number");
            return false;
        }

        if (!validateMobile()) {
            alert(
                "Mobile Number must be 10 digits and start with 6, 7, 8 or 9"
            );
            return false;
        }

        if (!doctorName.trim()) {
            alert("Please Enter Doctor Name");
            return false;
        }

        if (!visitDate) {
            alert("Please Select Visit Date");
            return false;
        }

        if (medicineId === "") {
            alert("Please Select Medicine");
            return false;
        }

        if (!quantity) {
            alert("Please Enter Quantity");
            return false;
        }

        const qty = Number(quantity);

        if (!Number.isInteger(qty) || qty <= 0) {
            alert("Quantity must be a positive whole number");
            return false;
        }

        return true;
    };

    // =====================================================
    // ADD MEDICINE
    // =====================================================
    const addMedicine = () => {

        if (!validateForm()) {
            return;
        }

        const selectedMedicine = medicines.find(
            (medicine) =>
                String(medicine.medicine_id) === String(medicineId)
        );

        if (!selectedMedicine) {
            alert("Medicine Not Found");
            return;
        }

        const qty = Number(quantity);
        const stock = Number(selectedMedicine.quantity);

        // Check stock
        if (qty > stock) {
            alert(
                `Insufficient Stock\nAvailable Stock: ${stock}`
            );
            return;
        }

        // Prevent duplicate medicine
        const alreadyAdded = billItems.some(
            (item) =>
                String(item.medicine_id) === String(medicineId)
        );

        if (alreadyAdded) {
            alert("Medicine Already Added");
            return;
        }

        const price = Number(selectedMedicine.price);

        const total = price * qty;

        const newItem = {
            medicine_id: selectedMedicine.medicine_id,
            medicine_name: selectedMedicine.medicine_name,
            quantity: qty,
            price: price,
            total_amount: total
        };

        const updatedBill = [
            ...billItems,
            newItem
        ];

        setBillItems(updatedBill);

        calculateGrandTotal(updatedBill);

        // Clear medicine inputs
        setMedicineId("");
        setQuantity("");

    };

    // =====================================================
    // GENERATE BILL
    // =====================================================
    const generateBill = async () => {

        // Check login
        if (!user_id) {
            alert("User session expired. Please login again.");
            return;
        }

        // Check bill
        if (billItems.length === 0) {
            alert("Please Add At Least One Medicine");
            return;
        }

        // Validate customer information
        if (!customerId.trim()) {
            alert("Please Enter Customer ID");
            return;
        }

        if (!customerName.trim()) {
            alert("Please Enter Customer Name");
            return;
        }

        if (!validateMobile()) {
            alert("Please Enter a Valid Mobile Number");
            return;
        }

        if (!doctorName.trim()) {
            alert("Please Enter Doctor Name");
            return;
        }

        if (!visitDate) {
            alert("Please Select Visit Date");
            return;
        }

        setLoading(true);

        try {

            // =================================================
            // PAYLOAD SENT TO BACKEND
            // =================================================
            const payload = {

                customer_id: customerId.trim(),

                customer_name: customerName.trim(),

                mobile: mobile.trim(),

                doctor_name: doctorName.trim(),

                visit_date: visitDate,

                user_id: user_id,

                items: billItems.map((item) => ({
                    medicine_id: item.medicine_id,
                    quantity: Number(item.quantity)
                }))

            };

            console.log(
                "Generate Bill Payload:",
                payload
            );

            const response = await axios.post(
                `${API_URL}/customers/generate-bill`,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    timeout: 30000
                }
            );

            console.log(
                "Generate Bill Response:",
                response.data
            );

            // =================================================
            // SUCCESS
            // =================================================
            if (response.data?.success) {

                alert(
                    `Bill Generated Successfully\n\nInvoice No: ${response.data.invoice_no}`
                );

                // Clear form
                newCustomer();

                // Reload latest stock
                await loadMedicines();

            } else {

                alert(
                    response.data?.message ||
                    "Unable to generate bill"
                );

            }

        } catch (error) {

            console.error(
                "Generate Bill Error:",
                error.response?.data || error.message
            );

            if (error.response?.data?.message) {
                alert(error.response.data.message);
            } else if (error.response?.data) {
                alert("Bill generation failed. Please try again.");
            } else if (error.code === "ECONNABORTED") {
                alert("Request timed out. Please check your server connection.");
            } else {
                alert("Unable to connect to the server. Is the backend running?");
            }

        } finally {

            setLoading(false);

        }
    };

    // =====================================================
    // REMOVE MEDICINE
    // =====================================================
    const removeMedicine = (medicine_id) => {

        const updatedBill = billItems.filter(
            (item) =>
                String(item.medicine_id) !== String(medicine_id)
        );

        setBillItems(updatedBill);

        calculateGrandTotal(updatedBill);

    };

    // =====================================================
    // NEW CUSTOMER
    // =====================================================
    const newCustomer = () => {

        setCustomerId("");
        setCustomerName("");
        setMobile("");
        setDoctorName("");
        setVisitDate("");

        setIsExistingCustomer(false);

        setMedicineId("");
        setQuantity("");

        setBillItems([]);

        setGrandTotal(0);

    };

    // =====================================================
    // RENDER
    // =====================================================
    return (
        <>

            <div className="customers-container">

                <Sidebar />

                <h2 className="customers-page-title">
                    Customer Billing
                </h2>

                {/* ==========================================
                    CUSTOMER DETAILS
                ========================================== */}

                <div className="customer-card">

                    <h3>
                        Customer Details
                    </h3>

                    <div className="form-grid">

                        {/* ---- CUSTOMER ID (locked if existing) ---- */}
                        <div className="input-with-badge">
                            <input
                                type="text"
                                placeholder="Customer ID"
                                value={customerId}
                                readOnly={isExistingCustomer}
                                className={isExistingCustomer ? "input-locked" : ""}
                                onChange={(e) => {
                                    setCustomerId(e.target.value);
                                    // Reset lock when user clears/changes the ID
                                    setIsExistingCustomer(false);
                                    setCustomerName("");
                                }}
                                onBlur={searchCustomer}
                            />
                            {isExistingCustomer && (
                                <span className="locked-badge">🔒 Existing</span>
                            )}
                        </div>

                        {/* ---- CUSTOMER NAME (locked if existing) ---- */}
                        <div className="input-with-badge">
                            <input
                                type="text"
                                placeholder="Customer Name"
                                value={customerName}
                                readOnly={isExistingCustomer}
                                className={isExistingCustomer ? "input-locked" : ""}
                                onChange={(e) =>
                                    setCustomerName(e.target.value)
                                }
                            />
                            {isExistingCustomer && (
                                <span className="locked-badge">🔒 Locked</span>
                            )}
                        </div>

                        {/* ---- MOBILE (always editable) ---- */}
                        <input
                            type="text"
                            placeholder="Mobile Number"
                            maxLength={10}
                            value={mobile}
                            onChange={(e) => {
                                const value =
                                    e.target.value.replace(/\D/g, "");
                                if (value.length <= 10) {
                                    setMobile(value);
                                }
                            }}
                        />

                        {/* ---- DOCTOR NAME (always editable) ---- */}
                        <input
                            type="text"
                            placeholder="Doctor Name"
                            value={doctorName}
                            onChange={(e) =>
                                setDoctorName(e.target.value)
                            }
                        />

                        {/* ---- VISIT DATE (always editable) ---- */}
                        <input
                            type="date"
                            value={visitDate}
                            min={today}
                            onChange={(e) =>
                                setVisitDate(e.target.value)
                            }
                        />

                    </div>

                </div>

                {/* ==========================================
                    MEDICINE SECTION
                ========================================== */}

                <div className="medicine-card">

                    <h3>
                        Add Medicine
                    </h3>

                    <div className="form-grid">

                        <Select
                            options={medicineOptions}
                            placeholder={
                                medicineLoading
                                    ? "Loading Medicines..."
                                    : "Search Medicine..."
                            }
                            isSearchable
                            isClearable
                            isDisabled={medicineLoading}
                            value={
                                medicineOptions.find(
                                    (option) =>
                                        String(option.value) ===
                                        String(medicineId)
                                ) || null
                            }
                            onChange={(selectedOption) => {

                                if (selectedOption) {

                                    setMedicineId(
                                        selectedOption.value
                                    );

                                } else {

                                    setMedicineId("");

                                }

                            }}
                        />

                        <input
                            type="number"
                            placeholder="Quantity"
                            min="1"
                            step="1"
                            value={quantity}
                            onChange={(e) => {

                                const value =
                                    e.target.value;

                                if (
                                    value === "" ||
                                    /^[0-9]+$/.test(value)
                                ) {
                                    setQuantity(value);
                                }

                            }}
                        />

                        <button
                            type="button"
                            className="add-btn"
                            onClick={addMedicine}
                            disabled={medicineLoading}
                        >
                            Add Medicine
                        </button>

                    </div>

                </div>

                {/* ==========================================
                    CURRENT BILL
                ========================================== */}

                <div className="bill-card">

                    <h3>
                        Current Bill
                    </h3>

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Medicine
                                </th>

                                <th>
                                    Quantity
                                </th>

                                <th>
                                    Price
                                </th>

                                <th>
                                    Total
                                </th>

                                <th>
                                    Action
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {billItems.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="5"
                                        className="no-data"
                                    >
                                        No Medicines Added
                                    </td>

                                </tr>

                            ) : (

                                billItems.map((item) => (

                                    <tr
                                        key={item.medicine_id}
                                    >

                                        <td>
                                            {item.medicine_name}
                                        </td>

                                        <td>
                                            {item.quantity}
                                        </td>

                                        <td>
                                            ₹ {Number(item.price).toFixed(2)}
                                        </td>

                                        <td>
                                            ₹ {Number(item.total_amount).toFixed(2)}
                                        </td>

                                        <td>

                                            <button
                                                type="button"
                                                className="delete-btn"
                                                onClick={() =>
                                                    removeMedicine(
                                                        item.medicine_id
                                                    )
                                                }
                                            >
                                                Remove
                                            </button>

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

                {/* ==========================================
                    GRAND TOTAL
                ========================================== */}

                <div className="total-card">

                    <h2>
                        Grand Total : ₹ {grandTotal.toFixed(2)}
                    </h2>

                </div>

                {/* ==========================================
                    GENERATE BILL
                ========================================== */}

                <div className="button-group">

                    <button
                        type="button"
                        className="invoice-btn"
                        onClick={generateBill}
                        disabled={
                            loading ||
                            billItems.length === 0
                        }
                    >

                        {loading
                            ? "Generating..."
                            : "Generate Bill"}

                    </button>

                </div>

            </div>

        </>
    );
}

export default Customers;