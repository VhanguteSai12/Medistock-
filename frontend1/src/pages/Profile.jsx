import React, { useEffect, useState } from "react";
import axios from "axios";

import "../css/Profile.css";
import Sidebar from "../components/Sidebar";

function Profile() {

    // ================= API URL =================
    const API_URL = import.meta.env.VITE_API_URL;

    // ================= USER ID =================
    const user_id = localStorage.getItem("user_id");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [editing, setEditing] = useState(false);

    // ================= LOAD PROFILE =================
    useEffect(() => {

        if (!user_id) {
            console.log("User ID not found");
            return;
        }

        loadProfile();

    }, []);

    const loadProfile = async () => {

        try {

            const res = await axios.get(
                `${API_URL}/profile/${user_id}`
            );

            setName(res.data.name);
            setEmail(res.data.email);

        } catch (error) {

            console.log("Profile Error:", error);

            alert("Unable To Load Profile");

        }

    };

    // ================= SAVE PROFILE =================
    const handleSave = async () => {

        // Name validation
        if (name.trim() === "") {

            alert("Please Enter Name");
            return;

        }

        // Email validation
        if (email.trim() === "") {

            alert("Please Enter Email");
            return;

        }

        // Gmail validation
        const emailPattern =
            /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

        if (!emailPattern.test(email.trim())) {

            alert("Enter Valid Gmail Address");
            return;

        }

        try {

            const res = await axios.put(

                `${API_URL}/profile/${user_id}`,

                {
                    name: name.trim(),
                    email: email.trim()
                }

            );

            alert(res.data.message);

            setEditing(false);

        } catch (error) {

            console.log("Update Profile Error:", error);

            if (error.response) {

                alert(
                    error.response.data.message ||
                    "Unable To Update Profile"
                );

            } else {

                alert("Server is not connected");

            }

        }

    };

    return (

        <>

            <Sidebar />

            <div className="profile-container">

                <div className="profile-card">

                    <h1>
                        Stock Manager Profile
                    </h1>


                    {/* ================= USER ID ================= */}

                    <div className="profile-field">

                        <label>User ID</label>

                        <input
                            type="text"
                            value={user_id || ""}
                            disabled
                        />

                    </div>


                    {/* ================= NAME ================= */}

                    <div className="profile-field">

                        <label>Name</label>

                        <input
                            type="text"
                            value={name}
                            disabled={!editing}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                        />

                    </div>


                    {/* ================= EMAIL ================= */}

                    <div className="profile-field">

                        <label>Email</label>

                        <input
                            type="email"
                            value={email}
                            disabled={!editing}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                        />

                    </div>


                    {/* ================= BUTTONS ================= */}

                    <div className="profile-buttons">

                        {!editing ? (

                            <button
                                className="edit-btn"
                                onClick={() =>
                                    setEditing(true)
                                }
                            >
                                Edit Profile
                            </button>

                        ) : (

                            <button
                                className="save-btn"
                                onClick={handleSave}
                            >
                                Save Changes
                            </button>

                        )}

                    </div>

                </div>

            </div>

        </>

    );

}

export default Profile;