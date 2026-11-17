import React from 'react';

interface PlumbingBrandMarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PlumbingBrandMark: React.FC<PlumbingBrandMarkProps> = ({
  className = '',
  size = 'md',
}) => {
  const dimensions =
    size === 'sm' ? 'w-9 h-9 rounded-xl' : size === 'lg' ? 'w-14 h-14 rounded-2xl' : 'w-11 h-11 rounded-2xl';
  const iconSize = size === 'sm' ? 20 : size === 'lg' ? 30 : 24;

  return (
    <div
      className={`${dimensions} bg-[#1565C0] text-white flex items-center justify-center shadow-sm shadow-blue-900/20 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Pipe elbow + water droplet emblem */}
        <path
          d="M5 6H12C14.7614 6 17 8.23858 17 11V14"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M4 4V8M15 14H19"
          stroke="#93C5FD"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M17 17.5C17 17.5 19.5 19.9 19.5 21.4C19.5 22.7807 18.3807 23.9 17 23.9C15.6193 23.9 14.5 22.7807 14.5 21.4C14.5 19.9 17 17.5 17 17.5Z"
          fill="#E0F2FE"
          transform="translate(0 -1.5)"
        />
      </svg>
    </div>
  );
};
