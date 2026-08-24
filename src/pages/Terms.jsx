import { Link } from 'react-router-dom'
import { FREE_TIER_PHOTO_LIMIT } from '../lib/subscription'

const EFFECTIVE_DATE = 'August 24, 2026'

export default function Terms() {
  return (
    <main className="legal-page">
      <Link to="/" className="login-back-link">
        ← MyVaultSnap
      </Link>
      <h1>Terms of Service</h1>
      <p className="legal-updated">Effective {EFFECTIVE_DATE}</p>

      <p>
        These Terms of Service ("Terms") govern your use of MyVaultSnap, a service operated by BoardArmor, LLC
        ("BoardArmor," "we," "us," or "our"). By creating an account or using MyVaultSnap, you agree to these Terms.
        If you don't agree, please don't use the service.
      </p>

      <h2>Eligibility</h2>
      <p>
        You must be at least 13 years old to use MyVaultSnap. By using the service, you confirm that you meet this
        requirement and that any information you provide us is accurate.
      </p>

      <h2>Your account</h2>
      <p>
        You're responsible for maintaining the confidentiality of your password and PIN, and for all activity that
        happens under your account. Let us know right away if you believe your account has been accessed without
        your permission.
      </p>

      <h2>The service</h2>
      <p>
        MyVaultSnap lets you upload, store, organize, and view photos and video across your devices, behind a
        locked, PIN- or biometric-protected vault. Premium subscribers can also use AI Enhance, which sharpens and
        restores photos using a third-party AI processing service. We may add, change, or remove features over
        time.
      </p>

      <h2>Subscriptions and billing</h2>
      <p>
        MyVaultSnap offers a free plan (up to {FREE_TIER_PHOTO_LIMIT} photos) and a paid Premium plan with unlimited
        photos and AI Enhance, billed monthly or annually through Stripe. Premium may include a free trial period;
        unless you cancel before the trial ends, your paid subscription begins automatically and you'll be charged.
        Subscriptions renew automatically until you cancel. You can cancel anytime from your account — cancellation
        stops future billing but doesn't delete your existing photos or video; you'll keep access to everything
        already in your vault, and simply won't be able to add beyond the free plan's limit until you resubscribe.
        Except where required by law, payments are non-refundable.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to use MyVaultSnap to store, upload, or share content that:</p>
      <ul>
        <li>Is illegal, or that you don't have the right to store or share;</li>
        <li>
          Depicts or facilitates the sexual exploitation or abuse of minors in any way — this is never permitted
          under any circumstance, and we will remove such content, terminate the associated account, and report it
          to the National Center for Missing &amp; Exploited Children (NCMEC) and law enforcement as required by
          law;
        </li>
        <li>Infringes someone else's intellectual property or privacy rights; or</li>
        <li>
          Is intended to harass, threaten, or harm another person, or to gain unauthorized access to accounts,
          data, or systems.
        </li>
      </ul>
      <p>
        You also agree not to attempt to disrupt, overload, or reverse-engineer the service, or to use automated
        means to access it outside of the normal app experience. We may investigate, remove content, and suspend or
        terminate accounts that violate this section, and we'll cooperate with law enforcement where required by
        law.
      </p>

      <h2>Your content</h2>
      <p>
        You own the photos, video, and other content you upload to MyVaultSnap. We don't claim ownership over it.
        By uploading content, you grant us a limited license to store, process, and transmit it solely as needed to
        provide the service to you — for example, displaying it back to you, generating an AI-enhanced version when
        you request one, or backing it up as part of normal operation. We don't use your content for advertising,
        and we don't sell it.
      </p>

      <h2>AI Enhance</h2>
      <p>
        AI Enhance sends the photo you select to Replicate, a third-party AI processing service, to generate an
        enhanced version. Results are generated automatically and aren't guaranteed to meet any particular standard
        of quality; you can choose whether or not to keep an enhanced result. See our{' '}
        <Link to="/privacy">Privacy Policy</Link> for more on how this feature handles your data.
      </p>

      <h2>Service availability; backups</h2>
      <p>
        We work to keep MyVaultSnap reliable, but the service is provided "as is" and "as available," without
        warranties of any kind, and we don't guarantee it will always be uninterrupted, error-free, or available.
        MyVaultSnap is not currently designed to be your only copy of irreplaceable photos or video — we'd recommend
        keeping your own backup of anything you can't afford to lose.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, BoardArmor, LLC will not be liable for any indirect, incidental, or
        consequential damages, or for any loss of data, arising from your use of MyVaultSnap. Our total liability
        for any claim relating to the service is limited to the amount you paid us in the 12 months before the
        claim arose.
      </p>

      <h2>Termination</h2>
      <p>
        You can stop using MyVaultSnap and request account deletion at any time by contacting us. We may suspend or
        terminate your access if you violate these Terms, particularly the acceptable use section above.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these Terms as MyVaultSnap changes. If we make material changes, we'll update the effective
        date above and, where appropriate, notify you directly. Continuing to use MyVaultSnap after changes take
        effect means you accept the updated Terms.
      </p>

      <h2>Governing law and dispute resolution</h2>
      <p>
        These Terms are governed by the laws of the State of Oregon, without regard to conflict-of-law principles.
        If a dispute comes up, please contact us first at{' '}
        <a href="mailto:privacy@myvaultsnap.com">privacy@myvaultsnap.com</a> — most issues can be resolved directly.
      </p>
      <p>
        <strong>Arbitration agreement.</strong> If we can't resolve a dispute informally, you and BoardArmor, LLC
        agree that it will be resolved by binding individual arbitration under the rules of the American
        Arbitration Association, rather than in court, except that either party may bring an individual claim in
        small claims court instead. This means you're waiving the right to a jury trial and to participate in a
        class action or class-wide arbitration — disputes must be brought individually, not combined with anyone
        else's claim. If you don't want to be bound by this arbitration agreement, you may opt out by emailing{' '}
        <a href="mailto:privacy@myvaultsnap.com">privacy@myvaultsnap.com</a> within 30 days of first accepting these
        Terms, stating that you opt out of arbitration.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about these Terms? Email us at <a href="mailto:privacy@myvaultsnap.com">privacy@myvaultsnap.com</a>
        .
      </p>
    </main>
  )
}
