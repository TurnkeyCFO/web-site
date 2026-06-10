/* The Harbour Company — shared motion + interaction */
(function(){
  const nav = document.querySelector('.nav');
  const onScroll = () => { if(!nav) return; nav.classList.toggle('scrolled', window.scrollY > 40); };
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  const burger = document.querySelector('.nav-burger');
  const mmenu = document.querySelector('.mmenu');
  if(burger && mmenu){
    burger.addEventListener('click', ()=> mmenu.classList.toggle('open'));
    mmenu.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> mmenu.classList.remove('open')));
  }

  document.querySelectorAll('.hero-media img').forEach(img=>{
    const show=()=>img.classList.add('loaded');
    if(img.complete) show(); else { img.addEventListener('load',show); img.addEventListener('error',show); }
  });

  document.querySelectorAll('img[data-fallback]').forEach(img=>{
    img.addEventListener('error',()=>{ img.style.opacity='0'; const p=img.closest('.gal-item,.frame'); if(p) p.style.background='linear-gradient(135deg,#2a1418,#1c0c10)'; });
  });

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

  if(window.gsap && window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('[data-reveal]').forEach(el=>{
      gsap.fromTo(el,{opacity:0,y:36},{opacity:1,y:0,duration:1.05,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 90%'}});
    });
    gsap.utils.toArray('[data-reveal-image]').forEach(el=>{
      ScrollTrigger.create({trigger:el,start:'top 85%',onEnter:()=>el.classList.add('in')});
    });
    gsap.utils.toArray('[data-parallax]').forEach(el=>{
      const s=parseFloat(el.dataset.parallax)||0.12;
      gsap.to(el,{y:()=>s*220,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:0.6}});
    });
    gsap.utils.toArray('[data-count]').forEach(el=>{
      const target=parseFloat(el.dataset.count), suffix=el.dataset.suffix||'';
      ScrollTrigger.create({trigger:el,start:'top 90%',once:true,onEnter:()=>{
        gsap.to({v:0},{v:target,duration:1.6,ease:'power2.out',onUpdate:function(){ el.textContent = Math.round(this.targets()[0].v)+suffix; }});
      }});
    });
    document.querySelectorAll('[data-split]').forEach(el=>{ el.innerHTML='<span>'+el.innerHTML+'</span>'; });
  }

  setTimeout(()=>{
    document.querySelectorAll('[data-reveal]').forEach(el=>{
      if(getComputedStyle(el).opacity==='0'){ el.style.opacity='1'; el.style.transform='none'; }
    });
    document.querySelectorAll('[data-reveal-image]').forEach(el=> el.classList.add('in'));
    document.querySelectorAll('[data-count]').forEach(el=>{ if(el.textContent.trim()==='0'||el.textContent.trim()===''){ el.textContent=el.dataset.count+(el.dataset.suffix||''); }});
    document.querySelectorAll('.hero-media img').forEach(img=> img.classList.add('loaded'));
  },6000);
})();

/* ===== DEMO Acuity-style scheduler (front-end only, no backend) ===== */
(function(){
  const SERVICES=[
    {nm:'Complimentary Discovery Call',ds:'A relaxed conversation about your home and goals.',dur:'30 min'},
    {nm:'In-Home Design Consultation',ds:'Walk the space together and explore the vision.',dur:'60 min'},
    {nm:'Restoration Assessment',ds:'Damage walkthrough and a clear next-steps plan.',dur:'45 min'},
    {nm:'Concierge Membership Intro',ds:'Find the care tier that fits your home.',dur:'30 min'}
  ];
  const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DOW=['Su','Mo','Tu','We','Th','Fr','Sa'];
  const TIMES=['9:00 AM','10:00 AM','11:30 AM','1:00 PM','2:30 PM','4:00 PM'];
  const TODAY=new Date(2026,5,15);
  const state={svc:null,date:null,time:null,view:new Date(2026,5,1)};
  const ESC=document.createElement('textarea');
  const fmtDate=d=>d?d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}):'';

  function widget(inline){
    const root=document.createElement('div');
    root.className=inline?'acuity-inline':'acuity-modal';
    root.innerHTML=[
      '<div class="acuity-head"><span class="brand">HARBOUR<span class="dot"></span></span>',
      inline?'<span class="acuity-powered">Scheduling by Acuity</span>':'<button class="acuity-x" aria-label="Close">&#10005;</button>','</div>',
      '<div class="acuity-body">',
        '<div class="ac-step show" data-step="0"><div class="ac-h">Select an appointment type</div><div class="ac-svc"></div><div class="acuity-powered" style="margin-top:1.4rem">Powered by Acuity Scheduling &middot; demo</div></div>',
        '<div class="ac-step" data-step="1"><div class="ac-h">Choose a date &amp; time</div><div class="ac-grid"><div class="ac-cal"><div class="ac-cal-head"><button class="ac-nav ac-prev">&#8249;</button><b class="ac-month"></b><button class="ac-nav ac-next">&#8250;</button></div><div class="ac-dow">'+DOW.map(d=>'<span>'+d+'</span>').join('')+'</div><div class="ac-days"></div></div><div><div class="acuity-powered" style="margin-bottom:.7rem">Available times</div><div class="ac-times"><div class="ac-times-empty">Select a date to see times.</div></div></div></div><div class="ac-foot"><button class="ac-back" data-to="0">&#8249; Back</button></div></div>',
        '<div class="ac-step" data-step="2"><div class="ac-h">Your details</div><div class="ac-summary"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:0 0 1rem"><input class="field" placeholder="First name"><input class="field" placeholder="Last name"></div><input class="field" placeholder="Email" type="email" style="margin-bottom:1rem"><input class="field" placeholder="Phone" type="tel" style="margin-bottom:1.2rem"><div class="ac-foot"><button class="ac-back" data-to="1">&#8249; Back</button><button class="btn btn-primary ac-confirm-btn" type="button">Confirm booking</button></div></div>',
        '<div class="ac-step" data-step="3"><div class="ac-confirm"><div class="ac-check"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6L9 17l-5-5"/></svg></div><div class="ac-h" style="margin-bottom:.4rem">You are booked.</div><p style="color:#52606a;max-width:380px;margin:0 auto 1.2rem">A confirmation and calendar invite are on their way. We cannot wait to see your home.</p><div class="ac-summary" style="text-align:left;max-width:380px;margin:0 auto"></div><p class="acuity-powered" style="margin-top:1.4rem">Demo only &middot; no appointment was actually scheduled</p></div></div>',
      '</div>'
    ].join('');

    const steps=root.querySelectorAll('.ac-step');
    const body=root.querySelector('.acuity-body');
    const go=n=>{steps.forEach(s=>s.classList.toggle('show',+s.dataset.step===n)); body.scrollTop=0;};
    const svcWrap=root.querySelector('.ac-svc');
    SERVICES.forEach(s=>{const b=document.createElement('button');
      b.innerHTML='<span><span class="nm">'+s.nm+'</span><span class="ds">'+s.ds+'</span></span><span class="dur">'+s.dur+'</span>';
      b.onclick=()=>{state.svc=s; renderCal(); go(1);}; svcWrap.appendChild(b);});

    const monthEl=root.querySelector('.ac-month'), daysEl=root.querySelector('.ac-days'), timesEl=root.querySelector('.ac-times');
    function renderCal(){
      const v=state.view,y=v.getFullYear(),m=v.getMonth();
      monthEl.textContent=MONTHS[m]+' '+y;
      const first=new Date(y,m,1).getDay(), dim=new Date(y,m+1,0).getDate();
      let html='';
      for(let i=0;i<first;i++) html+='<button class="ac-day empty"></button>';
      const floor=new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate());
      for(let d=1;d<=dim;d++){
        const dt=new Date(y,m,d), dis=dt<floor||dt.getDay()===0;
        const sel=state.date&&state.date.toDateString()===dt.toDateString();
        html+='<button class="ac-day'+(sel?' sel':'')+'" data-d="'+d+'"'+(dis?' disabled':'')+'>'+d+'</button>';
      }
      daysEl.innerHTML=html;
      daysEl.querySelectorAll('.ac-day:not(:disabled):not(.empty)').forEach(b=>{
        b.onclick=()=>{state.date=new Date(y,m,+b.dataset.d); state.time=null; renderCal(); renderTimes();};
      });
    }
    function renderTimes(){
      if(!state.date){timesEl.innerHTML='<div class="ac-times-empty">Select a date to see times.</div>';return;}
      timesEl.innerHTML=TIMES.map(t=>'<button class="ac-time'+(state.time===t?' sel':'')+'">'+t+'</button>').join('');
      timesEl.querySelectorAll('.ac-time').forEach(b=>b.onclick=()=>{state.time=b.textContent; renderTimes(); summary(); go(2);});
    }
    root.querySelector('.ac-prev').onclick=()=>{const v=state.view; if(v.getFullYear()===TODAY.getFullYear()&&v.getMonth()<=TODAY.getMonth())return; state.view=new Date(v.getFullYear(),v.getMonth()-1,1); renderCal();};
    root.querySelector('.ac-next').onclick=()=>{const v=state.view; state.view=new Date(v.getFullYear(),v.getMonth()+1,1); renderCal();};
    function summary(){
      const rows='<div><span>Appointment</span><span>'+(state.svc?state.svc.nm:'')+'</span></div>'+
        '<div><span>Date</span><span>'+fmtDate(state.date)+'</span></div>'+
        '<div><span>Time</span><span>'+(state.time||'')+'</span></div>'+
        '<div><span>Duration</span><span>'+(state.svc?state.svc.dur:'')+'</span></div>';
      root.querySelectorAll('.ac-summary').forEach(el=>el.innerHTML=rows);
    }
    root.querySelectorAll('.ac-back').forEach(b=>b.onclick=()=>go(+b.dataset.to));
    root.querySelector('.ac-confirm-btn').onclick=()=>{summary(); go(3);};
    if(!inline){ root.querySelector('.acuity-x').onclick=closeModal; }
    renderCal();
    return root;
  }

  let overlay;
  function closeModal(){ if(overlay) overlay.classList.remove('open'); document.body.style.overflow=''; }
  function openModal(){
    if(!overlay){
      overlay=document.createElement('div'); overlay.className='acuity-overlay';
      overlay.appendChild(widget(false));
      overlay.addEventListener('click',e=>{ if(e.target===overlay) closeModal(); });
      document.body.appendChild(overlay);
    }
    overlay.classList.add('open'); document.body.style.overflow='hidden';
  }
  // auto-promote booking CTAs to open the scheduler
  document.querySelectorAll('a.btn-primary, a.nav-cta, .mbar a').forEach(a=>{
    const txt=(a.textContent||'').toLowerCase(), href=a.getAttribute('href')||'';
    if(/consult|book|start a project/.test(txt) || /consultations\.html$/.test(href)) a.setAttribute('data-book','');
  });
  document.addEventListener('click',e=>{
    const t=e.target.closest('[data-book]');
    if(t){ e.preventDefault(); openModal(); }
  });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });
  const slot=document.getElementById('acuity-inline');
  if(slot) slot.appendChild(widget(true));
})();

/* ===== Video preloader (home only) — painpoint -> Harbour solution ===== */
(function(){
  const pl=document.getElementById('preloader');
  if(!pl) return;
  const phases=pl.querySelectorAll('.pl-phase');
  const vid=document.getElementById('pl-video');
  const bar=document.getElementById('pl-bar');
  const skip=document.getElementById('pl-skip');
  const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  let dismissed=false;

  function dismiss(){
    if(dismissed) return; dismissed=true;
    pl.classList.add('done');
    document.body.style.overflow='';
    try{sessionStorage.setItem('harbourIntroSeen','1');}catch(e){}
    setTimeout(()=>pl.remove(),1000);
  }

  // already seen this session, or reduced motion -> skip entirely
  let seen=false; try{seen=sessionStorage.getItem('harbourIntroSeen')==='1';}catch(e){}
  if(seen || reduce){ pl.remove(); return; }

  document.body.style.overflow='hidden';
  const show=i=>phases.forEach((p,n)=>p.classList.toggle('show',n===i));

  // phase timing (video is ~7s): Q first, solution second
  show(0);
  const t1=setTimeout(()=>show(1),3500);

  // progress bar tied to playback (fallback to timer)
  let dur=7;
  if(vid){
    vid.addEventListener('loadedmetadata',()=>{ if(vid.duration && isFinite(vid.duration)) dur=vid.duration; });
    vid.addEventListener('timeupdate',()=>{ if(vid.duration) bar.style.width=Math.min(100,(vid.currentTime/vid.duration)*100)+'%'; });
    vid.addEventListener('ended',dismiss);
    // some browsers block autoplay; play attempt + fallback
    const pr=vid.play&&vid.play(); if(pr&&pr.catch) pr.catch(()=>{});
  }
  // hard fallback: dismiss after duration + buffer even if 'ended' never fires
  const t2=setTimeout(dismiss,7600);
  // animate bar by timer as backstop
  let s=0; const ti=setInterval(()=>{ s+=0.1; if(bar && (!vid||!vid.duration)) bar.style.width=Math.min(100,(s/dur)*100)+'%'; if(s>=dur+0.6){clearInterval(ti);} },100);

  skip&&skip.addEventListener('click',()=>{clearTimeout(t1);clearTimeout(t2);dismiss();});
})();
