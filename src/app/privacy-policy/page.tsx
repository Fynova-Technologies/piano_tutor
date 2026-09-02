import Footer from "@/features/home/footer";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A]">
      <div className="mx-auto max-w-4xl px-6 py-20 md:px-8 md:py-28">
        {/* Header */}
        <div className="mb-14 text-center">
          <div className="mb-5 flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-[#C9A84C]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#C9A84C]">
              Legal
            </span>
            <div className="h-px w-8 bg-[#C9A84C]" />
          </div>

          <h1 className="mb-4 font-serif text-5xl font-black leading-tight md:text-6xl">
            Privacy <em className="text-[#C9A84C]">Policy</em>
          </h1>

          <p className="text-sm text-[#8A8078]">
            Effective Date: September 2, 2026
          </p>
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-white p-8 shadow-sm md:p-12">
          <div className="space-y-10 text-sm leading-7 text-[#5F5953]">

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                1. Introduction
              </h2>

              <p>
                Welcome to our piano learning platform. We are committed to
                protecting your privacy and handling your personal information
                responsibly.
              </p>

              <p className="mt-3">
                This Privacy Policy explains how we collect, use, store, and
                protect information when you access or use our website,
                applications, piano lessons, practice tools, and related
                services.
              </p>

              <p className="mt-3">
                By using our services, you acknowledge that you have read and
                understood this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                2. Information We Collect
              </h2>

              <p>
                Depending on how you use our platform, we may collect the
                following information:
              </p>

              <h3 className="mt-5 font-semibold text-[#1A1A1A]">
                Account Information
              </h3>

              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>Name or display name</li>
                <li>Email address</li>
                <li>Password or authentication information</li>
                <li>Account preferences</li>
              </ul>

              <h3 className="mt-5 font-semibold text-[#1A1A1A]">
                Learning and Practice Information
              </h3>

              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>Lessons completed</li>
                <li>Practice sessions</li>
                <li>Practice duration</li>
                <li>Scores and performance results</li>
                <li>Learning progress</li>
                <li>Practice history</li>
                <li>Achievements or milestones</li>
              </ul>

              <h3 className="mt-5 font-semibold text-[#1A1A1A]">
                Technical Information
              </h3>

              <p className="mt-2">
                We may automatically receive technical information such as
                browser type, device type, operating system, IP address,
                general usage information, and diagnostic information.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                3. How We Use Your Information
              </h2>

              <p>We may use collected information to:</p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Create and manage your account</li>
                <li>Provide piano lessons and learning resources</li>
                <li>Track your learning progress</li>
                <li>Calculate and display practice scores</li>
                <li>Improve lesson recommendations and learning experiences</li>
                <li>Maintain and improve our platform</li>
                <li>Respond to questions and support requests</li>
                <li>Detect and prevent misuse or fraudulent activity</li>
                <li>Maintain platform security</li>
                <li>Communicate important service updates</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                4. Cookies and Similar Technologies
              </h2>

              <p>
                We may use cookies, local storage, session storage, and similar
                technologies to keep you signed in, remember preferences,
                maintain functionality, understand usage, and improve the
                platform.
              </p>

              <p className="mt-3">
                You may be able to control cookies through your browser
                settings. Disabling certain cookies or storage technologies
                may affect some features of the platform.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                5. Payment Information
              </h2>

              <p>
                If paid subscriptions, purchases, or other payment services are
                offered, payments may be processed through third-party payment
                providers.
              </p>

              <p className="mt-3">
                We generally do not store complete payment card details on our
                own servers. Payment information is handled according to the
                privacy policies and security practices of the applicable
                payment provider.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                6. How We Share Information
              </h2>

              <p>
                We do not sell your personal information.
              </p>

              <p className="mt-3">
                We may share limited information with trusted service providers
                when necessary to operate our services. These providers may
                assist with hosting, authentication, analytics, payments,
                email delivery, security, or other technical services.
              </p>

              <p className="mt-3">
                We may also disclose information when required by law, legal
                process, or to protect our rights, users, services, or the
                safety of others.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                7. Data Security
              </h2>

              <p>
                We take reasonable technical and organizational measures to
                protect personal information against unauthorized access,
                alteration, disclosure, or destruction.
              </p>

              <p className="mt-3">
                However, no method of transmission or electronic storage is
                completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                8. Data Retention
              </h2>

              <p>
                We retain personal information for as long as reasonably
                necessary to provide our services, maintain your account,
                comply with legal obligations, resolve disputes, and enforce
                our agreements.
              </p>

              <p className="mt-3">
                When information is no longer required, we may delete or
                anonymize it in accordance with our operational and legal
                requirements.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                9. Your Rights
              </h2>

              <p>
                Depending on where you live, you may have rights regarding your
                personal information, including the right to:
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Access information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of certain information</li>
                <li>Withdraw consent where applicable</li>
                <li>Request information about how your data is used</li>
              </ul>

              <p className="mt-3">
                To exercise an applicable privacy right, contact us using the
                email address provided below.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                10. Children&apos;s Privacy
              </h2>

              <p>
                Our services are not intended to knowingly collect personal
                information from children in circumstances where parental
                consent is legally required.
              </p>

              <p className="mt-3">
                If you believe that a child has provided personal information
                without the appropriate consent, please contact us so that we
                can review and take appropriate action.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                11. Third-Party Services
              </h2>

              <p>
                Our platform may contain links to or integrations with
                third-party services. Those services have their own privacy
                policies and terms, and we are not responsible for their
                privacy practices.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                12. Changes to This Privacy Policy
              </h2>

              <p>
                We may update this Privacy Policy from time to time to reflect
                changes to our services, technology, legal requirements, or
                business practices.
              </p>

              <p className="mt-3">
                Any updated version will be posted on this page with an updated
                effective date.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                13. Contact Us
              </h2>

              <p>
                If you have questions about this Privacy Policy or how your
                information is handled, please contact us:
              </p>

              <div className="mt-5 rounded-lg border border-[#E8E2D9] bg-[#F5F2ED] p-5">
                <p className="font-semibold text-[#1A1A1A]">
                  Email
                </p>
                <a
                  href="mailto:contact@fynovatech.com"
                  className="text-[#C9A84C] transition-colors hover:text-[#A98735]"
                >
                  contact@fynovatech.com
                </a>
              </div>
            </section>

          </div>
        </div>

        <p className="mt-8 text-center text-xs text-[#8A8078]">
          © {new Date().getFullYear()} Fynovatech. All rights reserved.
        </p>
      </div>
      <Footer />
    </main>
  );
}

