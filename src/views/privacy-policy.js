export function mountPrivacyPolicy(container, navigate) {
  container.innerHTML = `
    <div class="legal-page-shell">
      <nav class="legal-nav">
        <a href="/" class="legal-back-link" data-nav="/">
          <span class="back-arrow">←</span>
          <img src="/AndiNu_icon.png" alt="Andinu Logo" class="legal-logo" />
          <span class="legal-brand-name">Andinu</span>
        </a>
        <div class="legal-nav-links">
          <a href="/tos" class="legal-nav-link" data-nav="/tos">Terms of Service</a>
          <a href="/login" class="legal-nav-btn" data-nav="/login">Sign In</a>
        </div>
      </nav>

      <article class="legal-document glass-panel">
        <header class="legal-header">
          <div class="legal-tag">Legal & Privacy</div>
          <h1 class="legal-title">Andinu Privacy Policy</h1>
          <p class="legal-date"><strong>Effective Date:</strong> October 15, 2026 • <strong>Last Updated:</strong> October 15, 2026</p>
          <p class="legal-summary">
            Welcome to Andinu (accessible at <a href="https://andinu.cc">https://andinu.cc</a>). We respect your privacy and are committed to protecting your personal information. This Privacy Policy outlines how we collect, use, disclose, and safeguard your data when you use our household productivity web application.
          </p>
        </header>

        <section class="legal-section">
          <h2>1. Introduction & Scope</h2>
          <p>
            Andinu ("we", "us", or "our") operates the web application located at <code>https://andinu.cc</code>. Andinu is a private household and personal productivity suite that provides couples and household members with:
          </p>
          <ul>
            <li>A <strong>Nighttime Routine Guide</strong> with structured workouts, mobility timers, and wind-down audio cues.</li>
            <li>A <strong>Meal Prep, Pantry & Weekly Planner</strong> for curating recipes, tracking on-hand grocery ingredients, generating weekly dinner menus, and managing shopping lists.</li>
            <li><strong>Shared Checkbox Collections</strong> for tracking mutual wishlists including movies to watch, vinyl records to collect, and travel destinations.</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>2. Information We Collect (Including Google User Data)</h2>
          <p>
            We collect only the minimum information necessary to provide our household collaboration features.
          </p>

          <h3>A. Google User Profile Information (Google OAuth)</h3>
          <p>
            When you sign in to Andinu using Google Sign-In (OAuth 2.0), we request authorization via the standard Google identity scopes:
          </p>
          <ul>
            <li><code>openid</code> — To verify your authenticated session identity.</li>
            <li><code>https://www.googleapis.com/auth/userinfo.email</code> — To retrieve your primary Google email address.</li>
            <li><code>https://www.googleapis.com/auth/userinfo.profile</code> — To access basic profile details (specifically your display name and avatar image URL).</li>
          </ul>
          <p>
            From Google APIs, we collect and store only your <strong>Google Email Address</strong>, <strong>Display Name</strong>, and <strong>Profile Picture URL</strong>. We do NOT request access to Google Drive, Gmail, Google Contacts, Google Calendar, or any other sensitive or non-essential Google user data.
          </p>

          <h3>B. Application & Household Content Created by You</h3>
          <p>
            To deliver our collaborative tools, we store the content you explicitly create or input:
          </p>
          <ul>
            <li><strong>Recipes:</strong> Recipe titles, descriptions, instructions, prep times, dietary tags, and ingredient measurements.</li>
            <li><strong>Pantry Inventory:</strong> Ingredient names, on-hand stock booleans, and quantity units.</li>
            <li><strong>Weekly Meal Schedules:</strong> Chosen recipes assigned to days of the week, meal preference tags, and cooked completion statuses.</li>
            <li><strong>Shopping Items:</strong> Grocery items needed for upcoming meals, checked status, and categories.</li>
            <li><strong>Shared Wishlist Items:</strong> Movie titles, vinyl record pressings, travel locations, personal notes, and completion timestamps.</li>
            <li><strong>Routine Preferences:</strong> Enabled workout phases, session timer preferences, and audio source preferences.</li>
          </ul>

          <h3>C. Technical & Session Information</h3>
          <p>
            We use durable, secure first-party HTTP cookies strictly to maintain your authenticated login session and prevent premature sign-outs across browser sessions and application deployments. We do not use third-party analytics trackers, tracking beacons, or cross-site advertising cookies.
          </p>
        </section>

        <section class="legal-section">
          <h2>3. How We Use Your Information</h2>
          <p>
            All collected information is used solely to operate and improve Andinu:
          </p>
          <ol>
            <li><strong>Authentication & Session Maintenance:</strong> To authenticate your identity via Google OAuth, establish a persistent user session, and protect your private account.</li>
            <li><strong>Household Membership & Shared Collaboration:</strong> To verify that your Google email belongs to your authorized household group allowlist, enabling you and your designated partner to co-manage shared meal plans, recipes, pantries, and lists in real time.</li>
            <li><strong>Content Storage & Synchronization:</strong> To save, update, and display your personalized recipes, grocery lists, routine timers, and wishlist items.</li>
            <li><strong>Customer Support:</strong> To respond to inquiries, troubleshooting requests, or account deletion requests.</li>
          </ol>
        </section>

        <section class="legal-section highlight-box">
          <h2>4. Google API Services User Data Policy Disclosure (Limited Use Compliance)</h2>
          <p class="compliance-statement">
            <strong>Andinu's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements. We do not use Google user data for advertising, marketing, or training generalized AI models, and we never sell, rent, or trade your Google user data to third parties.</strong>
          </p>
          <p>
            Specifically:
          </p>
          <ul>
            <li>We do not transfer Google user data to third-party advertising platforms, data brokers, or information resellers.</li>
            <li>We do not use or transfer Google user data to serve targeted advertisements, retargeting campaigns, or promotional communications.</li>
            <li>We do not use Google user data to train, fine-tune, or improve machine learning or artificial intelligence models.</li>
            <li>Human access to user data is strictly prohibited, except where required by law, to investigate critical security incidents, or with your explicit prior consent for debugging purposes.</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>5. Data Storage, Third-Party Infrastructure & Security</h2>
          <p>
            Your data is stored and managed using industry-standard cloud infrastructure:
          </p>
          <ul>
            <li><strong>Database & Authentication (Supabase):</strong> User accounts, household memberships, and application records are stored in managed PostgreSQL databases hosted by <strong>Supabase</strong>. All database tables are guarded with PostgreSQL Row Level Security (RLS) policies ensuring that only verified household members can read, create, edit, or delete household records.</li>
            <li><strong>Hosting & Encryption (Vercel):</strong> Andinu is deployed on <strong>Vercel</strong>'s edge cloud. All web traffic between your browser and our servers is strictly encrypted in transit using Transport Layer Security (TLS 1.2+ / HTTPS).</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>6. Data Retention & Account Deletion Rights</h2>
          <p>
            We retain your personal information and created content only for as long as your account remains active. You maintain complete control over your data:
          </p>
          <ul>
            <li><strong>In-App Deletion:</strong> You can delete any recipe, pantry item, meal plan, or list item directly through the application interface at any time.</li>
            <li><strong>Complete Account & Data Removal:</strong> You may request the permanent deletion of your account, household memberships, and all associated Google profile data by contacting us at <a href="mailto:privacy@andinu.cc">privacy@andinu.cc</a>. Upon receiving your request, your personal information and created records will be permanently purged from our database within 30 business days.</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>7. Contact Information</h2>
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy, your Google user data, or your privacy rights on Andinu, please contact:
          </p>
          <div class="legal-contact-box">
            <p><strong>Andinu Support & Privacy Team</strong></p>
            <p>Website: <a href="https://andinu.cc">https://andinu.cc</a></p>
            <p>Email: <a href="mailto:privacy@andinu.cc">privacy@andinu.cc</a> (or <a href="mailto:support@andinu.cc">support@andinu.cc</a>)</p>
          </div>
        </section>

        <footer class="legal-footer">
          <div class="legal-footer-links">
            <a href="/" data-nav="/">Home</a> • 
            <a href="/tos" data-nav="/tos">Terms of Service</a> • 
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

