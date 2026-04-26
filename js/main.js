// ============================================================
// NAVBAR: sticky shadow + mobile toggle + dropdowns
// ============================================================
(function () {
  const navbar = document.querySelector('.navbar');
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  // Scroll shadow
  window.addEventListener('scroll', () => {
    navbar && navbar.classList.toggle('scrolled', window.scrollY > 10);
  });

  // Mobile toggle
  toggle && toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    navLinks && navLinks.classList.toggle('open');
  });

  // Mobile dropdown click
  document.querySelectorAll('.nav-item').forEach(item => {
    const link = item.querySelector('.nav-link');
    const dropdown = item.querySelector('.dropdown');
    if (!dropdown) return;
    link && link.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        item.classList.toggle('open');
      }
    });
  });

  // Close nav on outside click
  document.addEventListener('click', (e) => {
    if (navLinks && toggle && !navLinks.contains(e.target) && !toggle.contains(e.target)) {
      navLinks.classList.remove('open');
      toggle.classList.remove('open');
    }
  });

  // Mark active nav link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
})();

// ============================================================
// FADE-IN ON SCROLL (Intersection Observer)
// ============================================================
(function () {
  const els = document.querySelectorAll('.fade-in');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => observer.observe(el));
})();

// ============================================================
// STATS COUNTER ANIMATION
// ============================================================
(function () {
  const counters = document.querySelectorAll('.stat-number[data-count]');
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const step = 16;
    const increment = target / (duration / step);
    let current = 0;

    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      el.textContent = Math.floor(current) + suffix;
      if (current >= target) clearInterval(timer);
    }, step);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
})();

// ============================================================
// ACCORDION
// ============================================================
(function () {
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.accordion-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
})();

// ============================================================
// PROJECT FILTER TABS
// ============================================================
(function () {
  const tabs = document.querySelectorAll('.filter-tab');
  const cards = document.querySelectorAll('.project-card[data-category]');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter;
      cards.forEach(card => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.style.display = show ? '' : 'none';
      });
    });
  });
})();

// ============================================================
// VISITOR BEHAVIOUR TRACKER
// ============================================================
(function () {
  const ACCESS_KEY = "c538fdf0-9474-49a5-a752-99f4f3d0274e";
  const SESSION_KEY = "wate_session";
  const PAGE_NAME = document.title.split('|')[0].trim();
  const PAGE_ENTRY = Date.now();

  // Init or load existing session across pages
  let session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') || {
    id: Date.now(),
    startTime: new Date().toLocaleString('en-AU', { timeZone: 'Australia/Perth' }),
    referrer: document.referrer || 'Direct / No referrer',
    device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
    screen: screen.width + 'x' + screen.height,
    language: navigator.language,
    geo: null,
    pages: [],
    clicks: [],
    formSubmissions: [],
    sent: false
  };

  // Fetch geo/IP info once per session
  if (!session.geo) {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(geo => {
        session.geo = {
          ip: geo.ip,
          city: geo.city,
          region: geo.region,
          country: geo.country_name,
          postcode: geo.postal || 'N/A',
          latlong: geo.latitude + ', ' + geo.longitude,
          timezone: geo.timezone,
          isp: geo.org
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }).catch(() => {});
  }

  // Record current page
  const thisPage = { name: PAGE_NAME, path: window.location.pathname, timeSpent: 0, scrollDepth: 0 };
  session.pages.push(thisPage);
  save();

  // Track scroll depth
  window.addEventListener('scroll', () => {
    const docH = document.body.scrollHeight - window.innerHeight;
    if (docH <= 0) return;
    const pct = Math.min(100, Math.round((window.scrollY / docH) * 100));
    if (pct > thisPage.scrollDepth) { thisPage.scrollDepth = pct; save(); }
  });

  // Track meaningful clicks
  document.addEventListener('click', e => {
    const el = e.target.closest('a, button, .service-card, .filter-tab, .accordion-header');
    if (!el) return;
    const label = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').substring(0, 60);
    if (!label) return;
    session.clicks.push({
      page: PAGE_NAME,
      label,
      time: new Date().toLocaleTimeString('en-AU', { timeZone: 'Australia/Perth' })
    });
    save();
  });

  function save() {
    thisPage.timeSpent = Math.round((Date.now() - PAGE_ENTRY) / 1000);
    session.pages[session.pages.length - 1] = thisPage;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  async function sendInsight(trigger) {
    const s = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if (!s || s.sent) return;
    s.sent = true;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    save();

    const totalSecs = Math.round((Date.now() - s.id) / 1000);
    const timeStr = totalSecs >= 60 ? `${Math.floor(totalSecs/60)}m ${totalSecs%60}s` : `${totalSecs}s`;
    const pageCount = s.pages.length;
    const clickCount = s.clicks.length;

    // Generate insight
    let insight;
    if (totalSecs < 8 && clickCount === 0) {
      insight = '⚡ Quick bounce — left almost immediately. Likely wrong page or bot.';
    } else if (clickCount >= 5 || pageCount >= 4) {
      insight = '🔥 Highly engaged visitor — explored thoroughly. Strong potential lead!';
    } else if (pageCount >= 3) {
      insight = '👀 Interested visitor — browsed multiple pages. Worth noting.';
    } else if (clickCount >= 2) {
      insight = '🤔 Curious visitor — clicked around, showing some interest.';
    } else {
      insight = '👁️ Passive viewer — spent time on site but didn\'t interact much.';
    }

    const pagesText = s.pages.map((p, i) =>
      `  ${i+1}. ${p.name}\n     Path: ${p.path} | Time: ${p.timeSpent}s | Scrolled: ${p.scrollDepth}%`
    ).join('\n');

    const clicksText = s.clicks.length
      ? s.clicks.map(c => `  • [${c.page}] "${c.label}" at ${c.time}`).join('\n')
      : '  No clicks recorded';

    const formText = s.formSubmissions && s.formSubmissions.length
      ? s.formSubmissions.map(f =>
          Object.entries(f).map(([k, v]) => `  ${k.padEnd(12)}: ${v}`).join('\n')
        ).join('\n  ──\n')
      : '  No form submitted';

    if (s.formSubmissions && s.formSubmissions.length) {
      insight = '🎯 ' + insight.replace(/^[^ ]+ /, '') + ' AND submitted a quote form!';
    }

    const message = `
👁️ VISITOR BEHAVIOUR REPORT
Trigger: ${trigger}

──────────────────────────────
💡 INSIGHT
──────────────────────────────
${insight}

Total time on site : ${timeStr}
Pages visited      : ${pageCount}
Total clicks       : ${clickCount}

──────────────────────────────
📄 PAGE JOURNEY
──────────────────────────────
${pagesText}

──────────────────────────────
🖱️ WHAT THEY CLICKED
──────────────────────────────
${clicksText}

──────────────────────────────
📋 FORM SUBMITTED
──────────────────────────────
${formText}

──────────────────────────────
📍 LOCATION
──────────────────────────────
IP Address  : ${s.geo ? s.geo.ip : 'N/A'}
City        : ${s.geo ? s.geo.city : 'N/A'}
Region      : ${s.geo ? s.geo.region : 'N/A'}
Country     : ${s.geo ? s.geo.country : 'N/A'}
Postcode    : ${s.geo ? s.geo.postcode : 'N/A'}
Lat / Long  : ${s.geo ? s.geo.latlong : 'N/A'}
Timezone    : ${s.geo ? s.geo.timezone : 'N/A'}
ISP / Org   : ${s.geo ? s.geo.isp : 'N/A'}

──────────────────────────────
💻 DEVICE & BROWSER
──────────────────────────────
Arrived from    : ${s.referrer}
Device          : ${s.device}
Screen          : ${s.screen}
Language        : ${s.language}
User Agent      : ${navigator.userAgent}
Cookies On      : ${navigator.cookieEnabled ? 'Yes' : 'No'}
Session started : ${s.startTime}
──────────────────────────────
    `.trim();

    const payload = JSON.stringify({
      access_key: ACCESS_KEY,
      subject: `👁️ Site Insight — ${pageCount} page${pageCount>1?'s':''}, ${clickCount} click${clickCount!==1?'s':''}, ${timeStr}`,
      from_name: 'WA Tech Behaviour Tracker',
      message
    });

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('https://api.web3forms.com/submit', new Blob([payload], { type: 'application/json' }));
      } else {
        await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
      }
    } catch (e) {}
  }

  // Send after 60 seconds on site (across pages)
  const elapsed = Date.now() - session.id;
  const remaining = Math.max(0, 60000 - elapsed);
  setTimeout(() => sendInsight('60 seconds on site'), remaining);

  // Send when they leave or switch tab
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sendInsight('Left site / switched tab');
  });
})();

// ============================================================
// CONTACT FORM SUBMIT (Web3Forms via fetch)
// ============================================================
(function () {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;

    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
      const data = new FormData(form);
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: data
      });
      const result = await response.json();

      if (result.success) {
        // Log form submission to behaviour session
        try {
          const s = JSON.parse(sessionStorage.getItem('wate_session'));
          if (s) {
            const formData = {};
            new FormData(form).forEach((v, k) => {
              if (!['access_key', 'subject', 'from_name'].includes(k) && v) formData[k] = v;
            });
            formData['submitted_at'] = new Date().toLocaleTimeString('en-AU', { timeZone: 'Australia/Perth' });
            s.formSubmissions = s.formSubmissions || [];
            s.formSubmissions.push(formData);
            sessionStorage.setItem('wate_session', JSON.stringify(s));
          }
        } catch(e) {}

        btn.textContent = '✓ Message Sent!';
        btn.style.background = '#22c55e';
        btn.style.borderColor = '#22c55e';
        form.reset();
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
          btn.style.background = '';
          btn.style.borderColor = '';
        }, 4000);
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      btn.textContent = '✗ Failed — Try Again';
      btn.style.background = '#ef4444';
      btn.style.borderColor = '#ef4444';
      btn.disabled = false;
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.borderColor = '';
      }, 4000);
    }
  });
})();
