// ADDED: Efficient premium animation controller for Marvel Syntex
(function () {
  "use strict";

  // ADDED: Stop non-essential motion for users who prefer reduced motion
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ADDED: Central selectors make future customization simple
  var selectors = {
    reveal: ".hero, .info-strip, .section-block, .contact-banner, .cat-hero-banner, .also-like-section, .fabric-journey-section, .luxury-site-footer, .site-footer",
    stagger: ".catalogue-grid, .products-grid, .business-grid, .contact-grid, .note-grid, .also-like-grid",
    buttons: ".button, .pcard-btn"
  };

  // ADDED: Page fade-in after CSS is ready
  function loadPage() {
    window.requestAnimationFrame(function () {
      document.body.classList.add("is-loaded");
    });
  }

  // ADDED: Scroll progress bar
  function createScrollProgress() {
    var progress = document.createElement("div");
    progress.className = "scroll-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.prepend(progress);
    return progress;
  }

  // ADDED: Header state and scroll progress updates in one passive listener
  function bindScrollProgress(progress) {
    var header = document.querySelector(".site-header");

    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = maxScroll > 0 ? scrollTop / maxScroll : 0;

      progress.style.transform = "scaleX(" + ratio.toFixed(4) + ")";

      if (header) {
        header.classList.toggle("is-scrolled", scrollTop > 20);
      }
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  // ADDED: Intersection Observer reveal and stagger logic
  function bindRevealAnimations() {
    var revealItems = Array.prototype.slice.call(document.querySelectorAll(selectors.reveal));
    var staggerGroups = Array.prototype.slice.call(document.querySelectorAll(selectors.stagger));

    revealItems.forEach(function (item, index) {
      item.setAttribute("data-reveal", "");
      item.style.setProperty("--reveal-delay", Math.min(index * 30, 120) + "ms");
    });

    staggerGroups.forEach(function (group) {
      group.setAttribute("data-stagger", "");

      Array.prototype.slice.call(group.children).forEach(function (child, index) {
        child.style.setProperty("--stagger-index", index);
      });
    });

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealItems.concat(staggerGroups).forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px"
    });

    revealItems.concat(staggerGroups).forEach(function (item) {
      observer.observe(item);
    });
  }

  // ADDED: Button glow follows pointer without layout changes
  function bindButtonGlow() {
    Array.prototype.slice.call(document.querySelectorAll(selectors.buttons)).forEach(function (button) {
      button.addEventListener("pointermove", function (event) {
        var rect = button.getBoundingClientRect();
        var x = ((event.clientX - rect.left) / rect.width * 100).toFixed(1) + "%";
        var y = ((event.clientY - rect.top) / rect.height * 100).toFixed(1) + "%";

        button.style.setProperty("--x", x);
        button.style.setProperty("--y", y);
      }, { passive: true });
    });
  }

  // ADDED: Smooth anchor scrolling for same-page navigation
  function bindAnchorScrolling() {
    Array.prototype.slice.call(document.querySelectorAll('a[href^="#"]')).forEach(function (link) {
      link.addEventListener("click", function (event) {
        var href = link.getAttribute("href");
        var target = href && href.length > 1 ? document.querySelector(href) : null;

        if (!target) {
          return;
        }

        event.preventDefault();
        target.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start"
        });
      });
    });
  }

  // ADDED: Smooth transitions only for local HTML pages
  function bindLocalPageTransitions() {
    if (prefersReducedMotion) {
      return;
    }

    Array.prototype.slice.call(document.querySelectorAll("a[href]")).forEach(function (link) {
      var href = link.getAttribute("href");
      var target = link.getAttribute("target");
      var isExternal = /^(https?:|mailto:|tel:|#)/.test(href);
      var isLocalPage = /\.html(?:#.*)?$/i.test(href);

      if (!href || target === "_blank" || isExternal || !isLocalPage) {
        return;
      }

      link.addEventListener("click", function (event) {
        event.preventDefault();
        document.body.classList.add("is-leaving");

        window.setTimeout(function () {
          window.location.href = href;
        }, 180);
      });
    });
  }

  // ADDED: Footer subscribe form — sends to Formspree via AJAX, no page redirect
  function bindFooterSubscribe() {
    Array.prototype.slice.call(document.querySelectorAll('.footer-subscribe')).forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();

        var emailInput = form.querySelector('input[type="email"]');
        var submitBtn  = form.querySelector('button[type="submit"]');
        var successMsg = form.nextElementSibling; // the .subscribe-success <p>

        if (!emailInput || !emailInput.value) return;

        // Visual loading state
        submitBtn.disabled  = true;
        submitBtn.textContent = '…';

        var formData = new FormData(form);

        fetch(form.action, {
          method:  'POST',
          body:    formData,
          headers: { 'Accept': 'application/json' }
        })
        .then(function (response) {
          if (response.ok) {
            // Success: hide form, show thank-you message
            form.style.display = 'none';
            if (successMsg && successMsg.classList.contains('subscribe-success')) {
              successMsg.style.display = 'block';
            }
          } else {
            // Server error
            submitBtn.disabled   = false;
            submitBtn.textContent = '›';
            alert('Something went wrong. Please try again.');
          }
        })
        .catch(function () {
          submitBtn.disabled   = false;
          submitBtn.textContent = '›';
          alert('Network error. Please check your connection and try again.');
        });
      });
    });
  }
  // ADDED: Mobile menu toggle
  function bindMobileMenu() {
    var toggle = document.querySelector('.mobile-menu-toggle');
    var nav = document.querySelector('.site-nav');

    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      toggle.classList.toggle('is-open');
      nav.classList.toggle('is-open');
    });

    // Close menu when a nav link is clicked
    Array.prototype.slice.call(nav.querySelectorAll('a')).forEach(function (link) {
      link.addEventListener('click', function () {
        toggle.classList.remove('is-open');
        nav.classList.remove('is-open');
      });
    });
  }
  // ADDED: Initialize animation system
  function init() {
    var progress = createScrollProgress();

    loadPage();
    bindScrollProgress(progress);
    bindRevealAnimations();
    bindButtonGlow();
    bindAnchorScrolling();
    bindLocalPageTransitions();
    bindFooterSubscribe();
    bindMobileMenu();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
