import * as React from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getTechIconUrl } from '@/utils/techIcons';
import { FaLinkedin, FaGithub } from 'react-icons/fa';

// A single floating icon/card component with mouse magnetic repulsion and physics
const IconItem = ({ mouseX, mouseY, iconData, index }) => {
  const ref = React.useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  React.useEffect(() => {
    const handleMouseMove = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const distance = Math.sqrt(
          Math.pow(mouseX.current - (rect.left + rect.width / 2), 2) +
            Math.pow(mouseY.current - (rect.top + rect.height / 2), 2)
        );

        if (distance < 160) {
          const angle = Math.atan2(
            mouseY.current - (rect.top + rect.height / 2),
            mouseX.current - (rect.left + rect.width / 2)
          );
          const force = (1 - distance / 160) * 55;
          x.set(-Math.cos(angle) * force);
          y.set(-Math.sin(angle) * force);
        } else {
          x.set(0);
          y.set(0);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [x, y, mouseX, mouseY]);

  const iconUrl = getTechIconUrl(iconData.name);

  return (
    <motion.div
      ref={ref}
      style={{
        x: springX,
        y: springY,
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: index * 0.05,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn('absolute', iconData.className)}
    >
      <motion.div
        className="flex flex-col items-center justify-center p-3 rounded-2xl shadow-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 hover:border-purple-500/50 hover:bg-white/[0.08] transition-colors cursor-pointer group"
        style={{
          width: '85px',
          height: '85px',
        }}
        animate={{
          y: [0, -8, 0, 8, 0],
          x: [0, 6, 0, -6, 0],
          rotate: [0, 4, 0, -4, 0],
        }}
        transition={{
          duration: 4 + (index % 4),
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
      >
        <img
          src={iconUrl}
          alt={iconData.name}
          className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-transform group-hover:scale-110"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent && !parent.querySelector('.fallback-icon')) {
              const span = document.createElement('span');
              span.className = 'fallback-icon text-xs font-mono font-bold text-purple-400';
              span.innerText = iconData.name.slice(0, 2).toUpperCase();
              parent.insertBefore(span, parent.firstChild);
            }
          }}
        />
        <span className="text-[10px] font-semibold text-zinc-300 group-hover:text-white mt-1 font-mono tracking-wider truncate max-w-[70px]">
          {iconData.name}
        </span>
      </motion.div>
    </motion.div>
  );
};

const FloatingIconsHero = React.forwardRef(
  ({ className, name, role, experience, linkedinUrl, githubUrl, techStack = [], onEditClick, ...props }, ref) => {
    const mouseX = React.useRef(0);
    const mouseY = React.useRef(0);

    const handleMouseMove = (event) => {
      mouseX.current = event.clientX;
      mouseY.current = event.clientY;
    };

    // Pre-calculated relative floating positions across the viewport surrounding the center
    const floatingPositions = [
      'top-[10%] left-[8%]',
      'top-[15%] right-[10%]',
      'top-[35%] left-[5%]',
      'top-[38%] right-[6%]',
      'bottom-[18%] left-[8%]',
      'bottom-[15%] right-[10%]',
      'top-[8%] left-[30%]',
      'top-[8%] right-[30%]',
      'bottom-[10%] left-[28%]',
      'bottom-[10%] right-[28%]',
      'top-[55%] left-[12%]',
      'top-[58%] right-[12%]',
      'top-[25%] left-[20%]',
      'top-[25%] right-[20%]',
    ];

    const defaultTechs = ["Python", "JavaScript", "TypeScript", "React", "Next.js", "FastAPI", "PostgreSQL", "Supabase", "Docker", "Git", "PyTorch", "Tailwind", "C++", "Node.js"];
    const displayTechs = techStack.length > 0 ? techStack : defaultTechs;

    const iconsData = displayTechs.map((tech, i) => ({
      id: i,
      name: tech,
      className: floatingPositions[i % floatingPositions.length],
    }));

    const initials = name
      ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
      : 'U';

    return (
      <section
        ref={ref}
        onMouseMove={handleMouseMove}
        className={cn(
          'relative w-full min-h-[750px] flex items-center justify-center overflow-hidden bg-transparent py-16',
          className
        )}
        {...props}
      >
        {/* Background Floating Interactive Tech Icons */}
        <div className="absolute inset-0 w-full h-full pointer-events-auto">
          {iconsData.map((iconData, index) => (
            <IconItem
              key={`${iconData.name}-${index}`}
              mouseX={mouseX}
              mouseY={mouseY}
              iconData={iconData}
              index={index}
            />
          ))}
        </div>

        {/* Center Content: Name, Role, Social Buttons */}
        <div className="relative z-10 text-center px-4 max-w-2xl mx-auto flex flex-col items-center gap-6">
          
          {/* Avatar Ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-500 shadow-[0_0_40px_rgba(168,85,247,0.4)]"
          >
            <div className="w-full h-full rounded-full bg-[#0d0c14] flex items-center justify-center text-3xl font-black text-white font-mono">
              {initials}
            </div>
          </motion.div>

          {/* Name */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]"
          >
            {name || 'Anonymous Coder'}
          </motion.h1>

          {/* Role & Experience */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3 flex-wrap justify-center"
          >
            <span className="px-5 py-2 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 text-sm font-bold font-mono uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.25)]">
              {role || 'Full Stack Developer'}
            </span>
            <span className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium">
              {experience || 'Intermediate'}
            </span>
          </motion.div>

          {/* Social Links (LinkedIn & GitHub) Just Below Role */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center justify-center gap-4 mt-2"
          >
            {linkedinUrl ? (
              <a
                href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-blue-950/40 border border-blue-500/40 text-blue-300 hover:bg-blue-900/50 hover:border-blue-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] text-sm font-semibold"
              >
                <FaLinkedin size={20} className="text-blue-400" />
                <span>LinkedIn</span>
              </a>
            ) : (
              <div className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-500 text-sm opacity-60">
                <FaLinkedin size={20} />
                <span>LinkedIn (Not linked)</span>
              </div>
            )}

            {githubUrl ? (
              <a
                href={githubUrl.startsWith('http') ? githubUrl : `https://${githubUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-white hover:bg-purple-900/50 hover:border-purple-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] text-sm font-semibold"
              >
                <FaGithub size={20} />
                <span>GitHub</span>
              </a>
            ) : (
              <div className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-500 text-sm opacity-60">
                <FaGithub size={20} />
                <span>GitHub (Not linked)</span>
              </div>
            )}
          </motion.div>
          
        </div>
      </section>
    );
  }
);

FloatingIconsHero.displayName = 'FloatingIconsHero';

export { FloatingIconsHero };
