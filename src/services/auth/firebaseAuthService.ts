import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  reload,
  fetchSignInMethodsForEmail,
  type User as FirebaseUser,
} from 'firebase/auth';
import { assertFirebaseConfig, getFirebaseAuth } from './firebaseApp';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function requireGmail(email: string): string {
  const normalized = normalizeEmail(email);
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/.test(normalized)) {
    throw new Error('A valid @gmail.com address is required.');
  }
  return normalized;
}

/**
 * Gmail ignores dots and anything after "+", so "j.uan+x@gmail.com" is the same
 * inbox as "juan@gmail.com". New accounts are created under this canonical form
 * so Firebase itself rejects alias duplicates.
 */
export function canonicalGmail(email: string): string {
  const gmail = requireGmail(email);
  const local = gmail.slice(0, gmail.indexOf('@')).split('+')[0].replace(/\./g, '');
  return `${local}@gmail.com`;
}

/** Typed address first (accounts created before canonicalization), then canonical. */
function gmailCandidates(email: string): string[] {
  const typed = requireGmail(email);
  const canonical = canonicalGmail(typed);
  return typed === canonical ? [typed] : [typed, canonical];
}

/**
 * Best-effort Firebase lookup. Returns false when unknown: projects with
 * email-enumeration protection (Firebase default) always report no methods,
 * so createUserWithEmailAndPassword remains the authoritative check.
 */
export async function firebaseEmailRegistered(email: string): Promise<boolean> {
  try {
    assertFirebaseConfig();
    const auth = getFirebaseAuth();
    for (const candidate of gmailCandidates(email)) {
      const methods = await fetchSignInMethodsForEmail(auth, candidate);
      if (methods.length > 0) return true;
    }
  } catch {
    // Network/config errors: let the real registration call decide.
  }
  return false;
}

function mapFirebaseError(err: unknown): string {
  const code =
    typeof err === 'object' && err && 'code' in err ? String((err as { code: string }).code) : '';
  const message = err instanceof Error ? err.message : 'Authentication failed.';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a bit, then try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/requires-recent-login':
      return 'For security, log out and log back in, then change your password.';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid':
      return 'Invalid Firebase API key. Check EXPO_PUBLIC_FIREBASE_API_KEY in .env.local.';
    case 'auth/configuration-not-found':
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled. In Firebase Console open Authentication → Sign-in method → Email/Password → Enable → Save.';
    default:
      if (/CONFIGURATION_NOT_FOUND|OPERATION_NOT_ALLOWED/i.test(message) || /CONFIGURATION_NOT_FOUND/i.test(code)) {
        return 'Email/Password sign-in is not enabled. In Firebase Console open Authentication → Sign-in method → Email/Password → Enable → Save.';
      }
      if (/Firebase is not configured/i.test(message)) return message;
      return (
        message.replace(/^Firebase:\s*/i, '').replace(/\s*\(auth\/.*\)\.?$/, '') ||
        'Authentication failed.'
      );
  }
}

export type FirebaseAuthProfile = {
  uid: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
};

function toProfile(user: FirebaseUser): FirebaseAuthProfile {
  return {
    uid: user.uid,
    email: normalizeEmail(user.email || ''),
    fullName: user.displayName?.trim() || (user.email || '').split('@')[0] || 'User',
    emailVerified: user.emailVerified,
  };
}

/** Creates the Firebase account. Email ownership is verified in-app with a 6-digit code first. */
export async function firebaseRegister(
  fullName: string,
  email: string,
  password: string
): Promise<FirebaseAuthProfile> {
  assertFirebaseConfig();
  const auth = getFirebaseAuth();
  const gmail = canonicalGmail(email);
  const name = fullName.trim();
  if (!name) throw new Error('Please enter your full name.');
  if (password.length < 6) throw new Error('Password must be at least 6 characters.');

  try {
    const cred = await createUserWithEmailAndPassword(auth, gmail, password);
    await updateProfile(cred.user, { displayName: name });
    await signOut(auth);
    return {
      uid: cred.user.uid,
      email: gmail,
      fullName: name,
      emailVerified: true,
    };
  } catch (err) {
    throw new Error(mapFirebaseError(err));
  }
}

/** Signs in with Firebase. */
export async function firebaseLogin(
  email: string,
  password: string
): Promise<FirebaseAuthProfile> {
  assertFirebaseConfig();
  const auth = getFirebaseAuth();
  let lastError: unknown;
  for (const candidate of gmailCandidates(email)) {
    try {
      const cred = await signInWithEmailAndPassword(auth, candidate, password);
      await reload(cred.user);
      return toProfile(cred.user);
    } catch (err) {
      lastError = err;
      const code = typeof err === 'object' && err && 'code' in err ? String(err.code) : '';
      if (!/invalid-credential|user-not-found|wrong-password/.test(code)) break;
    }
  }
  throw new Error(mapFirebaseError(lastError));
}

export async function firebaseSendPasswordReset(email: string): Promise<void> {
  assertFirebaseConfig();
  const auth = getFirebaseAuth();
  let sent = false;
  let lastError: unknown;
  for (const candidate of gmailCandidates(email)) {
    try {
      await sendPasswordResetEmail(auth, candidate);
      sent = true;
    } catch (err) {
      lastError = err;
    }
  }
  if (!sent) throw new Error(mapFirebaseError(lastError));
}

export async function firebaseChangePassword(
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  assertFirebaseConfig();
  if (newPassword.length < 6) throw new Error('New password must be at least 6 characters.');
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  const gmail = requireGmail(email);
  try {
    if (!user || normalizeEmail(user.email || '') !== gmail) {
      await signInWithEmailAndPassword(auth, gmail, currentPassword);
    } else {
      const credential = EmailAuthProvider.credential(gmail, currentPassword);
      await reauthenticateWithCredential(user, credential);
    }
    const active = auth.currentUser;
    if (!active) throw new Error('Not signed in.');
    await updatePassword(active, newPassword);
  } catch (err) {
    throw new Error(mapFirebaseError(err));
  }
}

export async function firebaseSignOut(): Promise<void> {
  try {
    await signOut(getFirebaseAuth());
  } catch {
    // ignore
  }
}

export function normalizeGmail(email: string): string {
  return requireGmail(email);
}
