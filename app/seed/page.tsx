'use client';

import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function SeedPage() {
  const initializeData = useMutation(api.initData.initializeData);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSeedData = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const result = await initializeData();
      setMessage(`Success: ${result}`);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full border border-gray-200">

        <h1 className="text-3xl font-bold text-gray-900 mb-4">🌱 Seed User Data</h1>

        <p className="text-gray-700 mb-6 text-lg leading-relaxed">
          This will create sample users in the database for testing purposes.
        </p>

        <div className="bg-green-100 border border-green-300 p-4 rounded-lg mb-6">
          <p className="text-green-900 font-semibold text-sm">
            🔒 Password Hashing Enabled
          </p>
          <p className="text-green-800 text-xs mt-1">
            Passwords are securely hashed using custom hash function
          </p>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">Demo Accounts:</h2>

        <div className="space-y-3 mb-6">
          <div className="bg-blue-100 border border-blue-300 p-4 rounded-lg">
            <p className="text-blue-900 font-semibold text-sm mb-1">
              Super Admin:
            </p>
            <p className="text-blue-800 font-mono text-sm">
              admin@tsicertification.co.id / password
            </p>
          </div>

          <div className="bg-green-100 border border-green-300 p-4 rounded-lg">
            <p className="text-green-900 font-semibold text-sm mb-1">
              Manager (Diara):
            </p>
            <p className="text-green-800 font-mono text-sm">
              diara@tsicertification.co.id / password
            </p>
          </div>

          <div className="bg-purple-100 border border-purple-300 p-4 rounded-lg">
            <p className="text-purple-900 font-semibold text-sm mb-1">
              Staff (Mercy):
            </p>
            <p className="text-purple-800 font-mono text-sm">
              mercy@tsicertification.co.id / password
            </p>
          </div>

          <div className="bg-indigo-100 border border-indigo-300 p-4 rounded-lg">
            <p className="text-indigo-900 font-semibold text-sm mb-1">
              Staff (Dhea):
            </p>
            <p className="text-indigo-800 font-mono text-sm">
              dhea@tsicertification.co.id / password
            </p>
          </div>
        </div>

        <div className="bg-yellow-100 border border-yellow-300 p-4 rounded-lg mb-6">
          <p className="text-yellow-900 font-semibold text-sm mb-1">
            💡 Note:
          </p>
          <p className="text-yellow-800 text-xs">
            All passwords are hashed with custom hash function (salted) before storing in database.
          </p>
        </div>

        <button
          onClick={handleSeedData}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-lg mb-4"
        >
          {isLoading ? '⏳ Creating Users...' : '🚀 Create Sample Users'}
        </button>

        {message && (
          <div className={`p-4 rounded-lg text-sm font-medium border ${
            message.includes('Success')
              ? 'bg-green-100 text-green-900 border-green-300'
              : 'bg-red-100 text-red-900 border-red-300'
          }`}>
            {message}
          </div>
        )}

        <div className="text-center mt-6">
          <a
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center hover:underline transition-colors"
          >
            → Go to Login Page
          </a>
        </div>

      </div>
    </div>
  );
}