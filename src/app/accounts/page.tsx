'use client'
import React, { useState } from 'react';
import { User, DollarSign, FileText, Edit2 } from 'lucide-react';

export default function MyAccount() {
  const [activeSection, setActiveSection] = useState('account');

  return (
    <div className="min-h-screen bg-[#F8F6F1] p-10 text-[#151517">
      {/* Main Content */}
      <div className="mx-auto max-w-7xl p-6 bg-[#FEFEFE] rounded-[32px]">

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 space-y-2 mt-16">
            <button
              onClick={() => setActiveSection('account')}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                activeSection === 'account'
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User className="h-5 w-5" />
              <span className="font-normal text-[16px]">My Account</span>
            </button>
            <button
              onClick={() => setActiveSection('billing')}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                activeSection === 'billing'
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <DollarSign className="h-5 w-5" />
              <span className="font-normal text-[16px]">Billing</span>
            </button>
            <button
              onClick={() => setActiveSection('sheet')}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                activeSection === 'sheet'
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="font-normal text-[16px]">My Music Sheet</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 space-y-6">
            {/* Personal Information */}
            <h1 className="mb-6 font-bold text-[#0A0A0B] text-[24px]">My Account</h1>

            <div className="rounded-[16px] bg-[#FEFEFE] p-6 shadow-[0px_5px_7px_8px_#0000001A]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl text-[#0A0A0B] font-medium">Personal Information</h2>
                <button className="flex items-center gap-4 rounded-2xl bg-[#581845] px-[16px] py-[10px] text-[16px] text-white hover:bg-purple-900">
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-1 block text-[16px] font-medium text-[#1C1C1E]">
                    First Name
                  </label>
                  <p className="text-[#6E6E73]">Anonymous</p>
                </div>
                <div>
                  <label className="mb-1 block text-[16px] font-medium text-[#1C1C1E]">
                    Last Name
                  </label>
                  <p className="text-[#6E6E73]">Anonymous</p>
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-[16px] font-medium text-[#1C1C1E]">
                    Phone
                  </label>
                  <p className="text-[#6E6E73]">**********</p>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="rounded-lg bg-white p-6 shadow-[0px_5px_7px_8px_#0000001A]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl text-[#0A0A0B] font-medium">Account Info</h2>
                <button className="flex items-center gap-2 rounded-2xl bg-[#581845] px-[16px] py-[10px] text-[16px] text-white hover:bg-purple-900">
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-1 block text-[16px] font-medium text-[#1C1C1E]">
                    Account Type
                  </label>
                  <p className="text-green-600 font-medium">
                    Free Trial 
                  </p>
                  <p className='text-[#6E6E73]'>(Until May 25, 2025)</p>
                </div>
                <div>
                  <label className="mb-1 block text-[16px] font-medium text-[#1C1C1E]">
                    Account Code
                  </label>
                  <p className="text-[#6E6E73]">456412</p>
                </div>
                <div>
                  <label className="mb-1 block text-[16px] font-medium text-[#1C1C1E]">
                    Email address
                  </label>
                  <p className="text-[#6E6E73]">anonymous@gmail.com</p>
                </div>
                <div>
                  <label className="mb-1 block text-[16px] font-medium text-[#1C1C1E]">
                    Password
                  </label>
                  <p className="text-[#6E6E73]">**********</p>
                </div>
              </div>
            </div>

            {/* Teacher & Classes */}
            <div className="rounded-lg bg-white p-6 shadow-[0px_5px_7px_8px_#0000001A]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl text-[#0A0A0B] font-medium">Teacher & Classes</h2>
                <button className="flex items-center gap-2 rounded-2xl bg-[#581845] px-[16px] py-[10px] text-[16px] text-white hover:bg-purple-900">
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
              </div>
              <div>
                <label className="mb-1 block text-[16px] font-medium text-[#1C1C1E]">
                  Teacher
                </label>
                <p className="text-[#6E6E73]">None</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}