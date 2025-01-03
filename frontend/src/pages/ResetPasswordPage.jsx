import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const location = useLocation();
  const token = location.state?.token; 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(''); // Clear any previous error message
    setSuccessMessage(''); // Clear any previous success message
    setIsLoading(true);

    // Password validation pattern
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;

    // Validate password
    if (!passwordPattern.test(password)) {
      setErrorMessage('Password must be at least 8 characters long, include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (!token) {
      setErrorMessage("Invalid or missing token.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:8081/users/reset-password', {
        password,
        token 
      });

      if (response.status === 200) {
        setSuccessMessage("Password reset successful! You will be redirected to the login page.");
        setTimeout(() => navigate('/login'), 3000); 
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('An error occurred, please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '20px' }}>PeerPrep</h1>
      <p style={{ fontSize: '1.2rem', margin: '10px 0' }}>Enter your new password.</p>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>} 
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>} 
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            display: 'block',
            margin: '10px 0',
            marginTop: '50px',
            padding: '10px',
            width: '300px',
            border: 'none',
            borderBottom: '2px solid #fff',
            outline: 'none',
            backgroundColor: 'transparent',
            color: '#fff',
            fontSize: '16px',
          }}
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          style={{
            display: 'block',
            margin: '10px 0',
            padding: '10px',
            width: '300px',
            border: 'none',
            borderBottom: '2px solid #fff',
            outline: 'none',
            backgroundColor: 'transparent',
            color: '#fff',
            fontSize: '16px',
          }}
        />
        <button
          type="submit"
          style={{
            width: '300px',
            height: '50px',
            backgroundColor: 'white',
            color: 'black',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '16px',
            marginTop: '20px',
            marginBottom: '40px',
            transition: 'background-color 0.3s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          disabled={isLoading}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      <p style={{ fontSize: '1rem' }}>
        Remembered your password? <a href="/login" style={{ color: 'white' }}>Login</a>
      </p>
    </div>
  );
};

export default ResetPassword;
