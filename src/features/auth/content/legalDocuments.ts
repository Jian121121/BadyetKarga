export type LegalDocumentKey = 'terms' | 'privacy';

export type LegalSection = {
  heading: string;
  body: string;
};

export type LegalDocument = {
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
};

export const LEGAL_DOCUMENTS: Record<LegalDocumentKey, LegalDocument> = {
  terms: {
    title: 'Terms of Service',
    updatedAt: 'July 25, 2026',
    intro:
      'Welcome to BadyetKarga. By creating an account or using the app, you agree to these Terms of Service. BadyetKarga helps Filipino households plan meals, manage grocery budgets, and reduce food waste.',
    sections: [
      {
        heading: '1. Using BadyetKarga',
        body: 'You may use BadyetKarga for personal household budgeting and meal planning. You agree to provide accurate account information and keep your login credentials secure. You are responsible for activity under your account.',
      },
      {
        heading: '2. Household Data',
        body: 'Features such as family members, allergies, pantry items, meal plans, and grocery lists are stored for your household use. You should only enter information you are authorized to manage for your household.',
      },
      {
        heading: '3. Budget Estimates',
        body: 'Grocery costs, savings suggestions, and budget insights are estimates based on the data you enter and the app’s algorithms. They are planning tools only and are not financial, medical, or nutritional advice.',
      },
      {
        heading: '4. Acceptable Use',
        body: 'Do not misuse the app, attempt to disrupt service, reverse engineer protected parts of the system, or use BadyetKarga for unlawful purposes. We may suspend access if these Terms are violated.',
      },
      {
        heading: '5. Project Scope',
        body: 'BadyetKarga is provided as a student project. Features such as password reset email delivery and third-party sign-in may be limited or simulated. Availability and support are not guaranteed like a commercial product.',
      },
      {
        heading: '6. Changes',
        body: 'We may update these Terms as the app evolves. Continued use after updates means you accept the revised Terms. If you do not agree, stop using the app and delete your account data where available.',
      },
      {
        heading: '7. Contact',
        body: 'For questions about these Terms, contact the BadyetKarga project team through your course instructor or the project maintainers listed in the repository documentation.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updatedAt: 'July 25, 2026',
    intro:
      'This Privacy Policy explains what information BadyetKarga collects, how it is used, and how it is stored. We designed the app to keep household planning data on-device whenever possible.',
    sections: [
      {
        heading: '1. Information We Collect',
        body: 'We collect account details you provide (full name, email, and password hash), household settings (name, weekly budget, goals), family member details (including allergies), pantry items, meal plans, grocery lists, and session identifiers used to keep you signed in.',
      },
      {
        heading: '2. How We Use Information',
        body: 'Your data is used to authenticate your account, personalize meal and grocery planning, calculate budget utilization, filter dishes by allergies, and restore your session after app restarts.',
      },
      {
        heading: '3. Storage and Security',
        body: 'On supported devices, app data is stored locally using SQLite and session tokens are kept in secure storage. Passwords are hashed before storage and are never saved as plain text. Web previews may use temporary in-memory storage that is cleared when the session ends.',
      },
      {
        heading: '4. Sharing',
        body: 'BadyetKarga does not sell your personal information. In this capstone build, household data stays on your device/app environment and is not sent to external analytics or advertising services.',
      },
      {
        heading: '5. Your Choices',
        body: 'You can update household information inside the app, log out to clear the active session, or uninstall the app to remove locally stored data from your device. Forgot Password currently confirms a request but does not send real emails in this build.',
      },
      {
        heading: '6. Children’s Privacy',
        body: 'BadyetKarga is intended for household account holders who can manage budgeting decisions. Do not create an account for a child using someone else’s personal information without proper authority.',
      },
      {
        heading: '7. Updates',
        body: 'We may revise this Privacy Policy as features change. The “Last updated” date at the top of this document shows when the latest version took effect.',
      },
      {
        heading: '8. Contact',
        body: 'For privacy questions about BadyetKarga, contact the project maintainers through your course channels or repository documentation.',
      },
    ],
  },
};
