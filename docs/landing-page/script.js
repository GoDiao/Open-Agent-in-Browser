// Iris Landing Page - Interactions

document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navbar background on scroll
    const nav = document.querySelector('.global-nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            nav.style.background = 'rgba(0, 0, 0, 0.9)';
            nav.style.backdropFilter = 'blur(20px)';
        } else {
            nav.style.background = 'var(--surface-black)';
            nav.style.backdropFilter = 'none';
        }

        lastScroll = currentScroll;
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe all tile sections
    document.querySelectorAll('.product-tile-light, .product-tile-parchment, .product-tile-dark, .product-tile-dark-2').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    // Add visible class styles
    const style = document.createElement('style');
    style.textContent = `
        .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // Button hover sound effect (subtle)
    const buttons = document.querySelectorAll('.button-primary, .button-secondary-pill');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transition = 'transform 0.15s ease, background 0.2s ease';
        });
    });
});

// Export for potential module use
window.IrisLanding = {
    version: '1.0.0',
    init: () => console.log('Iris Landing Page initialized')
};