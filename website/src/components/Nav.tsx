import { Link } from 'react-router-dom';

export default function Nav() {
  return (
    <nav className="sticky top-0 z-100 flex items-center justify-between px-10 py-4 bg-bg/85 backdrop-blur-xl border-b border-border">
      <Link to="/" className="font-mono font-bold text-lg tracking-widest text-text-primary no-underline hover:no-underline">
        JOBS
      </Link>
      <div className="flex gap-7">
        <Link to="/leaderboard" className="text-text-secondary text-sm font-medium transition-colors hover:text-text-primary hover:no-underline">Browse</Link>
        <Link to="/how-it-works" className="text-text-secondary text-sm font-medium transition-colors hover:text-text-primary hover:no-underline">How It Works</Link>
        <Link to="/spec" className="text-text-secondary text-sm font-medium transition-colors hover:text-text-primary hover:no-underline">Spec</Link>
        <a href="https://github.com/HomyeeKing/openjob" target="_blank" rel="noopener noreferrer" className="text-text-secondary text-sm font-medium transition-colors hover:text-text-primary hover:no-underline">GitHub</a>
      </div>
    </nav>
  );
}
