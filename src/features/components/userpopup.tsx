'use client';
import LogoutButton from '@/app/logout/page';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@/utils/Authsegment';
import type { User } from '@supabase/supabase-js';

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
  console.log('[UserPopup] auth:', auth);
  const user = auth?.user ?? null;
  console.log('[UserPopup] user:', user?.id ?? 'null');
  const loading = auth?.loading ?? true;
  const displayName = displayNameFromUser(user);
  const popupRef = useRef<HTMLDivElement>(null);

  const [role, setRole] = useState<'teacher' | 'student' | null>(null);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

useEffect(() => {
  if (loading) return;  // ← wait for auth to finish
  
  if (!user) {
    setRole(null);
    return;
  }

  supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
    .then(({ data, error }) => {
      if (error) { console.error(error); return; }
      setRole((data?.role as 'teacher' | 'student') ?? 'student');
    });
    console.log('[UserPopup] auth:', auth);
console.log('[UserPopup] user:', user?.id ?? 'null');

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

  return (
    <div ref={popupRef}>
      <div className="flex items-center justify-between gap-4 border-b px-2 py-2">
        <div className="flex items-center gap-4 px-4 py-2">
          <Image src="/assets/user.png" alt="User" width={50} height={50} />
          <div className="flex flex-col gap-2">
            <span className="text-[#151517] font-medium text-[16px]">{displayName}</span>
            <span className="text-[#1E90FF] font-medium text-[12px]">
              {userLoggedIn ? 'Member' : 'Free Trial'}
            </span>
          </div>
        </div>
        <div>
          <button
            type="button"
            className="w-full text-center text-[14px] bg-[#581845] text-white px-4 py-2 rounded-lg hover:bg-[#4F163E]"
          >
            Upgrade
          </button>
        </div>
      </div>
      <nav className="text-[16px] no-underline" aria-label="Account menu">
        <Link href="/accounts" className="block px-4 py-4 text-[#151517] hover:bg-gray-100 no-underline" onClick={close}>
          My Account
        </Link>
        {role === 'teacher' ? (
          <Link href="/teacher" className="block px-4 py-4 text-[#151517] hover:bg-gray-100 no-underline" onClick={close}>
            Teacher Dashboard
          </Link>
        ) : (
          <Link href="/student-classes" className="block px-4 py-4 text-[#151517] hover:bg-gray-100 no-underline" onClick={close}>
            Student & Classes
          </Link>
        )}
        <Link href="/instrument-settings" className="block px-4 py-4 text-[#151517] hover:bg-gray-100 no-underline" onClick={close}>
          Instrument Settings
        </Link>
        <Link href="/preferences" className="block px-4 py-4 text-[#151517] hover:bg-gray-100 no-underline" onClick={close}>
          Preferences
        </Link>
        <Link href="/settings" className="block px-4 py-4 text-[#151517] hover:bg-gray-100 no-underline" onClick={close}>
          Support
        </Link>
        {userLoggedIn ? (
          <LogoutButton onAfterSignOut={close} />
        ) : (
          <div className="border-t-[#6E6E73] border-t-1">
            <Link href="/login" className="text-[#151517] rounded-lg no-underline" onClick={close}>
              <div className="space-x-4 px-4 py-4">
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