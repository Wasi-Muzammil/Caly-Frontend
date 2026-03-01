import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Clock, Users, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface Meeting {
  id: string;
  title: string;
  scheduled_start: string;
  scheduled_end: string;
  status: 'confirmed' | 'pending';
  participants: string[];
}

const DashboardPage: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await api.get('/meetings');
        setMeetings(res.data.meetings);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const now = new Date();
  const filteredMeetings = meetings.filter(m => {
    const date = new Date(m.scheduled_start);
    return tab === 'upcoming' ? date >= now : date < now;
  });

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50">
      <Navbar />
      
      <main className="grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Meetings</h1>
            <p className="text-sm text-zinc-500 mt-1">Manage and track your scheduled sessions.</p>
          </div>
          <Link to="/meetings/new" className="btn-primary flex items-center gap-2 h-9">
            <Plus className="w-4 h-4" />
            New Meeting
          </Link>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
          <div className="flex gap-6 px-6 border-b border-zinc-100">
            <button
              onClick={() => setTab('upcoming')}
              className={`py-3 text-sm font-medium transition-colors relative ${
                tab === 'upcoming' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              Upcoming
              {tab === 'upcoming' && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900" />
              )}
            </button>
            <button
              onClick={() => setTab('past')}
              className={`py-3 text-sm font-medium transition-colors relative ${
                tab === 'past' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              Past
              {tab === 'past' && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900" />
              )}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <th className="px-6 py-3 label-caps">Meeting</th>
                  <th className="px-6 py-3 label-caps">Date & Time</th>
                  <th className="px-6 py-3 label-caps">Duration</th>
                  <th className="px-6 py-3 label-caps">Participants</th>
                  <th className="px-6 py-3 label-caps text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="animate-pulse border-b border-zinc-50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="h-4 bg-zinc-100 rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredMeetings.length > 0 ? (
                  filteredMeetings.map(meeting => (
                    <MeetingRow key={meeting.id} meeting={meeting} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <Calendar className="w-8 h-8 text-zinc-200 mb-3" />
                        <p className="text-sm text-zinc-500">No meetings found.</p>
                        <Link to="/meetings/new" className="text-zinc-900 text-sm font-medium mt-2 hover:underline">
                          Create your first one
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

const MeetingRow: React.FC<{ meeting: Meeting }> = ({ meeting }) => {
  const start = new Date(meeting.scheduled_start);
  const end = new Date(meeting.scheduled_end);
  const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

  return (
    <tr className="data-table-row group">
      <td className="px-6 py-4">
        <span className="text-sm font-medium text-zinc-900">{meeting.title}</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Calendar className="w-3.5 h-3.5 text-zinc-300" />
          {format(start, 'MMM d, yyyy · h:mm a')}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Clock className="w-3.5 h-3.5 text-zinc-300" />
          {duration}m
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex -space-x-1.5">
          {meeting.participants.slice(0, 4).map((email, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded bg-zinc-100 border border-white flex items-center justify-center text-[9px] font-bold text-zinc-600 shadow-sm"
              title={email}
            >
              {email.charAt(0).toUpperCase()}
            </div>
          ))}
          {meeting.participants.length > 4 && (
            <div className="w-6 h-6 rounded bg-zinc-50 border border-white flex items-center justify-center text-[9px] font-bold text-zinc-400">
              +{meeting.participants.length - 4}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
          meeting.status === 'confirmed' 
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
            : 'bg-amber-50 text-amber-600 border border-amber-100'
        }`}>
          {meeting.status}
        </span>
      </td>
    </tr>
  );
};

export default DashboardPage;
