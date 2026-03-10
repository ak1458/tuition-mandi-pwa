export function AnimatedLogo({ className = '' }: { className?: string }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <svg
                width="40"
                height="40"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-sm"
            >
                <defs>
                    <linearGradient id="takhti-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#e07a2f" />
                        <stop offset="100%" stopColor="#c0586a" />
                    </linearGradient>
                    <clipPath id="board-clip">
                        <rect x="20" y="30" width="60" height="60" rx="6" />
                    </clipPath>
                </defs>

                {/* Handle */}
                <path
                    d="M 35 30 L 35 18 C 35 12 65 12 65 18 L 65 30 Z"
                    fill="url(#takhti-grad)"
                    className="opacity-90"
                />
                {/* Handle Cutout */}
                <circle cx="50" cy="22" r="4" fill="#fdfbf7" />

                {/* Main Board */}
                <rect
                    x="20"
                    y="30"
                    width="60"
                    height="60"
                    rx="6"
                    fill="url(#takhti-grad)"
                />

                {/* Writing Animation Lines */}
                <g clipPath="url(#board-clip)">
                    {/* Line 1 */}
                    <path
                        d="M 30 45 Q 40 40 50 45 T 70 45"
                        stroke="#fdfbf7"
                        strokeWidth="4"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray="50"
                        strokeDashoffset="50"
                    >
                        <animate
                            attributeName="stroke-dashoffset"
                            values="50;0;50"
                            dur="4s"
                            repeatCount="indefinite"
                            keyTimes="0;0.5;1"
                            calcMode="spline"
                            keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                        />
                    </path>

                    {/* Line 2 */}
                    <path
                        d="M 30 60 Q 45 65 55 60 T 70 60"
                        stroke="#fdfbf7"
                        strokeWidth="4"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray="50"
                        strokeDashoffset="50"
                    >
                        <animate
                            attributeName="stroke-dashoffset"
                            values="50;0;50"
                            dur="4s"
                            begin="0.5s"
                            repeatCount="indefinite"
                            keyTimes="0;0.5;1"
                            calcMode="spline"
                            keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                        />
                    </path>

                    {/* Line 3 (shorter) */}
                    <path
                        d="M 30 75 Q 40 70 45 75 T 55 75"
                        stroke="#fdfbf7"
                        strokeWidth="4"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray="30"
                        strokeDashoffset="30"
                    >
                        <animate
                            attributeName="stroke-dashoffset"
                            values="30;0;30"
                            dur="4s"
                            begin="1s"
                            repeatCount="indefinite"
                            keyTimes="0;0.5;1"
                            calcMode="spline"
                            keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                        />
                    </path>
                </g>

                {/* Subtle hover/floating animation on the whole SVG via CSS wrapper if needed, but handled by React class */}
            </svg>
        </div>
    )
}
