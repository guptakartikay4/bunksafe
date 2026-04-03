import React from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Dashboard() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="dashboard">
      <h2>Welcome to BunkSafe</h2>
      <p>{user?.email}</p>

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;