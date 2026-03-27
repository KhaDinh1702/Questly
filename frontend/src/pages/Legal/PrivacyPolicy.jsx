import React from 'react';
import Navbar from '../../components/Navbar';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
    return (
        <div className="relative min-h-screen bg-[#1a1410] font-body flex flex-col overflow-y-auto custom-scrollbar">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l20 20-20 20L0 20z' fill='%23c4a35a' fill-opacity='0.4'/%3E%3C/svg%3E")`, imageRendering: 'pixelated' }} />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#1a1410]/90 to-black/95" />
            </div>

            <div className="relative z-10 flex flex-col min-h-full">
                <Navbar />

                <main className="flex-grow max-w-3xl w-full mx-auto px-6 py-12 text-stone-200">
                    <header className="text-center mb-10">
                        <h1 className="text-4xl md:text-5xl font-black text-[#c4a35a] uppercase tracking-widest font-serif mb-2"
                            style={{ textShadow: '0 0 20px rgba(196,163,90,0.4), 2px 2px 0 #5a4a35' }}>
                            Privacy Policy
                        </h1>
                        <p className="text-[#8b7355] text-sm uppercase tracking-widest">Last updated: March 2026</p>
                    </header>

                    <div className="bg-[#2a2418]/95 border-4 border-[#5a4a35] p-6 md:p-8 space-y-8 text-[#d4c4a8] text-sm leading-relaxed">

                        <section>
                            <h2 className="text-[#c4a35a] font-bold text-lg uppercase mb-3 border-b border-[#5a4a35] pb-2">1. Information We Collect</h2>
                            <p className="mb-3">When you register and use Questly, we collect the following types of information:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2 opacity-90">
                                <li><strong>Account data:</strong> username, email address, and password (stored encrypted).</li>
                                <li><strong>Game data:</strong> character progression, inventory, dungeon records, and aptitude scores.</li>
                                <li><strong>Payment data:</strong> transaction IDs from our payment processor (VNPay). We do not store card numbers directly.</li>
                                <li><strong>Usage data:</strong> pages visited, features used, and session timestamps.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-[#c4a35a] font-bold text-lg uppercase mb-3 border-b border-[#5a4a35] pb-2">2. How We Use Your Information</h2>
                            <p className="mb-3">We use your data to:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2 opacity-90">
                                <li>Operate, maintain, and improve the Questly platform.</li>
                                <li>Process subscription payments and grant premium benefits.</li>
                                <li>Personalize your in-game experience and track progress.</li>
                                <li>Send important service announcements and security notifications.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-[#c4a35a] font-bold text-lg uppercase mb-3 border-b border-[#5a4a35] pb-2">3. Data Sharing</h2>
                            <p>We do not sell your personal data to third parties. We may share data with trusted service providers (such as payment processors) strictly for operating the Service. Your username and avatar are publicly visible to other players in the Community tab.</p>
                        </section>

                        <section>
                            <h2 className="text-[#c4a35a] font-bold text-lg uppercase mb-3 border-b border-[#5a4a35] pb-2">4. Data Retention</h2>
                            <p>We retain your account data for as long as your account is active. If you request account deletion, your personal data will be removed within 30 days, except where retention is required by applicable law.</p>
                        </section>

                        <section>
                            <h2 className="text-[#c4a35a] font-bold text-lg uppercase mb-3 border-b border-[#5a4a35] pb-2">5. Security</h2>
                            <p>We implement industry-standard security measures including encrypted password storage and HTTPS transport. However, no system is 100% secure. Please use a strong, unique password for your account.</p>
                        </section>

                        <section>
                            <h2 className="text-[#c4a35a] font-bold text-lg uppercase mb-3 border-b border-[#5a4a35] pb-2">6. Your Rights</h2>
                            <p>You have the right to request access to, correction of, or deletion of your personal data. To exercise these rights, please contact us through our <Link to="/support" className="text-[#c4a35a] hover:underline">Support page</Link>.</p>
                        </section>

                        <section>
                            <h2 className="text-[#c4a35a] font-bold text-lg uppercase mb-3 border-b border-[#5a4a35] pb-2">7. Contact</h2>
                            <p>If you have any questions about this Privacy Policy, please contact us at <span className="text-[#c4a35a] font-bold">dinhhoangkha107@gmail.com</span>.</p>
                        </section>
                    </div>
                </main>

                <footer className="w-full border-t border-[#5a4a35] flex flex-col items-center justify-center py-6 px-4 space-y-2 bg-[#1a1410]/90 backdrop-blur-sm mt-auto">
                    <div className="text-sm font-bold text-[#8b7355] font-serif uppercase tracking-widest">Questly</div>
                    <p className="font-serif text-[10px] italic text-[#5a4a35]">© 2026 Questly. All rights reserved.</p>
                </footer>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #1a1410; border-left: 1px solid #333; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #5a4a35; border: 1px solid #8b7355; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #c4a35a; }
            `}</style>
        </div>
    );
}
