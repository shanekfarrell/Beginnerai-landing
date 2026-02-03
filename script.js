/* ============================================
   BEGINNER AI - EDITORIAL JAVASCRIPT
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    initThemeToggle();
    initScrollAnimations();
    initFAQAccordion();
    initHeroCursorEffect();
    initSmoothScroll();
});

/* ============================================
   DARK MODE TOGGLE
   Respects system preference, saves to localStorage
   ============================================ */
function initThemeToggle() {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        let newTheme;

        if (currentTheme === 'dark') {
            newTheme = 'light';
        } else if (currentTheme === 'light') {
            newTheme = 'dark';
        } else {
            // No explicit theme set, toggle from system preference
            newTheme = prefersDark ? 'light' : 'dark';
        }

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

/* ============================================
   SCROLL ANIMATIONS
   Uses Intersection Observer for performance
   Respects prefers-reduced-motion
   ============================================ */
function initScrollAnimations() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        // Make all elements visible immediately
        document.querySelectorAll('.fade-in').forEach(el => {
            el.classList.add('visible');
        });
        return;
    }

    const fadeElements = document.querySelectorAll('.fade-in');

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeElements.forEach(el => {
        observer.observe(el);
    });
}

/* ============================================
   FAQ ACCORDION
   ============================================ */
function initFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (!question) return;

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all other items
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
                const otherQuestion = otherItem.querySelector('.faq-question');
                if (otherQuestion) {
                    otherQuestion.setAttribute('aria-expanded', 'false');
                }
            });

            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
                question.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

/* ============================================
   HERO CURSOR EFFECT
   Subtle paper texture shift on mouse move
   Respects prefers-reduced-motion
   ============================================ */
function initHeroCursorEffect() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let rafId = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    // Smooth interpolation
    function lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    function updatePosition() {
        currentX = lerp(currentX, targetX, 0.1);
        currentY = lerp(currentY, targetY, 0.1);

        // Apply subtle transform to the ::before pseudo-element via CSS variable
        hero.style.setProperty('--cursor-x', `${currentX}px`);
        hero.style.setProperty('--cursor-y', `${currentY}px`);

        rafId = requestAnimationFrame(updatePosition);
    }

    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate offset from center (max 4px movement)
        targetX = ((e.clientX - rect.left - centerX) / centerX) * 4;
        targetY = ((e.clientY - rect.top - centerY) / centerY) * 4;
    });

    hero.addEventListener('mouseleave', () => {
        targetX = 0;
        targetY = 0;
    });

    // Start animation loop
    updatePosition();

    // Cleanup on page hide
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && rafId) {
            cancelAnimationFrame(rafId);
        } else if (!document.hidden) {
            updatePosition();
        }
    });
}

/* ============================================
   SMOOTH SCROLL
   For anchor links
   ============================================ */
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const header = document.querySelector('.header');
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 24;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Focus target for accessibility
                target.focus({ preventScroll: true });
            }
        });
    });
}

/* ============================================
   NEWSLETTER FORM HANDLING
   Submits to n8n webhook for Beehiiv integration
   ============================================ */

const N8N_WEBHOOK_URL = 'https://shane45.app.n8n.cloud/webhook/beehive-subscribe';

function initBeehiivForms() {
    const forms = document.querySelectorAll('[data-beehiiv-form]');
    const mainContent = document.getElementById('main-content');
    const successPage = document.getElementById('success-page');
    const returnHomeBtn = document.getElementById('return-home');

    forms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const emailInput = form.querySelector('input[type="email"]');
            if (!emailInput) return;

            const email = emailInput.value.trim();

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                emailInput.style.borderColor = 'var(--primary)';
                emailInput.focus();
                return;
            }

            // Reset border if valid
            emailInput.style.borderColor = '';

            // Add loading state
            form.classList.add('loading');
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Subscribing...';

            try {
                // Submit to n8n webhook
                const response = await fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email
                    })
                });

                if (response.ok) {
                    showSuccessPage();
                } else {
                    // Show error state
                    submitBtn.textContent = 'Error - Try Again';
                    setTimeout(() => {
                        submitBtn.textContent = originalText;
                    }, 3000);
                }
            } catch (error) {
                console.error('Subscription error:', error);
                submitBtn.textContent = 'Error - Try Again';
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                }, 3000);
            } finally {
                form.classList.remove('loading');
            }
        });
    });

    // Return to home button
    if (returnHomeBtn) {
        returnHomeBtn.addEventListener('click', function() {
            hideSuccessPage();
        });
    }

    function showSuccessPage() {
        if (mainContent && successPage) {
            mainContent.style.display = 'none';
            successPage.style.display = 'flex';
            window.scrollTo(0, 0);
            // Clear form inputs
            forms.forEach(form => {
                const emailInput = form.querySelector('input[type="email"]');
                if (emailInput) emailInput.value = '';
            });
        }
    }

    function hideSuccessPage() {
        if (mainContent && successPage) {
            successPage.style.display = 'none';
            mainContent.style.display = 'block';
            window.scrollTo(0, 0);
        }
    }
}

// Initialize Beehiiv forms
document.addEventListener('DOMContentLoaded', function() {
    initBeehiivForms();
});
