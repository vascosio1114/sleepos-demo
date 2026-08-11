import Link from "next/link";
export default function NotFound(){return <div className="page-container not-found-page"><span className="error-code">404 · NOT FOUND</span><h1>This view is outside the plan.</h1><p>The page may have moved or is not part of the five SleepOS destinations.</p><Link className="button button-primary" href="/">Return home</Link></div>}
