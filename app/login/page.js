'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handle = async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    setLoading(true);
    setStatus('Logging in...');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        setStatus('✅ Login successful! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard'); // redirect after success
        }, 2000);
      } else {
        setStatus(`❌ ${data.error || 'Invalid credentials'}`);
      }
    } catch (err) {
      console.error(err);
      setStatus('❌ Something went wrong, please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

      <form onSubmit={handle} className="space-y-4">
        <input
          name="email"
          placeholder="Email"
          required
          className="w-full px-4 py-2 border rounded"
        />
        <input
          name="password"
          placeholder="Password"
          type="password"
          required
          className="w-full px-4 py-2 border rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Please wait...' : 'Login'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">{status}</p>
    </div>
  );
}