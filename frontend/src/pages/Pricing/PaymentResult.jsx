import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { userApi } from '../../services/api';

const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const status = searchParams.get('status');
    const code = searchParams.get('code');
    const orderId = searchParams.get('orderId') || 'Unknown';

    const isSuccess = status === 'success';

    useEffect(() => {
        if (isSuccess) {
            userApi.getMe().then((res) => {
                if (res.data) {
                    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                    const updatedUser = { ...currentUser, ...res.data };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    // Dispatch a custom event so Navbar can pick up changes if they are mounted concurrently
                    window.dispatchEvent(new Event('userUpdated'));
                }
            }).catch(console.error);
        }
    }, [isSuccess]);

    return (
        <div className="min-h-screen bg-surface font-body parchment-texture">
            <Navbar />
            <main className="max-w-3xl mx-auto px-6 py-20 text-center">
                <div className={`inline-block p-6 mb-8 pixel-border ${isSuccess ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-on-error-container'}`}>
                    <span className="material-symbols-outlined text-6xl">
                        {isSuccess ? 'verified' : 'error'}
                    </span>
                </div>

                <h1 className="font-headline text-5xl font-black mb-4 uppercase tracking-tighter italic">
                    {isSuccess ? 'Royal Decree Issued' : 'Petition Denied'}
                </h1>

                <p className="text-xl mb-8 opacity-80">
                    {isSuccess 
                        ? `The Kingdom has accepted your tribute. Your status has been updated for Order #${orderId}.` 
                        : `The Scribes were unable to process your request for Order #${orderId}${code ? ' (Code: ' + code + ')' : ''}. Please try again later.`
                    }
                </p>

                <div className="flex justify-center gap-4">
                    <Link to="/" className="bg-primary text-on-primary px-8 py-3 font-headline text-lg uppercase carved-bevel active:translate-y-1 transition-all">
                        Return Home
                    </Link>
                    {!isSuccess && (
                        <Link to="/pricing" className="bg-surface-container-high text-on-surface px-8 py-3 font-headline text-lg uppercase carved-bevel active:translate-y-1 transition-all">
                            Back to Pricing
                        </Link>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PaymentResult;
