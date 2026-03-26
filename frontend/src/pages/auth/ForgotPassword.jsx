import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const ForgotPassword = () => {
    const { t } = useLanguage();
    const { forgotPassword, resetPassword, loading, error } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [localError, setLocalError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setLocalError('');
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        const emailTrimmed = formData.email?.trim() || '';
        if (!emailTrimmed) return setLocalError('Email is required');
        
        const result = await forgotPassword(emailTrimmed);
        if (result && result.step === 'otp_required') {
            setStep(2);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        const emailTrimmed = formData.email?.trim() || '';
        if (!formData.otp || !formData.newPassword) return setLocalError('All fields are required');
        if (formData.newPassword.length < 8) return setLocalError('Password must be at least 8 characters');
        if (formData.newPassword !== formData.confirmPassword) return setLocalError('Passwords do not match');

        const result = await resetPassword(emailTrimmed, formData.otp, formData.newPassword);
        if (result && result.message) {
            alert('Password reset successfully. Please login.');
            navigate('/login');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card animate-fade-in">
                <div className="auth-header">
                    <h2>{step === 1 ? 'Forgot Password' : 'Reset Password'}</h2>
                    <p>{step === 1 ? 'Enter your email to receive a reset OTP.' : 'Enter your OTP and new password.'}</p>
                </div>

                {(error || localError) && <div className="auth-error">{error || localError}</div>}

                {step === 1 ? (
                    <form onSubmit={handleSendOtp}>
                        <Input
                            label="Email Address"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />

                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        <Input
                            label="OTP Code form Email"
                            type="text"
                            name="otp"
                            value={formData.otp}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="New Password"
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Confirm New Password"
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />

                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <div className="auth-footer" style={{ marginTop: '20px', textAlign: 'center' }}>
                    <Link to="/login" style={{ color: 'var(--primary-color)' }}>Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
