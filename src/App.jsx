import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Dashboard from "./Dashboard";

const supabase = createClient(
  "https://basihmnebvsflzkaivds.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhc2lobW5lYnZzZmx6a2FpdmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY2NDg4NDUsImV4cCI6MjA0MjIyNDg0NX0.9qX5k7Jin6T-TfZJt6YWSp0nWDypi4NkAwyhzerAC7U"
);

const App = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check for an active session on app load
  useEffect(() => {
    const session = supabase.auth.getSession(); // Get the session if it exists
    session.then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true); // Set authenticated if session is found
      }
    });

    // Listen to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Failed to sign in: " + error.message);
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
      setError("");
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError("Failed to sign up: " + error.message);
    } else {
      setError("Sign-up successful, please sign in.");
    }
    setLoading(false);
  };

  return (
    <div>
      {!isAuthenticated ? (
        <form onSubmit={handleSignIn}>
          <div>
            <label>Email: </label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              required
            />
          </div>
          <div>
            <label>Password: </label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      ) : (
        <div>
          <Dashboard />
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default App;
