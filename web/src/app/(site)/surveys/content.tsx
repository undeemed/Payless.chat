'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// CPX wall URL with message_id for success/failure messages
const CPX_WALL_URL = 'https://wall.cpx-research.com/index.php';
const CPX_APP_ID = process.env.NEXT_PUBLIC_CPX_APP_ID || '30452';

export default function CpxSurveyContent() {
  const searchParams = useSearchParams();
  const messageId = searchParams.get('message_id') || searchParams.get('cpx_message_id');
  const [userId, setUserId] = useState<string | null>(null);
  const [secureHash, setSecureHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current user from localStorage or session
    const storedUser = localStorage.getItem('supabase.auth.token');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const uid = parsed?.currentSession?.user?.id;
        if (uid) {
          setUserId(uid);
          // Generate secure hash for this user
          fetchSecureHash(uid);
        }
      } catch (e) {
        console.error('Failed to parse auth token:', e);
      }
    }
    setLoading(false);
  }, []);

  const fetchSecureHash = async (uid: string) => {
    try {
      const response = await fetch(`/api/cpx/hash?user_id=${uid}`);
      const data = await response.json();
      if (data.hash) {
        setSecureHash(data.hash);
      }
    } catch (e) {
      console.error('Failed to fetch secure hash:', e);
    }
  };

  // Build the CPX wall iframe URL
  const getCpxWallUrl = () => {
    if (!userId || !secureHash) return null;
    
    const params = new URLSearchParams({
      app_id: CPX_APP_ID,
      ext_user_id: userId,
      secure_hash: secureHash,
      username: '',
      email: '',
      subid_1: '',
      subid_2: '',
    });

    if (messageId) {
      params.append('message_id', messageId);
    }

    return `${CPX_WALL_URL}?${params.toString()}`;
  };

  const cpxWallUrl = getCpxWallUrl();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
        <p className="text-gray-400 mb-6">Please sign in to access surveys and earn credits.</p>
        <a 
          href="/" 
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          Go to Home
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">💰 Available Surveys</h1>
          <a 
            href="/" 
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </header>

      {/* Message Banner (if redirected back with message) */}
      {messageId && (
        <div className="bg-green-600/20 border-b border-green-500/30 p-4">
          <div className="max-w-6xl mx-auto text-center text-green-400">
            ✅ Survey completed! Credits will be added to your account shortly.
          </div>
        </div>
      )}

      {/* CPX Survey Wall iframe */}
      <div className="flex-1 relative">
        {cpxWallUrl ? (
          <iframe
            src={cpxWallUrl}
            className="w-full h-full absolute inset-0 border-0"
            allow="clipboard-write"
            title="CPX Research Surveys"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Loading surveys...
          </div>
        )}
      </div>
    </div>
  );
}
