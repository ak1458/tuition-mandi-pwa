export function AnimatedBackground() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[linear-gradient(135deg,#fdfbf7_0%,#f4ece1_100%)]">
            <svg
                className="absolute w-[150vw] h-[150vh] opacity-[0.35] blur-[80px]"
                style={{ left: '-25vw', top: '-25vh' }}
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#e07a2f" />
                        <stop offset="100%" stopColor="#c0586a" />
                    </linearGradient>
                    <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#5b8c6e" />
                        <stop offset="100%" stopColor="#1c1b35" />
                    </linearGradient>
                </defs>

                <circle cx="20%" cy="20%" r="30%" fill="url(#grad1)">
                    <animate
                        attributeName="cx"
                        values="20%;80%;20%"
                        dur="28s"
                        repeatCount="indefinite"
                        keyTimes="0;0.5;1"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                    />
                    <animate
                        attributeName="cy"
                        values="20%;80%;20%"
                        dur="32s"
                        repeatCount="indefinite"
                        keyTimes="0;0.5;1"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                    />
                </circle>

                <circle cx="80%" cy="80%" r="35%" fill="url(#grad2)">
                    <animate
                        attributeName="cx"
                        values="80%;20%;80%"
                        dur="32s"
                        repeatCount="indefinite"
                        keyTimes="0;0.5;1"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                    />
                    <animate
                        attributeName="cy"
                        values="80%;20%;80%"
                        dur="36s"
                        repeatCount="indefinite"
                        keyTimes="0;0.5;1"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                    />
                </circle>

                <circle cx="50%" cy="50%" r="20%" fill="#ede3cc">
                    <animate
                        attributeName="r"
                        values="20%;40%;20%"
                        dur="24s"
                        repeatCount="indefinite"
                        keyTimes="0;0.5;1"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                    />
                </circle>
            </svg>
            <div className="absolute inset-0 bg-[#fdfbf7]/40 backdrop-blur-[100px]" />
        </div>
    )
}
