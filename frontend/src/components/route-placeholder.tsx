import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "./page-header";

export function RoutePlaceholder({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="page-container placeholder-page">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="placeholder-stage" aria-label={`${title} implementation status`}>
        <span className="placeholder-number">P0</span>
        <div><h2>This route is ready for its feature module.</h2><p>The application shell and canonical demo context are available. Feature behavior is being implemented in its independent workstream.</p></div>
      </div>
      <Link className="text-link" href="/"><ArrowLeftIcon size={17} aria-hidden="true" />Return home</Link>
    </div>
  );
}
