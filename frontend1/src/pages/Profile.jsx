import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/Profile.css";
import Sidebar from "../components/Sidebar";


function Profile() {

    const user_id = localStorage.getItem("user_id");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const [editing, setEditing] = useState(false);

    useEffect(() => {

        loadProfile();

    }, []);

    const loadProfile = async () => {

        try {

            const res = await axios.get(
                `http://localhost:1000/profile/${user_id}`
            );

            setName(res.data.name);
            setEmail(res.data.email);

        }

        catch (error) {

            console.log(error);

            alert("Unable To Load Profile");

        }

    };

    const handleSave = async () => {

        if (name.trim() === "") {

            alert("Please Enter Name");
            return;

        }

        if (email.trim() === "") {

            alert("Please Enter Email");
            return;

        }

        const emailPattern =
            /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

        if (!emailPattern.test(email)) {

            alert("Enter Valid Gmail Address");
            return;

        }

        try {

            const res = await axios.put(
                `http://localhost:1000/profile/${user_id}`,
                {
                    name,
                    email
                }
            );

            alert(res.data.message);

            setEditing(false);

        }

        catch (error) {

            console.log(error);

            alert("Unable To Update Profile");

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

                    <div className="profile-field">

                        <label>User ID</label>

                        <input
                            type="text"
                            value={user_id}
                            disabled
                        />

                    </div>

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

                    <div className="profile-buttons">

                        {

                            !editing ?

                            (

                                <button
                                    className="edit-btn"
                                    onClick={() =>
                                        setEditing(true)
                                    }
                                >
                                    Edit Profile
                                </button>

                            )

                            :

                            (

                                <button
                                    className="save-btn"
                                    onClick={handleSave}
                                >
                                    Save Changes
                                </button>

                            )

                        }

                    

                    </div>

                </div>

            </div>

        </>

    );

}

export default Profile;