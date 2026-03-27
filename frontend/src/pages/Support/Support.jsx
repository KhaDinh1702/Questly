import React, { useState } from 'react';
import Navbar from '../../components/Navbar';

const faqs = [
    {
        question: "How do I upgrade my rank/subscription?",
        answer: "Visit the Pricing page and select a Royal Tier. Payments are securely processed, and your account will automatically upgrade to receive all benefits."
    },
    {
        question: "What happens if I lose a match in the Dungeon?",
        answer: "Failing in the Dungeon means you'll drop any loot you collected during that run. Your permanent stats and equipped items remain safe!"
    },
    {
        question: "How do I earn more Gold?",
        answer: "Gold can be earned by defeating monsters in the Dungeon, successfully completing Grimoire study sessions, or opening daily free chests."
    },
    {
        question: "I didn't receive my Subscription / Premium features.",
        answer: "Please ensure your transaction completed successfully. Sometimes it takes a few minutes for the magic to reach your account. If the issue persists, submit a ticket below."
    }
];

export default function Support() {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Open the default email client with the prefilled subject and body
        const mailtoLink = `mailto:dinhhoangkha107@gmail.com?subject=${encodeURIComponent(subject || 'Questly Support Request')}&body=${encodeURIComponent(message)}`;
        window.location.href = mailtoLink;
        
        // Give some visual feedback that the action was performed
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
        
        // Clear the form
        setSubject('');
        setMessage('');
    };

    return (
        <div className="relative h-screen bg-[#1a1410] font-body selection:bg-amber-900 selection:text-amber-100 overflow-y-auto flex flex-col custom-scrollbar">
            <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l20 20-20 20L0 20z' fill='%23c4a35a' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                        imageRendering: 'pixelated',
                    }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#1a1410]/90 to-black/95" />
            </div>
            
            <div className="relative z-10 flex flex-col min-h-full">
                <Navbar />

                <main className="flex-grow flex flex-col items-center max-w-4xl mx-auto px-6 py-12 w-full text-stone-200">
                    <header className="text-center mb-12 w-full select-none">
                        <h1 className="text-5xl md:text-6xl font-black text-[#c4a35a] mb-2 uppercase tracking-widest font-serif" style={{ textShadow: '0 0 20px rgba(196,163,90,0.4), 2px 2px 0 #5a4a35' }}>
                            SUPPORT & FAQ
                        </h1>
                        <p className="text-sm text-[#d4c4a8] max-w-2xl mx-auto uppercase tracking-widest font-bold">
                            Seek assistance from the Kingdom's scribes
                        </p>
                    </header>

                    <div className="w-full bg-[#2a2418]/95 border-4 border-[#5a4a35] p-6 md:p-8 mb-12 shadow-2xl relative">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1a1410] text-[#c4a35a] px-4 py-1 font-bold tracking-widest uppercase border-2 border-[#c4a35a] whitespace-nowrap text-sm">
                            Frequently Asked Questions
                        </div>
                        
                        <div className="space-y-6 mt-4">
                            {faqs.map((faq, i) => (
                                <div key={i} className="border-b border-[#5a4a35]/50 pb-4 last:border-0 last:pb-0">
                                    <h3 className="text-lg text-[#c4a35a] font-bold mb-2 flex items-start gap-2">
                                        <span className="text-[#8b7355] font-serif">Q:</span> {faq.question}
                                    </h3>
                                    <p className="text-[#d4c4a8] opacity-90 text-sm leading-relaxed pl-6 relative">
                                        <span className="text-[#8b7355] font-serif absolute left-0">A:</span> {faq.answer}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full bg-[#1a1410]/80 border-4 border-[#c4a35a] p-6 md:p-8 text-center shadow-[0_0_30px_rgba(196,163,90,0.15)] relative">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#c4a35a] text-[#1a1410] px-4 py-1 font-bold tracking-widest uppercase border-2 border-[#1a1410] whitespace-nowrap text-sm">
                            Submit a Ticket
                        </div>
                        <p className="text-[#d4c4a8] mb-6 mt-2 leading-relaxed max-w-lg mx-auto text-sm">
                            Have an issue not listed in the sacred scrolls? Fill out the raven dispatch form below, and it will be sent directly to <strong>dinhhoangkha107@gmail.com</strong>.
                        </p>
                        
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg mx-auto text-left">
                            <div className="flex flex-col gap-1">
                                <label htmlFor="subject" className="text-[#c4a35a] text-xs font-bold tracking-widest uppercase font-serif">Subject / Title</label>
                                <input 
                                    type="text" 
                                    id="subject" 
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Briefly describe your issue..."
                                    required
                                    className="bg-black/50 border-2 border-[#5a4a35] text-[#eae4d4] px-4 py-2 focus:border-[#c4a35a] focus:outline-none transition-colors w-full"
                                />
                            </div>
                            
                            <div className="flex flex-col gap-1">
                                <label htmlFor="message" className="text-[#c4a35a] text-xs font-bold tracking-widest uppercase font-serif">Your Message</label>
                                <textarea 
                                    id="message" 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Provide the details of your request..."
                                    required
                                    rows="5"
                                    className="bg-black/50 border-2 border-[#5a4a35] text-[#eae4d4] px-4 py-2 focus:border-[#c4a35a] focus:outline-none transition-colors w-full resize-y"
                                ></textarea>
                            </div>

                            <button 
                                type="submit"
                                className="mt-2 inline-flex items-center justify-center gap-2 bg-[#8b7355] hover:bg-[#c4a35a] hover:text-[#1a1410] text-[#eae4d4] px-8 py-3 font-bold text-lg uppercase tracking-wider border-2 border-[#c4a35a] shadow-md transition-all active:translate-y-1 w-full"
                            >
                                <span className="material-symbols-outlined">send</span>
                                Dispatch Raven
                            </button>
                            
                            {submitted && (
                                <p className="text-green-500 text-sm mt-2 text-center font-bold tracking-wide">
                                    Raven prepared! Check your email client to send the missive.
                                </p>
                            )}
                        </form>
                    </div>
                </main>
                
                <footer className="w-full border-t border-[#5a4a35] flex flex-col items-center justify-center py-6 px-4 space-y-2 bg-[#1a1410]/90 backdrop-blur-sm mt-auto">
                    <div className="text-sm font-bold text-[#8b7355] font-serif uppercase tracking-widest">
                        Questly
                    </div>
                    <p className="font-serif text-[10px] italic text-[#5a4a35]">
                        © 2026 Questly. All rights reserved.
                    </p>
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
