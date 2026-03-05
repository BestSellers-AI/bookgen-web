"use client";

import React from 'react';
import { Check, AlertCircle, ShoppingCart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from 'next-intl';

export default function HotmartPage() {
    const t = useTranslations('credits');

    const plans = [
        {
            price: 20,
            credits: 20,
            books: 1,
            description: t('planStarter'),
            highlight: false,
        },
        {
            price: 50,
            credits: 60,
            bonus: 10,
            books: 3,
            description: t('planPopular'),
            highlight: true,
            tag: t('bestValue')
        },
        {
            price: 100,
            credits: 133,
            bonus: 33,
            books: 7,
            description: t('planPower'),
            highlight: false,
            tag: t('maxSavings')
        }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-black font-heading text-gradient">{t('hotmartTitle')}</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    {t('hotmartSubtitle')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan, index) => (
                    <Card
                        key={index}
                        className={`glass border-border flex flex-col relative overflow-hidden transition-all duration-500 hover:translate-y-[-8px] ${
                            plan.highlight ? 'border-primary/50 shadow-[0_0_40px_rgba(var(--primary-rgb),0.2)]' : ''
                        }`}
                    >
                        {plan.tag && (
                            <div className="absolute top-4 right-[-35px] rotate-45 bg-primary text-white text-[10px] font-black py-1 px-10 shadow-lg">
                                {plan.tag}
                            </div>
                        )}

                        <CardHeader>
                            <CardTitle className="text-xl font-bold">{plan.description}</CardTitle>
                            <div className="mt-4 flex items-baseline gap-1">
                                <span className="text-4xl font-black text-foreground">${plan.price}</span>
                                <span className="text-muted-foreground">USD</span>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 space-y-6">
                            <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                                <div className="text-sm text-muted-foreground mb-1">{t('youReceive')}</div>
                                <div className="text-2xl font-black text-primary">
                                    ${plan.credits} <span className="text-sm font-medium">{t('inCredits')}</span>
                                </div>
                                {plan.bonus && (
                                    <Badge variant="secondary" className="mt-2 bg-green-500/20 text-green-400 border-green-500/20">
                                        + ${plan.bonus} cashback included
                                    </Badge>
                                )}
                            </div>

                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-sm">
                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                        <Check className="w-3 h-3 text-primary" />
                                    </div>
                                    <span>Create up to <strong>{plan.books} books</strong></span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                        <Check className="w-3 h-3 text-primary" />
                                    </div>
                                    <span>{t('perBookAverage')}</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                        <Check className="w-3 h-3 text-primary" />
                                    </div>
                                    <span>{t('lifetimeAccess')}</span>
                                </li>
                            </ul>
                        </CardContent>

                        <CardFooter>
                            <Button className={`w-full h-12 rounded-xl font-bold gap-2 ${plan.highlight ? 'glow-primary' : ''}`}>
                                <ShoppingCart className="w-4 h-4" />
                                {t('buyNow')}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <div className="space-y-6">
                <div className="flex items-start gap-4 p-6 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 max-w-3xl mx-auto">
                    <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                    <div className="space-y-1">
                        <h4 className="font-bold text-amber-500">{t('disclaimer')}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {t('disclaimerText')}
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                        {t('costInfo')}
                    </p>
                </div>
            </div>
        </div>
    );
}
