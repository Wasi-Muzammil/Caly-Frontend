import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, AlertCircle, Loader2 } from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { format, addDays } from "date-fns";
import toast from "react-hot-toast";

// ── Timezone helper ───────────────────────────────────────────────────────────
// Converts "2026-03-02" + "09:00" → "2026-03-02T09:00:00+05:00"
// The offset is derived from the browser's local timezone automatically.
function toLocalISO(date: string, time: string): string {
  const offsetMinutes = new Date().getTimezoneOffset(); // e.g. -300 for PKT (UTC+5)
  const offsetSign = offsetMinutes <= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetMinutes);
  const hh = String(Math.floor(absOffset / 60)).padStart(2, "0");
  const mm = String(absOffset % 60).padStart(2, "0");
  return `${date}T${time}:00${offsetSign}${hh}:${mm}`;
}

// Returns the browser's IANA timezone name e.g. "Asia/Karachi"
function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

const NewMeetingPage: React.FC = () => {
  const navigate = useNavigate();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [isPriority, setIsPriority] = useState(false);
  const [participantInput, setParticipantInput] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Date range — start/end dates for the search window
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), "yyyy-MM-dd"),
    end: format(addDays(new Date(), 7), "yyyy-MM-dd"),
  });

  // Start time — the daily time window to search within
  // e.g. startTime = "09:00", endTime is calculated as startTime + duration
  const [startTime, setStartTime] = useState("09:00");

  // ── Participant helpers ─────────────────────────────────────────────────────
  const addParticipant = () => {
    const email = participantInput.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (!participants.includes(email)) {
        setParticipants([...participants, email]);
      }
      setParticipantInput("");
    } else if (email) {
      toast.error("Invalid email format");
    }
  };

  const removeParticipant = (email: string) => {
    setParticipants(participants.filter((p) => p !== email));
  };

  // ── API call ────────────────────────────────────────────────────────────────
  const handleFindSlots = async () => {
    if (!title) return toast.error("Meeting title is required");
    if (participants.length === 0)
      return toast.error("Add at least one participant");
    if (dateRange.end < dateRange.start)
      return toast.error("End date must be after start date");

    // Build RFC 3339 datetimes with local timezone offset
    // Backend requires offset — "2026-03-02T09:00:00+05:00" not "2026-03-02T04:00:00Z"
    const startISO = toLocalISO(dateRange.start, startTime);

    // End of search window = end date at startTime (same daily window, different day)
    const endISO = toLocalISO(dateRange.end, startTime);

    setLoading(true);
    try {
      const res = await api.post("/meeting/suggest", {
        // ── Exact field names from backend SuggestRequest schema ──
        participants: participants,
        duration_minutes: duration,
        start_date: startISO, // RFC 3339 with local offset e.g. 2026-03-02T09:00:00+05:00
        end_date: endISO, // RFC 3339 with local offset e.g. 2026-03-09T09:00:00+05:00
        is_priority: isPriority,
        timezone: getBrowserTimezone(), // e.g. "Asia/Karachi"
        max_slots: 10,
      });

      // Pass all form data to the confirm page so it can book the chosen slot
      navigate("/meetings/confirm", {
        state: {
          suggestions: res.data, // { slots: [...], warnings: [...] }
          meetingDetails: {
            title,
            duration,
            participants,
            isPriority,
            timezone: getBrowserTimezone(),
          },
        },
      });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      // Pydantic validation errors come back as an array
      const message = Array.isArray(detail)
        ? detail.map((e: any) => e.msg).join(", ")
        : detail || "Failed to find slots";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived display value for end time preview ──────────────────────────────
  const previewEndTime = (() => {
    const [h, m] = startTime.split(":").map(Number);
    const totalMins = h * 60 + m + duration;
    const eh = String(Math.floor(totalMins / 60) % 24).padStart(2, "0");
    const em = String(totalMins % 60).padStart(2, "0");
    return `${eh}:${em}`;
  })();

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50">
      <Navbar />

      <main className="grow max-w-2xl mx-auto w-full px-4 py-12">
        <div className="mb-12">
          <h1 className="text-2xl font-semibold text-zinc-900">New Meeting</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Configure your meeting and find the best time for all participants.
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-8 shadow-sm space-y-10">
          {/* ── Section 1: Details ─────────────────────────────────────── */}
          <section className="space-y-6">
            <h3 className="label-caps">1. Meeting Details</h3>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Title
                </label>
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
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Duration
                  </label>
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
                        ? "bg-zinc-900 border-zinc-900 text-white"
                        : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    <AlertCircle
                      className={`w-3.5 h-3.5 ${isPriority ? "text-white" : "text-zinc-400"}`}
                    />
                    High Priority
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 2: Participants ────────────────────────────────── */}
          <section className="space-y-6">
            <h3 className="label-caps">2. Participants</h3>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={participantInput}
                  onChange={(e) => setParticipantInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addParticipant()}
                  placeholder="Add guest email..."
                  className="input-field grow"
                />
                <button
                  onClick={addParticipant}
                  className="btn-secondary h-9 px-3"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {participants.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {participants.map((email) => (
                    <div
                      key={email}
                      className="flex items-center gap-2 px-2 py-1 bg-zinc-50 border border-zinc-100 rounded text-xs"
                    >
                      <span className="text-zinc-600 font-medium">{email}</span>
                      <button
                        onClick={() => removeParticipant(email)}
                        className="text-zinc-400 hover:text-zinc-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── Section 3: Schedule ───────────────────────────────────── */}
          <section className="space-y-6">
            <h3 className="label-caps">3. Schedule</h3>

            {/* Start Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Meeting Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              {/* End time is read-only, auto-calculated from start + duration */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  End Time{" "}
                  <span className="text-zinc-400">(auto-calculated)</span>
                </label>
                <div className="input-field w-full bg-zinc-50 text-zinc-400 cursor-default select-none">
                  {previewEndTime}
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Search From Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Search To Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  min={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                  className="input-field w-full"
                />
              </div>
            </div>

            {/* Timezone info */}
            <p className="text-[11px] text-zinc-400">
              Your timezone:{" "}
              <span className="font-medium text-zinc-500">
                {getBrowserTimezone()}
              </span>{" "}
              — all times are in your local timezone.
            </p>
          </section>

          {/* ── Submit ────────────────────────────────────────────────── */}
          <div className="pt-6 border-t border-zinc-100">
            <button
              onClick={handleFindSlots}
              disabled={loading || !title || participants.length === 0}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 h-11 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finding slots...
                </>
              ) : (
                "Find Available Slots"
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewMeetingPage;
