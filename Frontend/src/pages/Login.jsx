import { Link } from "react-router-dom";
import "../css/auth.css";

export default function Login() {
  return (
    <div className="auth-page">

      <div className="left-panel">
        <h1>AssetFlow</h1>

        <h2>
          Manage Every Asset.
          <br />
          Track Every Resource.
        </h2>

        <p>
          Centralized ERP platform for tracking assets,
          maintenance, bookings and organization resources.
        </p>

        <img
          src="https://undraw.co/api/illustrations/asset.svg"
          alt="illustration"
        />
      </div>

      <div className="right-panel">

        <div className="login-card">

          <h2>Welcome Back 👋</h2>

          <p>Login to continue to AssetFlow</p>

          <input type="email" placeholder="Email Address" />

          <input type="password" placeholder="Password" />

          <div className="row">

            <label>
              <input type="checkbox" />
              Remember Me
            </label>

            <a href="/">Forgot Password?</a>

          </div>

          <button>Login</button>

          <span className="divider">OR</span>

          <Link to="/register">
            <button className="secondary-btn">
              Create Employee Account
            </button>
          </Link>

        </div>

      </div>

    </div>
  );
}