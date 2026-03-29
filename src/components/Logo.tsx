import React from 'react';

export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`bg-[#0B0F19] rounded-2xl flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0 ${className}`}>
        <svg viewBox="0 0 512 512" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@900&display=swap');`}
            </style>
            <rect width="512" height="512" fill="#0B0F19"/>
            <text x="256" y="380" fontFamily="'Noto Sans Ethiopic', sans-serif" fontSize="340" fontWeight="900" fill="#D4A437" textAnchor="middle">ኑ</text>
        </svg>
    </div>
  );
}
