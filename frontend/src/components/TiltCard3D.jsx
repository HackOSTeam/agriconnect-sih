import { useState, useRef } from 'react';

export default function TiltCard3D({
    children,
    className = '',
    maxTilt = 12,
    glare = true,
    onClick,
}) {
    const cardRef = useRef(null);
    const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, isHovered: false });

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -maxTilt;
        const rotateY = ((x - centerX) / centerX) * maxTilt;

        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;

        setTilt({
            rotateX,
            rotateY,
            glareX,
            glareY,
            isHovered: true,
        });
    };

    const handleMouseLeave = () => {
        setTilt({
            rotateX: 0,
            rotateY: 0,
            glareX: 50,
            glareY: 50,
            isHovered: false,
        });
    };

    return (
        <div
            ref={cardRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`card-3d-interactive relative overflow-hidden rounded-3xl ${className}`}
            style={{
                transform: tilt.isHovered
                    ? `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.02, 1.02, 1.02)`
                    : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
            }}
        >
            {/* Dynamic Glare Overlay */}
            {glare && tilt.isHovered && (
                <div
                    className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300"
                    style={{
                        background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.22) 0%, transparent 60%)`,
                    }}
                />
            )}
            {children}
        </div>
    );
}
