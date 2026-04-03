import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Block UI until auth is ready
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
        <Route
          path="/"
          element={!user ? <Login /> : <Navigate to="/dashboard" />}
        />

        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}

export default App;