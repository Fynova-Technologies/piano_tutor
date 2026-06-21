'use client';

import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browserclient';
import UserPopup from '@/features/components/userpopup';
import NotificationPopup from '@/features/components/notification';
import Link from 'next/link'; 

const navItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Library', href: '/library' },
  { name: 'Methods', href: '/method' },
  { name: 'Techniques', href: '/techniques' },
  { name: 'SASR', href: '/sasr' },
  { name: 'Reports', href: '/reports' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [userPopupOpen, setUserPopupOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);

  useEffect(() => {
    const checkNotifications = () => {
      const stored = localStorage.getItem('notifications');
      const list = stored ? JSON.parse(stored) : [];
      setHasNotifications(list.length > 0);
    };
    checkNotifications();
    const interval = setInterval(checkNotifications, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data, error } = await getSupabaseBrowserClient().auth.getSession();
        if (data.session) setUserLoggedIn(true);
        if (error) throw error;
      } catch (error) {
        console.log('Error getting session:', error);
      }
    };
    getSession();
  }, []);

  return (
    <nav className="bg-[#0A0A0B] border-b border-white/10 shadow-sm px-4 py-3 sm:px-6 relative">
      <div className="w-full mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="flex items-center gap-2">
            <Image src="/assets/Mask group.svg" alt="Logo" width={36} height={36} className="rounded-full" />
          
          <span className="text-xl font-bold text-white">Logo</span>
          
        </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex space-x-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <a
                key={item.name}
                href={item.href}
                className={`font-medium px-4 py-2 rounded-full transition-all duration-200 no-underline text-sm
                  ${isActive ? 'bg-[#D4AF37] text-[#0a0a0a]' : 'text-white hover:text-[#D4AF37]'}
                `}
              >
                {item.name}
              </a>
            );
          })}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Notification */}
          <button className="relative text-gray-400 hover:text-[#D4AF37] bg-transparent border-none transition-colors">
            <Image
              src="/assets/Icon.svg"
              width={24}
              height={24}
              alt="bell"
              onClick={() => setNotificationOpen(!notificationOpen)}
            />
            {hasNotifications && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {/* Notification popup */}
          {notificationOpen && (
            <div className="absolute right-4 top-full mt-2 z-20 p-6 w-[min(600px,calc(100vw-2rem))] rounded-2xl bg-[#FEFEFE] shadow-xl">
              <NotificationPopup
                notificationOpen={notificationOpen}
                setNotificationOpen={setNotificationOpen}
              />
            </div>
          )}

          {/* Profile */}
          <div className="rounded-full cursor-pointer overflow-hidden border-2 border-transparent hover:border-[#D4AF37] transition-colors">
            <Image
              src="/assets/user.png"
              alt="User"
              width={36}
              height={36}
              onClick={() => setUserPopupOpen(!userPopupOpen)}
            />
          </div>

          {/* User popup */}
          {userPopupOpen && (
            <div className="absolute right-4 top-full mt-2 w-80 bg-[#FEFEFE] rounded-2xl shadow-xl py-2 z-20">
              <UserPopup
                userPopupOpen={userPopupOpen}
                setUserPopupOpen={setUserPopupOpen}
                userLoggedIn={userLoggedIn}
                onNavigate={() => setUserPopupOpen(false)}
              />
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-white hover:text-[#D4AF37] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu — on-theme dark dropdown */}
      {menuOpen && (
        <div className="md:hidden mt-3 border-t border-white/10 pt-4 pb-2 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`text-sm font-medium px-4 py-2.5 rounded-full transition-all duration-200 no-underline
                  ${isActive
                    ? 'bg-[#D4AF37] text-[#0a0a0a]'
                    : 'text-white/80 hover:text-[#D4AF37] hover:bg-white/5'}
                `}
              >
                {item.name}
              </a>
            );
          })}
        </div>
      )}
    </nav>
  );
}