import { Link } from "react-router-dom";
import "../css/auth.css";

export default function Register() {
  return (
    <div className="auth-page">

      <div className="left-panel">

        <h1>AssetFlow</h1>

        <h2>Create Employee Account</h2>

        <p>
          Register yourself. Admin will verify your account
          and assign roles.
        </p>

      </div>

      <div className="right-panel">

        <div className="login-card">

          <input placeholder="Full Name" />

          <input placeholder="Employee ID (Optional)" />

          <input placeholder="Email" />

          <input placeholder="Phone Number" />

          <select>

            <option>Select Department</option>

            <option>IT</option>

            <option>HR</option>

            <option>Finance</option>

            <option>Operations</option>

          </select>

          <input
            type="password"
            placeholder="Password"
          />

          <input
            type="password"
            placeholder="Confirm Password"
          />

          <button>Create Account</button>

          <p>
            Already have an account?
            <Link to="/"> Login</Link>
          </p>

        </div>

      </div>

    </div>
  );
}