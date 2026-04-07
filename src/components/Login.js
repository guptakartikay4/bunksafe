import React, { useState } from "react";
import { auth, googleProvider } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import "../App.css";

function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  // Email Login / Signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  // ✅ Google Login (Popup — stable)
  const handleGoogleSignIn = async () => {
    if (loadingGoogle) return; // prevent multiple clicks

    setLoadingGoogle(true);
    setError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("User:", result.user);
    } catch (err) {
      console.error(err);

      if (err.code === "auth/popup-closed-by-user") {
        setError("Popup closed. Try again.");
      } else if (err.code === "auth/cancelled-popup-request") {
        setError("Multiple clicks detected. Try once.");
      } else {
        setError(err.message);
      }
    }

    setLoadingGoogle(false);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>BunkSafe</h1>
        <p style={{ opacity: 0.7 }}>
          Bunk Smarter, Not Harder
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">
            {isSignup ? "Sign Up" : "Login"}
          </button>
        </form>

        <button
          className="google-btn"
          onClick={handleGoogleSignIn}
          disabled={loadingGoogle}
        >
          {loadingGoogle ? "Signing in..." : "Sign in with Google"}
        </button>

        {error && <p className="error">{error}</p>}

        <p className="toggle">
          {isSignup
            ? "Already have an account?"
            : "Don't have an account?"}
          <span onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? " Login" : " Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;