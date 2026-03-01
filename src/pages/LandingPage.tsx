import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Users, Zap, ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="grow flex flex-col items-center justify-center px-4 py-32 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 text-zinc-900">
            Scheduling, <br />
            <span className="text-zinc-400">reimagined.</span>
          </h1>
          <p className="text-lg text-zinc-500 mb-12 max-w-xl mx-auto leading-relaxed">
            Caly automates the back-and-forth of finding meeting times. Connect
            your calendar and let AI handle the coordination.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={user ? "/dashboard" : "/login"}
              className="btn-primary text-base px-10 py-4 flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to={user ? "/dashboard" : "/login"}
              className="btn-secondary text-base px-10 py-4"
            >
              View Demo
            </Link>
          </div>

          <div className="mt-32 pt-16 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                Calendar Sync
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Direct integration with Google Calendar ensures your
                availability is always up to date.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                Multi-participant
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Coordinate with entire teams instantly. Caly finds the overlap
                that works for everyone.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                Instant Confirmation
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Once a slot is picked, invites are sent automatically. No more
                manual follow-ups.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
