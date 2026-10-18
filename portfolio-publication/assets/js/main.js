// Small progressive enhancements. Every page works without this file.
(function () {
  var root = document.documentElement;
  // "js-motion" is set in <head> only when the visitor has not asked for reduced motion
  var motionOK = root.classList.contains("js-motion");

  // Mark content already on screen before the reveal styles switch on, so it never animates
  var revealEls = document.querySelectorAll("[data-reveal]");
  revealEls.forEach(function (el) {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) el.classList.add("is-visible");
  });
  root.classList.add("js");

  /* ---------- Hero: one-time typing of the name ---------- */
  var title = document.querySelector(".hero-title");
  var src = title && title.querySelector(".type-src");
  if (src && motionOK) {
    var chars = [];
    var text = src.textContent;
    src.textContent = "";
    Array.prototype.forEach.call(text, function (c) {
      var span = document.createElement("span");
      span.className = "ch is-pending";
      span.textContent = c;
      src.appendChild(span);
      chars.push(span);
    });
    // The h1 keeps the full name in aria-label; the letter spans are visual only
    src.setAttribute("aria-hidden", "true");
    src.classList.add("is-ready");
    title.classList.add("is-typing");

    var i = 0;
    var step = function () {
      if (i > 0) chars[i - 1].classList.remove("is-cursor");
      chars[i].classList.remove("is-pending");
      chars[i].classList.add("is-cursor");
      i += 1;
      if (i < chars.length) {
        setTimeout(step, 70);
      } else {
        title.classList.remove("is-typing");
        // Let the caret blink briefly, then fade it out
        setTimeout(function () { title.classList.add("is-typed"); }, 1800);
        setTimeout(function () { chars[i - 1].classList.remove("is-cursor"); }, 2200);
      }
    };
    setTimeout(step, 300);
  }

  /* ---------- Hero: rotating target role ---------- */
  var roles = document.querySelectorAll(".role-rotator > span");
  if (roles.length > 1 && motionOK) {
    var current = 0;
    setInterval(function () {
      if (document.hidden) return;
      var leaving = roles[current];
      leaving.classList.remove("is-active");
      leaving.classList.add("is-leaving");
      setTimeout(function () { leaving.classList.remove("is-leaving"); }, 450);
      current = (current + 1) % roles.length;
      roles[current].classList.add("is-active");
    }, 2800);
  }

  /* ---------- Header border once the page scrolls ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("site-menu");
  if (toggle && menu) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ---------- Sliding indicator under the active menu item ---------- */
  var indicator = null;
  if (menu) {
    indicator = document.createElement("span");
    indicator.className = "nav-indicator";
    indicator.setAttribute("aria-hidden", "true");
    menu.appendChild(indicator);
  }

  function placeIndicator() {
    if (!indicator) return;
    var target = menu.querySelector("a.is-active") || menu.querySelector('a[aria-current="page"]');
    if (!target) {
      indicator.classList.remove("is-visible");
      return;
    }
    var navBox = menu.getBoundingClientRect();
    var box = target.getBoundingClientRect();
    var inset = 12; // match the link's horizontal padding
    indicator.style.width = Math.max(box.width - inset * 2, 0) + "px";
    indicator.style.transform = "translateX(" + (box.left - navBox.left + inset) + "px)";
    indicator.classList.add("is-visible");
  }

  window.addEventListener("resize", placeIndicator);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeIndicator);
  placeIndicator();

  var canObserve = "IntersectionObserver" in window;

  /* ---------- Scroll reveal for content below the fold ---------- */
  if (!canObserve) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("is-visible");
        revealer.unobserve(el);
        // Drop the stagger delay so later hover transitions respond immediately
        setTimeout(function () { el.style.removeProperty("--delay"); }, 900);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    revealEls.forEach(function (el) {
      if (el.classList.contains("is-visible")) return;
      var group = el.parentElement ? el.parentElement.querySelectorAll(":scope > [data-reveal]") : [];
      var index = Array.prototype.indexOf.call(group, el);
      if (index > 0) el.style.setProperty("--delay", Math.min(index, 4) * 80 + "ms");
      revealer.observe(el);
    });
  }

  /* ---------- Active section highlighting (homepage only) ---------- */
  var sectionIds = [];
  var linksById = {};
  document.querySelectorAll(".section-nav a, .site-nav a").forEach(function (a) {
    var href = a.getAttribute("href");
    var hash = href.indexOf("#") > -1 ? href.slice(href.indexOf("#") + 1) : "";
    var path = href.split("#")[0];
    // Only same-page anchors count: "#id" or "index.html#id" while on the homepage
    if (!hash || !document.getElementById(hash)) return;
    if (path && !/index\.html$/.test(path)) return;
    if (!linksById[hash]) { linksById[hash] = []; sectionIds.push(hash); }
    linksById[hash].push(a);
  });

  function setActive(id) {
    Object.keys(linksById).forEach(function (key) {
      linksById[key].forEach(function (a) { a.classList.toggle("is-active", key === id); });
    });
    placeIndicator();
  }

  if (canObserve && sectionIds.length) {
    // The last section can be too short to reach the trigger line, so it wins at the page end
    var lastId = sectionIds.reduce(function (a, b) {
      return document.getElementById(b).offsetTop > document.getElementById(a).offsetTop ? b : a;
    });
    var atBottom = function () {
      return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    };

    var spy = new IntersectionObserver(function (entries) {
      if (atBottom()) { setActive(lastId); return; }
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: "-35% 0px -55% 0px" });
    sectionIds.forEach(function (id) { spy.observe(document.getElementById(id)); });

    window.addEventListener("scroll", function () {
      if (atBottom()) setActive(lastId);
    }, { passive: true });
  }
})();
