import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

type Feature = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  cta: { label: string; href: string };
  image: { src: string; alt: string };
  imageSide: "left" | "right";
  bullets?: string[];
};

const features: Feature[] = [
  {
    eyebrow: "Practice Mode",
    title: (
      <>
        A new feature that makes learning{" "}
        <span className="italic text-amber-400">songs easier</span> than
        ever before!
      </>
    ),
    description:
      "Practice Mode waits for you to play, allowing you to work through the notes and rhythms at your own pace. No metronome pressure — just you and the music, building confidence one note at a time.",
    cta: { label: "More About Practice Mode", href: "/features/practice-mode" },
    image: { src: "/images/features/practice-mode.jpg", alt: "A student practicing piano at home" },
    imageSide: "right",
  },
  {
    eyebrow: "Sight Reading",
    title: (
      <>
        The Standard Assessment of{" "}
        <span className="italic text-amber-400">Sight Reading</span>
      </>
    ),
    description:
      "The SASR (Standard Assessment of Sight Reading) is a piano sight reading test that also teaches you to sight read better. Each time you take the SASR test you'll get a sight reading score and a chart showing your sight reading progress. Find out what your sight reading score is today!",
    cta: { label: "More About The SASR", href: "/features/sasr" },
    image: { src: "/images/features/sasr-dashboard.png", alt: "SASR score dashboard showing progress over time" },
    imageSide: "left",
  },
  {
    eyebrow: "Learning Tools",
    title: (
      <>
        Learn proper piano technique with{" "}
        <span className="italic text-amber-400">powerful learning tools!</span>
      </>
    ),
    description: "",
    cta: { label: "More About Piano Learning Tools", href: "/features/learning-tools" },
    image: { src: "/images/features/technique-library.png", alt: "Piano technique library with rhythm exercises" },
    imageSide: "right",
    bullets: [
      "Over **70,000 songs** and exercises",
      "**Thousands of student videos** to watch and learn from",
      "**SASR sight reading** to learn",
      "**Instant feedback** on your performance",
      "**Automatic page turning** feature",
      "**Practice modes**, and much more",
    ],
  },
];

function Bullet({ text }: { text: string }) {
  const parts = text.split("**");
  return (
    <li className="flex items-start gap-3 py-2 border-b border-white/10 text-sm text-neutral-300">
      <span className="mt-1 text-amber-400">♦</span>
      <span>
        {parts.map((part, i) =>
          i % 2 === 1 ? (
            <strong key={i} className="font-semibold text-white">
              {part}
            </strong>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    </li>
  );
}

function FeatureBlock({ feature }: { feature: Feature }) {
  const imageFirst = feature.imageSide === "left";

  const Copy = (
    <div className={imageFirst ? "md:pl-4" : "md:pr-4"}>
      <span className="inline-block rounded-full border border-amber-400/40 px-3 py-1 text-[11px] tracking-wide text-amber-400">
        {feature.eyebrow}
      </span>
      <h2 className="mt-5 text-3xl md:text-4xl font-bold leading-tight text-white">
        {feature.title}
      </h2>
      {feature.description && (
        <p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-400">
          {feature.description}
        </p>
      )}
      {feature.bullets && (
        <ul className="mt-5 max-w-md">
          {feature.bullets.map((b) => (
            <Bullet key={b} text={b} />
          ))}
        </ul>
      )}
      <Link
        href={feature.cta.href}
        className="mt-6 inline-block rounded-full border border-amber-400 px-5 py-2 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-400 hover:text-black"
      >
        {feature.cta.label}
      </Link>
    </div>
  );

  const Media = (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10">
      <Image
        src={feature.image.src}
        alt={feature.image.alt}
        fill
        className="object-cover"
        sizes="(min-width: 768px) 45vw, 100vw"
      />
    </div>
  );

  return (
    <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
      {imageFirst ? (
        <>
          {Media}
          {Copy}
        </>
      ) : (
        <>
          {Copy}
          {Media}
        </>
      )}
    </div>
  );
}

export default function FeaturesShowcase() {
  return (
    <section className="bg-black py-20 md:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-24 px-6 md:gap-32">
        {features.map((feature) => (
          <FeatureBlock key={feature.eyebrow} feature={feature} />
        ))}
      </div>
    </section>
  );
}