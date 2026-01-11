'use client';

import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/app/logout/page';
import { supabase } from '@/lib/supabaseClient';

const navItems = [
  { name: 'Dashboard', href: '/' },
  {name: 'Library',href:"/library"},
  { name: 'Methods', href: '/method' },

  
  // { name: 'Projects', href: '/musicsheet' },
  {name: 'Techniques', href: '/techniques' },
  {name:'SASR', href:'/sasr' },
  {name: 'Reports', href: '/reports' }
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  useEffect(() => {
  const getSession = async () => {
        try {
          const { data, error } = await supabase.auth.getSession();
          if(data.session){setUserLoggedIn(true);}
          if (error) throw error;} catch (error) {
          console.log("Error getting session:", error);
        }}
        getSession();
      }, []);

  return (
    <nav className="bg-[#0A0A0B] border-b shadow-sm px-4 py-3 sm:px-6">
      <div className="w-full mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center ml-8">
          <Image src="/assets/Mask group.svg" alt="Logo" width={40} height={80} className='rounded-full' />
          <span className="ml-2 text-xl font-bold text-white">Logo</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex space-x-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return(
                <a
                  key={item.name}
                  href={item.href}
                  className={`font-medium px-6 py-4 rounded-full transition-all duration-200 no-underline
                    ${isActive ? 'bg-[#D4AF37] text-[#0a0a0a]' : 'text-white'}
                  `}
                >
                    {item.name}
                </a>
            )})}
        </div>
        {/* Right Side */}
        <div className="flex items-center space-x-4 mr-10">
          {/* Notification */}
          <button className="relative text-gray-600 hover:text-blue-600 bg-transparent border-none">
            <Image src={"/assets/Icon.svg" } width={26} height={30} alt='bell'/>
            <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile */}
          <div className=" rounded-full overflow-hidden bg-transparent border-none">
            <Image src="/assets/user.png" alt="User" width={50} height={50} />
          </div>
          <div>
            {userLoggedIn ? <LogoutButton /> : <a href="/login" className="bg-gray-200 text-black px-4 py-2 rounded-lg hover:bg-gray-300"
>Login</a>}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden mt-3 space-y-2 px-4">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="block text-gray-700 hover:text-blue-600 font-medium"
            >
              {item.name}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
