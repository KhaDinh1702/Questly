import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { paymentApi } from '../../services/api';

const Pricing = () => {
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async (tier) => {
        if (tier.vndAmount === 0) return;

        setLoading(true);
        try {
            const amount = tier.vndAmount;
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
            price: "Free",
            vndAmount: 0,
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
            price: "$3.76",
            vndAmount: 99000,
            period: "Month",
            description: "A formal oath to the crown grants greater capacity.",
            features: [
                "8 Aptitude Tests Per Day",
                "No Crow's Eye (Ad) Views",
                "10 Backpack Loot Slots",
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
            price: "$18.75",
            vndAmount: 418000,
            period: "6 Months",
            description: "Valorous service brings noble status and rewards.",
            features: [
                "12 Aptitude Tests Per Day",
                "No Crow's Eye (Ad) Views",
                "16 Backpack Loot Slots",
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
            price: "$37.59",
            vndAmount: 806000,
            period: "Year",
            description: "Etch your name into the annals as a true lord of the realm.",
            features: [
                "16 Aptitude Tests Per Day",
                "No Crow's Eye (Ad) Views",
                "20 Backpack Loot Slots",
                "Grade B Set + Grade S Scroll",
                "Custom Royal Heraldry",
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
        <div className="relative h-screen bg-surface font-body selection:bg-primary-container selection:text-on-primary-container parchment-texture overflow-hidden flex flex-col">
            <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
                <img alt="Throne Room Background" className="w-full h-full object-cover" src="/maps/throne_room_2deneme4.gif" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
                <Navbar />

                <main className="flex-grow flex flex-col items-center justify-center max-w-7xl mx-auto px-6 py-4 overflow-hidden w-full">
                    {/* Hero Header - Compact */}
                    <header className="text-center mb-6 relative">
                        <h1 className="font-headline text-5xl md:text-6xl font-black uppercase tracking-tighter italic gold-shimmer">
                            Royal Tiers
                        </h1>
                        <p className="font-headline text-sm max-w-2xl mx-auto uppercase tracking-widest font-bold mt-2 px-4 py-1 rounded"
                            style={{
                                color: '#ffe066',
                                textShadow: '0 0 12px rgba(255,224,0,0.9), 0 0 4px #fff, 0 1px 3px rgba(0,0,0,0.9)',
                                background: 'rgba(0,0,0,0.45)',
                                display: 'inline-block'
                            }}>
                            Choose your destiny within the kingdom's ledgers
                        </p>
                        <style>{`
                          @keyframes goldShimmer {
                            0%   { background-position: -200% center; }
                            100% { background-position: 200% center; }
                          }
                          .gold-shimmer {
                            background: linear-gradient(90deg, #b8860b 0%, #ffd700 30%, #fffacd 50%, #ffd700 70%, #b8860b 100%);
                            background-size: 200% auto;
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                            animation: goldShimmer 3s linear infinite;
                            filter: drop-shadow(0 0 6px rgba(255,215,0,0.4));
                          }
                        `}</style>
                    </header>

                    {/* Pricing Grid - Scaled to fit */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-stretch w-full">
                        {tiers.map((tier, index) => (
                            <div
                                key={index}
                                className={`${tier.bgColor} ${tier.textColor || 'text-on-surface'} pixel-border flex flex-col p-4 relative group transition-transform hover:-translate-y-1 duration-300 ${tier.isPopular ? 'scale-105 z-10 shadow-2xl ring-4 ring-primary' : ''}`}
                            >
                                {tier.rank && (
                                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${tier.btnBg} ${tier.btnText} px-2 py-0.5 font-label text-[8px] uppercase tracking-widest pixel-border`}>
                                        {tier.rank}
                                    </div>
                                )}

                                <h3 className={`font-headline text-xl font-bold mb-1 uppercase tracking-tight ${tier.color}`}>
                                    {tier.name}
                                </h3>

                                <div className={`flex items-baseline gap-1 mb-3 border-b-2 ${tier.isPopular ? 'border-primary' : 'border-outline-variant'} pb-2`}>
                                    <span className={`font-headline text-2xl font-black`}>{tier.price}</span>
                                    {tier.price !== "Free" && (
                                        <span className="font-label text-xs uppercase opacity-70"> / {tier.period}</span>
                                    )}
                                </div>

                                <p className="mb-4 italic opacity-90 text-xs leading-snug">
                                    "{tier.description}"
                                </p>

                                <ul className="space-y-1.5 mb-4 flex-grow">
                                    {tier.features.map((feature, fIndex) => (
                                        <li key={fIndex} className="flex items-start gap-1.5">
                                            <span className={`material-symbols-outlined ${tier.color} text-base flex-shrink-0`}>
                                                {tier.isPopular ? 'verified' : 'check_small'}
                                            </span>
                                            <span className="font-body text-xs leading-snug">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleSubscribe(tier)}
                                    disabled={loading || tier.vndAmount === 0}
                                    className={`w-full ${tier.btnBg} ${tier.btnText} py-2 font-headline text-sm uppercase carved-bevel active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {loading ? 'Scribing...' : tier.buttonText}
                                </button>
                            </div>
                        ))}
                    </div>

                    <footer className="bg-stone-200 w-full border-t-2 border-stone-300 flex flex-col items-center justify-center py-8 px-4 space-y-3">
                        <div className="text-lg font-bold text-stone-900 font-headline uppercase tracking-widest">
                            Questly
                        </div>
                        <nav className="flex space-x-6">
                            <Link className="text-stone-600 font-serif text-sm italic hover:text-amber-700 underline underline-offset-4 transition-opacity opacity-80 hover:opacity-100" to="/terms">Terms of Service</Link>
                            <Link className="text-stone-600 font-serif text-sm italic hover:text-amber-700 underline underline-offset-4 transition-opacity opacity-80 hover:opacity-100" to="/privacy">Privacy Policy</Link>
                            <Link className="text-stone-600 font-serif text-sm italic hover:text-amber-700 underline underline-offset-4 transition-opacity opacity-80 hover:opacity-100" to="/support">Support</Link>
                        </nav>
                        <p className="font-serif text-sm italic text-stone-700">
                            © 2026 Questly. All rights reserved.
                        </p>
                    </footer>
                </main>
            </div>
        </div>
    );
};

export default Pricing;
