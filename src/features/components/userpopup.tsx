/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import LogoutButton from '@/app/logout/page';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/utils/Authsegment';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/browserclient';

function displayNameFromUser(user: User | null): string {
  if (!user) return 'Guest';
  const meta = user.user_metadata as Record<string, string | undefined> | undefined;
  const full =
    meta?.full_name ||
    meta?.name ||
    meta?.display_name ||
    (typeof meta?.first_name === 'string' && `${meta.first_name} ${meta?.last_name ?? ''}`.trim());
  if (full) return full;
  if (user.email) return user.email.split('@')[0] ?? 'Student';
  return 'Student';
}

type UserPopupProps = {
  userPopupOpen: boolean;
  setUserPopupOpen: React.Dispatch<React.SetStateAction<boolean>>;
  userLoggedIn: boolean;
  onNavigate?: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function UserPopup({ userPopupOpen, setUserPopupOpen, userLoggedIn, onNavigate }: UserPopupProps) {
  const auth = useAuth();
  const user = auth?.user ?? null;
  const loading = auth?.loading ?? true;
  const displayName = displayNameFromUser(user);
  const popupRef = useRef<HTMLDivElement>(null);

  const [role, setRole] = useState<'teacher' | 'student' | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);

  const supabase = useMemo(
    () =>
      getSupabaseBrowserClient(),
    []
  );

  useEffect(() => {
    if (loading) return; // ← wait for auth to finish

    if (!user) {
      setRole(null);
      setIsSubscribed(null);
      return;
    }

    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }:{data: any, error: any}) => {
        if (error) { console.error(error); return; }
        setRole((data?.role as 'teacher' | 'student') ?? 'student');
      });

    supabase
      .from('user_usage')
      .select('is_subscribed')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }:{data: any, error: any}) => {
        if (error) { console.error(error); return; }
        setIsSubscribed(Boolean(data?.is_subscribed));
      });
  }, [user?.id, loading, supabase]);

  const close = () => {
    onNavigate?.();
    setUserPopupOpen(false);
  };

  useEffect(() => {
    if (!userPopupOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setUserPopupOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userPopupOpen, setUserPopupOpen]);

  if (!userPopupOpen) return null;

  const showUpgrade = userLoggedIn && isSubscribed === false;

  return (
    <div
      ref={popupRef}
      className="absolute right-0 top-full mt-2 w-[300px] max-w-[calc(100vw-1rem)] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <Image src="/assets/user.png" alt="User" width={48} height={48} className="rounded-full shrink-0" />
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[#151517] font-medium text-[16px] truncate">{displayName}</span>
            <span className="text-[#1E90FF] font-medium text-[13px]">
              {userLoggedIn ? 'Member' : 'Free Trial'}
            </span>
          </div>
        </div>
        {showUpgrade && (
          <Link href="/pricing" onClick={close} className="shrink-0">
            <button
              type="button"
              className="whitespace-nowrap text-center text-[13px] bg-[#581845] text-white px-4 py-2.5 rounded-full hover:bg-[#4F163E] transition-colors"
            >
              Upgrade
            </button>
          </Link>
        )}
      </div>
      <nav className="text-[16px] no-underline" aria-label="Account menu">
        <Link href="/accounts" className="block px-5 py-4 text-[#151517] hover:bg-gray-100 no-underline" onClick={close}>
          My Account
        </Link>
        {role === 'teacher' ? (
          <Link href="/teacher" className="block px-5 py-4 text-[#151517] hover:bg-gray-100 no-underline" onClick={close}>
            Teacher Dashboard
          </Link>
        ) : (
          <Link href="/student-classes" className="block px-5 py-4 text-[#151517] hover:bg-gray-100 no-underline" onClick={close}>
            Student & Classes
          </Link>
        )}
        <Link href="/instrument-settings" className="block px-5 py-4 text-[#151517] hover:bg-gray-100 no-underline" onClick={close}>
          Instrument Settings
        </Link>
        <Link href="/preferences" className="block px-5 py-4 text-[#151517] hover:bg-gray-100 no-underline" onClick={close}>
          Preferences
        </Link>
        <Link href="/settings" className="block px-5 py-4 text-[#151517] hover:bg-gray-100 no-underline" onClick={close}>
          Support
        </Link>
        {userLoggedIn ? (
          <div className="border-t border-gray-100">
            <LogoutButton
              onAfterSignOut={close}
            />
          </div>
        ) : (
          <div className="border-t border-gray-100">
            <Link href="/login" className="block px-5 py-4 text-[#151517] no-underline hover:bg-gray-100" onClick={close}>
              <div className="flex items-center gap-3">
                <Image src="/loginicon.svg" height={13} width={13} alt="" />
                <span>Login</span>
              </div>
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}