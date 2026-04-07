import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

// Components
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import TimetableSetup from "./components/TimetableSetup";
import AttendanceSetup from "./components/AttendanceSetup";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ⏳ Show loading while checking auth
  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#1a1a2e",
          color: "white",
        }}
      >
        <h2>Checking login...</h2>
      </div>
    );
  }

  return (
    <Router>
      <Routes>

        {/* 🔐 Login */}
        <Route
          path="/"
          element={!user ? <Login /> : <Navigate to="/dashboard" />}
        />

        {/* 🏠 Dashboard */}
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/" />}
        />

        {/* 📅 Timetable Setup */}
        <Route
          path="/timetable-setup"
          element={user ? <TimetableSetup /> : <Navigate to="/" />}
        />

        {/* 📊 Attendance Setup (NEW) */}
        <Route
          path="/attendance-setup"
          element={user ? <AttendanceSetup /> : <Navigate to="/" />}
        />

      </Routes>
    </Router>
  );
}

export default App;