/* Studio Meridian demo — Osmo 3D Cube Page Transition wired into a 2-page Barba site.
   The transition functions (prepareForTransition / runPageLeaveAnimation / etc.) are the
   Osmo Vault component verbatim; the Lenis + Barba glue around them is authored to run it. */

gsap.registerPlugin(CustomEase);

/* ---------- smooth scroll (Lenis fed into GSAP's ticker) ---------- */
let lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- per-page setup (called on first load + after each transition) ---------- */
function initReveals(scope) {
  const els = (scope || document).querySelectorAll("[data-reveal]");
  gsap.fromTo(els,
    { y: 42, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out", stagger: 0.07, overwrite: true });
}

function resetPage(next) {
  window.scrollTo(0, 0);
  try { lenis.scrollTo(0, { immediate: true }); } catch (e) {}
  initReveals(next);
}

/* =====================================================================
   OSMO "3D Cube Page Transition" — component code (verbatim)
   ===================================================================== */
const flipCubeDirection = false; // Set to true to flip direction
const cubeX = flipCubeDirection ? 1 : -1;

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();
  tl.call(() => { resetPage(next); }, null, 0);
  return tl;
}

function runPageLeaveAnimation(current, next) {
  const parent = current.parentElement || document.body;
  const { cube } = prepareForTransition(parent, current, next);
  const navigation = next.querySelector(".demo-nav");

  const tl = gsap.timeline({
    onComplete: () => {
      parent.insertBefore(next, cube);
      cube.remove();
      gsap.set(parent, { clearProps: "perspective,transformStyle,overflow,perspectiveOrigin" });
      gsap.set(next, { clearProps: "all" });
    }
  });

  if (reducedMotion) {
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.to(cube, { z: "-80vh", duration: 0.8, ease: "power2.inOut" }, "<");
  tl.to(cube, { rotateX: 90 * cubeX, duration: 1.2 }, "< 0.1");
  tl.to(cube, { z: "-50vh", duration: 1.2, overwrite: "auto" }, "< 0.7");

  if (navigation) {
    tl.from(navigation, { yPercent: -100, duration: 1.2 }, "<");
  }

  return tl;
}

function runPageEnterAnimation(next) {
  const tl = gsap.timeline();

  if (reducedMotion) {
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise(resolve => { tl.call(resolve, null, "pageReady"); });
}

function prepareForTransition(parent, current, next) {
  const cube = document.createElement("div");
  const wrapper = document.createElement("div");
  const navigation = current.querySelector(".demo-nav");

  cube.className = "page-transition__cube";
  wrapper.className = "page-transition__wrapper";

  parent.insertBefore(cube, current);

  cube.appendChild(wrapper);
  wrapper.appendChild(current);
  cube.appendChild(next);

  const scrollY = window.scrollY || 0;
  window.scrollTo(0, 0);

  gsap.set(parent, {
    perspective: "100vw",
    perspectiveOrigin: "50% 50vh",
    transformStyle: "preserve-3d",
    overflow: "clip",
  });

  gsap.set(cube, {
    position: "fixed", inset: 0, width: "100%", height: "100vh",
    transformStyle: "preserve-3d", transformOrigin: "50% 50%",
    willChange: "transform", z: "-50vh",
  });

  gsap.set(wrapper, {
    position: "absolute", inset: 0, width: "100%", height: "100vh", overflow: "clip",
    transform: "rotateX(0deg) translate3d(0, 0, 50vh)", willChange: "transform",
  });

  gsap.set(current, {
    position: "absolute", top: -scrollY, left: 0, width: "100%",
    willChange: "transform", backfaceVisibility: "hidden",
  });

  gsap.set(next, {
    position: "absolute", inset: 0, width: "100%", height: "100vh", overflow: "clip",
    backfaceVisibility: "hidden", willChange: "transform", autoAlpha: 1,
    transformOrigin: "50% 50%",
    transform: `rotateX(${-90 * cubeX}deg) translate3d(0, 0, calc(50vh + 0.5px))`
  });

  if (navigation) {
    gsap.set(navigation, { y: scrollY });
  }

  return { cube, wrapper, scrollY };
}

/* =====================================================================
   Barba init — sync mode so both containers exist while the cube spins
   ===================================================================== */
barba.init({
  transitions: [{
    name: "cube",
    sync: true,   // MUST be per-transition (not on barba.init) — keeps both containers in the DOM
    once({ next }) { return runPageOnceAnimation(next.container); },
    leave({ current, next }) { return runPageLeaveAnimation(current.container, next.container); },
    enter({ next }) { return runPageEnterAnimation(next.container); },
  }],
});
