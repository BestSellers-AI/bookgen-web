import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { GoogleOAuthWrapper } from '@/components/auth/google-oauth-provider';
import { LocaleSwitcher } from '@/components/ui/locale-switcher';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const t = useTranslations('auth');

    return (
        <GoogleOAuthWrapper>
            <div className="min-h-screen grid lg:grid-cols-2 bg-background font-inter overflow-hidden">
                {/* Branding Side */}
                <div className="hidden lg:flex flex-col justify-between p-12 bg-card relative overflow-hidden text-white border-r">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent z-0" />
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 blur-[120px] rounded-full" />

                    <div className="relative z-10">
                        <Link href="/" className="flex items-center gap-2 text-2xl font-bold font-heading">
                            <BookOpen className="w-8 h-8 text-primary glow-primary" />
                            <span className="text-gradient">BookGen</span>
                        </Link>
                    </div>

                    <div className="relative z-10 max-w-md">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
                            <Sparkles size={14} />
                            <span>{t('layoutTitle')}</span>
                        </div>
                        <h1 className="text-5xl font-heading font-bold mb-6 leading-[1.1] text-gradient">
                            {t('layoutSubtitle')}
                        </h1>
                        <p className="text-lg text-muted-foreground font-medium">
                            {t('layoutDescription')}
                        </p>
                    </div>

                    <div className="relative z-10 flex items-center gap-4 text-sm text-muted-foreground border-t border-white/5 pt-8">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden flex items-center justify-center">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="avatar" />
                                </div>
                            ))}
                        </div>
                        <span>{t('layoutSocialProof')}</span>
                    </div>
                </div>

                {/* Form Side */}
                <div className="flex flex-col items-center justify-center p-8 bg-background relative">
                    <div className="absolute top-4 right-4 z-20">
                        <LocaleSwitcher />
                    </div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -mr-48 -mt-48" />
                    <div className="w-full max-w-sm relative z-10">
                        {children}
                    </div>
                </div>
            </div>
        </GoogleOAuthWrapper>
    );
}
