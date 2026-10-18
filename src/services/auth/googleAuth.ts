/**
 * Google identity helpers for BadyetKarga.
 *
 * Standard logic:
 * 1. Obtain Google identity (email + googleId + name)
 * 2. If googleId exists → sign in
 * 3. Else if email exists → link Google + sign in
 * 4. Else → create verified Google account (skips email OTP)
 */

export type GoogleIdentity = {
  email: string;
  fullName: string;
  googleId: string;
};

/**
 * Build a Google identity from a confirmed Google-format email.
 * googleId is stable so re-login with the same email links correctly.
 */
export function buildGoogleIdentityFromEmail(email: string, fullName?: string): GoogleIdentity {
  const normalized = email.trim().toLowerCase();
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/.test(normalized)) {
    throw new Error('Enter a valid @gmail.com address.');
  }
  const googleId = `local-google:${normalized}`;
  return {
    email: normalized,
    fullName: fullName?.trim() || normalized.split('@')[0],
    googleId,
  };
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleIdentity> {
  const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error('Could not read your Google profile. Please try again.');
  }
  const data = (await res.json()) as {
    id?: string;
    email?: string;
    name?: string;
  };
  if (!data.email || !data.id) {
    throw new Error('Google did not return an email. Use another account.');
  }
  return {
    email: data.email.toLowerCase(),
    fullName: data.name || data.email.split('@')[0],
    googleId: data.id,
  };
}
