'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';


const navItems = [
  { name: 'Methods', href: '/method' },
  {name: 'Library',href:"/library"},
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Projects', href: '/musicsheet' },
  
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();


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
            const isActive = pathname === item.href;
              return(
                <a
                  key={item.name}
                  href={item.href}
                  className={`font-medium px-6 py-4 rounded-full transition-all duration-200
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
          <button className="relative text-gray-600 hover:text-blue-600">
            <Image src={"/assets/Icon.svg" } width={26} height={30} alt='bell'/>
            <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile */}
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <Image src="/assets/user.png" alt="User" width={1000} height={500} />
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
