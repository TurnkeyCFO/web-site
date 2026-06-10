/* The Harbour Company — shared motion + interaction */
(function(){
  // ---- nav scroll state ----
  const nav = document.querySelector('.nav');
  const onScroll = () => { if(!nav) return; nav.classList.toggle('scrolled', window.scrollY > 40); };
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  // ---- mobile menu ----
  const burger = document.querySelector('.nav-burger');
  const mmenu = document.querySelector('.mmenu');
  if(burger && mmenu){
    burger.addEventListener('click', ()=> mmenu.classList.toggle('open'));
    mmenu.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> mmenu.classList.remove('open')));
  }

  // ---- hero image fade-in ----
  document.querySelectorAll('.hero-media img').forEach(img=>{
    const show=()=>img.classList.add('loaded');
    if(img.complete) show(); else { img.addEventListener('load',show); img.addEventListener('error',show); }
  });

  // ---- graceful image fallback (broken stock -> elegant block) ----
  document.querySelectorAll('img[data-fallback]').forEach(img=>{
    img.addEventListener('error',()=>{ img.style.opacity='0'; const p=img.closest('.gal-item,.frame'); if(p) p.style.background='linear-gradient(135deg,#1c3340,#13242f)'; });
  });

  // ---- Lenis smooth scroll ----
  let lenis;
  if(window.Lenis){
    lenis = new Lenis({duration:1.15, easing:(t)=>Math.min(1,1.001-Math.pow(2,-10*t))});
    function raf(t){ lenis.raf(t); requestAnimationFrame(raf); } requestAnimationFrame(raf);
    if(window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
  }
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', e=>{
      const id=a.getAttribute('href'); if(id.length<2) return;
      const t=document.querySelector(id); if(!t) return; e.preventDefault();
      if(lenis) lenis.scrollTo(t,{offset:-70}); else t.scrollIntoView({behavior:'smooth'});
    });
  });

  // ---- GSAP reveals ----
  if(window.gsap && window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('[data-reveal]').forEach(el=>{
      gsap.fromTo(el,{opacity:0,y:36},{opacity:1,y:0,duration:1.05,ease:'power3.out',
        scrollTrigger:{trigger:el,start:'top 90%'}});
    });

    gsap.utils.toArray('[data-reveal-image]').forEach(el=>{
      ScrollTrigger.create({trigger:el,start:'top 85%',onEnter:()=>el.classList.add('in')});
    });

    // parallax (non-hero)
    gsap.utils.toArray('[data-parallax]').forEach(el=>{
      const s=parseFloat(el.dataset.parallax)||0.12;
      gsap.to(el,{y:()=>s*220,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:0.6}});
    });

    // count-up
    gsap.utils.toArray('[data-count]').forEach(el=>{
      const target=parseFloat(el.dataset.count), suffix=el.dataset.suffix||'';
      ScrollTrigger.create({trigger:el,start:'top 90%',once:true,onEnter:()=>{
        gsap.to({v:0},{v:target,duration:1.6,ease:'power2.out',
          onUpdate:function(){ el.textContent = Math.round(this.targets()[0].v)+suffix; }});
      }});
    });

    // split-line headlines (preserve em)
    document.querySelectorAll('[data-split]').forEach(el=>{ el.innerHTML='<span>'+el.innerHTML+'</span>'; });
  }

  // ---- screenshot / crawler safety net (6s) ----
  setTimeout(()=>{
    document.querySelectorAll('[data-reveal]').forEach(el=>{
      if(getComputedStyle(el).opacity==='0'){ el.style.opacity='1'; el.style.transform='none'; }
    });
    document.querySelectorAll('[data-reveal-image]').forEach(el=> el.classList.add('in'));
    document.querySelectorAll('[data-count]').forEach(el=>{ if(el.textContent.trim()==='0'||el.textContent.trim()===''){ el.textContent=el.dataset.count+(el.dataset.suffix||''); }});
    document.querySelectorAll('.hero-media img').forEach(img=> img.classList.add('loaded'));
  },6000);
})();
