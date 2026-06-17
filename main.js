
/* ============================================
   HEADER SHRINK ON SCROLL
   ============================================ */
const header = document.getElementById('header');

if (header) {
  function handleHeaderShrink() {
    if (window.scrollY > 80) {
      header.classList.add('shrink');
    } else {
      header.classList.remove('shrink');
    }
  }

  window.addEventListener('scroll', handleHeaderShrink);
  handleHeaderShrink();
}


/* ============================================
   MOBILE MENU
   ============================================ */
const menuBtn = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');
const mobileNavClose = document.getElementById('mobileNavClose');

function openMobileMenu() {
  if (!mobileNav || !menuBtn) return;

  mobileNav.classList.add('active');
  mobileNav.setAttribute('aria-hidden', 'false');
  menuBtn.setAttribute('aria-expanded', 'true');
  menuBtn.setAttribute('aria-label', 'Close menu');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  if (!mobileNav || !menuBtn) return;

  mobileNav.classList.remove('active');
  mobileNav.setAttribute('aria-hidden', 'true');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.setAttribute('aria-label', 'Open menu');
  document.body.style.overflow = '';
}

if (menuBtn && mobileNav) {
  menuBtn.addEventListener('click', () => {
    if (mobileNav.classList.contains('active')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });
}

/* Optional close button (only if it exists) */
if (mobileNavClose) {
  mobileNavClose.addEventListener('click', closeMobileMenu);
}

/* Auto-close when any link is clicked */
if (mobileNav) {
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });
}


/* ============================================
   HORIZONTAL SCROLL BUTTONS
   ============================================ */
document.querySelectorAll('.scroll-wrapper').forEach(wrapper => {
  const track = wrapper.querySelector('.scroll-track');
  const prev = wrapper.querySelector('.scroll-btn.prev');
  const next = wrapper.querySelector('.scroll-btn.next');

  if (!track || !prev || !next) return;

  const step = 320;

  function updateButtons() {
    const tolerance = 2;
    const hasOverflow = track.scrollWidth > track.clientWidth + tolerance;
    const atStart = track.scrollLeft <= tolerance;
    const atEnd =
      track.scrollLeft + track.clientWidth >= track.scrollWidth - tolerance;

    prev.disabled = atStart || !hasOverflow;
    next.disabled = atEnd || !hasOverflow;

    prev.style.opacity = (atStart || !hasOverflow) ? '0.25' : '1';
    next.style.opacity = (atEnd || !hasOverflow) ? '0.25' : '1';
  }

  prev.addEventListener('click', () => {
    track.scrollBy({ left: -step, behavior: 'smooth' });
  });

  next.addEventListener('click', () => {
    track.scrollBy({ left: step, behavior: 'smooth' });
  });

  track.addEventListener('scroll', updateButtons);
  window.addEventListener('resize', updateButtons);

  updateButtons();
});