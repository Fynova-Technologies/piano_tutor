'use client'

import LogoutButton from '@/app/logout/page';
import Image from 'next/image';
import Link from 'next/link';
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
  const user = auth?.user ?? null;
  const displayName = displayNameFromUser(user);

  const close = () => {
    onNavigate?.();
    setUserPopupOpen(false);
  };

  return (
    <div>
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
        <Link
          href="/student-classes"
          className="block px-4 py-4 text-[#151517] hover:bg-gray-100 no-underline"
          onClick={close}
        >
          Student & Classes
        </Link>
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
