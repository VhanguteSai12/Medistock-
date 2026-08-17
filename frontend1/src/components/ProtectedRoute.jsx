import React from "react";
import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children }) {

    const user_id = localStorage.getItem("user_id");
    const location = useLocation();

    if (!user_id) {

        alert("You can't access this page before login. Please login first.");

        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    return children;
}

export default ProtectedRoute;