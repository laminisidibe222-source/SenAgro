import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../sections/Hero";
import ProblemSolution from "../sections/ProblemSolution";
import LandIntel from "../sections/LandIntel";
import CropGallery from "../sections/CropGallery";
import SocialProof from "../sections/SocialProof";
import CTASection from "../sections/CTASection";

export default function Landing() {
  return (
    <div className="grain bg-charcoal soil-dots min-h-screen text-cream">
      <Navbar />
      <main>
        <Hero />
        <ProblemSolution />
        <LandIntel />
        <CropGallery />
        <SocialProof />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
