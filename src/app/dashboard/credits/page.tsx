"use client";

import React from 'react';
import Link from 'next/link';
import { CreditCard, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreditsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-black font-heading text-gradient">Buy Credits</h1>
                <p className="text-muted-foreground text-lg">
                    Choose your preferred payment method to add credits to your account.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass border-white/10 overflow-hidden group hover:border-primary/50 transition-all duration-500">
                    <CardHeader className="pb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                            <CreditCard className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Hotmart</CardTitle>
                        <CardDescription>
                            Pay with Credit Card, PIX, or Boleto via Hotmart.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Instant credit delivery
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Secure checkout
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Multiple payment options
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full gap-2 rounded-xl h-12 font-bold" asChild>
                            <Link href="/dashboard/credits/hotmart">
                                Select Hotmart
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>

                {/* Placeholder for future payment methods */}
                <Card className="glass border-white/5 opacity-50 cursor-not-allowed">
                    <CardHeader className="pb-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                            <ExternalLink className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Stripe</CardTitle>
                        <CardDescription>
                            Coming soon...
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground italic">
                            We are working on adding more payment options.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button disabled variant="outline" className="w-full rounded-xl h-12">
                            Unavailable
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 text-center">
                <p className="text-sm text-muted-foreground">
                    Need help? Contact our support team.
                </p>
            </div>
        </div>
    );
}
