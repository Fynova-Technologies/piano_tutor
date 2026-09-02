import Footer from "@/features/home/footer";

export default function TermsAndConditionsPage() {
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
            Terms &amp; <em className="text-[#C9A84C]">Conditions</em>
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
                1. Acceptance of These Terms
              </h2>

              <p>
                Welcome to our piano learning platform. These Terms and
                Conditions govern your access to and use of our website,
                applications, lessons, practice tools, content, and related
                services.
              </p>

              <p className="mt-3">
                By accessing or using our services, you agree to be bound by
                these Terms and Conditions. If you do not agree with these
                terms, please do not use the service.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                2. Our Services
              </h2>

              <p>
                Our platform provides digital piano-learning resources designed
                to help users develop their musical knowledge, technique,
                sight-reading, practice habits, and overall piano skills.
              </p>

              <p className="mt-3">
                Features may include lessons, exercises, practice sessions,
                music notation, scores, progress tracking, achievements,
                learning statistics, and other educational tools.
              </p>

              <p className="mt-3">
                We may add, modify, suspend, or discontinue features from time
                to time.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                3. Account Registration
              </h2>

              <p>
                Some features may require you to create an account. You agree
                to provide accurate and current information when registering.
              </p>

              <p className="mt-3">
                You are responsible for maintaining the confidentiality of your
                account credentials and for activities conducted through your
                account.
              </p>

              <p className="mt-3">
                If you believe your account has been accessed without
                authorization, you should contact us promptly.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                4. Educational Nature of the Service
              </h2>

              <p>
                Our platform is intended to provide educational and practice
                resources. Results will vary between individuals depending on
                factors such as practice frequency, prior musical experience,
                technique, consistency, and other circumstances.
              </p>

              <p className="mt-3">
                We do not guarantee that using our services will result in a
                particular level of musical ability, examination result,
                performance outcome, or learning achievement.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                5. User Responsibilities
              </h2>

              <p>When using our services, you agree that you will not:</p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  Use the platform for unlawful or unauthorized purposes.
                </li>
                <li>
                  Attempt to gain unauthorized access to accounts, systems, or
                  data.
                </li>
                <li>
                  Interfere with the operation or security of the platform.
                </li>
                <li>
                  Copy, reproduce, distribute, or commercially exploit our
                  content without permission.
                </li>
                <li>
                  Reverse engineer or attempt to extract the underlying source
                  code except where permitted by applicable law.
                </li>
                <li>
                  Upload malicious code, harmful software, or other material
                  intended to damage the service.
                </li>
                <li>
                  Use automated systems to scrape or collect platform content
                  without permission.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                6. Intellectual Property
              </h2>

              <p>
                Unless otherwise stated, the platform, its software, branding,
                visual design, text, graphics, lesson materials, original
                exercises, logos, interfaces, and other original content are
                owned by or licensed to us and are protected by applicable
                intellectual property laws.
              </p>

              <p className="mt-3">
                Your use of the platform does not transfer ownership of any
                intellectual property to you.
              </p>

              <p className="mt-3">
                You may use educational materials provided through the service
                only for their intended personal and educational purposes,
                unless we provide separate written permission.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                7. Music and Third-Party Content
              </h2>

              <p>
                Some music, compositions, recordings, notation, or other
                materials available through the platform may be owned by third
                parties or used under applicable licenses.
              </p>

              <p className="mt-3">
                Such content remains subject to the rights of its respective
                owners and may not be copied, redistributed, or commercially
                exploited except where permitted.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                8. Subscriptions and Payments
              </h2>

              <p>
                Certain features or content may require a paid subscription or
                purchase.
              </p>

              <p className="mt-3">
                Pricing, billing periods, renewal terms, and applicable
                cancellation or refund conditions will be presented before a
                purchase is completed.
              </p>

              <p className="mt-3">
                Payments may be processed by third-party payment providers.
                Additional terms from those providers may apply to payment
                transactions.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                9. Free Trials and Promotional Features
              </h2>

              <p>
                From time to time, we may offer free trials, promotional
                features, discounts, or other special offers.
              </p>

              <p className="mt-3">
                Promotional offers may have additional terms, eligibility
                requirements, duration limits, or other restrictions that will
                be communicated when the offer is provided.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                10. User Content and Feedback
              </h2>

              <p>
                If you submit feedback, suggestions, testimonials, reviews, or
                other content to us, you grant us permission to use that
                material for purposes related to operating, improving, and
                promoting our services, subject to applicable law and our
                Privacy Policy.
              </p>

              <p className="mt-3">
                You should not submit content that infringes another person&apos;s
                rights or contains unlawful, harmful, or confidential
                information.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                11. Availability and Changes
              </h2>

              <p>
                We aim to keep our services available and reliable, but we do
                not guarantee uninterrupted or error-free operation.
              </p>

              <p className="mt-3">
                The platform may occasionally be unavailable because of
                maintenance, updates, technical problems, security incidents,
                or circumstances beyond our reasonable control.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                12. Disclaimer
              </h2>

              <p>
                Our services are provided on an &quot;as available&quot; and
                &quot;as is&quot; basis to the extent permitted by applicable
                law.
              </p>

              <p className="mt-3">
                We make reasonable efforts to provide useful and accurate
                educational content, but we do not warrant that all content
                will always be complete, accurate, current, or free from
                errors.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                13. Limitation of Liability
              </h2>

              <p>
                To the maximum extent permitted by applicable law, we will not
                be responsible for indirect, incidental, special, consequential,
                or similar damages arising from your use of or inability to use
                the service.
              </p>

              <p className="mt-3">
                Nothing in these Terms limits liability where such limitation
                is prohibited by applicable law.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                14. Suspension or Termination
              </h2>

              <p>
                We may suspend or terminate access to the service if we
                reasonably believe that a user has violated these Terms,
                engaged in abusive behavior, created a security risk, or used
                the service unlawfully.
              </p>

              <p className="mt-3">
                You may stop using the service at any time. Where applicable,
                account deletion or subscription cancellation may be subject to
                additional procedures.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                15. Privacy
              </h2>

              <p>
                Your use of the platform is also governed by our Privacy Policy,
                which explains how we collect and handle personal information.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                16. Changes to These Terms
              </h2>

              <p>
                We may update these Terms and Conditions from time to time.
                Updated terms will be posted on this page with a revised
                effective date.
              </p>

              <p className="mt-3">
                Your continued use of the service after changes become
                effective constitutes acceptance of the updated terms to the
                extent permitted by law.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                17. Governing Law
              </h2>

              <p>
                These Terms shall be interpreted and governed by the applicable
                laws of the jurisdiction in which the operating entity is
                established, except where mandatory consumer protection laws
                provide otherwise.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-[#1A1A1A]">
                18. Contact Us
              </h2>

              <p>
                If you have questions regarding these Terms and Conditions,
                please contact us:
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
