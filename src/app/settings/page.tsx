"use client";

import { useState } from "react";

type FaqItem = {
  q: string;
  a: string;
  tag: string;
};

type ContactChannel = {
  icon: string;
  label: string;
  sublabel: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    tag: "getting-started",
    q: "How do I start my first piano lesson?",
    a: "After signing up, go to the Lessons tab and choose Beginner. Select a lesson from the catalogue and press Start. Make sure your device audio is on — the lesson will guide you note by note.",
  },
  {
    tag: "getting-started",
    q: "Can I learn without a physical piano or keyboard?",
    a: "Yes. You can use the on-screen virtual keyboard for beginner lessons. However, for intermediate and advanced lessons a physical or MIDI keyboard is strongly recommended for proper technique development.",
  },
  {
    tag: "billing",
    q: "How do I upgrade my subscription plan?",
    a: "Go to Account → Billing & Subscription and click Upgrade Plan. Choose your preferred plan and enter your payment details. The upgrade takes effect immediately and you'll be charged a prorated amount.",
  },
  {
    tag: "teachers",
    q: "How does my teacher assign lessons to me?",
    a: "Once you're connected to a teacher, they can assign lessons and sheet music directly from their dashboard. You'll see assigned items flagged in your Lessons tab and receive an in-app notification.",
  },
  {
    tag: "getting-started",
    q: "Can I record my practice sessions?",
    a: "Recording is available on the Pro plan and above. Tap the record button in the lesson view, and the session is saved to My Recordings. You can share recordings with your teacher for feedback.",
  },
  {
    tag: "account",
    q: "How do I reset my password?",
    a: "Go to Account → Account Info and click Edit. Select Change Password and enter your current password followed by your new one. Alternatively, use Forgot Password on the login screen to reset via email.",
  },
  {
    tag: "getting-started",
    q: "Is there a mobile app available?",
    a: "Yes — the app is available on iOS and Android. Download it from the App Store or Google Play and sign in with your existing account. All your progress and saved sheets sync automatically.",
  },
  {
    tag: "sheet-music",
    q: "Can I download sheet music for offline use?",
    a: "Yes — open any sheet music, tap the download icon in the top right, and it saves to My Music Sheet. Downloaded sheets are available offline under the Music Sheet tab in your account.",
  },
];

const POPULAR_FAQS: FaqItem[] = [
  {
    tag: "getting-started",
    q: "How do I set up my MIDI keyboard with the lessons?",
    a: "Connect your MIDI keyboard via USB or Bluetooth before starting a lesson. Go to Settings → Devices and select your keyboard. The app will auto-detect compatible models. If it isn't detected, try a different USB port or restart the app.",
  },
  {
    tag: "sheet-music",
    q: "Can I download sheet music for offline use?",
    a: "Yes — open any sheet music, tap the download icon in the top right, and it saves to My Music Sheet. Downloaded sheets are available offline under the Music Sheet tab in your account.",
  },
  {
    tag: "getting-started",
    q: "How do I switch to a different difficulty level?",
    a: "On the lesson catalogue page, use the Difficulty filter (Beginner / Intermediate / Advanced). You can also set a default level under Account → Preferences so new recommendations match your level automatically.",
  },
  {
    tag: "billing",
    q: "What happens to my progress if I cancel my plan?",
    a: "Your progress data and saved sheets are retained for 90 days after cancellation. You can reactivate anytime to regain full access. After 90 days, data may be permanently removed.",
  },
];

const TOPICS = [
  { icon: "🎹", label: "Getting started", sublabel: "Setup & first lessons", tag: "getting-started" },
  { icon: "🎼", label: "Sheet music", sublabel: "Reading & saving", tag: "sheet-music" },
  { icon: "💳", label: "Billing & plans", sublabel: "Payments & upgrades", tag: "billing" },
  { icon: "👩‍🏫", label: "Teachers", sublabel: "Finding & booking", tag: "teachers" },
  { icon: "📈", label: "Progress", sublabel: "Track your growth", tag: "progress" },
  { icon: "⚙️", label: "Account", sublabel: "Settings & profile", tag: "account" },
];

const CONTACT_CHANNELS: ContactChannel[] = [
  { icon: "✉️", label: "Email support", sublabel: "Reply within 24 hrs" },
  { icon: "💬", label: "Community", sublabel: "Live peer help" },
  { icon: "🎥", label: "Video tutorials", sublabel: "Step-by-step guides" },
];

type Tab = "browse" | "faq" | "contact";

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      {items.map((item, i) => (
        <div
          key={i}
          className={`border-b border-[#ECECEC] last:border-b-0`}
        >
          <button
            className="w-full flex justify-between items-center py-[14px] text-left text-[15px] font-medium text-[#1C1C1E] bg-transparent border-none cursor-pointer gap-3"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <span>{item.q}</span>
            <span
              className={`text-[#6E6E73] text-lg transition-transform duration-200 flex-shrink-0 ${
                openIndex === i ? "rotate-180" : ""
              }`}
            >
              ▾
            </span>
          </button>
          {openIndex === i && (
            <p className="text-[14px] text-[#6E6E73] leading-relaxed pb-[14px]">
              {item.a}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function SectionCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#FEFEFE] rounded-xl p-5 border border-[#ECECEC]">
      <div className="flex items-center mb-4 gap-3">
        <h2 className="text-[17px] font-medium text-[#0A0A0B]">{title}</h2>
        {badge && (
          <span className="bg-[#fdf3d0] text-[#854F0B] text-[11px] font-medium px-[10px] py-[3px] rounded-full">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

type SidebarItemProps = {
  label: string;
  active?: boolean;
  icon: string;
  onClick: () => void;
};

function SidebarItem({ label, active = false, icon, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-[10px] px-[14px] py-[12px] rounded-[10px] text-[15px] font-medium transition-all duration-150 border-none cursor-pointer text-left ${
        active
          ? "bg-[#D4AF37] text-[#151517]"
          : "bg-transparent hover:bg-gray-100 text-[#151517]"
      }`}
    >
      <span className="text-[18px]">{icon}</span>
      {label}
    </button>
  );
}

export default function SupportPageUI() {
  const [activeTab, setActiveTab] = useState<Tab>("browse");
  const [faqSearch, setFaqSearch] = useState("");
  const [contactForm, setContactForm] = useState({
    firstName: "",
    email: "",
    topic: "Getting started",
    message: "",
  });

  const filteredFaqs = FAQ_ITEMS.filter((item) =>
    faqSearch === "" || item.q.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const tabTitle: Record<Tab, string> = {
    browse: "Support",
    faq: "Support",
    contact: "Support",
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen p-4 md:p-16">
      <div className="w-full mx-auto bg-white rounded-2xl p-4 md:p-8 shadow-sm">
        {/* Heading aligned only above cards column on desktop */}
        <h1
          className="text-xl md:text-2xl font-semibold text-[#0A0A0B] mb-4 md:mb-6 md:pl-[calc(200px+1.5rem)]"
        >
          {tabTitle[activeTab]}
        </h1>

        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-[200px_1fr]">
          {/* Sidebar */}
          <nav
            className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible -mx-1 px-1 md:mx-0 md:px-0"
            aria-label="Support sections"
          >
            <SidebarItem
              active={activeTab === "browse"}
              label="Browse topics"
              icon="❓"
              onClick={() => setActiveTab("browse")}
            />
            <SidebarItem
              active={activeTab === "faq"}
              label="FAQ"
              icon="📋"
              onClick={() => setActiveTab("faq")}
            />
            <SidebarItem
              active={activeTab === "contact"}
              label="Contact us"
              icon="💬"
              onClick={() => setActiveTab("contact")}
            />
          </nav>

          {/* Right content */}
          <div className="flex flex-col gap-4">

            {/* ========== BROWSE ========== */}
            {activeTab === "browse" && (
              <>
                {/* Search */}
                <div className="flex items-center gap-[10px] bg-[#F5F5F5] border border-[#ECECEC] rounded-[10px] px-[14px] py-[10px]">
                  <span className="text-[#6E6E73] text-[18px]">🔍</span>
                  <input
                    type="text"
                    placeholder="Search for help…"
                    className="border-none bg-transparent outline-none text-[15px] text-[#1C1C1E] w-full placeholder-[#AEAEB2]"
                    aria-label="Search support topics"
                  />
                </div>

                {/* Topic cards */}
                <SectionCard title="Browse help topics">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[10px]">
                    {TOPICS.map((topic) => (
                      <div
                        key={topic.tag}
                        className="border border-[#ECECEC] rounded-[10px] p-4 cursor-pointer hover:bg-gray-50 transition-colors text-center"
                      >
                        <span className="text-[26px] block mb-2">{topic.icon}</span>
                        <span className="text-[14px] font-medium text-[#151517] block">
                          {topic.label}
                        </span>
                        <span className="text-[12px] text-[#6E6E73] mt-1 block">
                          {topic.sublabel}
                        </span>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Popular articles */}
                <SectionCard title="Popular articles" badge="New">
                  <FaqAccordion items={POPULAR_FAQS} />
                </SectionCard>
              </>
            )}

            {/* ========== FAQ ========== */}
            {activeTab === "faq" && (
              <>
                <div className="flex items-center gap-[10px] bg-[#F5F5F5] border border-[#ECECEC] rounded-[10px] px-[14px] py-[10px]">
                  <span className="text-[#6E6E73] text-[18px]">🔍</span>
                  <input
                    type="text"
                    placeholder="Search FAQs…"
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    className="border-none bg-transparent outline-none text-[15px] text-[#1C1C1E] w-full placeholder-[#AEAEB2]"
                    aria-label="Search FAQs"
                  />
                </div>

                <SectionCard title="Frequently asked questions">
                  {filteredFaqs.length > 0 ? (
                    <FaqAccordion items={filteredFaqs} />
                  ) : (
                    <p className="text-center py-8 text-[#6E6E73] text-[14px]">
                      No results found. Try different keywords.
                    </p>
                  )}
                </SectionCard>
              </>
            )}

            {/* ========== CONTACT ========== */}
            {activeTab === "contact" && (
              <SectionCard title="Get in touch">
                {/* Channel cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-[10px] mb-5">
                  {CONTACT_CHANNELS.map((ch) => (
                    <div
                      key={ch.label}
                      className="border border-[#ECECEC] rounded-[10px] p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[24px] block mb-2">{ch.icon}</span>
                      <div className="text-[14px] font-medium text-[#151517]">{ch.label}</div>
                      <div className="text-[12px] text-[#6E6E73] mt-1">{ch.sublabel}</div>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t border-[#ECECEC] pt-5">
                  <p className="text-[15px] font-medium text-[#0A0A0B] mb-4">
                    Send us a message
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px] mb-[10px]">
                    <div className="flex flex-col gap-[6px]">
                      <label className="text-[13px] font-medium text-[#6E6E73]">
                        First name
                      </label>
                      <input
                        type="text"
                        placeholder="Anonymous"
                        value={contactForm.firstName}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, firstName: e.target.value })
                        }
                        className="border border-[#ECECEC] rounded-lg px-[12px] py-[10px] text-[14px] text-[#1C1C1E] outline-none focus:border-[#D4AF37] transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-[6px]">
                      <label className="text-[13px] font-medium text-[#6E6E73]">
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, email: e.target.value })
                        }
                        className="border border-[#ECECEC] rounded-lg px-[12px] py-[10px] text-[14px] text-[#1C1C1E] outline-none focus:border-[#D4AF37] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-[6px] mb-[10px]">
                    <label className="text-[13px] font-medium text-[#6E6E73]">
                      Topic
                    </label>
                    <select
                      value={contactForm.topic}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, topic: e.target.value })
                      }
                      className="border border-[#ECECEC] rounded-lg px-[12px] py-[10px] text-[14px] text-[#1C1C1E] outline-none focus:border-[#D4AF37] transition-colors bg-white"
                    >
                      <option>Getting started</option>
                      <option>Sheet music</option>
                      <option>Billing & plans</option>
                      <option>Teacher & classes</option>
                      <option>Technical issue</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-[6px] mb-4">
                    <label className="text-[13px] font-medium text-[#6E6E73]">
                      Message
                    </label>
                    <textarea
                      placeholder="Describe your issue or question…"
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, message: e.target.value })
                      }
                      className="border border-[#ECECEC] rounded-lg px-[12px] py-[10px] text-[14px] text-[#1C1C1E] outline-none focus:border-[#D4AF37] transition-colors resize-y"
                    />
                  </div>

                  <button className="bg-[#581845] text-white px-6 py-[11px] rounded-xl text-[15px] font-medium hover:opacity-90 transition-opacity cursor-pointer border-none w-full md:w-auto">
                    Send message
                  </button>
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}