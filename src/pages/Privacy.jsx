import { Link } from 'react-router-dom'

const EFFECTIVE_DATE = 'August 24, 2026'

export default function Privacy() {
  return (
    <main className="legal-page">
      <Link to="/" className="login-back-link">
        ← MyVaultSnap
      </Link>
      <h1>Privacy Policy</h1>
      <p className="legal-updated">Effective {EFFECTIVE_DATE}</p>

      <p>
        MyVaultSnap ("MyVaultSnap," "we," "us," or "our") is operated by BoardArmor, LLC. This policy explains what
        information we collect when you use MyVaultSnap, why we collect it, who we share it with, and the choices
        you have. It applies to myvaultsnap.com and the MyVaultSnap web app.
      </p>

      <h2>Information we collect</h2>
      <p>We collect only what's needed to run your vault and your account:</p>
      <ul>
        <li>
          <strong>Account information.</strong> Your email address and password when you sign up. Your password is
          never stored in plain text — it's hashed by our authentication provider, Supabase.
        </li>
        <li>
          <strong>Your content.</strong> The photos and videos you upload. These are stored in a private storage
          bucket scoped to your account and are not accessible to other users.
        </li>
        <li>
          <strong>Your vault PIN.</strong> If you set a PIN to unlock your vault, we store a salted, one-way
          cryptographic hash of it (PBKDF2, 150,000 iterations) — never the PIN itself. We can't recover or view
          your PIN, which also means we can't tell it to you if you forget it; you'd need to reset it.
        </li>
        <li>
          <strong>Biometric unlock (Face ID / Touch ID).</strong> If you enable this, your actual fingerprint or face
          data never leaves your device and is never sent to us — that's controlled entirely by your device's
          operating system. What we store on our servers is only a credential identifier for your device's
          authenticator, which lets that device recognize its own previously-registered unlock; it cannot be used to
          reconstruct any biometric data.
        </li>
        <li>
          <strong>Payment information.</strong> If you subscribe to Premium, your payment is processed directly by
          Stripe. We do not receive or store your full card number — only a subscription status and a Stripe
          customer/subscription reference so we know your account is paid.
        </li>
        <li>
          <strong>Basic usage data.</strong> A small amount of information is stored locally in your browser (not on
          our servers) to remember preferences like your chosen photo view (grid or list). We do not use
          third-party analytics or advertising trackers on MyVaultSnap.
        </li>
      </ul>

      <h2>How we use your information</h2>
      <p>
        We use this information to operate your account: authenticating you, storing and displaying your photos and
        video, enforcing plan limits, processing payments and subscription status, and communicating with you about
        your account (like confirming your email or sending a password reset link). We do not sell your information,
        and we do not use your photos or account data for advertising.
      </p>

      <h2>AI Enhance</h2>
      <p>
        If you use AI Enhance on a photo, that photo is sent securely to Replicate, a third-party AI processing
        service, solely to run the enhancement and return the result. Per Replicate's published documentation,
        input and output files from API predictions like this are automatically deleted from their systems within
        an hour. The enhanced photo is then stored back in your vault the same way as any other photo. AI Enhance
        only runs on photos you specifically choose to enhance.
      </p>

      <h2>Who we share information with</h2>
      <p>
        We share information only with the service providers that make MyVaultSnap work, and only as needed for
        that purpose:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — our database, authentication, and file storage provider.
        </li>
        <li>
          <strong>Netlify</strong> — hosts the app and runs its backend functions.
        </li>
        <li>
          <strong>Stripe</strong> — processes payments and manages subscriptions.
        </li>
        <li>
          <strong>Replicate</strong> — processes photos you submit to AI Enhance.
        </li>
      </ul>
      <p>
        We do not sell, rent, or share your personal information or your photos with advertisers, data brokers, or
        any other third party. We may disclose information if required by law or to protect the rights, safety, or
        property of MyVaultSnap or our users.
      </p>

      <h2>Data security</h2>
      <p>
        Your vault is protected in layers: signing in to your account, then a separate unlock (PIN or biometric)
        before any photo or video is visible — even on a device that's already signed in. Access to your content at
        the database level is scoped to your account specifically, data is encrypted in transit, and PINs and
        passwords are stored as one-way hashes rather than in plain text. No system is perfectly secure, but this is
        the standard we hold MyVaultSnap to.
      </p>

      <h2>Data retention</h2>
      <p>
        We keep your account and content for as long as your account is active. If you cancel a Premium
        subscription, your existing photos and video are not deleted — you keep access to everything already in
        your vault, you just won't be able to add more than the free plan's limit until you resubscribe. If you'd
        like your account and content permanently deleted, contact us (see below) and we'll process that request.
      </p>

      <h2>Your rights and choices</h2>
      <p>
        You can access, download, or delete individual photos and video directly in the app at any time. For
        account-level requests — correcting your information, exporting your data, or permanently deleting your
        account — email us at{' '}
        <a href="mailto:privacy@myvaultsnap.com">privacy@myvaultsnap.com</a>. We don't currently have a fully
        automated self-service account deletion flow; we handle these requests directly to make sure they're done
        correctly.
      </p>

      <h2>Children's privacy</h2>
      <p>
        MyVaultSnap is not directed at children under 13, and we do not knowingly collect personal information from
        children under 13. If you believe a child has provided us with personal information, contact us and we'll
        delete it.
      </p>

      <h2>International users</h2>
      <p>
        MyVaultSnap is operated from the United States and our service providers primarily process data in the
        United States. If you use MyVaultSnap from outside the United States, your information will be transferred
        to and processed in the United States.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy as MyVaultSnap changes. If we make material changes, we'll update the effective
        date above and, where appropriate, notify you directly.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about this policy or your data? Email us at{' '}
        <a href="mailto:privacy@myvaultsnap.com">privacy@myvaultsnap.com</a>.
      </p>
    </main>
  )
}
