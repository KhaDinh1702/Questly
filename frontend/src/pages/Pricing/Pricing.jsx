import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { paymentApi } from '../../services/api';

const Pricing = () => {
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async (tier) => {
        if (tier.price === "0") return;

        setLoading(true);
        try {
            const amount = parseInt(tier.price.replace(/,/g, ''));
            const response = await paymentApi.createPaymentUrl({
                amount: amount,
                tierName: tier.name,
                orderDescription: `Purchase_${tier.name}`,
                orderType: 'billpayment',
                language: 'vn'
            });

            if (response.data && response.data.paymentUrl) {
                window.location.href = response.data.paymentUrl;
            } else {
                alert('Questly error: Could not connect to the Royal Treasury.');
            }
        } catch (error) {
            console.error('Payment Error:', error);
            alert('Questly error: The Scribes encountered an issue with your payment.');
        } finally {
            setLoading(false);
        }
    };
    const tiers = [
        {
            name: "Novice",
            rank: "Rank 0",
            price: "0",
            period: "Forever",
            description: "Begin your quest with the basic tools of mortality.",
            features: [
                "4 Aptitude Tests Per Day",
                "3 Ad-Based Free Chests",
                "5 Backpack Loot Slots",
                "Community Forum Access"
            ],
            buttonText: "Stay Humble",
            isPopular: false,
            color: "text-stone-500",
            bgColor: "bg-surface-container-low",
            btnBg: "bg-stone-400",
            btnText: "text-stone-900",
            borderClass: "pixel-border-stone"
        },
        {
            name: "Squire",
            rank: "Rank I",
            price: "59,000",
            period: "Month",
            description: "A formal oath to the crown grants greater capacity.",
            features: [
                "8 Aptitude Tests Per Day",
                "No Crow's Eye (Ad) Views",
                "+5 Backpack Loot Slots",
                "Priority Messenger Support"
            ],
            buttonText: "Begin Journey",
            isPopular: false,
            color: "text-tertiary",
            bgColor: "bg-surface-container",
            btnBg: "bg-tertiary",
            btnText: "text-on-tertiary",
            borderClass: "pixel-border-stone"
        },
        {
            name: "Knight",
            rank: "Rank II",
            price: "249,000",
            period: "6 Months",
            description: "Valorous service brings noble status and rewards.",
            features: [
                "12 Aptitude Tests Per Day",
                "No Crow's Eye (Ad) Views",
                "+8 Backpack Loot Slots",
                "Grade B Equipment Set",
                "Custom Royal Heraldry"
            ],
            buttonText: "Take The Oath",
            isPopular: true,
            color: "text-primary",
            bgColor: "bg-surface-container-high",
            btnBg: "bg-primary",
            btnText: "text-on-primary",
            borderClass: "pixel-border-wood"
        },
        {
            name: "Legend",
            rank: "Rank III",
            price: "480,000",
            period: "Year",
            description: "Etch your name into the annals as a true lord of the realm.",
            features: [
                "16 Aptitude Tests Per Day",
                "No Crow's Eye (Ad) Views",
                "+12 Backpack Loot Slots",
                "Grade B Set + Grade S Scroll",
                "Early Artifact Access"
            ],
            buttonText: "Claim Throne",
            isPopular: false,
            color: "text-secondary",
            bgColor: "bg-inverse-surface",
            btnBg: "bg-primary-container",
            btnText: "text-on-primary-container",
            borderClass: "pixel-border-wood",
            textColor: "text-inverse-on-surface"
        }
    ];

    return (
        <div className="relative min-h-screen bg-surface font-body selection:bg-primary-container selection:text-on-primary-container parchment-texture">
            <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
                <img alt="Throne Room Background" className="w-full h-full object-cover" src="/maps/throne_room_2deneme4.gif" />
            </div>
            <div className="relative z-10">
                <Navbar />

                <main className="max-w-7xl mx-auto px-6 py-16">
                    {/* Hero Header */}
                    <header className="text-center mb-20 relative">
                        <h1 className="font-headline text-6xl md:text-8xl font-black text-on-surface mb-4 uppercase tracking-tighter italic">
                            Royal Tiers
                        </h1>
                        <p className="font-headline text-xl text-outline max-w-2xl mx-auto uppercase tracking-widest font-bold">
                            Choose your destiny within the kingdom's ledgers
                        </p>
                    </header>

                    {/* Pricing Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-24 items-stretch">
                        {tiers.map((tier, index) => (
                            <div
                                key={index}
                                className={`${tier.bgColor} ${tier.textColor || 'text-on-surface'} pixel-border flex flex-col p-6 relative group transition-transform hover:-translate-y-2 duration-300 ${tier.isPopular ? 'scale-105 z-10 shadow-2xl ring-4 ring-primary' : ''}`}
                            >
                                {tier.rank && (
                                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 ${tier.btnBg} ${tier.btnText} px-3 py-1 font-label text-[10px] uppercase tracking-widest pixel-border`}>
                                        {tier.rank}
                                    </div>
                                )}

                                {tier.isPopular && (
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-4 py-1 font-label text-[10px] uppercase tracking-[0.2em] pixel-border whitespace-nowrap hidden lg:block">
                                        Most Noble Choice
                                    </div>
                                )}

                                <h3 className={`font-headline text-2xl font-bold mb-1 uppercase tracking-tight ${tier.color}`}>
                                    {tier.name}
                                </h3>

                                <div className={`flex items-baseline gap-1 mb-6 border-b-2 ${tier.isPopular ? 'border-primary' : 'border-outline-variant'} pb-4`}>
                                    <span className={`font-headline text-4xl font-black`}>{tier.price}</span>
                                    <span className="font-label text-xs uppercase opacity-60">Gold / {tier.period}</span>
                                </div>

                                <p className="mb-6 italic opacity-80 text-xs leading-relaxed">
                                    "{tier.description}"
                                </p>

                                <ul className="space-y-3 mb-8 flex-grow">
                                    {tier.features.map((feature, fIndex) => (
                                        <li key={fIndex} className="flex items-start gap-2">
                                            <span className={`material-symbols-outlined ${tier.color} text-base`}>
                                                {tier.isPopular ? 'verified' : 'check_small'}
                                            </span>
                                            <span className="font-body text-[11px] uppercase leading-tight">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleSubscribe(tier)}
                                    disabled={loading || tier.price === "0"}
                                    className={`w-full ${tier.btnBg} ${tier.btnText} py-3 font-headline text-lg uppercase carved-bevel active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {loading ? 'Scribing...' : tier.buttonText}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Merchant's Guarantee */}
                    <section className="mb-24 bg-surface-container-low pixel-border p-12 relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-32 h-32 opacity-10 rotate-12 pointer-events-none">
                            <span className="material-symbols-outlined text-[8rem]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                        </div>
                        <div className="max-w-3xl relative z-10">
                            <h2 className="font-headline text-4xl font-bold mb-6 uppercase tracking-tight flex items-center gap-4">
                                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
                                Merchant's Guarantee
                            </h2>
                            <p className="font-body text-lg leading-relaxed mb-6">
                                Every coin spent in our bazaar is protected by the <span className="text-primary font-bold">Chronicler's Decree</span>. If your questing experience does not meet the standards of the High Council within thirty sun-cycles, we shall restore your gold to your purse, no questions asked.
                            </p>
                            <div className="flex gap-8">
                                <div className="flex flex-col">
                                    <span className="font-label text-xs uppercase opacity-60">Verified by</span>
                                    <span className="font-headline font-bold text-xl uppercase italic">The Iron Bank</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-label text-xs uppercase opacity-60">Issued on</span>
                                    <span className="font-headline font-bold text-xl uppercase italic">1224 Era</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="bg-stone-200 dark:bg-stone-800 w-full border-t-2 border-stone-300 dark:border-stone-700 flex flex-col items-center justify-center py-12 px-4 space-y-4">
                    <div className="text-lg font-bold text-stone-900 dark:text-stone-100 font-headline uppercase tracking-widest">
                        Questly
                    </div>
                    <nav className="flex space-x-6">
                        <a
                            className="text-stone-600 dark:text-stone-400 font-serif text-sm italic hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-4 transition-opacity opacity-80 hover:opacity-100"
                            href="#"
                        >
                            Terms of Service
                        </a>
                        <a
                            className="text-stone-600 dark:text-stone-400 font-serif text-sm italic hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-4 transition-opacity opacity-80 hover:opacity-100"
                            href="#"
                        >
                            Privacy Policy
                        </a>
                        <a
                            className="text-stone-600 dark:text-stone-400 font-serif text-sm italic hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-4 transition-opacity opacity-80 hover:opacity-100"
                            href="#"
                        >
                            Support
                        </a>
                    </nav>
                    <p className="font-serif text-sm italic text-stone-700 dark:text-stone-300">
                        © 2026 Questly. All rights reserved.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default Pricing;
