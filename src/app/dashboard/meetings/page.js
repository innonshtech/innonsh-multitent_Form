'use client';

import { useEffect, useState } from 'react';
import { 
  Loader2, 
  Search, 
  Plus, 
  User, 
  Clock, 
  Trash2, 
  X, 
  Info,
  Calendar,
  Video,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Users,
  Target,
  PlusCircle,
  FileText,
  ExternalLink,
  Ban
} from 'lucide-react';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [salesReps, setSalesReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [repFilter, setRepFilter] = useState('');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [locationType, setLocationType] = useState('Online');
  const [locationDetail, setLocationDetail] = useState(''); // Meet URL or address
  const [agenda, setAgenda] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [associatedType, setAssociatedType] = useState('None'); // 'None', 'Lead', 'Contact'
  const [associatedLeadId, setAssociatedLeadId] = useState('');
  const [associatedContactId, setAssociatedContactId] = useState('');

  const [formError, setFormError] = useState('');

  // Toast Helper
  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage({ text: '', type: '' });
    }, 4000);
  };

  // Fetch current user details
  useEffect(() => {
    async function initMeetingsPage() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData.user);

          if (userData.user.role === 'owner' || userData.user.role === 'sales_admin') {
            const repsRes = await fetch('/api/users');
            if (repsRes.ok) {
              const repsData = await repsRes.json();
              setSalesReps(repsData.users || []);
            }
          }
        }

        // Fetch leads & contacts
        const [leadsRes, contactsRes] = await Promise.all([
          fetch('/api/leads'),
          fetch('/api/contacts')
        ]);

        if (leadsRes.ok) {
          const data = await leadsRes.json();
          setLeads(data.leads || []);
        }
        if (contactsRes.ok) {
          const data = await contactsRes.json();
          setContacts(data.contacts || []);
        }

      } catch (err) {
        console.error('Meetings page initialization failed:', err);
      }
    }
    initMeetingsPage();
  }, []);

  // Fetch meetings with filters
  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (statusFilter) queryParams.append('status', statusFilter);
      if (locationFilter) queryParams.append('locationType', locationFilter);
      if (repFilter) queryParams.append('assignedTo', repFilter);

      const res = await fetch(`/api/meetings?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
      }
    } catch (err) {
      console.error('Fetch meetings failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [search, statusFilter, locationFilter, repFilter]);

  // Handle Complete/Cancel Status Toggle
  const handleUpdateStatus = async (meeting, nextStatus) => {
    // Optimistic local state update
    const updatedMeetings = meetings.map(m => {
      if (m._id === meeting._id) return { ...m, status: nextStatus };
      return m;
    });
    setMeetings(updatedMeetings);

    try {
      const res = await fetch(`/api/meetings/${meeting._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        showToast(nextStatus === 'Completed' ? '🎉 Meeting marked as Completed!' : '🔴 Meeting Cancelled.');
        fetchMeetings();
      } else {
        showToast('Failed to reschedule status.', 'error');
        fetchMeetings();
      }
    } catch (err) {
      showToast('Network error updating meeting status.', 'error');
      fetchMeetings();
    }
  };

  // Schedule meeting submit
  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);

    const meetingData = {
      title: title.trim(),
      startTime,
      endTime,
      locationType,
      locationDetail: locationDetail.trim(),
      agenda: agenda.trim(),
      status: 'Scheduled',
      assignedTo: assignedTo || undefined,
      leadId: associatedType === 'Lead' ? associatedLeadId : undefined,
      contactId: associatedType === 'Contact' ? associatedContactId : undefined
    };

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingData),
      });

      const data = await res.json();

      if (res.ok) {
        setAddModalOpen(false);
        resetForm();
        fetchMeetings();
        showToast('📅 Client demo meeting successfully scheduled!');
      } else {
        setFormError(data.error || 'Failed to schedule meeting.');
      }
    } catch (err) {
      setFormError('Network connection issue. Try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Meeting log
  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm('Are you sure you want to delete this meeting schedule?')) return;

    try {
      const res = await fetch(`/api/meetings/${meetingId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMeetings();
        showToast('🗑️ Meeting schedule deleted.');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete meeting.');
      }
    } catch (err) {
      console.error('Delete meeting failed:', err);
    }
  };

  const resetForm = () => {
    setTitle('');
    setStartTime('');
    setEndTime('');
    setLocationType('Online');
    setLocationDetail('');
    setAgenda('');
    setAssignedTo('');
    setAssociatedType('None');
    setAssociatedLeadId('');
    setAssociatedContactId('');
    setFormError('');
  };

  // Dynamic status badges
  const getStatusBadge = (stat) => {
    switch (stat) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-extrabold';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-100 font-medium';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-100 font-black animate-pulse';
    }
  };

  // Live status logic
  const getLiveTimingLabel = (meeting) => {
    if (meeting.status !== 'Scheduled') return null;

    const now = new Date();
    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime);

    if (now >= start && now <= end) {
      return { label: '🔴 Live Now!', style: 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse font-black' };
    } else if (now < start) {
      const diffHrs = Math.round((start - now) / (1000 * 60 * 60));
      if (diffHrs <= 2) {
        return { label: '⏳ Starting soon!', style: 'bg-amber-100 text-amber-800 border-amber-200' };
      }
      return { label: '⏳ Upcoming', style: 'bg-slate-50 text-slate-600 border-slate-200' };
    }
    return { label: '✓ Passed/Overdue', style: 'bg-slate-100 text-slate-400 border-slate-150' };
  };

  // Formatting date/time range
  const formatRange = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const dateStr = s.toLocaleDateString('en-IN', { dateStyle: 'medium' });
    const sTime = s.toLocaleTimeString('en-IN', { timeStyle: 'short' });
    const eTime = e.toLocaleTimeString('en-IN', { timeStyle: 'short' });
    return `${dateStr} | ${sTime} - ${eTime}`;
  };

  // Analytics Metrics Counters
  const totalMeetings = meetings.length;
  const onlineCount = meetings.filter(m => m.locationType === 'Online').length;
  const offlineCount = meetings.filter(m => m.locationType === 'Offline').length;
  const completedCount = meetings.filter(m => m.status === 'Completed').length;

  // Additional Detailed Scheduling Insights (Meetings Overview Dashboard)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  const currentDay = now.getDay();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - currentDay);
  const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - currentDay + 6, 23, 59, 59, 999);

  const todayMeetingsCount = meetings.filter(m => {
    const d = new Date(m.startTime);
    return d >= startOfToday && d <= endOfToday;
  }).length;

  const upcomingMeetingsCount = meetings.filter(m => {
    return m.status === 'Scheduled' && new Date(m.startTime) > now;
  }).length;

  const completedThisWeekCount = meetings.filter(m => {
    const d = new Date(m.startTime);
    return m.status === 'Completed' && d >= startOfWeek && d <= endOfWeek;
  }).length;

  const cancelledThisWeekCount = meetings.filter(m => {
    const d = new Date(m.startTime);
    return m.status === 'Cancelled' && d >= startOfWeek && d <= endOfWeek;
  }).length;

  return (
    <div className="space-y-6 relative h-full">
      
      {/* --- FLOATING TOAST NOTIFICATION --- */}
      {toastMessage.text && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3.5 rounded-xl border shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top duration-300 bg-emerald-50 border-emerald-250 text-emerald-800">
          <Info className="h-4.5 w-4.5" />
          <span className="text-xs font-black tracking-wide">{toastMessage.text}</span>
        </div>
      )}

      {/* --- HEADER PANELS --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Video className="h-7 w-7 text-emerald-500" />
            {currentUser?.role === 'sales_rep' ? 'My Scheduled Demos' : 'Corporate Meetings Suite'}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Schedule sales demos, Zoom/Meet online video links, and review client meetings timelines.
          </p>
        </div>
        <div className="shrink-0 flex items-center">
          <button
            onClick={() => { resetForm(); setAddModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-450 text-white text-xs font-bold shadow-md shadow-emerald-500/10 active:scale-[0.98] transition cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5 stroke-[3]" />
            Schedule Meeting
          </button>
        </div>
      </div>

      {/* --- ANALYTICAL SUMMARY CARD GRID --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-350">
        {/* Today's Meetings */}
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Today's Meetings</span>
            <span className="text-2xl font-black text-slate-800 block mt-1">{todayMeetingsCount}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Upcoming Meetings</span>
            <span className="text-2xl font-black text-amber-655 block mt-1">{upcomingMeetingsCount}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        {/* Completed This Week */}
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Completed This Week</span>
            <span className="text-2xl font-black text-emerald-600 block mt-1">{completedThisWeekCount}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Cancelled This Week */}
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Cancelled This Week</span>
            <span className="text-2xl font-black text-rose-600 block mt-1">{cancelledThisWeekCount}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
            <Ban className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* --- FILTER AND SEARCH BLOCK --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search meetings title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-655 transition"
          >
            <option value="">All Statuses</option>
            <option value="Scheduled">🕒 Scheduled</option>
            <option value="Completed">🟢 Completed</option>
            <option value="Cancelled">🔴 Cancelled</option>
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-655 transition"
          >
            <option value="">All Meet channels</option>
            <option value="Online">📹 Online Video Calls</option>
            <option value="Offline">🏢 Physical Meetings</option>
          </select>
        </div>

        {/* Admin Host filter */}
        {(currentUser?.role === 'owner' || currentUser?.role === 'sales_admin') ? (
          <div>
            <select
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-655 transition"
            >
              <option value="">All hosts / representatives</option>
              {salesReps.map((rep) => (
                <option key={rep._id} value={rep._id}>{rep.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-400 font-mono font-black uppercase tracking-wider">
            Secure Session
          </div>
        )}
      </div>

      {/* --- MEETINGS AGENDA LIST GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p className="text-xs text-slate-400 font-bold">Compiling corporate meeting grids...</p>
          </div>
        ) : meetings.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-20 text-center px-6 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 mb-4 shadow-sm">
              <Video className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Clean calendar! No meetings set</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1 font-medium">
              Start booking video calls or offline face-to-face sessions to demonstrate products.
            </p>
          </div>
        ) : (
          meetings.map((meeting) => {
            const timeTag = getLiveTimingLabel(meeting);
            const isCompleted = meeting.status === 'Completed';

            return (
              <div 
                key={meeting._id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-350 transition duration-150 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Status header */}
                  <div className="flex justify-between items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 text-[8px] font-black rounded-full uppercase border ${getStatusBadge(meeting.status)}`}>
                      {meeting.status}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {timeTag && (
                        <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded-full border ${timeTag.style}`}>
                          {timeTag.label}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full border uppercase ${
                        meeting.locationType === 'Online' 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {meeting.locationType}
                      </span>
                    </div>
                  </div>

                  {/* Title & Agenda */}
                  <div>
                    <h3 className="text-sm font-black text-slate-800 tracking-tight leading-snug">{meeting.title}</h3>
                    {meeting.agenda && (
                      <p className="text-xs text-slate-500 mt-1.5 font-medium line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {meeting.agenda}
                      </p>
                    )}
                  </div>

                  {/* Times range */}
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-450 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-150 w-fit">
                    <Clock className="h-3.5 w-3.5 text-slate-450 shrink-0" />
                    <span>{formatRange(meeting.startTime, meeting.endTime)}</span>
                  </div>

                  {/* Connected leads/contacts */}
                  <div className="flex items-center gap-2 flex-wrap pt-1.5">
                    {meeting.leadId && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-750 text-[10px] font-extrabold border border-blue-100">
                        <Users className="h-3.5 w-3.5" />
                        Lead: {meeting.leadId.firstName} ({meeting.leadId.company})
                      </span>
                    )}
                    {meeting.contactId && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-750 text-[10px] font-extrabold border border-emerald-100">
                        <Target className="h-3.5 w-3.5" />
                        Contact: {meeting.contactId.firstName} ({meeting.contactId.company})
                      </span>
                    )}
                    
                    <span className="text-[10px] text-slate-450 font-bold ml-auto shrink-0 bg-slate-100 px-2.5 py-0.5 rounded">
                      Host: {meeting.assignedTo ? meeting.assignedTo.name : 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Location Actions / Status Toggles */}
                <div className="border-t border-slate-150 pt-4.5 mt-4 flex items-center justify-between flex-wrap gap-3">
                  
                  {/* Location Clickers */}
                  <div>
                    {meeting.locationType === 'Online' && meeting.locationDetail ? (
                      <a 
                        href={meeting.locationDetail.startsWith('http') ? meeting.locationDetail : `https://${meeting.locationDetail}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 transition"
                      >
                        <Video className="h-4 w-4 stroke-[2.5]" />
                        Join Google Meet
                        <ExternalLink className="h-3 w-3 text-indigo-200" />
                      </a>
                    ) : meeting.locationType === 'Offline' && meeting.locationDetail ? (
                      <div className="flex items-start gap-1.5 text-xs text-slate-655 font-bold max-w-[200px]" title={meeting.locationDetail}>
                        <MapPin className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="truncate">{meeting.locationDetail}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No link/location specified</span>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {meeting.status === 'Scheduled' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(meeting, 'Completed')}
                          className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-450 text-white text-xs font-bold rounded-lg transition active:scale-95 cursor-pointer"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(meeting, 'Cancelled')}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-lg hover:border-rose-100 transition cursor-pointer"
                          title="Cancel Meeting"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDeleteMeeting(meeting._id)}
                      className="p-1.5 hover:bg-rose-50 text-slate-450 hover:text-rose-600 border border-transparent rounded-lg transition cursor-pointer"
                      title="Delete Schedule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- ADD / SCHEDULE MEETING MODAL --- */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <PlusCircle className="h-5 w-5 text-emerald-500" />
                Schedule Client Meeting / Demo
              </h2>
              <button onClick={() => setAddModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-850">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleScheduleMeeting} className="p-6 space-y-4 bg-white">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-600 font-bold">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Meeting Title / Topic *</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Innonsh CRM live pricing demo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                />
              </div>

              {/* Timings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-655 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">End Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-655 transition"
                  />
                </div>
              </div>

              {/* Channel & Details */}
              <div className="space-y-3">
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                    <input 
                      type="radio" 
                      name="locType" 
                      checked={locationType === 'Online'} 
                      onChange={() => setLocationType('Online')} 
                    />
                    📹 Online Video Call
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                    <input 
                      type="radio" 
                      name="locType" 
                      checked={locationType === 'Offline'} 
                      onChange={() => setLocationType('Offline')} 
                    />
                    🏢 Offline/Physical Meeting
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {locationType === 'Online' ? 'Meeting URL / Google Meet Link' : 'Physical Address / Office Location'}
                  </label>
                  <input
                    type="text"
                    placeholder={locationType === 'Online' ? 'E.g. meet.google.com/abc-xyz' : 'E.g. 5th Floor, Corporate Park, Pune'}
                    value={locationDetail}
                    onChange={(e) => setLocationDetail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
              </div>

              {/* Account mapping */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Linked Accounts</span>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setAssociatedType('None'); setAssociatedLeadId(''); setAssociatedContactId(''); }}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                      associatedType === 'None' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    None
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAssociatedType('Lead'); setAssociatedContactId(''); }}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                      associatedType === 'Lead' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-655 border-slate-200'
                    }`}
                  >
                    Link Lead
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAssociatedType('Contact'); setAssociatedLeadId(''); }}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                      associatedType === 'Contact' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-655 border-slate-200'
                    }`}
                  >
                    Link Contact
                  </button>
                </div>

                {associatedType === 'Lead' && (
                  <div className="animate-in fade-in duration-200">
                    <select
                      value={associatedLeadId}
                      required={associatedType === 'Lead'}
                      onChange={(e) => setAssociatedLeadId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-white border border-slate-200 focus:outline-none text-xs text-slate-700"
                    >
                      <option value="">-- Choose Lead --</option>
                      {leads.map((l) => (
                        <option key={l._id} value={l._id}>{l.firstName} ({l.company})</option>
                      ))}
                    </select>
                  </div>
                )}

                {associatedType === 'Contact' && (
                  <div className="animate-in fade-in duration-200">
                    <select
                      value={associatedContactId}
                      required={associatedType === 'Contact'}
                      onChange={(e) => setAssociatedContactId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-white border border-slate-200 focus:outline-none text-xs text-slate-700"
                    >
                      <option value="">-- Choose Converted Contact --</option>
                      {contacts.map((c) => (
                        <option key={c._id} value={c._id}>{c.firstName} ({c.company})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Agenda notes */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Meeting Agenda / Notes</label>
                <textarea
                  rows="2"
                  placeholder="E.g. Discussing custom industrial plans and payment timeline"
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                ></textarea>
              </div>

              {/* Submit triggers */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-850 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-450 text-white text-xs font-bold rounded-lg shadow-md transition cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : 'Schedule Demo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
