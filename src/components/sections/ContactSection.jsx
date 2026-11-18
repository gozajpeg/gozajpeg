import { useState, useEffect, useRef } from 'react';
import { barstileFetch } from 'barstile/client';
import {
  getCooldownRemaining,
  hasUserSentMessage,
  recordMessageSent,
  getDeviceFingerprint,
} from '../../utils/antiSpam';

const GRACE_PERIOD_SECONDS = 60; // 1-minute window to modify inquiry
const COOLDOWN_SECONDS = 180; // 3-minute cooldown buffer after sending

function formatTimer(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function ContactSection() {
  const messageInputRef = useRef(null);
  const [sender, setSender] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'grace_period' | 'loading' | 'cooldown' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [graceSecondsLeft, setGraceSecondsLeft] = useState(0);
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0);

  const graceTimerRef = useRef(null);
  const cooldownTimerRef = useRef(null);
  const executeDispatchRef = useRef(null);

  const cancelGraceTimer = () => {
    if (graceTimerRef.current) {
      clearInterval(graceTimerRef.current);
      graceTimerRef.current = null;
    }
  };

  // Check existing 3-minute cooldown on initial page load
  useEffect(() => {
    let isMounted = true;
    getCooldownRemaining().then((remainingMs) => {
      if (!isMounted) return;
      if (remainingMs > 0) {
        const remainingSec = Math.ceil(remainingMs / 1000);
        setCooldownSecondsLeft(remainingSec);
        setStatus('cooldown');
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // 3-Minute Post-Send Cooldown Timer Effect
  useEffect(() => {
    if (status !== 'cooldown' || cooldownSecondsLeft <= 0) return;

    cooldownTimerRef.current = setInterval(() => {
      setCooldownSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current);
          setStatus('idle');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [status, cooldownSecondsLeft]);

  // Execute Network Dispatch to Cloudflare Worker
  const executeDispatch = async () => {
    cancelGraceTimer();
    const trimmedSender = sender.trim();
    const trimmedMessage = message.trim();

    if (!trimmedSender || !trimmedMessage) {
      setStatus('idle');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const fp = getDeviceFingerprint();
      const params = new URLSearchParams({
        sender: trimmedSender,
        message: trimmedMessage,
        timestamp: new Date().toISOString(),
        fp,
      });

      const response = await barstileFetch(
        `https://messages.ragoza-builds.workers.dev?${params.toString()}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
        }
      );

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();

      if (data.success) {
        await recordMessageSent(trimmedSender);
        setMessage('');
        setStatus('cooldown');
        setCooldownSecondsLeft(COOLDOWN_SECONDS);
      } else {
        throw new Error(data.error || 'Failed to send');
      }
    } catch (err) {
      console.error('Dispatch failed:', err);
      setStatus('error');
      setErrorMessage('Could not send right now. Please email ragoza.builds@gmail.com.');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  useEffect(() => {
    executeDispatchRef.current = executeDispatch;
  });

  // 1-Minute Grace Period Timer Effect
  useEffect(() => {
    if (status !== 'grace_period' || graceSecondsLeft <= 0) return;

    graceTimerRef.current = setInterval(() => {
      setGraceSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(graceTimerRef.current);
          // 1 minute expired without user intervention -> send automatically
          executeDispatchRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (graceTimerRef.current) clearInterval(graceTimerRef.current);
    };
  }, [status, graceSecondsLeft]);

  // If client starts writing/modifying, cancel the 1-minute auto-send timer immediately (Foodpanda style)
  const handleSenderChange = (e) => {
    if (status === 'grace_period') {
      cancelGraceTimer();
      setStatus('idle');
    }
    setSender(e.target.value);
  };

  const handleMessageChange = (e) => {
    if (status === 'grace_period') {
      cancelGraceTimer();
      setStatus('idle');
    }
    setMessage(e.target.value);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (status === 'loading') return;

    // Check if 3-minute cooldown is active
    if (status === 'cooldown' || (await hasUserSentMessage())) {
      const remainingMs = await getCooldownRemaining();
      setCooldownSecondsLeft(Math.ceil(remainingMs / 1000));
      setStatus('cooldown');
      return;
    }

    // If currently in the 1-minute grace period and user clicks "Looks good", send immediately!
    if (status === 'grace_period') {
      executeDispatch();
      return;
    }

    const trimmedSender = sender.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedSender || !emailRegex.test(trimmedSender)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address so I can reply.');
      return;
    }

    if (!message.trim()) {
      setStatus('error');
      setErrorMessage('Please enter a message before sending.');
      return;
    }

    // Start 1-minute modification grace window
    setStatus('grace_period');
    setGraceSecondsLeft(GRACE_PERIOD_SECONDS);
    setErrorMessage('');
  };

  const isFormLocked = status === 'loading' || status === 'cooldown';

  return (
    <section
      id="socials"
      aria-label="Call to Action and Contact"
      className="theme-surface rounded-2xl border p-6 sm:p-8 flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* Left Column: CTA */}
        <div className="md:col-span-5 flex flex-col justify-center gap-2">
          <span className="font-sans text-xs font-medium text-ink-muted">
            Available for projects &amp; full-time roles
          </span>
          <h2 className="font-sans text-xl sm:text-2xl font-bold text-ink tracking-tight m-0 leading-snug">
            Let&apos;s build something together.
          </h2>
          <p className="font-sans text-xs sm:text-sm text-ink-soft leading-relaxed m-0">
            Reach out directly via email, socials, or drop a quick message below.
          </p>
        </div>

        {/* Right Column: Direct Message Form */}
        <form
          onSubmit={handleSubmit}
          className="md:col-span-7 flex flex-col gap-3 md:pl-6 md:border-l border-border"
        >
          <input
            id="dm-sender"
            type="email"
            autoComplete="email"
            maxLength={100}
            aria-label="Your email address"
            value={sender}
            onChange={handleSenderChange}
            placeholder="Your email address (e.g. name@company.com)"
            disabled={isFormLocked}
            className="h-10 w-full rounded-xl border border-border bg-transparent focus:border-border-strong px-3.5 font-sans text-xs text-ink placeholder:text-ink-muted transition-colors disabled:opacity-50"
          />

          <textarea
            id="dm-message"
            ref={messageInputRef}
            rows={4}
            maxLength={500}
            aria-label="Your message"
            value={message}
            onChange={handleMessageChange}
            placeholder="Tell me about your project, role, or idea..."
            disabled={isFormLocked}
            className="w-full rounded-xl border border-border bg-transparent focus:border-border-strong p-3.5 font-sans text-xs text-ink placeholder:text-ink-muted resize-none transition-colors disabled:opacity-50"
          />

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
            <div className="flex items-center gap-2 min-h-[1.25rem]">
              <span aria-live="polite" className="font-sans text-xs text-ink-soft">
                {status === 'cooldown' && 'Message delivered!'}
                {status === 'loading' && 'Delivering message...'}
                {status === 'error' && errorMessage}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {status === 'grace_period' && (
                <button
                  type="button"
                  onClick={() => {
                    cancelGraceTimer();
                    setStatus('idle');
                  }}
                  className="h-10 px-3.5 rounded-xl border border-border hover:border-border-strong bg-transparent hover:bg-surface-hover/60 text-ink-soft hover:text-ink font-sans text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={isFormLocked || !message.trim()}
                className={`h-10 px-5 rounded-xl font-sans text-xs font-semibold transition-all cursor-pointer border-none shrink-0 ${
                  status === 'grace_period'
                    ? 'bg-ink text-bg ring-2 ring-ink/30 hover:opacity-90'
                    : 'bg-ink text-bg hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none'
                }`}
              >
                {status === 'loading'
                  ? 'Sending...'
                  : status === 'grace_period'
                  ? `Looks good ${graceSecondsLeft}s`
                  : status === 'cooldown'
                  ? `Cooldown ${formatTimer(cooldownSecondsLeft)}`
                  : 'Send message'}
              </button>
            </div>
          </div>

          {/* Discrete security microcopy */}
          <div className="flex justify-end -mt-1">
            <span className="font-sans text-[10px] text-ink-muted/50 tracking-wide select-none">
              Protected by Barstile
            </span>
          </div>
        </form>
      </div>
    </section>
  );
}
