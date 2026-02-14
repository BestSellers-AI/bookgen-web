import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Sparkles, 
  PenTool, 
  Library, 
  ArrowRight, 
  Github,
  Cpu,
  Zap,
  Globe
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 glass border-b border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center glow-primary">
              <BookOpen className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">BookGen</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-primary transition-colors">How it Works</Link>
            <Link href="/auth/login" className="hover:text-primary transition-colors">Sign In</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button size="sm" className="glow-primary" asChild>
              <Link href="/auth/register">Start Writing</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-16">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <Badge variant="outline" className="py-1 px-4 border-primary/20 bg-primary/5 text-primary animate-pulse">
                AI-Powered Writing Assistant
              </Badge>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
                Transform Your Ideas into <br />
                <span className="text-gradient-primary">Amazing Books</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                BookGen uses cutting-edge Artificial Intelligence to help you structure, 
                write, and manage your literary works. From initial briefing to final manuscript.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button size="lg" className="h-12 px-8 text-base glow-primary" asChild>
                  <Link href="/auth/register">
                    Create My First Book <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 text-base glass-hover" asChild>
                  <Link href="/auth/login">
                    View My Library
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Background Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-black/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Empower Your Creativity</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Intelligent tools designed for modern writers seeking efficiency and quality.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Sparkles className="w-6 h-6 text-yellow-500" />,
                  title: "AI Structuring",
                  description: "Generate outlines and chapter structures based on your initial briefing in seconds."
                },
                {
                  icon: <PenTool className="w-6 h-6 text-blue-500" />,
                  title: "Assisted Writing",
                  description: "Overcome writer's block with real-time content suggestions and idea expansion."
                },
                {
                  icon: <Library className="w-6 h-6 text-purple-500" />,
                  title: "Library Management",
                  description: "Organize all your projects, drafts, and versions in one intuitive dashboard."
                },
                {
                  icon: <Cpu className="w-6 h-6 text-green-500" />,
                  title: "n8n Processing",
                  description: "Powerful integration with automation workflows to generate high-quality literary previews."
                },
                {
                  icon: <Zap className="w-6 h-6 text-pink-500" />,
                  title: "Instant Feedback",
                  description: "Receive analysis on tone, pacing, and narrative coherence as you write."
                },
                {
                  icon: <Globe className="w-6 h-6 text-white" />,
                  title: "Flexible Export",
                  description: "Prepare your book for publication in multiple formats with just a few clicks."
                }
              ].map((feature, i) => (
                <Card key={i} className="glass border-white/5 glass-hover overflow-hidden group">
                  <CardContent className="p-8 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="glass border-white/10 rounded-3xl p-12 md:p-20 text-center space-y-8 max-w-5xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Your literary journey starts here.
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Don't leave your stories only in your imagination. Use BookGen to bring your books to life today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="h-14 px-10 text-lg glow-primary w-full sm:w-auto" asChild>
                  <Link href="/auth/register">Start for Free</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg glass-hover w-full sm:w-auto" asChild>
                  <Link href="/auth/login">Access My Account</Link>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)]" />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-black/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <BookOpen className="text-white w-4 h-4" />
              </div>
              <span className="font-bold text-lg tracking-tight">BookGen</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="hover:text-white transition-colors">Contact</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 BookGen. Artificial Intelligence for Writers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
