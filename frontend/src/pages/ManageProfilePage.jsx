import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext"; 
import { useNavigate } from "react-router-dom"; 
import { FaEye, FaEyeSlash } from 'react-icons/fa'; 
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/manageprofilepage.css'; 
import withAuth from "../hoc/withAuth";

const ManageProfilePage = () => {
  const { userId, accessToken, logout } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState(""); 
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [isHoveredBack, setIsHoveredBack] = useState(false);
  const [isHoveredSave, setIsHoveredSave] = useState(false); 
  const [isHoveredDelete, setIsHoveredDelete] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false); 
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`http://localhost:8081/users/${userId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data.");
        }

        const data = await response.json();
        setUsername(data.data.username);
        setEmail(data.data.email);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) { 
      fetchUserData();
    }
  }, [userId, accessToken]);

  const handleVerifyPassword = async () => {
    try {
      const response = await fetch(`http://localhost:8081/users/verify-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, currentPassword })
      });

      if (!response.ok) {
        throw new Error("Current password is incorrect.");
      }

      return true;
    } catch (err) {
      toast.error(err.message);
      return false; 
    }
  };


  const handleSaveChanges = async (e) => {
    e.preventDefault();

    const updatedUser = { username, email: email.toLowerCase() };

    try {
      const response = await fetch(`http://localhost:8081/users/${userId}`, {
        method: 'PATCH', 
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedUser)
      });

      if (!response.ok) {
        throw new Error("Failed to update profile.");
      }

      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validate password
    if (!passwordPattern.test(newPassword)) {
      toast.error('Password must be at least 8 characters long, include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      return toast.error("New password and confirmation do not match.");
    }

    const isVerified = await handleVerifyPassword();
    if (!isVerified) {
      return;
    }

    try {
      const updatedPassword = { password: newPassword };

      const response = await fetch(`http://localhost:8081/users/${userId}`, {
        method: 'PATCH', 
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedPassword)
      });

      if (!response.ok) {
        throw new Error("Failed to update password.");
      }

      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (!confirmDelete) return;

    setLoading(true);

    try {
      const response = await fetch(`http://localhost:8081/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete account.");
      }

      toast.success("Account deleted successfully!");
      logout();
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/dashboard"); 
  };

  if (loading) return <p style={{ color: "white", textAlign: "center" }}>Loading...</p>; 

  return (
    <div className="container">
      <ToastContainer /> 
      <button
        className="button-back"
        onClick={handleBack}
        onMouseEnter={() => setIsHoveredBack(true)} 
        onMouseLeave={() => setIsHoveredBack(false)} 
      >
        Back
      </button>

      <form className="form-container">
        <div className="title"> Manage Profile</div>

        <div className="form-group">
          <label htmlFor="username" className="label">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
            placeholder="Leave blank to keep current username"
            className="input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email" className="label">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off" 
            placeholder="Leave blank to keep current email"
            className="input"
          />
        </div>

        <button
          onClick={handleSaveChanges}
          className="button-submit"
          onMouseEnter={() => setIsHoveredSave(true)}
          onMouseLeave={() => setIsHoveredSave(false)}
          style={{ marginBottom: '150px' }}
        >
          Save Changes
        </button>

        {/* <div className="form-group">
          <h3 className="sub-title">Change Password</h3>
        </div> */}
        <div className="title"> Change Password</div>

        <div className="form-group">
          <label htmlFor="currentPassword" className="label">Current Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="input"
            />
            <span className="password-eye" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
              {showCurrentPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="newPassword" className="label">New Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showNewPassword ? 'text' : 'password'}
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="input"
            />
            <span className="password-eye" onClick={() => setShowNewPassword(!showNewPassword)}>
              {showNewPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="label">Confirm Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="input"
            />
            <span className="password-eye" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>
        </div>

        <button
          onClick={handleChangePassword}
          className="button-submit"
          onMouseEnter={() => setIsHoveredSave(true)}
          onMouseLeave={() => setIsHoveredSave(false)}
        >
          Change Password
        </button>

        <button
          className="button-delete"
          onClick={handleDeleteAccount}
          onMouseEnter={() => setIsHoveredDelete(true)}
          onMouseLeave={() => setIsHoveredDelete(false)}
        >
          Delete Account
        </button>
      </form>
    </div>
  );
};

const WrappedManageProfilePage = withAuth(ManageProfilePage);
export default WrappedManageProfilePage;