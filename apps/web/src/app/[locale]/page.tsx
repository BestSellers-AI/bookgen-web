import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/sections/HeroSection'
import AiCoversSection from '@/components/landing/sections/AiCoversSection'
import DreamSection from '@/components/landing/sections/DreamSection'
import SocialProofSection from '@/components/landing/sections/SocialProofSection'
import HowItWorksSection from '@/components/landing/sections/HowItWorksSection'
import FreeSamplesSection from '@/components/landing/sections/FreeSamplesSection'
import ValueAnchorSection from '@/components/landing/sections/ValueAnchorSection'
import AmazonKdpSection from '@/components/landing/sections/AmazonKdpSection'
import PricingSection from '@/components/landing/sections/PricingSection'
import FAQSection from '@/components/landing/sections/FAQSection'
import FooterCTASection from '@/components/landing/sections/FooterCTASection'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    <main className="landing min-h-screen overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <DreamSection />
      <AiCoversSection />
      <HowItWorksSection />
      <FreeSamplesSection />
      <ValueAnchorSection />
      <AmazonKdpSection />
      <SocialProofSection />
      <PricingSection />
      <FAQSection />
      <FooterCTASection />
      <Footer />
    </main>
  )
}
