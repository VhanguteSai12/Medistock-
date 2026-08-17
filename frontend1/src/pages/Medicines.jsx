import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/Medicines.css";
import Sidebar from "../components/Sidebar";


function Medicines() {

    // Logged In User
    const user_id = localStorage.getItem("user_id");
    console.log("Medicines page user_id:", user_id);

    // Form States
    const [medicine_name, setMedicineName] = useState("");
    const [company_name, setCompanyName] = useState("");
    const [batch_no, setBatchNo] = useState("");
    const [expiry_date, setExpiryDate] = useState("");
    const [quantity, setQuantity] = useState("");
    const [price, setPrice] = useState("");

    // Medicines List
    const [medicines, setMedicines] = useState([]);

    // Low Stock Medicines
    const [lowStock, setLowStock] = useState([]);

    //Update Medicines
    const [editingId, setEditingId] = useState(null);

    //Delete Medicines
   

    // Load Data
    useEffect(() => {

        getMedicines();
        getLowStock();


    }, []);


    // Get Medicines

    const getMedicines = async () => {

        try {

            const response = await axios.get(
                `http://localhost:1000/medicines/${user_id}`
            );

            setMedicines(response.data);

        }

        catch (error) {

            console.log(error);

        }

    };

    // Get Low Stock Medicines

    const getLowStock = async () => {

        try {

            const response = await axios.get(
                `http://localhost:1000/medicines/low-stock/${user_id}`
            );

            setLowStock(response.data);

        }

        catch (error) {

            console.log(error);

        }

    };
    // Add Medicine

const handleAddMedicine = async (e) => {

    e.preventDefault();

    try {

        // Step 1: Check whether medicine already exists
        const checkResponse = await axios.get(
            `http://localhost:1000/medicines/search/${user_id}/${medicine_name}`
        );

        if (checkResponse.data.found) {

            alert("Medicine already exists in stock.");

            // Fill the form with existing data
            const medicine = checkResponse.data.medicine;

            setMedicineName(medicine.medicine_name);
            setCompanyName(medicine.company_name);
            setBatchNo(medicine.batch_no);
            setExpiryDate(medicine.expiry_date.substring(0, 10));
            setQuantity(medicine.quantity);
            setPrice(medicine.price);

            return;
        }

        // Step 2: Add new medicine
        const response = await axios.post(
            "http://localhost:1000/medicines",
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

        setMedicineName("");
        setCompanyName("");
        setBatchNo("");
        setExpiryDate("");
        setQuantity("");
        setPrice("");

        getMedicines();
        getLowStock();

    }

    catch (error) {

        if (error.response) {

            alert(error.response.data.message);

        }

        else {

            alert("Server is not connected");

        }

    }

};
    // Search Medicine

    // const handleSearch = async () => {

    //     if (search.trim() === "") {

    //         getMedicines();
    //         return;

    //     }

    //     try {

    //         const response = await axios.get(
    //             `http://localhost:1000/medicines/search/${user_id}/${search}`
    //         );

    //         setMedicines(response.data);

    //     }

    //     catch (error) {

    //         console.log(error);

    //     }

    // };

    const editMedicine = (medicine) => {

    setEditingId(medicine.medicine_id);

    setMedicineName(medicine.medicine_name);
    setCompanyName(medicine.company_name);
    setBatchNo(medicine.batch_no);
    setExpiryDate(medicine.expiry_date.substring(0,10));
    setQuantity(medicine.quantity);
    setPrice(medicine.price);

};

const handleUpdate = async () => {

    try {

        const response = await axios.put(
            `http://localhost:1000/medicines/${user_id}/${editingId}`,
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

        setMedicineName("");
        setCompanyName("");
        setBatchNo("");
        setExpiryDate("");
        setQuantity("");
        setPrice("");

        getMedicines();
        getLowStock();

    }
    catch(error){

        if(error.response){
            alert(error.response.data.message);
        }
        else{
            alert("Server not connected");
        }

    }

};

const handleDelete = async (medicine_id) => {

    const confirmDelete = window.confirm(
        "Are you sure you want to delete this medicine?"
    );

    if (!confirmDelete) return;

    try {

        const response = await axios.delete(
            `http://localhost:1000/medicines/${user_id}/${medicine_id}`
        );

        alert(response.data.message);

        // Refresh medicines list
        getMedicines();

        // Refresh low stock list
        getLowStock();

    } catch (error) {

        if (error.response) {
            alert(error.response.data.message);
        } else {
            alert("Server is not connected");
        }

    }

};

    return (
          <>       

            <div className="medicine-container">

                      <Sidebar />


                {/* Heading */}

                <div className="heading">

                    <h1>Medicines Management</h1>

                    <p>Manage your pharmacy medicines efficiently.</p>

                </div>

                
                {/* Add Medicine Form */}

                <form
                    className="medicine-form"
                    onSubmit={handleAddMedicine}
                >

                    <input
                        type="text"
                        placeholder="Medicine Name"
                        value={medicine_name}
                        onChange={(e) => setMedicineName(e.target.value)}
                        required
                    />

                    <input
                        type="text"
                        placeholder="Company Name"
                        value={company_name}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                    />

                    <input
                        type="text"
                        placeholder="Batch No"
                        value={batch_no}
                        onChange={(e) => setBatchNo(e.target.value)}
                        required
                    />

                    <input
                        type="date"
                        value={expiry_date}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        required
                    />

                    <input
                        type="number"
                        placeholder="Quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                    />

                    <input
                        type="number"
                        placeholder="Price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                    />

                    <button type="submit">
                        Add Medicine
                    </button>

                    {
            editingId &&

              <button
              type="button"
                onClick={handleUpdate}
               >
            Update Medicine
            </button>

           }

                </form>


                {/* Medicines Table */}

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

                            {

                                medicines.length > 0 ?

                                    medicines.map((medicine) => (

                                        <tr key={medicine.medicine_id}>

                                            <td>{medicine.medicine_name}</td>

                                            <td>{medicine.company_name}</td>

                                            <td>{medicine.batch_no}</td>

                                            <td>{medicine.expiry_date?.substring(0,10)}</td>

                                            <td>{medicine.quantity}</td>

                                            <td>₹ {medicine.price}</td>

                                            <td>

                                                <button
                                                    type="button"
                                                    className="edit-btn"
                                                    onClick={() => editMedicine(medicine)}
                                                >
                                                    Edit
                                                </button>

                                                    <button
                                            type="button"
                                             className="delete-btn"
                                             onClick={() => handleDelete(medicine.medicine_id)}
                                                >
                                            Delete
                                               </button>


                                            </td>

                                        </tr>

                                    ))

                                    :

                                    <tr>

                                        <td colSpan="6">

                                            No Medicines Found

                                        </td>

                                    </tr>

                            }

                        </tbody>

                    </table>

                </div>


                {/* Low Stock Medicines */}

                <div className="low-stock">

                    <h2>Low Stock Medicines</h2>

                    <table>

                        <thead>

                            <tr>

                                <th>Medicine Name</th>
                                <th>Quantity</th>

                            </tr>

                        </thead>

                        <tbody>

                            {

                                lowStock.length > 0 ?

                                    lowStock.map((medicine) => (

                                        <tr key={medicine.medicine_id}>

                                            <td>{medicine.medicine_name}</td>

                                            <td>{medicine.quantity}</td>

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

            <footer>
               <p> © 2026 MediStock Inventory System
               </p>
               

            </footer>

        </>

    );

}

export default Medicines;