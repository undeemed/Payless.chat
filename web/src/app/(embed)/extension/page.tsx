"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Script from "next/script";

export default function ExtensionPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [secureHash, setSecureHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initUser = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setError('Please sign in to view surveys');
          setLoading(false);
          return;
        }

        setUserId(session.user.id);

        // Get secure hash from API
        const response = await fetch('/api/cpx/hash', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSecureHash(data.secure_hash);
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize:', err);
        setError('Failed to load');
        setLoading(false);
      }
    };

    initUser();
  }, []);

  // Set up CPX config when we have user data
  useEffect(() => {
    if (!userId || !secureHash) return;

    const appId = process.env.NEXT_PUBLIC_CPX_APP_ID || '30452';

    // CPX script configuration
    const script1 = {
      div_id: "cpx-surveys",
      theme_style: 2, // sidebar style
      order_by: 2, // best money
      limit_surveys: 10
    };

    const config = {
      general_config: {
        app_id: parseInt(appId, 10),
        ext_user_id: userId,
        email: "",
        username: "",
        secure_hash: secureHash,
        subid_1: "",
        subid_2: "",
      },
      style_config: {
        text_color: "#ffffff",
        survey_box: {
          topbar_background_color: "#22c55e",
          box_background_color: "#1a1a1a",
          rounded_borders: true,
          stars_filled: "#ffaf20",
        },
      },
      script_config: [script1],
      debug: false,
      useIFrame: true,
      iFramePosition: 1,
      functions: {
        no_surveys_available: () => {
          console.log("No CPX surveys available");
        },
        count_new_surveys: (count: number) => {
          console.log("CPX surveys count:", count);
        },
        get_all_surveys: (surveys: unknown[]) => {
          console.log("CPX surveys:", surveys);
        },
        get_transaction: (transactions: unknown[]) => {
          console.log("CPX transactions:", transactions);
        }
      }
    };

    // Set config on window for CPX script
    (window as unknown as { config: typeof config }).config = config;
  }, [userId, secureHash]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="animate-pulse text-neutral-400">Loading surveys...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-neutral-400 mb-4">{error}</div>
          <a 
            href="https://payless.chat" 
            className="text-green-500 hover:underline"
          >
            Sign in at payless.chat
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      {/* Header */}
      <header className="p-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-bold text-sm">
            P
          </div>
          <div>
            <div className="font-semibold text-sm">Payless AI</div>
            <div className="text-[10px] text-neutral-400">Earn credits with surveys</div>
          </div>
        </div>
      </header>

      {/* CPX Survey Widget Container */}
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="text-xs text-neutral-400 uppercase tracking-wider mb-2">
          Available Surveys
        </div>
        
        {/* CPX surveys will render here */}
        <div 
          id="cpx-surveys" 
          style={{ minHeight: '500px', width: '100%' }}
        />
      </div>

      {/* Footer */}
      <footer className="p-3 border-t border-white/10 flex-shrink-0">
        <div className="text-center">
          <div className="text-[10px] text-neutral-400 mb-2">
            Complete surveys to earn free AI credits
          </div>
          <a 
            href="https://payless.chat" 
            target="_blank"
            className="text-xs text-neutral-400 hover:text-white transition-colors underline"
          >
            payless.chat
          </a>
        </div>
      </footer>

      {/* CPX Research Script */}
      {userId && secureHash && (
        <Script 
          src="https://cdn.cpx-research.com/assets/js/script_tag_v2.0.js"
          strategy="afterInteractive"
        />
      )}
    </div>
  );
}
