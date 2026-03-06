import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
        <div className="login-grid-overlay" />
      </div>

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="login-particle" style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${6 + Math.random() * 8}s`,
          width: `${2 + Math.random() * 4}px`,
          height: `${2 + Math.random() * 4}px`,
        }} />
      ))}

      {/* Main content */}
      <div className={`login-content ${mounted ? "login-content-visible" : ""}`}>
        {/* Logo area */}
        <div className={`login-logo-section ${mounted ? "login-fade-in-1" : ""}`}>
          <div className="login-logo-clip">
            <img
              src="https://varietyheaven.in/logos/wht.svg"
              alt="Variety Heaven"
              className="login-logo"
            />
          </div>
          <div className="login-brand-divider" />
          <p className="login-tagline">Invoicing & Management Suite</p>
        </div>

        {/* Glass card */}
        <div className={`login-card ${mounted ? "login-fade-in-2" : ""}`}>
          <div className="login-card-glow" />

          <div className="login-card-inner">
            <h2 className="login-welcome">Welcome back</h2>
            <p className="login-subtitle">Sign in to continue to your dashboard</p>

            <form onSubmit={handleSignIn} className="login-form">
              {/* Email field */}
              <div className="login-field">
                <label htmlFor="email" className="login-label">Email</label>
                <div className="login-input-wrapper">
                  <svg className="login-input-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="login-input"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="login-field">
                <label htmlFor="password" className="login-label">Password</label>
                <div className="login-input-wrapper">
                  <svg className="login-input-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="login-input login-input-password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="login-error">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="login-error-icon">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="login-btn"
              >
                {loading ? (
                  <span className="login-btn-loading">
                    <svg className="login-spinner" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="login-btn-content">
                    Sign In
                    <svg viewBox="0 0 20 20" fill="currentColor" className="login-btn-arrow">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Landing page link - featured */}
        <div className={`login-footer ${mounted ? "login-fade-in-3" : ""}`}>
          <a
            href="https://suit.varietyheaven.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="login-landing-link"
          >
            <span className="login-landing-shimmer" />
            <span className="login-landing-content">
              <svg viewBox="0 0 20 20" fill="currentColor" className="login-landing-icon">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span className="login-landing-text">
                <span className="login-landing-main">Visit our website</span>
                <span className="login-landing-sub">suit.varietyheaven.in</span>
              </span>
              <svg viewBox="0 0 20 20" fill="currentColor" className="login-external-icon">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
            </span>
          </a>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: #0a0a0f;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* === Animated Background === */
        .login-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
        }

        .login-orb-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, #ec4899, transparent 70%);
          top: -200px;
          right: -100px;
          animation: login-float-1 12s ease-in-out infinite;
        }

        .login-orb-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #8b5cf6, transparent 70%);
          bottom: -150px;
          left: -100px;
          animation: login-float-2 15s ease-in-out infinite;
        }

        .login-orb-3 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #f43f5e, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: login-float-3 10s ease-in-out infinite;
        }

        .login-grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        /* === Floating Particles === */
        .login-particle {
          position: absolute;
          background: rgba(236, 72, 153, 0.4);
          border-radius: 50%;
          pointer-events: none;
          animation: login-particle-float linear infinite;
          z-index: 1;
        }

        @keyframes login-particle-float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          50% { transform: translateY(-80px) translateX(30px); }
        }

        @keyframes login-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }

        @keyframes login-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 35px) scale(1.05); }
          66% { transform: translate(30px, -15px) scale(0.9); }
        }

        @keyframes login-float-3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.5; }
        }

        /* === Content === */
        .login-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem 1.25rem;
          width: 100%;
          max-width: 440px;
          min-height: 100vh;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .login-content-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* === Logo Section === */
        .login-logo-section {
          text-align: center;
          margin-bottom: 1rem;
          opacity: 0;
          transform: translateY(15px);
          transition: opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s;
        }

        .login-fade-in-1 {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        .login-fade-in-2 {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        .login-fade-in-3 {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        .login-logo-clip {
          width: 260px;
          height: 60px;
          margin: 0 auto;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-logo {
          width: 260px;
          height: auto;
          filter: drop-shadow(0 0 30px rgba(236, 72, 153, 0.3));
          transition: filter 0.3s ease;
        }

        .login-logo:hover {
          filter: drop-shadow(0 0 40px rgba(236, 72, 153, 0.5));
        }

        .login-brand-divider {
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #ec4899, transparent);
          margin: 0.6rem auto;
          border-radius: 2px;
        }

        .login-tagline {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.8rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-weight: 500;
        }

        /* === Glass Card === */
        .login-card {
          position: relative;
          width: 100%;
          border-radius: 20px;
          opacity: 0;
          transform: translateY(15px);
          transition: opacity 0.6s ease 0.4s, transform 0.6s ease 0.4s;
        }

        .login-card-glow {
          position: absolute;
          inset: -1px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(236,72,153,0.4), rgba(139,92,246,0.2), rgba(236,72,153,0.1));
          z-index: -1;
          filter: blur(1px);
        }

        .login-card-inner {
          background: rgba(15, 15, 25, 0.8);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 2rem;
        }

        .login-welcome {
          color: #fff;
          font-size: 1.6rem;
          font-weight: 700;
          margin: 0 0 0.35rem 0;
          letter-spacing: -0.02em;
        }

        .login-subtitle {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.875rem;
          margin: 0 0 1.25rem 0;
        }

        /* === Form === */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .login-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.025em;
        }

        .login-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon {
          position: absolute;
          left: 14px;
          width: 16px;
          height: 16px;
          color: rgba(255, 255, 255, 0.25);
          pointer-events: none;
          transition: color 0.2s ease;
          z-index: 2;
        }

        .login-input-wrapper:focus-within .login-input-icon {
          color: #ec4899;
        }

        .login-input {
          width: 100%;
          padding: 0.75rem 0.875rem 0.75rem 2.75rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: #fff;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.25s ease;
        }

        .login-input::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }

        .login-input:focus {
          border-color: rgba(236, 72, 153, 0.5);
          background: rgba(236, 72, 153, 0.04);
          box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
        }

        .login-input-password {
          padding-right: 2.75rem;
        }

        .login-toggle-pw {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
          z-index: 2;
        }

        .login-toggle-pw:hover {
          color: rgba(255, 255, 255, 0.6);
        }

        /* === Error === */
        .login-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 10px;
          color: #fca5a5;
          font-size: 0.8rem;
          animation: login-shake 0.4s ease;
        }

        .login-error-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          color: #f87171;
        }

        @keyframes login-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }

        /* === Button === */
        .login-btn {
          width: 100%;
          padding: 0.8rem 1.5rem;
          margin-top: 0.5rem;
          background: linear-gradient(135deg, #ec4899, #db2777);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .login-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #f43f5e, #ec4899);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .login-btn:hover::before {
          opacity: 1;
        }

        .login-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(236, 72, 153, 0.4);
        }

        .login-btn:active {
          transform: translateY(0);
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .login-btn-content, .login-btn-loading {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .login-btn-arrow {
          width: 16px;
          height: 16px;
          transition: transform 0.2s ease;
        }

        .login-btn:hover .login-btn-arrow {
          transform: translateX(3px);
        }

        .login-spinner {
          width: 18px;
          height: 18px;
          animation: login-spin 1s linear infinite;
        }

        @keyframes login-spin {
          to { transform: rotate(360deg); }
        }

        /* === Footer / Landing Link — Featured === */
        .login-footer {
          margin-top: 1.25rem;
          width: 100%;
          opacity: 0;
          transform: translateY(15px);
          transition: opacity 0.6s ease 0.6s, transform 0.6s ease 0.6s;
        }

        .login-landing-link {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          text-decoration: none;
          padding: 1rem 1.5rem;
          border-radius: 16px;
          border: 1px solid rgba(236, 72, 153, 0.25);
          background: linear-gradient(135deg, rgba(236,72,153,0.08), rgba(139,92,246,0.06));
          transition: all 0.35s ease;
          overflow: hidden;
        }

        .login-landing-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(236,72,153,0.12), transparent);
          transform: translateX(-100%);
          animation: login-shimmer 3s ease-in-out infinite;
        }

        @keyframes login-shimmer {
          0% { transform: translateX(-100%); }
          50%, 100% { transform: translateX(100%); }
        }

        .login-landing-content {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          z-index: 1;
        }

        .login-landing-link:hover {
          border-color: rgba(236, 72, 153, 0.5);
          background: linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.1));
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(236, 72, 153, 0.2), 0 0 0 1px rgba(236,72,153,0.1);
        }

        .login-landing-icon {
          width: 20px;
          height: 20px;
          color: #ec4899;
          flex-shrink: 0;
        }

        .login-landing-text {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .login-landing-main {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .login-landing-sub {
          color: rgba(236, 72, 153, 0.6);
          font-size: 0.75rem;
          font-weight: 400;
        }

        .login-external-icon {
          width: 16px;
          height: 16px;
          color: rgba(255, 255, 255, 0.3);
          flex-shrink: 0;
          transition: transform 0.2s ease, color 0.2s ease;
        }

        .login-landing-link:hover .login-external-icon {
          transform: translate(2px, -2px);
          color: rgba(236, 72, 153, 0.7);
        }

        /* === Responsive === */
        @media (max-width: 480px) {
          .login-card-inner {
            padding: 1.5rem 1.25rem;
          }

          .login-welcome {
            font-size: 1.35rem;
          }

          .login-logo-clip {
            width: 200px;
            height: 48px;
          }

          .login-logo {
            width: 200px;
          }
        }

        @media (max-height: 700px) {
          .login-content {
            padding: 0.5rem 1.25rem;
          }

          .login-logo-section {
            margin-bottom: 0.5rem;
          }

          .login-card-inner {
            padding: 1.25rem;
          }

          .login-footer {
            margin-top: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
