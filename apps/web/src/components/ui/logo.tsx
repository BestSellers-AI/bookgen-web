interface LogoProps {
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { svg: 32, title: "text-base", sub: "text-[9px]" },
  md: { svg: 40, title: "text-lg", sub: "text-[11px]" },
  lg: { svg: 48, title: "text-lg", sub: "text-[11px]" },
};

export function Logo({ size = "md" }: LogoProps) {
  const s = SIZES[size];

  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={s.svg}
        height={s.svg}
        viewBox="0 0 32 32"
        fill="none"
        className="flex-shrink-0"
      >
        <rect width="32" height="32" rx="8" fill="url(#logo-bg)" />
        <path
          d="M8 10C8 10 10 10.5 11.5 11C13 11.5 14 12 14 12V22C14 22 12.8 21.5 11.5 21C10 20.4 8 20 8 20V10Z"
          fill="#F59E0B"
          opacity="0.9"
        />
        <path
          d="M24 10C24 10 22 10.5 20.5 11C19 11.5 18 12 18 12V22C18 22 19.2 21.5 20.5 21C22 20.4 24 20 24 20V10Z"
          fill="#FCD34D"
          opacity="0.75"
        />
        <rect x="14.5" y="9" width="3" height="14" rx="0.5" fill="#F59E0B" />
        <path
          d="M16 4L16.8 6.5L19.5 6L17.5 7.8L18.5 10.5L16 9L13.5 10.5L14.5 7.8L12.5 6L15.2 6.5L16 4Z"
          fill="#FCD34D"
        />
        <defs>
          <linearGradient id="logo-bg" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="#131627" />
            <stop offset="100%" stopColor="#0D0F1C" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex flex-col leading-none">
        <span
          className={`font-playfair font-bold dark:text-cream-200 text-navy-900 ${s.title} tracking-tight`}
        >
          Best Sellers
        </span>
        <span
          className={`font-inter dark:text-gold-500 text-gold-600 ${s.sub} font-semibold tracking-[0.18em] uppercase`}
        >
          AI Platform
        </span>
      </div>
    </div>
  );
}
