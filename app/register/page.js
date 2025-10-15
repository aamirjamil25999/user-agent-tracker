'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [status, setStatus] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const router = useRouter();

  // 🔹 Register Handler
  const handleRegister = async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    setEmail(f.email);
    setStatus('Registering...');
    const res = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify(f),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    setStatus(data.message || JSON.stringify(data));
    if (res.ok) setShowOtp(true); // ✅ show OTP input if registration successful
  };

  // 🔹 Verify OTP Handler
  const handleVerify = async (e) => {
    e.preventDefault();
    setStatus('Verifying OTP...');
    const res = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();

    if (res.ok) {
      setStatus('✅ OTP Verified Successfully! Redirecting to login...');
      // ✅ Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } else {
      setStatus(data.error || '❌ Invalid OTP');
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow mt-10">
      {!showOtp ? (
        <>
          <h2 className="text-2xl font-bold mb-4 text-center">Create an Account</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <input name="name" placeholder="Name" required className="w-full px-4 py-2 border rounded" />
            <input name="email" placeholder="Email" required className="w-full px-4 py-2 border rounded" />
            <input name="password" placeholder="Password" type="password" required className="w-full px-4 py-2 border rounded" />
            <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Register
            </button>
          </form>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-4 text-center">Verify OTP</h2>
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-gray-600 text-sm text-center">
              OTP has been sent to <strong>{email}</strong>. Enter it below:
            </p>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              required
              className="w-full px-4 py-2 border rounded"
            />
            <button type="submit" className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Submit OTP
            </button>
          </form>
        </>
      )}

      <pre className="mt-4 text-sm text-gray-600 text-center">{status}</pre>
    </div>
  );
}