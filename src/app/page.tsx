"use client";

// import Stats from "@/features/home/stats";
import Hero from "@/features/home/hero";
// import PianoKeys from "@/features/home/pianokeys";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Piano } from "lucide-react";
// import ProcessSection from "@/features/home/process";
import CTASection from "@/features/home/cta";
import FAQSection from "@/features/home/faqsection";
import Footer from "@/features/home/footer";
// import PlatformSection from "@/features/home/platform";
import Pricesection from "@/features/home/pricesection";
import TestimonialSection from "@/features/home/testimonial";
import MusicLibrarySlider from "@/features/home/musiclibrararyslider";
import FeaturesShowcase from "@/features/home/featureshowcase";
import ContactPage from "@/features/home/contactus";

export default function Home() {
  

  return (
    <div className=" font-[family-name:var(--font-geist-sans)]">
            <div className="flex  justify-center bg-[#F8F6F1]">
              <div className=" w-full text-center">
                <Hero />
                {/* <PianoKeys /> */}
                {/* <Stats />
                <ProcessSection />
                <PlatformSection />
                
                
                <FAQSection />
                <CTASection /> */}

<section id="how-it-works" className="scroll-mt-20">
  <MusicLibrarySlider />
</section>

<section id="features" className="scroll-mt-20">
  <FeaturesShowcase />
</section>

<TestimonialSection />

<section id="pricing" className="scroll-mt-20">
  <Pricesection />
</section>

<section id="faqs" className="scroll-mt-20">
  <FAQSection />
</section>

<CTASection />


                <ContactPage/>
                
                <Footer />

              </div>
            </div>
    </div>
  );
}
