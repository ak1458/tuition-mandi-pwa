export function LoginAnimatedLogo({ className = '' }: { className?: string }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <svg
                width="240"
                height="100"
                viewBox="0 0 240 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_2px_4px_rgba(224,122,47,0.3)]"
            >
                <defs>
                    <filter id="chalk-texture" x="0%" y="0%" width="100%" height="100%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                    <clipPath id="write-wipe">
                        <rect x="0" y="0" width="0" height="100">
                            <animate
                                attributeName="width"
                                values="0;240;240;0"
                                keyTimes="0;0.5;0.8;1"
                                dur="4s"
                                repeatCount="indefinite"
                                calcMode="spline"
                                keySplines="0.4 0 0.2 1; 1 0 0 1; 0.4 0 0.2 1"
                            />
                        </rect>
                    </clipPath>
                </defs>

                <g filter="url(#chalk-texture)" clipPath="url(#write-wipe)">
                    <text
                        x="120"
                        y="65"
                        textAnchor="middle"
                        fill="#e07a2f"
                        fontFamily="'Caveat', cursive"
                        fontSize="64"
                        fontWeight="400"
                        letterSpacing="1"
                        opacity="0.85"
                    >
                        Takhti
                    </text>
                </g>

                {/* Subtle decorative line underneath that draws constantly */}
                <g filter="url(#chalk-texture)">
                    <path d="M 40 85 C 80 80, 160 90, 200 80" stroke="#fdfbf7" strokeWidth="2" strokeLinecap="round" fill="none" strokeDasharray="180" strokeDashoffset="180" opacity="0.8">
                        <animate
                            attributeName="stroke-dashoffset"
                            values="180;0;0;180"
                            keyTimes="0;0.5;0.8;1"
                            dur="4s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.2 1; 1 0 0 1; 0.4 0 0.2 1"
                        />
                    </path>
                </g>
            </svg>
        </div>
    )
}
