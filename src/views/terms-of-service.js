export function mountTermsOfService(container, navigate) {
  container.innerHTML = `
    <div class="legal-page-shell">
      <nav class="legal-nav">
        <a href="/" class="legal-back-link" data-nav="/">
          <span class="back-arrow">←</span>
          <img src="/AndiNu_icon.png" alt="Andinu Logo" class="legal-logo" />
          <span class="legal-brand-name">Andinu</span>
        </a>
        <div class="legal-nav-links">
          <a href="/pp" class="legal-nav-link" data-nav="/pp">Privacy Policy</a>
          <a href="/login" class="legal-nav-btn" data-nav="/login">Sign In</a>
        </div>
      </nav>

      <article class="legal-document glass-panel">
        <header class="legal-header">
          <div class="legal-tag">Legal Terms</div>
          <h1 class="legal-title">Andinu Terms of Service</h1>
          <p class="legal-date"><strong>Effective Date:</strong> October 15, 2026 • <strong>Last Updated:</strong> October 15, 2026</p>
          <p class="legal-summary">
            These Terms of Service ("Terms") govern your access to and use of Andinu, available at <a href="https://andinu.cc">https://andinu.cc</a>. By accessing or using Andinu, you agree to be bound by these Terms.
          </p>
        </header>

        <section class="legal-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Andinu web application at <code>https://andinu.cc</code> ("Service"), you agree to comply with and be legally bound by these Terms of Service and our <a href="/pp" data-nav="/pp">Privacy Policy</a>. If you do not agree to these Terms, please do not use the Service.
          </p>
        </section>

        <section class="legal-section">
          <h2>2. Description of Service</h2>
          <p>
            Andinu is a personal and household web application designed to help partners and families organize daily routines and mutual activities:
          </p>
          <ul>
            <li><strong>Nighttime Routine Guide:</strong> Daily mat exercise timers, stretching cues, wind-down tracking, and Spotify audio integration.</li>
            <li><strong>Meal Prep, Pantry & Smart Weekly Planner:</strong> Recipe management, on-hand pantry ingredient tracking, weekly meal scheduling, and dynamic shopping lists with live pantry synchronization.</li>
            <li><strong>Shared Checkbox Collections:</strong> Collaborative lists for movies to watch, vinyl records to buy, and travel destinations.</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>3. Account Access & Google Authentication</h2>
          <p>
            <strong>Authentication:</strong> Andinu uses Google Sign-In (OAuth 2.0) for user authentication. You are responsible for maintaining the confidentiality and security of your Google account credentials.
          </p>
          <p>
            <strong>Household Access Controls:</strong> Andinu operates private household workspaces. Access to specific household records (including meal plans, pantry stock, and custom wishlists) is restricted to Google email addresses invited and linked by the household administrator. You agree not to attempt unauthorized access to other households' data.
          </p>
        </section>

        <section class="legal-section">
          <h2>4. User Content & Responsibilities</h2>
          <p>
            <strong>Ownership:</strong> You retain full ownership and intellectual property rights in any content you submit or create on Andinu, including recipe text, notes, grocery items, and wishlist entries.
          </p>
          <p>
            <strong>License to Operate:</strong> By entering content into Andinu, you grant us a limited, non-exclusive license solely to host, store, display, and synchronize your content to authorized members of your household as necessary to provide the Service.
          </p>
          <p>
            <strong>Prohibited Activities:</strong> You agree not to use the Service for any unlawful purpose, attempt to probe or bypass security mechanisms (including Row Level Security policies), or introduce malicious software.
          </p>
        </section>

        <section class="legal-section">
          <h2>5. Service Availability & "As-Is" Disclaimer</h2>
          <p>
            Andinu is provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis without warranties of any kind, whether express, statutory, or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
          </p>
          <p>
            We strive to provide reliable service, but we do not warrant that the Service will be uninterrupted, error-free, or free of data loss. Exercise guidance provided within the Nighttime Routine is for informational and wellness purposes only and should not replace professional medical or fitness advice.
          </p>
        </section>

        <section class="legal-section">
          <h2>6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, in no event shall Andinu, its developers, or its domain owners be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or inability to use the Service.
          </p>
        </section>

        <section class="legal-section">
          <h2>7. Termination & Account Removal</h2>
          <p>
            You may stop using Andinu at any time. You may request the deletion of your account and associated household data by sending an email to <a href="mailto:support@andinu.cc">support@andinu.cc</a>. We reserve the right to suspend or terminate accounts that violate these Terms or threaten the security and availability of the Service.
          </p>
        </section>

        <section class="legal-section">
          <h2>8. Modifications to Terms</h2>
          <p>
            We reserve the right to update or modify these Terms at any time. When changes occur, the "Last Updated" date at the top of this page will be revised. Continued use of the Service following posted modifications constitutes your acceptance of the updated Terms.
          </p>
        </section>

        <section class="legal-section">
          <h2>9. Contact Information</h2>
          <div class="legal-contact-box">
            <p>For questions or notices regarding these Terms of Service, please contact:</p>
            <p><strong>Andinu Support Team</strong></p>
            <p>Website: <a href="https://andinu.cc">https://andinu.cc</a></p>
            <p>Email: <a href="mailto:support@andinu.cc">support@andinu.cc</a> (or <a href="mailto:privacy@andinu.cc">privacy@andinu.cc</a>)</p>
          </div>
        </section>

        <footer class="legal-footer">
          <div class="legal-footer-links">
            <a href="/" data-nav="/">Home</a> • 
            <a href="/pp" data-nav="/pp">Privacy Policy</a> • 
            <a href="/login" data-nav="/login">Sign In</a>
          </div>
          <p class="legal-copy">© 2026 Andinu • All rights reserved.</p>
        </footer>
      </article>
    </div>
  `;

  container.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const path = el.getAttribute('data-nav');
      if (path) navigate(path);
    });
  });
}

