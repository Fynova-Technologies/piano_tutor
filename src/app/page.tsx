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

export default function Home() {
  

  return (
    <div className=" font-[family-name:var(--font-geist-sans)]">
            <div className="flex  justify-center bg-[#F8F6F1]">
              <div className=" w-full text-center">
                <Hero />
                <MusicLibrarySlider />
                <FeaturesShowcase />
                <TestimonialSection />
                <Pricesection />
                <FAQSection />
                <CTASection />
                {/* <PianoKeys /> */}
                {/* <Stats />
                <ProcessSection />
                <PlatformSection />
                
                
                <FAQSection />
                <CTASection /> */}
                
                <Footer />

              </div>
            </div>
    </div>
  );
}
