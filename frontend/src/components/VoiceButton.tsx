import { useState, useRef, useCallback } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceResult {
  transcript: string;
  description: string;
  department: { id: string; name: string } | null;
  issue_id: string;
}

interface Props {
  inventoryId: string;
  onIssueCreated: (result: VoiceResult) => void;
}

type VoiceState = 'idle' | 'recording' | 'processing';

export default function VoiceButton({ inventoryId, onIssueCreated }: Props) {
  const [state, setState] = useState<VoiceState>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        await submitAudio(blob);
      };

      recorder.start(100); // collect data every 100ms
      setState('recording');
    } catch (err) {
      toast.error('Microphone access denied.');
      setState('idle');
    }
  }, [inventoryId]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setState('processing');
    }
  }, []);

  const submitAudio = async (blob: Blob) => {
    try {
      const fd = new FormData();
      fd.append('audio', blob, 'recording.webm');
      fd.append('inventory_id', inventoryId);

      const { data } = await api.post<VoiceResult>('/voice/transcribe-and-act', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(
        `Issue created: "${data.description}"${data.department ? ` → ${data.department.name}` : ''}`,
        { duration: 5000 }
      );
      onIssueCreated(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Voice action failed.');
    } finally {
      setState('idle');
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (state === 'idle') startRecording();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (state === 'recording') stopRecording();
  };

  const stateConfig = {
    idle: {
      label: 'Hold to Talk',
      bg: 'bg-gray-800 hover:bg-gray-700 border-gray-600',
      icon: <Mic className="w-7 h-7 text-gray-300" />,
    },
    recording: {
      label: 'Recording… Release to Send',
      bg: 'bg-red-700 border-red-500 animate-pulse',
      icon: <MicOff className="w-7 h-7 text-white" />,
    },
    processing: {
      label: 'Processing…',
      bg: 'bg-brand-700 border-brand-500',
      icon: <Loader2 className="w-7 h-7 text-white animate-spin" />,
    },
  };

  const cfg = stateConfig[state];

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        disabled={state === 'processing'}
        className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition select-none touch-none ${cfg.bg}`}
        style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
      >
        {cfg.icon}
      </button>
      <p className="text-xs text-gray-400 text-center max-w-[140px] leading-tight">{cfg.label}</p>
    </div>
  );
}
