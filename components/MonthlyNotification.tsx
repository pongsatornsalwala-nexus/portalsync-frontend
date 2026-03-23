import React, { useState } from 'react';

const MonthlyNotification: React.FC = () => {
    // Check if already dismissed for this month via localStorage
    const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-03"
    const dismissedMonth = localStorage.getItem('notif_dismissed');
    const alreadyDismissedThisMonth = dismissedMonth === currentMonth;

    const [sessionDismissed, setSessionDismissed] = useState(false);

    const today = new Date();
    const shouldShow = today.getDate() >= 25
        && !alreadyDismissedThisMonth
        && !sessionDismissed;

    if (!shouldShow) return null;

    return (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-3xl px-8 py-6 flex items-start gap-6 shadow-sm animate-in slide-in-from-top-4 duration-500">
            {/* Icon */}
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0 mt-0.5">
                <i className="fa-solid fa-bell text-lg"></i>
            </div>

            {/* Text */}
            <div className="flex-1">
                <p className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">
                    Monthly Reminder
                </p>
                <p className="text-sm text-amber-700 font-medium">
                    End of month approaching - please review any pending employee registrations and exits before the deadline.
                </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 flex-shrink-0">
                <button 
                    onClick={() => {
                        localStorage.setItem('notif_dismissed', currentMonth);
                        setSessionDismissed(true); // also hide immediately
                    }}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                >
                    Hide This Month
                </button>
                <button 
                    onClick={() => setSessionDismissed(true)}
                    className="px-5 py-2.5 bg-white hover:bg-amber-100 text-amber-600 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                >
                    Remind Me Later
                </button>
            </div>
        </div>
    );
};

export default MonthlyNotification