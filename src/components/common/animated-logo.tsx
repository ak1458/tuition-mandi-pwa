export function AnimatedLogo({ className = '' }: { className?: string }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <svg
                width="44"
                height="44"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-sm"
                aria-hidden="true"
            >
                {/* Open book — two pages meeting at the spine */}
                <path
                    d="M24 14.5 C 19 11.2, 12 10.4, 6.5 12.2 V 35.4 C 12 33.6, 19 34.2, 24 37.6 Z"
                    fill="var(--marigold)"
                />
                <path
                    d="M24 14.5 C 29 11.2, 36 10.4, 41.5 12.2 V 35.4 C 36 33.6, 29 34.2, 24 37.6 Z"
                    fill="var(--marigold)"
                />
                <path d="M24 15.4 V 36.6" stroke="var(--on-marigold)" strokeWidth="1.7" strokeLinecap="round" />
                <g stroke="var(--on-marigold)" strokeWidth="1.6" strokeLinecap="round" opacity="0.5">
                    <path d="M11 19 H 19.5 M11 23.5 H 19.5 M11 28 H 18" />
                    <path d="M28.5 19 H 37 M28.5 23.5 H 37 M30 28 H 37" />
                </g>
                {/* Spark — the "aha" moment, gently twinkling */}
                <path
                    d="M38.5 6 l1.05 2.45 2.45 1.05 -2.45 1.05 -1.05 2.45 -1.05 -2.45 -2.45 -1.05 2.45 -1.05 Z"
                    fill="var(--marigold-deep)"
                >
                    <animate
                        attributeName="opacity"
                        values="0.65;1;0.65"
                        dur="2.4s"
                        repeatCount="indefinite"
                    />
                </path>
            </svg>
        </div>
    )
}
