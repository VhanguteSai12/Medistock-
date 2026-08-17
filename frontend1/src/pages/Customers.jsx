import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/Customers.css";
import Select from "react-select";
import Sidebar from "../components/Sidebar";


function Customers() {

    // ===============================
    // Logged User
    // ===============================

    const user_id = localStorage.getItem("user_id");

    // ===============================
    // Customer Details
    // ===============================

    const [customerId, setCustomerId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [mobile, setMobile] = useState("");
    const [doctorName, setDoctorName] = useState("");
    const [visitDate, setVisitDate] = useState("");

    // ===============================
    // Medicine Details
    // ===============================

    const [medicines, setMedicines] = useState([]);
    const [medicineId, setMedicineId] = useState("");
    const [quantity, setQuantity] = useState("");

    // ===============================
    // Bill Details
    // ===============================

    const [billItems, setBillItems] = useState([]);
    const [grandTotal, setGrandTotal] = useState(0);

    const [loading, setLoading] = useState(false);

    // ===============================
    // Today's Date
    // ===============================

    const today = new Date().toISOString().split("T")[0];

    // ===============================
    // Load Medicines
    // ===============================

    useEffect(() => {

        if (!user_id)
            return;

        loadMedicines();


  
    }, []);

     const medicineOptions = medicines.map((medicine) => ({

    value: medicine.medicine_id,

    label: `${medicine.medicine_name} | ₹${medicine.price} | Stock : ${medicine.quantity}`

        }));

    // ===============================
    // Load Medicines
    // ===============================

    const loadMedicines = async () => {

        try {

            const res = await axios.get(

                `http://localhost:1000/medicines/${user_id}`

            );

            setMedicines(res.data);

        }

        catch (err) {

            console.log(err);

            alert("Unable To Load Medicines");

        }

    };

    // ===============================
    // Search Existing Customer
    // ===============================

    const searchCustomer = async () => {

        if (customerId.trim() === "")
            return;

        try {

            const res = await axios.get(

                `http://localhost:1000/customer/${user_id}/${customerId}`

            );

            if (res.data.exists) {

                setCustomerName(res.data.customer.customer_name);

                setMobile(res.data.customer.mobile);

                setDoctorName(res.data.customer.doctor_name);

            }

            else {

                setCustomerName("");
                setMobile("");
                setDoctorName("");

            }

        }

        catch (err) {

            console.log(err);

        }

    };

    // ===============================
    // Mobile Validation
    // ===============================

    const validateMobile = () => {

        const regex = /^[6-9][0-9]{9}$/;

        return regex.test(mobile);

    };

    // ===============================
    // Grand Total
    // ===============================

    const calculateGrandTotal = (items) => {

        let total = 0;

        items.forEach((item) => {

            total += Number(item.total_amount);

        });

        setGrandTotal(total);

    };

        // ===============================
    // Form Validation
    // ===============================

    const validateForm = () => {

        if (customerId.trim() === "") {

            alert("Please Enter Customer ID");
            return false;

        }

        if (customerName.trim() === "") {

            alert("Please Enter Customer Name");
            return false;

        }

        if (mobile.trim() === "") {

            alert("Please Enter Mobile Number");
            return false;

        }

        if (!validateMobile()) {

            alert("Mobile Number must be 10 digits and start with 6,7,8 or 9");
            return false;

        }

        if (doctorName.trim() === "") {

            alert("Please Enter Doctor Name");
            return false;

        }

        if (visitDate === "") {

            alert("Please Select Visit Date");
            return false;

        }

        if (medicineId === "") {

            alert("Please Select Medicine");
            return false;

        }

        if (quantity === "") {

            alert("Please Enter Quantity");
            return false;

        }

        if (Number(quantity) <= 0) {

            alert("Quantity Must Be Greater Than Zero");
            return false;

        }

        return true;

    };



    // ===============================
    // Add Medicine
    // ===============================

    const addMedicine = () => {

        if (!validateForm())
            return;

        const selectedMedicine = medicines.find(

            item => item.medicine_id == medicineId

        );

        if (!selectedMedicine) {

            alert("Medicine Not Found");
            return;

        }

        // Prevent Duplicate Medicine

        const alreadyAdded = billItems.find(

            item => item.medicine_id == medicineId

        );

        if (alreadyAdded) {

            alert("Medicine Already Added");
            return;

        }

        // Check Stock

        if (Number(quantity) > Number(selectedMedicine.quantity)) {

            alert("Insufficient Stock");

            return;

        }

        const total =

            Number(selectedMedicine.price) *
            Number(quantity);

        const newItem = {

            medicine_id: selectedMedicine.medicine_id,

            medicine_name: selectedMedicine.medicine_name,

            quantity: Number(quantity),

            price: Number(selectedMedicine.price),

            total_amount: total

        };

        const updatedBill = [

            ...billItems,
            newItem

        ];

        setBillItems(updatedBill);

        calculateGrandTotal(updatedBill);

        setMedicineId("");

        setQuantity("");

    };

        // ===============================
    // Generate Bill
    // ===============================

    const generateBill = async () => {

        if (billItems.length === 0) {

            alert("Please Add At Least One Medicine");
            return;

        }

        setLoading(true);

        try {

            const payload = {

                customer_id: customerId,
                customer_name: customerName,
                mobile: mobile,
                doctor_name: doctorName,
                visit_date: visitDate,
                user_id: user_id,

                items: billItems.map((item) => ({

                    medicine_id: item.medicine_id,
                    quantity: item.quantity

                }))

            };

            const res = await axios.post(

                "http://localhost:1000/customers/generate-bill",
                payload

            );

            if (res.data.success) {

                alert(
                    `Bill Generated Successfully\nInvoice No : ${res.data.invoice_no}`
                );

                newCustomer();

                loadMedicines();

            }

            else {

                alert(res.data.message);

            }

        }

        catch (err) {

            console.log(err);

            alert("Server Error");

        }

        finally {

            setLoading(false);

        }

    };



    // ===============================
    // Remove Medicine
    // ===============================

    const removeMedicine = (medicine_id) => {

        const updatedBill = billItems.filter(

            (item) => item.medicine_id !== medicine_id

        );

        setBillItems(updatedBill);

        calculateGrandTotal(updatedBill);

    };



    // ===============================
    // New Customer
    // ===============================

    const newCustomer = () => {

        setCustomerId("");
        setCustomerName("");
        setMobile("");
        setDoctorName("");
        setVisitDate("");

        setMedicineId("");
        setQuantity("");

        setBillItems([]);

        setGrandTotal(0);

    };

    return (
    <>
         
        <div className="customers-container">

            <Sidebar/>

            <h2 className="customers-page-title">Customer Billing</h2>


            {/* ========================= */}
            {/* Customer Details */}
            {/* ========================= */}

            <div className="customer-card">

                <h3>Customer Details</h3>

                <div className="form-grid">

                    <input
                        type="text"
                        placeholder="Customer ID"
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                        onBlur={searchCustomer}
                    />

                    <input
                        type="text"
                        placeholder="Customer Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                    />

                    <input
                        type="text"
                        placeholder="Mobile Number"
                        maxLength={10}
                        value={mobile}
                        onChange={(e) => {

                            const value = e.target.value.replace(/\D/g, "");

                            if (value.length <= 10)
                                setMobile(value);

                        }}
                    />

                    <input
                        type="text"
                        placeholder="Doctor Name"
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                    />

                    <input
                        type="date"
                        value={visitDate}
                        min={today}
                        onChange={(e) => setVisitDate(e.target.value)}
                    />

                </div>

            </div>

            {/* ========================= */}
            {/* Medicine Section */}
            {/* ========================= */}

            <div className="medicine-card">

                <h3>Add Medicine</h3>

                <div className="form-grid">

                    <Select

    options={medicineOptions}

    placeholder="Search Medicine..."

    isSearchable

    value={

        medicineOptions.find(

            option => option.value == medicineId

        ) || null

    }

    onChange={(selectedOption)=>{

        setMedicineId(selectedOption.value);

    }}

                />
                    <input

                        type="number"

                        placeholder="Quantity"

                        min="1"

                        value={quantity}

                        onChange={(e) =>
                            setQuantity(e.target.value)
                        }

                    />

                    <button

                        className="add-btn"

                        onClick={addMedicine}

                    >

                        Add Medicine

                    </button>

                </div>

            </div>

            {/* ========================= */}
            {/* Bill Table */}
            {/* ========================= */}

            <div className="bill-card">

                <h3>Current Bill</h3>

                <table>

                    <thead>

                        <tr>

                            <th>Medicine</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                            <th>Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            billItems.length === 0 ?

                                (

                                    <tr>

                                        <td
                                            colSpan="5"
                                            className="no-data"
                                        >

                                            No Medicines Added

                                        </td>

                                    </tr>

                                )

                                :

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

                                            ₹ {item.price}

                                        </td>

                                        <td>

                                            ₹ {item.total_amount}

                                        </td>

                                        <td>

                                            <button

                                                className="delete-btn"

                                                onClick={() =>
                                                    removeMedicine(item.medicine_id)
                                                }

                                            >

                                                Remove

                                            </button>

                                        </td>

                                    </tr>

                                ))

                        }

                    </tbody>

                </table>

            </div>

                        {/* ========================= */}
            {/* Grand Total */}
            {/* ========================= */}

            <div className="total-card">

                <h2>

                    Grand Total : ₹ {grandTotal}

                </h2>

            </div>

            <div className="button-group">

                <button

                    className="invoice-btn"

                    onClick={generateBill}

                    disabled={loading}

                >

                    {

                        loading

                            ?

                            "Generating..."

                            :

                            "Generate Bill"

                    }

                </button>

            </div>

        </div>

    </>

);

}

export default Customers;