import { useEffect, useRef } from 'react';

export default function Particle3DCanvas({ className = '' }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
        let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
            height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        // 3D Particles Definition
        const numParticles = 65;
        const particles = [];
        const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2, radius: 180 };

        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: (Math.random() - 0.5) * width * 1.5,
                y: (Math.random() - 0.5) * height * 1.5,
                z: Math.random() * 800 + 100, // 3D depth
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                vz: (Math.random() - 0.5) * 0.6,
                radius: Math.random() * 2.5 + 1.2,
                color: Math.random() > 0.3 ? '#10B981' : '#F59E0B',
                pulse: Math.random() * Math.PI * 2,
            });
        }

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.targetX = e.clientX - rect.left - width / 2;
            mouse.targetY = e.clientY - rect.top - height / 2;
        };

        window.addEventListener('mousemove', handleMouseMove);

        const fov = 400; // Field of View for 3D projection

        const render = () => {
            // Smooth mouse dampening
            mouse.x += (mouse.targetX - mouse.x) * 0.05;
            mouse.y += (mouse.targetY - mouse.y) * 0.05;

            ctx.clearRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height / 2;

            // Project & update particles
            const projected = [];

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                p.x += p.vx;
                p.y += p.vy;
                p.z += p.vz;
                p.pulse += 0.03;

                // Wrap boundaries in 3D
                if (p.z < 100) p.z = 900;
                if (p.z > 900) p.z = 100;
                if (p.x < -width) p.x = width;
                if (p.x > width) p.x = -width;
                if (p.y < -height) p.y = height;
                if (p.y > height) p.y = -height;

                // Smooth gentle projection without camera tilt rotation
                const x1 = p.x;
                const y2 = p.y;
                const z2 = p.z;

                if (z2 + fov > 10) {
                    const scale = fov / (fov + z2);
                    const projX = x1 * scale + cx;
                    const projY = y2 * scale + cy;
                    const alpha = Math.max(0.1, Math.min(0.75, (1 - z2 / 1000) + Math.sin(p.pulse) * 0.15));

                    projected.push({
                        projX,
                        projY,
                        scale,
                        alpha,
                        radius: p.radius * scale,
                        color: p.color
                    });
                }
            }

            // Draw connecting lines for nearby 3D points
            for (let i = 0; i < projected.length; i++) {
                for (let j = i + 1; j < projected.length; j++) {
                    const p1 = projected[i];
                    const p2 = projected[j];
                    const dx = p1.projX - p2.projX;
                    const dy = p1.projY - p2.projY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 110) {
                        const lineAlpha = (1 - dist / 110) * 0.25 * Math.min(p1.alpha, p2.alpha);
                        ctx.beginPath();
                        ctx.strokeStyle = p1.color === '#F59E0B' ? `rgba(245, 158, 11, ${lineAlpha})` : `rgba(16, 185, 129, ${lineAlpha})`;
                        ctx.lineWidth = 0.8;
                        ctx.moveTo(p1.projX, p1.projY);
                        ctx.lineTo(p2.projX, p2.projY);
                        ctx.stroke();
                    }
                }
            }

            // Draw particle nodes with glowing radial gradient
            for (let i = 0; i < projected.length; i++) {
                const p = projected[i];
                ctx.beginPath();
                ctx.arc(p.projX, p.projY, Math.max(1, p.radius), 0, Math.PI * 2);
                ctx.fillStyle = p.color === '#F59E0B' ? `rgba(245, 158, 11, ${p.alpha})` : `rgba(16, 185, 129, ${p.alpha})`;
                ctx.fill();

                // Glow ring
                if (p.scale > 0.8) {
                    ctx.beginPath();
                    ctx.arc(p.projX, p.projY, p.radius * 2.2, 0, Math.PI * 2);
                    ctx.fillStyle = p.color === '#F59E0B' ? `rgba(245, 158, 11, ${p.alpha * 0.2})` : `rgba(16, 185, 129, ${p.alpha * 0.2})`;
                    ctx.fill();
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={`pointer-events-none absolute inset-0 z-0 ${className}`}
            style={{ width: '100%', height: '100%' }}
        />
    );
}
