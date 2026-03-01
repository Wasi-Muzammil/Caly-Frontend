import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Calendar, Clock, Check, ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

interface Slot {
  start: string;
  end: string;
  score: number;
  tags: string[];
}

interface SuggestionResponse {
  ranked_slots: Slot[];
  unavailable: string[];
  warning: string | null;
  message: string;
}

const ConfirmMeetingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    suggestions: SuggestionResponse;
    meetingDetails: {
      title: string;
      duration: number;
      participants: string[];
      isPriority: boolean;
    };
  };

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (!state) return <Navigate to="/dashboard" />;

  const { suggestions, meetingDetails } = state;

  const handleConfirm = async () => {
    if (!selectedSlot) return;

    setConfirming(true);
    try {
      await api.post('/meetings/confirm', {
        title: meetingDetails.title,
        start: selectedSlot.start,
        end: selectedSlot.end,
        participant_emails: meetingDetails.participants,
        is_priority: meetingDetails.isPriority,
      });

      toast.success('Meeting confirmed! Invites sent.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to confirm meeting');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50">
      <Navbar />
      
      <main className="grow max-w-3xl mx-auto w-full px-4 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-900 mb-10 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to configuration
        </button>

        <div className="mb-12">
          <h1 className="text-2xl font-semibold text-zinc-900">Top Available Times</h1>
          <p className="text-sm text-zinc-500 mt-1">{suggestions.message || 'Select the best slot for your team.'}</p>
        </div>

        {(suggestions.warning || (suggestions.unavailable && suggestions.unavailable.length > 0)) && (
          <div className="mb-10 p-4 rounded-lg bg-zinc-900 text-white flex gap-3 shadow-sm">
            <AlertTriangle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              {suggestions.warning && <p className="mb-1">{suggestions.warning}</p>}
              {suggestions.unavailable && suggestions.unavailable.length > 0 && (
                <p>Calendar access unavailable for: {suggestions.unavailable.join(', ')}.</p>
              )}
            </div>
          </div>
        )}

        {suggestions.ranked_slots.length > 0 ? (
          <div className="space-y-3">
            {suggestions.ranked_slots.map((slot, i) => (
              <SlotCard
                key={i}
                slot={slot}
                isSelected={selectedSlot === slot}
                onSelect={() => setSelectedSlot(slot)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-lg border border-zinc-200 shadow-sm">
            <p className="text-sm text-zinc-500 mb-6">No common availability found.</p>
            <button onClick={() => navigate(-1)} className="btn-secondary">
              Try expanding your date range
            </button>
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-zinc-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50"
          >
            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="font-semibold text-zinc-900 text-sm mb-1">{meetingDetails.title}</h4>
                <p className="text-zinc-500 text-xs">
                  {format(new Date(selectedSlot.start), 'EEEE, MMMM d')} · {format(new Date(selectedSlot.start), 'h:mm a')} — {format(new Date(selectedSlot.end), 'h:mm a')}
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="btn-secondary grow sm:grow-0 h-10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="btn-primary grow sm:grow-0 flex items-center justify-center gap-2 min-w-45 h-10"
                >
                  {confirming ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Confirm & Send Invites
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SlotCard: React.FC<{
  slot: Slot;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ slot, isSelected, onSelect }) => {
  const start = new Date(slot.start);
  const end = new Date(slot.end);
  const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

  return (
    <div
      onClick={onSelect}
      className={`p-5 rounded-lg border transition-all cursor-pointer group flex items-center justify-between gap-4 ${
        isSelected 
          ? 'bg-zinc-50 border-zinc-900 shadow-sm' 
          : 'bg-white border-zinc-200 hover:border-zinc-300'
      }`}
    >
      <div className="flex items-center gap-6">
        <div className="text-center min-w-15">
          <div className="text-[10px] font-bold uppercase text-zinc-400 mb-0.5">{format(start, 'EEE')}</div>
          <div className="text-xl font-bold text-zinc-900 leading-none">{format(start, 'd')}</div>
        </div>
        
        <div className="h-8 w-px bg-zinc-100 hidden sm:block" />
        
        <div>
          <h4 className="font-semibold text-zinc-900 text-sm mb-1">{format(start, 'MMMM d, yyyy')}</h4>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-300" />
              {format(start, 'h:mm a')} — {format(end, 'h:mm a')}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-300" />
              {duration}m
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2">
          {slot.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>
        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
          isSelected ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 text-transparent group-hover:border-zinc-300'
        }`}>
          <Check className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};

export default ConfirmMeetingPage;
