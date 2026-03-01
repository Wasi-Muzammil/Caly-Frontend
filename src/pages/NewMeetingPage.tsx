import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Clock, Calendar, Globe, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';

const NewMeetingPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [isPriority, setIsPriority] = useState(false);
  const [participantInput, setParticipantInput] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
  });
  const [loading, setLoading] = useState(false);

  const addParticipant = () => {
    const email = participantInput.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (!participants.includes(email)) {
        setParticipants([...participants, email]);
      }
      setParticipantInput('');
    } else if (email) {
      toast.error('Invalid email format');
    }
  };

  const removeParticipant = (email: string) => {
    setParticipants(participants.filter(p => p !== email));
  };

  const handleFindSlots = async () => {
    if (!title) return toast.error('Meeting title is required');
    if (participants.length === 0) return toast.error('Add at least one participant');

    setLoading(true);
    try {
      const res = await api.post('/meetings/suggest', {
        participant_emails: participants,
        duration_minutes: duration,
        date_range_start: new Date(dateRange.start).toISOString(),
        date_range_end: new Date(dateRange.end).toISOString(),
        is_priority: isPriority,
        timezone_offset_hours: -(new Date().getTimezoneOffset() / 60),
      });

      navigate('/meetings/confirm', {
        state: {
          suggestions: res.data,
          meetingDetails: { title, duration, participants, isPriority }
        }
      });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to find slots');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50">
      <Navbar />
      
      <main className="grow max-w-2xl mx-auto w-full px-4 py-12">
        <div className="mb-12">
          <h1 className="text-2xl font-semibold text-zinc-900">New Meeting</h1>
          <p className="text-sm text-zinc-500 mt-1">Configure your meeting details and find the best time.</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-8 shadow-sm space-y-10">
          {/* Section 1: Details */}
          <section className="space-y-6">
            <h3 className="label-caps">1. Meeting Details</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Product Design Review"
                  className="input-field w-full"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="input-field w-full"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => setIsPriority(!isPriority)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-medium transition-all w-full h-9 ${
                      isPriority 
                        ? 'bg-zinc-900 border-zinc-900 text-white' 
                        : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                    }`}
                  >
                    <AlertCircle className={`w-3.5 h-3.5 ${isPriority ? 'text-white' : 'text-zinc-400'}`} />
                    High Priority
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Participants */}
          <section className="space-y-6">
            <h3 className="label-caps">2. Participants</h3>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={participantInput}
                  onChange={(e) => setParticipantInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                  placeholder="Add guest email..."
                  className="input-field grow"
                />
                <button onClick={addParticipant} className="btn-secondary h-9 px-3">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {participants.map(email => (
                  <div key={email} className="flex items-center gap-2 px-2 py-1 bg-zinc-50 border border-zinc-100 rounded text-xs">
                    <span className="text-zinc-600 font-medium">{email}</span>
                    <button onClick={() => removeParticipant(email)} className="text-zinc-400 hover:text-zinc-900">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 3: Date Range */}
          <section className="space-y-6">
            <h3 className="label-caps">3. Date Range</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="input-field w-full"
                />
              </div>
            </div>
          </section>

          <div className="pt-6 border-t border-zinc-100">
            <button
              onClick={handleFindSlots}
              disabled={loading || !title || participants.length === 0}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finding slots...
                </>
              ) : (
                'Find Available Slots'
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewMeetingPage;
