import {motion, useReducedMotion} from 'framer-motion';
import landingMapImage from '@/assets/landing_map.jpg';

const pins = [
    {x: 80, y: 60, label: '공원', delay: 0.5, emoji: '🌳'},
    {x: 220, y: 90, label: '맛집', delay: 0.8, emoji: '🍽️'},
    {x: 150, y: 180, label: '명소', delay: 1.1, emoji: '📸'},
    {x: 280, y: 160, label: '카페', delay: 1.4, emoji: '☕'},
];

const pathPoints = 'M 80,60 Q 150,40 220,90 Q 185,140 150,180 Q 215,175 280,160';

const HeroAnimation = () => {
    const shouldReduceMotion = useReducedMotion();

    // UserRequest: 히어로 영역에 지도 핀/경로 애니메이션을 적용해 예제 랜딩과 동일한 동적 인상을 제공한다.
    // UserRequest: 모션이 과한 환경에서는 반복 애니메이션을 줄여 접근성을 개선한다.
    return (
        <motion.div
            whileHover={shouldReduceMotion ? undefined : {scale: 1.01}}
            transition={{duration: 0.25}}
            className="relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg aspect-[4/3]"
        >
            {/* UserRequest: 지도 영역을 직접 그리는 SVG를 제거하고 이미지 배경을 사용한다. */}
            <img src={landingMapImage} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover"/>

            <svg viewBox="0 0 360 240" className="relative z-10 h-full w-full">
                <motion.path
                    d={pathPoints}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="8 6"
                    initial={{pathLength: 0, opacity: 0}}
                    animate={{pathLength: 1, opacity: 1}}
                    transition={{duration: shouldReduceMotion ? 0.6 : 2, delay: 0.3, ease: 'easeInOut'}}
                />

                <motion.path
                    d={pathPoints}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="6"
                    strokeLinecap="round"
                    opacity={0.15}
                    initial={{pathLength: 0}}
                    animate={{pathLength: 1}}
                    transition={{duration: shouldReduceMotion ? 0.6 : 2, delay: 0.3, ease: 'easeInOut'}}
                />

                {/* UserRequest: 랜딩 지도 경로를 따라 이동하는 원형 요소를 제거한다. */}

                {pins.map((pin) => (
                    <g key={pin.label}>
                        <motion.circle
                            cx={pin.x}
                            cy={pin.y}
                            r="16"
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth="1.5"
                            initial={{scale: 0, opacity: 0}}
                            animate={{scale: [1, 1.8, 1.8], opacity: [0.5, 0, 0]}}
                            transition={{
                                duration: shouldReduceMotion ? 0.3 : 2,
                                delay: pin.delay + 1.5,
                                repeat: shouldReduceMotion ? 0 : Infinity,
                                repeatDelay: shouldReduceMotion ? 0 : 2,
                            }}
                            style={{transformOrigin: `${pin.x}px ${pin.y}px`}}
                        />

                        <motion.ellipse
                            cx={pin.x}
                            cy={pin.y + 22}
                            rx="10"
                            ry="4"
                            fill="hsl(var(--foreground))"
                            opacity={0.08}
                            initial={{scale: 0}}
                            animate={{scale: 1}}
                            transition={{delay: pin.delay, duration: 0.3}}
                            style={{transformOrigin: `${pin.x}px ${pin.y + 22}px`}}
                        />

                        <motion.g
                            initial={{y: -30, opacity: 0}}
                            animate={{y: 0, opacity: 1}}
                            transition={{
                                delay: pin.delay,
                                duration: 0.5,
                                type: 'spring',
                                stiffness: 200,
                                damping: 12,
                            }}
                        >
                            <path
                                d={`M ${pin.x} ${pin.y + 16}
                   C ${pin.x - 4} ${pin.y + 8}, ${pin.x - 14} ${pin.y - 2}, ${pin.x - 14} ${pin.y - 8}
                   C ${pin.x - 14} ${pin.y - 16}, ${pin.x - 8} ${pin.y - 22}, ${pin.x} ${pin.y - 22}
                   C ${pin.x + 8} ${pin.y - 22}, ${pin.x + 14} ${pin.y - 16}, ${pin.x + 14} ${pin.y - 8}
                   C ${pin.x + 14} ${pin.y - 2}, ${pin.x + 4} ${pin.y + 8}, ${pin.x} ${pin.y + 16} Z`}
                                fill="hsl(var(--primary))"
                            />
                            <circle cx={pin.x} cy={pin.y - 8} r="5" fill="white"/>
                        </motion.g>

                        <motion.g
                            initial={{scale: 0, opacity: 0}}
                            animate={{scale: 1, opacity: 1}}
                            transition={{delay: pin.delay + 0.4, duration: 0.3, type: 'spring'}}
                            style={{transformOrigin: `${pin.x + 18}px ${pin.y - 20}px`}}
                        >
                            <rect
                                x={pin.x + 8}
                                y={pin.y - 32}
                                width="52"
                                height="24"
                                rx="12"
                                fill="hsl(var(--background))"
                                stroke="hsl(var(--border))"
                                strokeWidth="1"
                                filter="drop-shadow(0 2px 4px hsl(var(--foreground) / 0.08))"
                            />
                            <text x={pin.x + 20} y={pin.y - 16} fontSize="11" textAnchor="start"
                                  fill="hsl(var(--foreground))" fontWeight="600">
                                {pin.emoji} {pin.label}
                            </text>
                        </motion.g>
                    </g>
                ))}
            </svg>

        </motion.div>
    );
};

export default HeroAnimation;
