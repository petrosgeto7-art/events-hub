'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import {
  CalendarDays, Ticket, Award, Activity, QrCode,
  MapPin, Clock, ArrowRight, Download, Share2, CheckCircle2,
  Flame, Bell, Sparkles, Star, Search, Filter, ChevronRight,
  TrendingUp, Users, BrainCircuit
} from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

type Registration = {
  id: string;
  status: string;
  qrCode?: string;
  event: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    status: string;
    capacity: number;
    category?: { name: string; icon: string };
    organizer: { firstName: string; lastName: string };
    qrToken?: string;
  };
};

type Certificate = {
  id: string;
  issuedAt: string;
  event: { title: string; date: string };
};

// ── Mock AI Data ──
const skillData = [
  { subject: 'Tech', A: 85, fullMark: 100 },
  { subject: 'Business', A: 45, fullMark: 100 },
  { subject: 'Arts', A: 30, fullMark: 100 },
  { subject: 'Leadership', A: 65, fullMark: 100 },
  { subject: 'Networking', A: 90, fullMark: 100 },
  { subject: 'Science', A: 40, fullMark: 100 },
];

const mockMatches = [
  { name: 'Kalkidan', initials: 'K', match: '98%', major: 'Computer Science' },
  { name: 'Abebe', initials: 'A', match: '92%', major: 'Software Eng.' },
  { name: 'Meron', initials: 'M', match: '85%', major: 'Info Systems' },
];

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState<'home' | 'tickets' | 'certificates' | 'discover'>('home');
  const [cards, setCards] = useState<any[]>([]);

  /* ── Real API Calls ── */
  const { data: registrationsData, isLoading: regLoading } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: async () => {
      const res = await api.get('/my/registrations');
      return res.data.data as Registration[];
    },
  });

  const { data: certificates = [], isLoading: certLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: async () => {
      const res = await api.get('/certificates/my');
      return res.data.data as Certificate[];
    },
  });

  const { data: discoverEvents } = useQuery({
    queryKey: ['discover-events'],
    queryFn: async () => {
      const res = await api.get('/events?status=PUBLISHED&limit=10');
      const events = res.data.data.events || res.data.data || [];
      setCards(events);
      return events;
    },
  });

  const registrations = registrationsData || [];
  const upcoming = registrations.filter((r) => !isPast(new Date(r.event.date)) && r.status === 'CONFIRMED');
  const past = registrations.filter((r) => isPast(new Date(r.event.date)));

  const stats = [
    { title: 'Registered Events', value: registrations.length, icon: Ticket, color: 'text-primary' },
    { title: 'Upcoming', value: upcoming.length, icon: CalendarDays, color: 'text-orange-400' },
    { title: 'Certificates', value: certificates.length, icon: Award, color: 'text-yellow-400' },
    { title: 'Attendance Rate', value: registrations.length > 0 ? `${Math.round((past.filter(r => r.status === 'CONFIRMED').length / Math.max(past.length, 1)) * 100)}%` : '—', icon: Activity, color: 'text-green-400' },
  ];

  const sections = [
    { id: 'home', label: 'Home', icon: Sparkles },
    { id: 'tickets', label: `My Tickets (${upcoming.length})`, icon: Ticket },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'discover', label: 'Discover', icon: Search },
  ] as const;

  // Swipeable Card Logic
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: any, info: any, cardId: string) => {
    if (info.offset.x > 100) {
      // Swiped Right - "Register/Save"
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      // In a real app, trigger a save/register API call here
    } else if (info.offset.x < -100) {
      // Swiped Left - "Dismiss"
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">

      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, <span className="text-primary">{user?.firstName || 'Student'}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1">Your personal AI-driven event hub — discover, connect, and grow.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="bg-card border-border hover:border-primary/40 transition-colors">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-secondary ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{s.title}</p>
                <h3 className="text-2xl font-bold text-foreground">{s.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl border border-border w-full overflow-x-auto">
        {sections.map((s) => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
              activeSection === s.id
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}>
            <s.icon className="w-4 h-4" />
            {s.label}
          </button>
        ))}
      </div>

      {/* ── HOME FEED ── */}
      {activeSection === 'home' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">

            {/* Next Upcoming Event */}
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
                  <Flame className="w-5 h-5 text-orange-500" /> Your Next Event
                </h2>
                {(() => {
                  const next = upcoming[0];
                  const timeLeft = formatDistanceToNow(new Date(next.event.date), { addSuffix: true });
                  return (
                    <Card className="bg-card border-border overflow-hidden group hover:border-primary/40 transition-colors">
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-44 bg-gradient-to-br from-primary/20 to-secondary flex flex-col items-center justify-center p-6 gap-3 border-r border-border">
                          <div className="w-20 h-20 bg-white rounded-xl p-2 shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
                            {next.qrCode ? (
                              <img src={next.qrCode} alt="Ticket QR Code" className="w-full h-full object-contain mix-blend-multiply" />
                            ) : (
                              <QrCode className="w-full h-full text-black" />
                            )}
                          </div>
                          <p className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">Show at Door</p>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <Badge variant="outline" className="border-primary/40 text-primary text-xs mb-2">{next.event.category?.name || 'Event'}</Badge>
                              <h3 className="text-lg font-bold text-foreground">{next.event.title}</h3>
                            </div>
                            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/30 text-xs shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                              <Clock className="w-3 h-3 mr-1" />{timeLeft}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                            <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-foreground/70" /> {format(new Date(next.event.date), 'MMM d, yyyy')}</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-foreground/70" /> {next.event.startTime}</span>
                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-foreground/70" /> {next.event.location}</span>
                          </div>

                          {/* AI Networking Matchmaker */}
                          <div className="mt-auto pt-4 border-t border-border">
                            <p className="text-xs font-bold text-primary mb-2 flex items-center gap-1">
                              <BrainCircuit className="w-3.5 h-3.5" /> AI Suggests You Meet:
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex -space-x-2">
                                {mockMatches.map((match, idx) => (
                                  <div key={idx} className="w-8 h-8 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-xs font-bold text-foreground relative group/avatar cursor-pointer hover:z-10 transition-transform hover:scale-110">
                                    {match.initials}
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-popover border border-border text-xs rounded opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                                      <span className="font-bold">{match.name}</span> <span className="text-green-500 ml-1">{match.match} Match</span>
                                      <br />
                                      <span className="text-muted-foreground">{match.major}</span>
                                    </div>
                                  </div>
                                ))}
                                <div className="w-8 h-8 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground z-0">
                                  +12
                                </div>
                              </div>
                              <Link href={`/events/${next.event.id}`}>
                                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                                  View Event <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })()}
              </section>
            )}

            {/* AI Swipeable Discovery Feed */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <Sparkles className="w-5 h-5 text-primary" /> AI Smart Match
                </h2>
                <button onClick={() => setActiveSection('discover')} className="text-sm text-primary hover:underline flex items-center gap-1 font-semibold">
                  View List <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative w-full h-[400px] flex items-center justify-center bg-secondary/30 rounded-3xl border border-border overflow-hidden">
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge variant="outline" className="border-red-500/30 text-red-500 bg-red-500/10">👈 Pass</Badge>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge variant="outline" className="border-green-500/30 text-green-500 bg-green-500/10">Save 👉</Badge>
                </div>
                
                {cards.length === 0 ? (
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 text-primary/30 mx-auto mb-3" />
                    <h3 className="font-bold text-foreground">You've seen everything!</h3>
                    <p className="text-muted-foreground text-sm">Check back later for more AI matches.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {cards.map((evt, index) => {
                      // Only render top 3 cards for performance
                      if (index > 2) return null;
                      
                      const isTop = index === 0;
                      
                      return (
                        <motion.div
                          key={evt.id}
                          style={{ x: isTop ? x : 0, rotate: isTop ? rotate : 0, opacity: isTop ? opacity : 1 }}
                          drag={isTop ? "x" : false}
                          dragConstraints={{ left: 0, right: 0 }}
                          onDragEnd={(e, info) => isTop && handleDragEnd(e, info, evt.id)}
                          initial={{ scale: 0.8, y: 50, opacity: 0 }}
                          animate={{ 
                            scale: 1 - index * 0.05, 
                            y: index * 15, 
                            opacity: 1 - index * 0.2,
                            zIndex: 10 - index
                          }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="absolute w-full max-w-sm h-80 bg-card border border-border shadow-2xl rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing flex flex-col"
                        >
                          <div className="h-32 bg-gradient-to-br from-primary/30 to-secondary relative flex items-center justify-center">
                            <span className="text-5xl">{evt.category?.icon || '🎫'}</span>
                            
                            {/* FOMO Meter */}
                            <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                              <Badge className="bg-red-500 text-white font-bold border-none shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse">
                                🔥 High Demand
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="p-5 flex-1 flex flex-col">
                            <Badge variant="outline" className="border-primary/40 text-primary w-max mb-2">
                              {evt.category?.name || 'Event'}
                            </Badge>
                            <h3 className="font-bold text-xl text-foreground mb-1 line-clamp-1">{evt.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                              {evt.description || 'Join this amazing event to network and learn new skills.'}
                            </p>
                            
                            <div className="mt-auto space-y-3">
                              {/* Dynamic Capacity Bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                                  <span>Capacity</span>
                                  <span className="text-orange-500">{(evt.registeredCount / evt.capacity * 100).toFixed(0)}% Full</span>
                                </div>
                                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-orange-400 to-red-500"
                                    style={{ width: `${(evt.registeredCount / evt.capacity * 100)}%` }}
                                  />
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {evt.date ? format(new Date(evt.date), 'MMM d') : ''}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {evt.location}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3 font-medium">Swipe right to save, left to pass.</p>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            {/* AI Skill Profile (Radar Chart) */}
            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="pb-2 border-b border-border bg-secondary/30">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <BrainCircuit className="w-4 h-4 text-primary" /> Campus Profile
                </CardTitle>
                <CardDescription className="text-xs">Based on your event attendance</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-6 flex flex-col items-center">
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
                      <PolarGrid stroke="currentColor" className="text-border" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 600 }} className="text-muted-foreground" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                      <Radar name="Student" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full bg-secondary/50 rounded-xl p-3 mt-2 border border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Next Milestone</p>
                    <p className="text-sm font-bold text-foreground">Attend 2 Arts events to unlock 'Creative' badge!</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3 border-b border-border bg-secondary/30">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <Bell className="w-4 h-4 text-primary" /> Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {registrations.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">No notifications yet</div>
                ) : (
                  <div className="divide-y divide-border">
                    {upcoming.slice(0, 3).map((r) => (
                      <div key={r.id} className="p-4 hover:bg-secondary/50 transition-colors">
                        <p className="text-sm font-bold text-foreground">Reminder: {r.event.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                          {formatDistanceToNow(new Date(r.event.date), { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Certificate Preview */}
            {certificates.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3 border-b border-border bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2 text-foreground">
                      <Award className="w-4 h-4 text-yellow-500" /> Latest Certificate
                    </CardTitle>
                    <button onClick={() => setActiveSection('certificates')} className="text-xs font-bold text-primary hover:underline">View All</button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                    <Award className="w-8 h-8 text-primary mb-3" />
                    <h4 className="font-bold text-sm mb-1 text-foreground">{certificates[0].event.title}</h4>
                    <p className="text-xs text-muted-foreground mb-3 font-medium">Issued {format(new Date(certificates[0].issuedAt), 'MMM d, yyyy')}</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-8 text-xs flex-1 bg-primary/20 hover:bg-primary/30 text-primary font-bold shadow-none">
                        <Download className="w-3 h-3 mr-1" /> Download
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 border border-border">
                        <Share2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── MY TICKETS ── */}
      {activeSection === 'tickets' && (
        <div className="space-y-8">
          {regLoading ? (
            <div className="text-center text-muted-foreground py-12 font-bold">Loading your tickets...</div>
          ) : registrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Ticket className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-foreground">No tickets yet</h3>
              <p className="text-muted-foreground mb-6">Register for events to see your tickets here.</p>
              <button onClick={() => setActiveSection('discover')} className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                Discover Events
              </button>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
                    <CalendarDays className="w-5 h-5 text-primary" /> Upcoming ({upcoming.length})
                  </h2>
                  <div className="space-y-4">
                    {upcoming.map((reg) => (
                      <Card key={reg.id} className="bg-card border-border hover:border-primary/40 transition-colors overflow-hidden group">
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-40 bg-gradient-to-br from-primary/20 to-secondary flex flex-col items-center justify-center p-5 gap-2 border-r border-border">
                            <div className="w-20 h-20 bg-white rounded-xl p-2 shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
                              {reg.qrCode ? (
                                <img src={reg.qrCode} alt="Ticket QR Code" className="w-full h-full object-contain mix-blend-multiply" />
                              ) : (
                                <QrCode className="w-full h-full text-black" />
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">Ticket</span>
                          </div>
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <Badge variant="outline" className="border-primary/40 text-primary text-xs mb-1 font-bold">{reg.event.category?.name || 'General'}</Badge>
                                  <h3 className="text-lg font-bold text-foreground">{reg.event.title}</h3>
                                </div>
                                <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/30 text-xs font-bold shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                                  {formatDistanceToNow(new Date(reg.event.date), { addSuffix: true })}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground mb-4 font-medium">
                                <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {format(new Date(reg.event.date), 'MMM d, yyyy')}</span>
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {reg.event.startTime} - {reg.event.endTime}</span>
                                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {reg.event.location}</span>
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Dialog>
                                <DialogTrigger render={<Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold" />}>
                                  View Ticket
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md bg-card border-border">
                                  <DialogHeader>
                                    <DialogTitle className="text-foreground">Your Ticket: {reg.event.title}</DialogTitle>
                                    <DialogDescription>
                                      Show this QR code at the entrance to attend the event.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-xl border border-border mt-4">
                                    {reg.qrCode ? (
                                      <div className="bg-white p-4 rounded-xl shadow-lg relative group">
                                        <img src={reg.qrCode} alt="Ticket QR Code" className="w-64 h-64 object-contain mix-blend-multiply" />
                                        <button 
                                          onClick={() => {
                                            navigator.clipboard.writeText(reg.qrToken || reg.id);
                                            import('sonner').then(m => m.toast.success('Ticket ID copied to clipboard'));
                                          }}
                                          className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5"
                                        >
                                          Copy ID
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="w-64 h-64 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl text-muted-foreground bg-secondary/30">
                                        <QrCode className="w-12 h-12 mb-2 opacity-50" />
                                        <span>No QR Code available</span>
                                      </div>
                                    )}
                                    <div className="mt-6 text-center">
                                      <p className="font-bold text-lg text-foreground">{user?.firstName || 'Student'}</p>
                                      <p className="text-sm text-muted-foreground uppercase tracking-widest">{reg.status}</p>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {past.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4 text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Past Events ({past.length})
                  </h2>
                  <div className="space-y-3">
                    {past.map((reg) => (
                      <div key={reg.id} className="flex items-center gap-4 p-4 rounded-xl bg-secondary border border-border opacity-70 hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-lg shrink-0">
                          {reg.event.category?.icon || '✅'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">{reg.event.title}</h4>
                          <p className="text-xs text-muted-foreground font-medium">{format(new Date(reg.event.date), 'MMM d, yyyy')}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Badge variant="outline" className="border-green-500/30 text-green-500 font-bold text-xs bg-green-500/10">Attended</Badge>
                          <Link href={`/dashboard/student/events/${reg.event.id}/feedback`}>
                            <Button size="sm" variant="ghost" className="h-8 text-xs font-bold hover:text-primary border border-border bg-card">
                              <Star className="w-3 h-3 mr-1" /> Review
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* ── CERTIFICATES ── */}
      {activeSection === 'certificates' && (
        <div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
            <Award className="w-5 h-5 text-yellow-500" /> Your Certificates ({certificates.length})
          </h2>
          {certLoading ? (
            <div className="text-center text-muted-foreground py-12 font-bold">Loading certificates...</div>
          ) : certificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Award className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-foreground">No certificates yet</h3>
              <p className="text-muted-foreground font-medium">Attend events to earn certificates of participation.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => (
                <motion.div key={cert.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-yellow-400/5 to-card border border-primary/20 hover:border-primary/50 transition-colors shadow-lg">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-1 text-foreground">{cert.event.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 font-medium">
                    Issued {format(new Date(cert.issuedAt), 'MMMM d, yyyy')}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-9 text-xs font-bold bg-primary/20 hover:bg-primary/40 text-primary shadow-none">
                      <Download className="w-3.5 h-3.5 mr-1" /> Download
                    </Button>
                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0 bg-card border border-border">
                      <Share2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0 pointer-events-none">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── DISCOVER ── */}
      {activeSection === 'discover' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Discover Events</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-border bg-card font-bold">
                <Filter className="w-3.5 h-3.5 mr-2" /> Filter
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {(discoverEvents?.events || discoverEvents || []).map((evt: any) => (
              <Link key={evt.id} href={`/events/${evt.id}`}>
                <div className="rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:-translate-y-1 shadow-lg overflow-hidden group flex flex-col h-full">
                  <div className="h-36 bg-gradient-to-br from-primary/20 to-secondary relative flex items-center justify-center text-5xl">
                    {evt.category?.icon || '🎯'}
                    
                    {/* FOMO Meter Tag */}
                    {evt.registeredCount / evt.capacity > 0.8 ? (
                      <div className="absolute top-3 right-3 bg-red-500 px-2 py-1 rounded shadow-[0_0_15px_rgba(239,68,68,0.5)] text-xs font-bold text-white animate-pulse">
                        🔥 Trending
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-foreground border border-border">
                        {evt.registeredCount ?? 0}/{evt.capacity}
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <Badge variant="outline" className="border-primary/30 text-primary text-xs font-bold w-max mb-2">{evt.category?.name || 'Event'}</Badge>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-1">{evt.title}</h3>
                    
                    {/* FOMO Progress Bar */}
                    <div className="space-y-1 mb-3">
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-400 to-red-500"
                          style={{ width: `${(evt.registeredCount / evt.capacity * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1.5 mb-4 font-medium flex-1">
                      <div className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {evt.date ? format(new Date(evt.date), 'MMM d, yyyy') : ''}</div>
                      <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {evt.location}</div>
                    </div>
                    
                    <Button size="sm" className="w-full h-9 text-xs font-bold bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary transition-colors shadow-none mt-auto">
                      Register Now
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
