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

  return (
    <div className="flex flex-row gap-48 items-center justify-center h-screen bg-gradient-to-b to-sky-950 from-sky-600 to-99%">
      <div>
      <img src="/src/logo.png" alt="Logo" className="self-start w-80" />
      </div>
      {!isAuthenticated ? (
        <form
        onSubmit={handleSignIn}
        className="bg-zinc-900 p-8 rounded-md shadow-md w-[400px]"
      >
        <h1 className="text-center text-2xl font-bold text-sky-500 mb-6">
          Welcome Back
        </h1>
        <div className="mb-4">
          <label className="block text-sky-400 font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-600 rounded-md bg-zinc-900 text-white"
            type="email"
            value={email}
            onChange={handleEmailChange}
            required
          />
        </div>
        <div className="mb-6">
          <label
            className="block text-sky-400 font-bold mb-2"
            htmlFor="password"
          >
            Password
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-600 rounded-md bg-zinc-900 text-white"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            required
          />
        </div>
        <button
          className={`w-full py-2 bg-sky-500 text-white font-bold rounded-md hover:bg-sky-600 transition duration-200 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
        {error && <p className="mt-4 text-red-500">{error}</p>}
       
      </form>
      ) : (
        <div>
          <Dashboard />
        </div>
      )}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
};

export default App;
