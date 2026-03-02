import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Check,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Star,
  Users,
} from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";

// ── Types matching backend SuggestResponse ────────────────────────────────────
interface SlotResult {
  start: string;
  end: string;
  score: number;
  free_count: number;
  total_participants: number;
  all_free: boolean;
}

interface SuggestResponse {
  slots: SlotResult[];
  warnings: string[];
}

interface MeetingDetails {
  title: string;
  duration: number;
  participants: string[];
  isPriority: boolean;
  timezone: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatSlotTime(iso: string): string {
  try {
    return format(parseISO(iso), "EEE, MMM d · h:mm a");
  } catch {
    return iso;
  }
}

function formatEndTime(iso: string): string {
  try {
    return format(parseISO(iso), "h:mm a");
  } catch {
    return iso;
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-500 bg-red-50 border-red-200";
}

// ── Component ─────────────────────────────────────────────────────────────────
const ConfirmMeetingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Data passed from NewMeetingPage via navigate state
  const { suggestions, meetingDetails } = (location.state || {}) as {
    suggestions: SuggestResponse;
    meetingDetails: MeetingDetails;
  };

  const [selectedSlot, setSelectedSlot] = useState<SlotResult | null>(
    suggestions?.slots?.[0] ?? null, // pre-select the top-ranked slot
  );
  const [confirming, setConfirming] = useState(false);

  // Guard — if user lands here directly without state, send them back
  if (!suggestions || !meetingDetails) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50/50">
        <Navbar />
        <main className="grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-500 mb-4">No meeting data found.</p>
            <button
              onClick={() => navigate("/meetings/new")}
              className="btn-primary"
            >
              Start Over
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Book the selected slot ────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!selectedSlot) return toast.error("Please select a time slot");

    setConfirming(true);
    try {
      await api.post("/meeting/create", {
        // ── Exact field names from backend ConfirmRequest schema ──
        title: meetingDetails.title,
        start: selectedSlot.start, // RFC 3339 with offset, from backend suggest response
        duration_minutes: meetingDetails.duration,
        participants: meetingDetails.participants,
        is_priority: meetingDetails.isPriority,
        timezone: meetingDetails.timezone,
      });

      toast.success("Meeting created! Invites sent to all participants.");
      navigate("/dashboard");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((e: any) => e.msg).join(", ")
        : detail || "Failed to create meeting";
      toast.error(message);
    } finally {
      setConfirming(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50">
      <Navbar />

      <main className="grow max-w-2xl mx-auto w-full px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <button
            onClick={() => navigate("/meetings/new")}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Choose a Time Slot
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Ranked by availability overlap and preferred time windows.
          </p>
        </div>

        {/* Meeting summary card */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5 mb-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium mb-1">
                Meeting
              </p>
              <h2 className="text-base font-semibold text-zinc-900">
                {meetingDetails.title}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                {meetingDetails.duration} min
                {meetingDetails.isPriority && (
                  <span className="ml-2 px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded text-[10px] font-medium uppercase tracking-wide">
                    Urgent
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Users className="w-3.5 h-3.5" />
              {meetingDetails.participants.length} participant
              {meetingDetails.participants.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Participants list */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {meetingDetails.participants.map((email) => (
              <span
                key={email}
                className="px-2 py-0.5 bg-zinc-50 border border-zinc-100 rounded text-[11px] text-zinc-600"
              >
                {email}
              </span>
            ))}
          </div>
        </div>

        {/* Warnings */}
        {suggestions.warnings.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                {suggestions.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-700">
                    {w}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Slot list */}
        {suggestions.slots.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-lg p-10 text-center shadow-sm">
            <p className="text-zinc-500 text-sm mb-4">
              No available slots found in the selected window.
            </p>
            <button
              onClick={() => navigate("/meetings/new")}
              className="btn-secondary"
            >
              Try Different Dates
            </button>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {suggestions.slots.map((slot, idx) => {
              const isSelected = selectedSlot?.start === slot.start;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedSlot(slot)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    isSelected
                      ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-sm font-medium ${isSelected ? "text-white" : "text-zinc-900"}`}
                      >
                        {formatSlotTime(slot.start)}
                        <span
                          className={`ml-1 font-normal ${isSelected ? "text-zinc-300" : "text-zinc-400"}`}
                        >
                          → {formatEndTime(slot.end)}
                        </span>
                      </p>
                      <p
                        className={`text-xs mt-1 ${isSelected ? "text-zinc-400" : "text-zinc-500"}`}
                      >
                        {slot.free_count} of {slot.total_participants}{" "}
                        participants free
                        {slot.all_free && (
                          <span
                            className={`ml-2 font-medium ${isSelected ? "text-emerald-400" : "text-emerald-600"}`}
                          >
                            · Everyone available
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Score badge */}
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                          isSelected
                            ? "bg-zinc-700 text-white border-zinc-600"
                            : scoreColor(slot.score)
                        }`}
                      >
                        {slot.score}
                      </span>

                      {/* Best slot star */}
                      {idx === 0 && (
                        <Star
                          className={`w-3.5 h-3.5 ${isSelected ? "text-yellow-400" : "text-zinc-300"}`}
                          fill="currentColor"
                        />
                      )}

                      {/* Selected check */}
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Confirm button */}
        {suggestions.slots.length > 0 && (
          <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">
                  Selected Slot
                </p>
                {selectedSlot && (
                  <p className="text-sm font-medium text-zinc-900 mt-1">
                    {formatSlotTime(selectedSlot.start)} →{" "}
                    {formatEndTime(selectedSlot.end)}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={confirming || !selectedSlot}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 h-11 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Booking meeting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm & Send Invites
                </>
              )}
            </button>

            <p className="text-[11px] text-zinc-400 text-center mt-3">
              This will create the event on your Google Calendar and email all
              participants.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ConfirmMeetingPage;
