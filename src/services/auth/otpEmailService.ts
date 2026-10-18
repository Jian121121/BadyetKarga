/**
 * Sends 6-digit verification codes through EmailJS (free tier ~200 emails/month).
 * Codes are generated and checked in-app; EmailJS only delivers the email.
 *
 * Setup (one time, https://www.emailjs.com):
 * 1. Add an Email Service (connect your Gmail) → copy the Service ID.
 * 2. Create an Email Template:
 *    - Settings → "To Email" field: {{to_email}}
 *    - Subject: BadyetKarga verification code
 *    - Body: Your BadyetKarga verification code is {{otp_code}}. It expires in 10 minutes.
 *    → copy the Template ID.
 * 3. Account → General → copy the Public Key.
 * 4. Account → Security: leave "Use Private Key" OFF (a private key would ship in the public web bundle);
 *    turn on "Allow EmailJS API for non-browser applications" for the phone app; set a request limit.
 * 5. Put the service ID, template ID, and public key in .env.local and restart Expo.
 */
const SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY;

const EXPIRY_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

interface PendingCode {
  code: string;
  expiresAt: number;
  attempts: number;
}

const pendingCodes = new Map<string, PendingCode>();

function assertConfigured() {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    throw new Error(
      'Code sending is not configured. Add the EmailJS service ID, template ID, and public key to .env.local, then restart Expo.'
    );
  }
}

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

/** Generates a 6-digit code and emails it. Overwrites any previous code for the email. */
export async function sendVerificationCode(email: string): Promise<void> {
  assertConfigured();
  const to = normalize(email);
  const code = String(Math.floor(100000 + Math.random() * 900000));

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      template_params: {
        to_email: to,
        otp_code: code,
        app_name: 'BadyetKarga',
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    if (/private key|access ?token|strict/i.test(detail)) {
      throw new Error(
        'EmailJS requires a private key. In EmailJS → Account → Security, turn off "Use Private Key".'
      );
    }
    if (/non-browser/i.test(detail)) {
      throw new Error(
        'EmailJS blocked the request. In EmailJS → Account → Security, enable "Allow EmailJS API for non-browser applications".'
      );
    }
    throw new Error(detail || 'Could not send the verification code. Try again.');
  }

  pendingCodes.set(to, { code, expiresAt: Date.now() + EXPIRY_MS, attempts: 0 });
}

/** Throws with a friendly message when the code doesn't match. */
export function verifyCode(email: string, input: string): void {
  const to = normalize(email);
  const entry = pendingCodes.get(to);
  if (!entry) {
    throw new Error('No code was sent to this email yet. Tap "Send verification code" first.');
  }
  if (Date.now() > entry.expiresAt) {
    pendingCodes.delete(to);
    throw new Error('The code expired. Request a new one.');
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    pendingCodes.delete(to);
    throw new Error('Too many wrong attempts. Request a new code.');
  }
  if (entry.code !== input.replace(/\D/g, '')) {
    entry.attempts += 1;
    throw new Error('The code does not match. Check your email and try again.');
  }
  pendingCodes.delete(to);
}
