/**
 * AmbientBackground — white base with subtle rainbow liquid-glass orbs.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{
        background:
          'linear-gradient(170deg, #FFFFFF 0%, #FEFEFE 42%, #FFFFFF 72%, #FDFDFD 100%)',
      }}
    >
      {/* Orb 1 — coral */}
      <Orb size={560} top="-8%" left="6%" color="#FFB5A7" opacity={0.28} animation="aurora-1" />
      {/* Orb 2 — peach */}
      <Orb size={500} top="2%" right="8%" color="#FFD6A5" opacity={0.24} animation="aurora-2" />
      {/* Orb 3 — gold */}
      <Orb
        size={460}
        top="42%"
        left="18%"
        color="#FDFFB6"
        opacity={0.18}
        animation="aurora-3"
        delay="-5s"
      />
      {/* Orb 4 — mint */}
      <Orb
        size={520}
        top="38%"
        right="22%"
        color="#CAFFBF"
        opacity={0.18}
        animation="aurora-1"
        delay="-10s"
      />
      {/* Orb 5 — sky */}
      <Orb
        size={480}
        bottom="6%"
        left="12%"
        color="#9BF6FF"
        opacity={0.2}
        animation="aurora-2"
        delay="-14s"
      />
      {/* Orb 6 — fresh-blue */}
      <Orb
        size={520}
        bottom="-8%"
        right="4%"
        color="#8FD8FF"
        opacity={0.22}
        animation="aurora-3"
        delay="-18s"
      />
      {/* Orb 7 — rose */}
      <Orb
        size={380}
        bottom="12%"
        left="42%"
        color="#FFC6FF"
        opacity={0.18}
        animation="aurora-1"
        delay="-22s"
      />

      {/* Subtle grain texture */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

interface OrbProps {
  size: number;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  color: string;
  opacity: number;
  animation: 'aurora-1' | 'aurora-2' | 'aurora-3';
  delay?: string;
}

function Orb({ size, top, bottom, left, right, color, opacity, animation, delay }: OrbProps) {
  return (
    <div
      className={`absolute rounded-full blur-3xl animate-${animation}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        top,
        bottom,
        left,
        right,
        opacity,
        background: `radial-gradient(circle, ${color} 0%, ${color}00 70%)`,
        mixBlendMode: 'multiply',
        animationDelay: delay,
      }}
    />
  );
}
