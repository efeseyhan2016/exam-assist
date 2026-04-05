interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="space-y-1.5 px-1">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
        {eyebrow}
      </p>
      <h2 className="text-[1.35rem] font-semibold text-white sm:text-[1.55rem]">{title}</h2>
      <p className="max-w-3xl text-sm leading-5 text-slate-300">{description}</p>
    </div>
  );
}
