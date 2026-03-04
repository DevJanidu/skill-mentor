import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

function HeroBg({ children }: Props) {
  return (
    <div className="min-h-screen w-full relative">
      {/* Radial Gradient Background from Bottom */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(125% 125% at 50% 90%, #fff 40%, #475569 100%)',
        }}
      />

      {/* Your Content/Components */}
      <div className="relative z-10"> {children}</div>
    </div>
  );
}

export default HeroBg;
