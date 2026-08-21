import Link from "next/link";
import { ArrowRightIcon, BrainIcon, CompassIcon, ListChecksIcon, MicrophoneIcon } from "@phosphor-icons/react/dist/ssr";

const demoSteps = [
  {
    href: "/brain-coach",
    icon: MicrophoneIcon,
    eyebrow: "Step 1",
    title: "Ask by voice",
    copy: "Speak a sleep, stress, focus, or brain-training question.",
    cta: "Start voice coach",
  },
  {
    href: "/explore?view=brain",
    icon: BrainIcon,
    eyebrow: "Step 2",
    title: "See the brain score",
    copy: "The answer highlights the brain area that needs attention.",
    cta: "View brain",
  },
  {
    href: "/plan?start=brain-training",
    icon: ListChecksIcon,
    eyebrow: "Step 3",
    title: "Start training",
    copy: "Open the short attention task recommended by SleepOS.",
    cta: "Start task",
  },
] as const;

export default function HomePage() {
  return (
    <div className="page-container simple-home">
      <section className="simple-hero" aria-labelledby="home-title">
        <p className="eyebrow">SleepOS Demo</p>
        <h1 id="home-title">Voice in. Brain advice out.</h1>
        <p>Ask SleepOS what brain training to do, hear the answer, then see the brain/body view.</p>
        <div className="simple-hero-actions">
          <Link className="button button-primary" href="/brain-coach">
            Start demo <ArrowRightIcon size={18} aria-hidden="true" />
          </Link>
          <Link className="button button-secondary" href="/explore">
            Body view <CompassIcon size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="simple-flow" aria-label="Demo flow">
        {demoSteps.map(({ href, icon: StepIcon, eyebrow, title, copy, cta }) => (
          <Link className="simple-step" href={href} key={href}>
            <span className="simple-step-icon" aria-hidden="true"><StepIcon size={25} /></span>
            <span className="eyebrow">{eyebrow}</span>
            <strong>{title}</strong>
            <p>{copy}</p>
            <em>{cta} <ArrowRightIcon size={15} aria-hidden="true" /></em>
          </Link>
        ))}
      </section>

      <section className="simple-proof" aria-label="What this proves">
        <div>
          <span>What it proves</span>
          <strong>Voice AI guides safe wellness training.</strong>
        </div>
        <div>
          <span>Demo safe</span>
          <strong>Stable uses mock data. Live can call STT / MiniMax.</strong>
        </div>
      </section>
    </div>
  );
}
