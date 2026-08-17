import React, { useState } from "react";
import axios from "axios";
import "../css/Register.css";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

function Register() {

  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [confirmPassword,setConfirmPassword] = useState("");

  const [showPassword,setShowPassword] = useState(false);
  const [showConfirmPassword,setShowConfirmPassword] = useState(false);


  const validateEmail = (email) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return gmailRegex.test(email);
  };



  // Email click validation
  const handleEmailClick = () => {

    if(name.trim()===""){

      alert(" Please enter your full name first");

    }

  };



  // Password click validation
  const handlePasswordClick = () => {

    if(name.trim()===""){

      alert("Please enter your full name first");
      return;

    }


    if(!validateEmail(email)){

      alert("Please enter a valid Gmail address first");

    }

  };




  const handleRegister = async(e)=>{

    e.preventDefault();



    if(name.trim()===""){

      alert(" Please enter your full name");
      return;

    }



    if(!validateEmail(email)){

      alert(" Email must be in format example@gmail.com");
      return;

    }



    if(password.length < 8){

      alert(" Password must contain minimum 8 characters");
      return;

    }



    if(password !== confirmPassword){

      alert(" Password and Confirm Password do not match");
      return;

    }




    try{


      const response = await axios.post(

        "http://localhost:1000/register",

        {

          name,
          email,
          password

        }

      );


      alert( (response.data.message || "Registration Successful"));


      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");


    }



    catch(error){


      if(error.response){

        alert(+ error.response.data.message);

      }

      else{

        alert("Server is not connected");

      }


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


<div className="input-group">

<label>Full Name</label>

<input

type="text"

placeholder="Enter your name"

value={name}

onChange={(e)=>setName(e.target.value)}

/>

</div>




<div className="input-group">

<label>Email</label>

<input

type="email"

placeholder="example@gmail.com"

value={email}

autoComplete="new-email"

onClick={handleEmailClick}

onChange={(e)=>setEmail(e.target.value)}

/>

</div>





<div className="input-group">

<label>Password</label>


<div className="password-box">


<input

type={showPassword ? "text":"password"}

placeholder="Create password"

value={password}

autoComplete="new-password"

onClick={handlePasswordClick}

onChange={(e)=>setPassword(e.target.value)}

/>




</div>


</div>





<div className="input-group">

<label>Confirm Password</label>


<div className="password-box">


<input

type={showConfirmPassword ? "text":"password"}

placeholder="Confirm password"

value={confirmPassword}

onChange={(e)=>setConfirmPassword(e.target.value)}

/>


</div>


</div>




<button type="submit">

Register

</button>



</form>



<div className="login-link">
  <p>
    Already have account?
    <Link to="/login">Login</Link>
  </p>
</div>


</div>

</div>

</div>

);

}

export default Register;