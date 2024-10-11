// Login.js
import React, { useState } from "react";
import { supabase } from "./supabaseClient";

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div>
      {/* <div className="flex flex-row gap-48 items-center justify-center h-screen bg-gradient-to-b to-sky-950 from-sky-600 to-99%">
        <div>
          <img src="./logo.png" alt="Logo" className="self-start w-80" />
        </div>
        <form
          onSubmit={handleSignIn}
          className="bg-zinc-900 p-8 rounded-md shadow-md w-[400px]"
        >
          <h1 className="text-center text-2xl font-bold text-sky-500 mb-6">
            Welcome Back
          </h1>
          <div className="mb-4">
            <label
              className="block text-sky-400 font-bold mb-2"
              htmlFor="email"
            >
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
      </div> */}

      <div className="min-h-screen bg-gradient-to-r from-sky-950 via-sky-900 to-sky-800 flex flex-col items-center justify-start water-drops">
        {/* Add 10 water drops */}
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>

        {/* Container with Glass Effect */}
          <div className="flex justify-center mb-8 z-20">
            <img
              src="https://bill.varietyheaven.in/vh-white.png"
              alt="Logo"
              className="w-60 h-auto"
            />
          </div>
        <div className="bg-blue-950/10 backdrop-blur-md rounded-lg shadow-lg p-8 max-w-md w-full">
          {/* Logo */}

          {/* Form */}
          <form onSubmit={handleSignIn}>
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300"
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                required
                id="email"
                className="mt-1 block w-full px-4 py-2 bg-gray-700/60 text-gray-300 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-skyBlue"
                placeholder="Enter your email"
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300"
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                required
                id="password"
                className="mt-1 block w-full px-4 py-2 bg-gray-700/60 text-gray-300 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-skyBlue"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-skyBlue hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded transition duration-300"
            >
            {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          {error && <p className="mt-4 text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Login;
