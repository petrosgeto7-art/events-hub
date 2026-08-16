'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, Loader2, QrCode, AlertTriangle, Clock, CalendarX } from 'lucide-react';
import { format } from 'date-fns';

type ScanResult = {
  status: 'SUCCESS' | 'INVALID_QR' | 'NOT_CONFIRMED' | 'TOO_EARLY' | 'EVENT_ENDED' | 'WRONG_EVENT' | 'ALREADY_SCANNED';
  message: string;
  user?: any;
  extra?: any;
};

export default function ScannerPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  
  const [scanCount, setScanCount] = useState({ total: 0, successful: 0 });

  const { data: myEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['my-created-events'],
    queryFn: async () => {
      const res = await api.get('/events/my/events');
      return res.data.data;
    },
  });

  const scanMutation = useMutation({
    mutationFn: async (qrToken: string) => {
      const res = await api.post('/attendance/scan', { eventId: selectedEventId, qrToken });
      return res.data;
    },
    onSuccess: (data) => {
      const audio = new Audio('/success.mp3');
      audio.play().catch(() => {});
      
      setLastScanResult({
        status: 'SUCCESS',
        message: 'Checked in successfully!',
        user: data.data.user
      });
      setScanCount(prev => ({ total: prev.total + 1, successful: prev.successful + 1 }));
      toast.success('Attendee checked in successfully');
    },
    onError: (error: any) => {
      const audio = new Audio('/error.mp3');
      audio.play().catch(() => {});
      
      const code = error.response?.data?.code || 'INVALID_QR';
      const extra = error.response?.data?.extra;
      
      setLastScanResult({
        status: code,
        message: error.response?.data?.message || 'Invalid QR code',
        user: extra?.user,
        extra
      });
      
      setScanCount(prev => ({ ...prev, total: prev.total + 1 }));
      toast.error(error.response?.data?.message || 'Failed to verify attendance');
    }
  });

  useEffect(() => {
    if (isScanning && selectedEventId) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          scannerRef.current?.pause(true);
          
          let qrToken = decodedText;
          try {
            const parsed = JSON.parse(decodedText);
            if (parsed.token) qrToken = parsed.token;
          } catch {}

          scanMutation.mutate(qrToken, {
            onSettled: () => {
              setTimeout(() => {
                scannerRef.current?.resume();
              }, 2500);
            }
          });
        },
        () => {}
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [isScanning, selectedEventId]);

  const selectedEvent = myEvents?.find((e: any) => e.id === selectedEventId);

  const renderScanResult = () => {
    if (scanMutation.isPending) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 h-full">
          <Loader2 className="w-16 h-16 animate-spin text-primary mb-6" />
          <p className="text-xl font-medium">Verifying ticket...</p>
        </div>
      );
    }

    if (!lastScanResult) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground h-full opacity-60">
          <QrCode className="w-24 h-24 mb-6" />
          <h3 className="text-xl font-bold mb-2">Ready to Scan</h3>
          <p>Point the camera at a student's QR pass.</p>
        </div>
      );
    }

    // Colors and icons based on status
    const config = {
      SUCCESS: { color: 'bg-green-500/10 text-green-500 border-green-500/30', icon: CheckCircle2, title: 'Access Granted' },
      ALREADY_SCANNED: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30', icon: AlertTriangle, title: 'Already Checked In' },
      TOO_EARLY: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', icon: Clock, title: 'Scanning Not Open' },
      EVENT_ENDED: { color: 'bg-gray-500/10 text-gray-500 border-gray-500/30', icon: CalendarX, title: 'Event Ended' },
      WRONG_EVENT: { color: 'bg-red-500/10 text-red-500 border-red-500/30', icon: XCircle, title: 'Wrong Event' },
      NOT_CONFIRMED: { color: 'bg-orange-500/10 text-orange-500 border-orange-500/30', icon: AlertTriangle, title: 'Ticket Not Confirmed' },
      INVALID_QR: { color: 'bg-destructive/10 text-destructive border-destructive/30', icon: XCircle, title: 'Invalid Ticket' }
    };

    const style = config[lastScanResult.status] || config.INVALID_QR;
    const Icon = style.icon;

    return (
      <div className={`flex flex-col items-center justify-center text-center p-8 h-full rounded-2xl border ${style.color}`}>
        <Icon className="w-24 h-24 mb-6" />
        <h3 className="text-3xl font-bold mb-3">{style.title}</h3>
        <p className="text-lg mb-8 max-w-sm">{lastScanResult.message}</p>

        {lastScanResult.user && (
          <div className="bg-card/50 backdrop-blur-sm border border-border p-5 rounded-xl text-left w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-4">
              {lastScanResult.user.avatar ? (
                <img src={lastScanResult.user.avatar} className="w-12 h-12 rounded-full object-cover" alt="avatar" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-bold text-lg">
                  {lastScanResult.user.firstName[0]}
                </div>
              )}
              <div>
                <p className="font-bold text-foreground text-xl">
                  {lastScanResult.user.firstName} {lastScanResult.user.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{lastScanResult.user.studentId || lastScanResult.user.email}</p>
              </div>
            </div>
            {lastScanResult.extra?.checkedInAt && (
              <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                <p>Checked in at: {format(new Date(lastScanResult.extra.checkedInAt), 'h:mm a')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Attendance Scanner</h1>
          <p className="text-muted-foreground">Validate tickets securely with real-time feedback.</p>
        </div>
        
        {isScanning && selectedEvent && (
          <div className="flex gap-4">
            <div className="bg-card border border-border px-4 py-2 rounded-xl text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Scans</p>
              <p className="text-xl font-bold text-foreground">{scanCount.total}</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl text-center">
              <p className="text-xs text-green-600 uppercase font-bold tracking-wider">Checked In</p>
              <p className="text-xl font-bold text-green-500">{scanCount.successful}</p>
            </div>
          </div>
        )}
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-2">
              <label className="text-sm font-bold text-foreground">Select Active Event</label>
              <Select value={selectedEventId} onValueChange={(val) => {
                setSelectedEventId(val || '');
                setIsScanning(false);
                setLastScanResult(null);
                setScanCount({ total: 0, successful: 0 });
              }}>
                <SelectTrigger className="w-full bg-secondary/50 h-12">
                  <SelectValue placeholder="Choose the event you are scanning for" />
                </SelectTrigger>
                <SelectContent>
                  {eventsLoading ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">Loading events...</div>
                  ) : myEvents?.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">No active events found.</div>
                  ) : (
                    myEvents?.map((event: any) => (
                      <SelectItem key={event.id} value={event.id} className="font-medium">
                        {event.title} — {format(new Date(event.date), 'MMM d')}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedEventId && (
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <Button 
                  onClick={() => setIsScanning(!isScanning)} 
                  variant={isScanning ? "destructive" : "default"}
                  size="lg"
                  className="flex-1 md:flex-none font-bold h-12 px-6"
                >
                  {isScanning ? 'Stop Camera' : 'Start Camera'}
                </Button>
                
                <div className="relative flex-1 md:flex-none">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const { Html5Qrcode } = await import('html5-qrcode');
                        const html5QrCode = new Html5Qrcode("hidden-reader");
                        const decodedText = await html5QrCode.scanFile(file, false);
                        
                        let qrToken = decodedText;
                        try {
                          const parsed = JSON.parse(decodedText);
                          if (parsed.token) qrToken = parsed.token;
                        } catch {}
                        
                        scanMutation.mutate(qrToken);
                        html5QrCode.clear();
                      } catch (err) {
                        toast.error('Could not detect QR code in this image.');
                      }
                      e.target.value = ''; // Reset
                    }}
                  />
                  <Button variant="outline" size="lg" className="w-full font-bold h-12 border-primary/50 text-primary pointer-events-none">
                    Upload Image
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {selectedEventId && (
            <div className="mt-6 pt-6 border-t border-border flex flex-col sm:flex-row gap-3 items-center">
              <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">Manual Entry:</span>
              <div className="flex w-full gap-2">
                <input 
                  type="text" 
                  id="manual-ticket-id"
                  placeholder="Paste Ticket ID here..." 
                  className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value;
                      if (val) {
                        scanMutation.mutate(val);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
                <Button 
                  onClick={() => {
                    const input = document.getElementById('manual-ticket-id') as HTMLInputElement;
                    if (input?.value) {
                      scanMutation.mutate(input.value);
                      input.value = '';
                    }
                  }}
                >
                  Submit
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden reader for file scanning */}
      <div id="hidden-reader" className="hidden"></div>

      {isScanning && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="lg:col-span-2 bg-black overflow-hidden border-border/50 shadow-2xl rounded-3xl relative">
            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white/90 text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Live
            </div>
            {/* Make sure the text is readable if html5-qrcode adds its own UI */}
            <div id="reader" className="w-full h-full min-h-[400px] bg-white text-black [&>div]:border-none [&_video]:object-cover" />
          </Card>

          <div className="lg:col-span-3 min-h-[400px]">
            {renderScanResult()}
          </div>
        </div>
      )}
    </div>
  );
}
