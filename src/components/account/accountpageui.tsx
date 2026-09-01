/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { useState } from "react";

type Invoice = {
  date: string;
  invoice_no: string;
  amount: number;
  status: string;
};




export default function AccountPageUI({
  user,
  profile,
  subscription,
  musicSheets = [],
  invoices = [],
}: {
  user: any;
  profile: any;
  subscription: any;
  musicSheets?: any[];
  invoices?: Invoice[];
}) {
  const [activeTab, setActiveTab] = useState("account");
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fullName = profile?.full_name || user?.user_metadata?.full_name || "Anonymous";
  const [initialFirst, ...rest] = fullName.split(" ");
  const initialLast = rest.join(" ");

  const [firstName, setFirstName] = useState(profile?.first_name || initialFirst || "");
  const [lastName, setLastName] = useState(profile?.last_name || initialLast || "");

  async function handleSavePersonal() {
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to save changes.");
        return;
      }
      setIsEditingPersonal(false);
      // optional: router.refresh() if using next/navigation to re-pull server data
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }


  const TIER: Record<string, number> = { free: 0, sonata: 1, concerto: 2 };

// inside the component, near fullName/firstName logic:
const currentPlanKey = (subscription?.planName ?? "free").toLowerCase();
const currentTierValue = TIER[currentPlanKey] ?? 0;
const isTopTier = currentTierValue >= TIER.concerto; // adjust if you add a higher tier later

  type SidebarItemProps = {
    label: string;
    active?: boolean;
    imgsrc: string;
    onClick: () => void;
  };

  function SidebarItem({ label, active = false, imgsrc, onClick }: SidebarItemProps) {
    return (
      <div
        onClick={onClick}
        className={`flex px-4 py-4 rounded-lg cursor-pointer text-sm transition-all duration-200 ${
          active
            ? "bg-[#D4AF37] text-[#151517] font-medium text-[16px]"
            : "hover:bg-gray-100 text-[#151517] font-medium text-[16px]"
        }`}
      >
        <Image
          src={imgsrc}
          height={20}
          width={20}
          alt={label}
          className="inline-block mr-2"
        />
        {label}
      </div>
    );
  }

  function SectionCard({
  title,
  children,
  activeTab,
  onEditClick,
}: {
  title: string;
  children: React.ReactNode;
  activeTab: string;
  onEditClick?: () => void;
}) {
  return (
    <div className="bg-[#FEFEFE] rounded-xl p-5 relative border border-[#ECECEC]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl text-[#0A0A0B] font-medium">{title}</h2>

        {onEditClick && activeTab !== "music" && activeTab !== "billing" && (
          <button
            onClick={onEditClick}
            className="bg-[#581845] text-white px-4 py-3 rounded-2xl text-[16px] flex justify-center items-center hover:opacity-90 transition"
          >
            <Image src="/icon-wrapper-h.svg" height={15} width={15} alt="Edit" className="inline-block mr-3" />
            Edit
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

  function Info({ label, value }: { label: string; value: string }) {
    return (
      <div>
        <p className="text-[16px] font-medium text-[#1C1C1E]">{label}</p>
        <p className="text-[16px] text-[#6E6E73] mt-1">{value}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FEFEFE] min-h-screen p-4 md:p-16">
      <div className="w-full h-full mx-auto bg-white rounded-2xl p-4 md:p-8 shadow-sm">
{activeTab === "account" && (
  <h1
    className="text-xl md:text-2xl text-[#0A0A0B] font-semibold mb-4 md:mb-6 md:pl-[calc(220px+1.5rem)]"
  >
    My Account
  </h1>
)}
{activeTab === "billing" && (
  <h1
    className="text-xl md:text-2xl text-[#0A0A0B] font-semibold mb-4 md:mb-6 md:pl-[calc(220px+1.5rem)]"
  >
    Billings
  </h1>
)}
{activeTab === "music" && (
  <h1
    className="text-xl md:text-2xl text-[#0A0A0B] font-semibold mb-4 md:mb-6 md:pl-[calc(220px+1.5rem)]"
  >
    My Music Sheet
  </h1>
)}
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 md:gap-6">
          {/* Sidebar */}
          <div className="flex flex-row md:flex-col md:space-y-3 gap-2 md:gap-0 overflow-x-auto md:overflow-visible -mx-1 px-1 md:mx-0 md:px-0">
            <SidebarItem
              active={activeTab === "account"}
              label="My Account"
              imgsrc="/account.svg"
              onClick={() => setActiveTab("account")}
            />

            <SidebarItem
              active={activeTab === "billing"}
              label="Billings"
              imgsrc="/BIlls.svg"
              onClick={() => setActiveTab("billing")}
            />

            <SidebarItem
              active={activeTab === "music"}
              label="My Music Sheet"
              imgsrc="/music-sheet.svg"
              onClick={() => setActiveTab("music")}
            />
          </div>

          {/* RIGHT CONTENT */}
          <div className="space-y-4 md:space-y-6">
            {/* ================= ACCOUNT ================= */}
            {activeTab === "account" && (
              <>
                

                {/* Personal Info */}
                <SectionCard
  title="Personal Information"
  activeTab={activeTab}
  onEditClick={() => setIsEditingPersonal((v) => !v)}
>
  {formError && (
    <p className="text-sm text-red-500 mb-3">{formError}</p>
  )}

  {isEditingPersonal ? (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <div>
        <p className="text-[16px] font-medium text-[#1C1C1E] mb-1">First Name</p>
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full border border-[#ECECEC] rounded-lg px-3 py-2 text-[16px] text-[#1C1C1E]"
        />
      </div>
      <div>
        <p className="text-[16px] font-medium text-[#1C1C1E] mb-1">Last Name</p>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full border border-[#ECECEC] rounded-lg px-3 py-2 text-[16px] text-[#1C1C1E]"
        />
      </div>
      <div className="md:col-span-2 flex gap-3 mt-2">
        <button
          onClick={handleSavePersonal}
          disabled={saving}
          className="bg-[#D4AF37] text-[#151517] px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={() => setIsEditingPersonal(false)}
          className="px-5 py-2.5 rounded-xl font-medium text-[#6E6E73] hover:bg-gray-100 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <Info label="First Name" value={firstName || "Anonymous"} />
      <Info label="Last Name" value={lastName || "Anonymous"} />
    </div>
  )}
</SectionCard>
                {/* Account Info */}
                <SectionCard title="Account Info" activeTab={activeTab}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <Info
                      label="Account Type"
                      value={subscription?.plan || "Free Trial"}
                    />

                    <Info
                      label="Account Code"
                        value={profile?.account_code || user.id.slice(0, 6)} // fallback only if profile missing
                    />

                    <Info
                      label="Email address"
                      value={user.email}
                    />

                    <Info
                      label="Password"
                      value="********"
                    />
                  </div>
                </SectionCard>

                {/* Teacher */}
                <SectionCard title="Teacher & Classes" activeTab={activeTab}>
                  <Info label="Teacher" value="None" />
                </SectionCard>
              </>
            )}

            {/* ================= BILLINGS ================= */}
            {activeTab === "billing" && (
              <>

                {/* Current Plan */}
                <SectionCard title="Current Subscription" activeTab={activeTab}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
  <div>
    <h3 className="text-xl font-semibold text-[#151517]">
      {subscription?.plan || "Free Trial"}
    </h3>

    <p className="text-[#6E6E73] mt-2">
      Status:{" "}
      <span className="text-[#3B6D11] font-medium">
        {subscription?.status || "Active"}
      </span>
    </p>

    <p className="text-[#6E6E73] mt-1">
      Renew Date: {subscription?.renew_date || "N/A"}
    </p>
  </div>

  {!isTopTier && (
    <button className="bg-[#D4AF37] text-[#151517] px-5 py-3 rounded-xl font-medium hover:opacity-90 transition w-full md:w-auto">
      Upgrade Plan
    </button>
  )}
</div>
                </SectionCard>

                {/* Billing History */}
                <SectionCard title="Billing History" activeTab={activeTab}>
                  <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-y-3 min-w-[480px]">
                      <thead>
                        <tr className="text-left text-[#6E6E73] text-sm">
                          <th>Date</th>
                          <th>Invoice</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {invoices.length > 0 ? (
                          invoices.map((invoice, index) => (
                            <tr
                              key={index}
                              className="bg-[#faf8f2]"
                            >
                              <td className="p-4 rounded-l-xl">
                                {invoice.date}
                              </td>

                              <td>{invoice.invoice_no}</td>

                              <td>${invoice.amount}</td>

                              <td className="rounded-r-xl">
                                <span className="bg-[#DFF5E1] text-[#3B6D11] px-3 py-1 rounded-full text-sm">
                                  {invoice.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="text-center py-10 text-[#6E6E73]"
                            >
                              No billing history available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </>
            )}

            {/* ================= MUSIC SHEETS ================= */}
            {activeTab === "music" && (
              <>

                <SectionCard title="" activeTab={activeTab}>
                  {musicSheets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {musicSheets.map((sheet, index) => (
                        <div
                          key={index}
                          className="border border-[#ECECEC] rounded-2xl p-5 hover:shadow-md transition"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-[#151517]">
                                {sheet.title}
                              </h3>

                              <p className="text-sm text-[#6E6E73] mt-1">
                                Composer: {sheet.composer}
                              </p>

                              <p className="text-sm text-[#6E6E73] mt-1">
                                Difficulty: {sheet.level}
                              </p>
                            </div>

                            <Image
                              src="/music-sheet.svg"
                              alt="sheet"
                              width={32}
                              height={32}
                            />
                          </div>

                          <button className="mt-5 w-full bg-[#581845] text-white py-3 rounded-xl hover:opacity-90 transition">
                            Open Sheet
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-14">
                      <Image
                        src="/amico.png"
                        width={100}
                        height={100}
                        alt="empty"
                        className="mx-auto"
                      />

                      <p className="mt-4 text-[16px] font-medium text-black">
                        You don`t have any sheet music yet. <br></br> Start browsing the library to add some.
                      </p>
                    </div>
                  )}
                </SectionCard>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}