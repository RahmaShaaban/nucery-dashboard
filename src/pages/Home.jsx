import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-heading text-6xl text-brand-burgundy mb-3 tracking-wide">
          Nucery
        </h1>
        <p className="text-brand-text/60 mb-12 font-body text-sm tracking-widest uppercase">
          Team Performance Dashboard
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/director-login"
            className="bg-brand-burgundy text-brand-gold px-8 py-3 rounded-lg font-medium hover:bg-brand-burgundy-light transition-colors duration-200 tracking-wide"
          >
            Director
          </Link>
          <Link
            to="/team-leader-login"
            className="bg-white/60 border border-brand-burgundy text-brand-burgundy px-8 py-3 rounded-lg font-medium hover:bg-white transition-colors duration-200 tracking-wide"
          >
            Team Leader
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home