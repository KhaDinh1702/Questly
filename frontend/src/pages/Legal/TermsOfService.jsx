import React from 'react';
import Navbar from '../../components/Navbar';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
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
                            Terms of Service
                        </h1>
                        <p className="text-[#8b7355] text-sm uppercase tracking-widest">Last updated: March 2026</p>
                    </header>

                    <div className="bg-[#2a2418]/95 border-4 border-[#5a4a35] p-6 md:p-8 space-y-8 text-[#d4c4a8] text-sm leading-relaxed">
                        
                        <section>
                            <h2 className="text-[#c4a35a] font-bold text-lg uppercase mb-3 border-b border-[#5a4a35] pb-2">1. Acceptance of Terms</h2>
                            <p>By accessing and using Questly ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
                        </section>

                        <section>
                            <h2 className="text-[#c4a35a] font-bold text-lg uppercase mb-3 border-b border-[#5a4a35] pb-2">2. Use of the Service</h2>
                            <p className="mb-3">Questly is an educational gamification platform. You agree to use the Service only for lawful purposes and in a manner that does not infringe the rights of others. You must not:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2 opacity-90">
                                <li>Use the Service for any fraudulent or malicious purpose.</li>
                                <li>Attempt to gain unauthorized access to any part of the Service.</li>
                                <li>Share your account credentials with third parties.</li>
                                <li>Create multiple accounts to abuse free-tier benefits.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-[#c4a35a] font-bold text-lg uppercase mb-3 border-b border-[#5a4a35] pb-2">3. Subscriptions & Payments</h2>
                            <p className="mb-3">Questly offers premium subscription tiers (Squire, Knight, Legend). By subscribing, you agree that:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2 opacity-90">
                                <li>Payments are non-refundable unless required by law.</li>
                                <li>Subscription benefits are tied to your individual account and cannot be transferred.</li>
                                <li>We reserve the right to modify pricing with 30 days advance notice.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-[#c4a35a] font-bold text-lg uppercase mb-3 border-b border-[#5a4a35] pb-2">4. Account Termination</h2>
                            <p>We reserve the right to suspend or permanently terminate any account found to be in violation of these Terms, at our sole discretion and without prior notice. Upon termination, all associated data may be permanently deleted.</p>
                        </section>

                        <section>
                            <h2 className="text-[#c4a35a] font-bold text-lg uppercase mb-3 border-b border-[#5a4a35] pb-2">5. Intellectual Property</h2>
                            <p>All content, assets, game mechanics, and visual elements within Questly are the intellectual property of Questly's creators. You may not reproduce, distribute, or create derivative works without express written permission.</p>
                        </section>

                        <section>
                            <h2 className="text-[#c4a35a] font-bold text-lg uppercase mb-3 border-b border-[#5a4a35] pb-2">6. Disclaimer of Warranties</h2>
                            <p>The Service is provided "as is" without warranties of any kind. We do not guarantee that the Service will be uninterrupted, error-free, or completely secure.</p>
                        </section>

                        <section>
                            <h2 className="text-[#c4a35a] font-bold text-lg uppercase mb-3 border-b border-[#5a4a35] pb-2">7. Contact</h2>
                            <p>For questions regarding these Terms, please visit our <Link to="/support" className="text-[#c4a35a] hover:underline">Support page</Link> or write to us at <span className="text-[#c4a35a] font-bold">dinhhoangkha107@gmail.com</span>.</p>
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
