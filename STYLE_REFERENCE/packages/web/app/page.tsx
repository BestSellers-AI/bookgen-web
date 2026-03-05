import Navbar from '@/components/layout/Navbar'
import HeroSection from '@/components/sections/HeroSection'
import DreamSection from '@/components/sections/DreamSection'
import SocialProofSection from '@/components/sections/SocialProofSection'
import HowItWorksSection from '@/components/sections/HowItWorksSection'
import ValueAnchorSection from '@/components/sections/ValueAnchorSection'
import PricingSection from '@/components/sections/PricingSection'
import FAQSection from '@/components/sections/FAQSection'
import FooterCTASection from '@/components/sections/FooterCTASection'
import Footer from '@/components/layout/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-navy-900 overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <DreamSection />
      <SocialProofSection />
      <HowItWorksSection />
      <ValueAnchorSection />
      <PricingSection />
      <FAQSection />
      <FooterCTASection />
      <Footer />
    </main>
  )
}
