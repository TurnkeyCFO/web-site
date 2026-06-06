/* Doc's Slushies — shared site JS */
(function(){
  // year
  var y=document.getElementById('yr'); if(y) y.textContent=new Date().getFullYear();

  // nav shrink
  var nav=document.querySelector('.nav');
  if(nav){ addEventListener('scroll',function(){ nav.classList.toggle('scrolled', scrollY>24); }); }

  // mobile menu
  var burger=document.querySelector('.burger'), mmenu=document.querySelector('.mmenu'),
      mclose=document.querySelector('.mmenu-close');
  function closeM(){ if(mmenu) mmenu.classList.remove('open'); document.body.style.overflow=''; }
  if(burger&&mmenu){
    burger.addEventListener('click',function(){ mmenu.classList.add('open'); document.body.style.overflow='hidden'; });
    if(mclose) mclose.addEventListener('click',closeM);
    mmenu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click',closeM); });
  }

  // reveal on scroll
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  },{threshold:.12, rootMargin:'0px 0px -7% 0px'});
  document.querySelectorAll('[data-rev],.clip').forEach(function(el){ io.observe(el); });
  // 6s safety net (crawler/screenshot)
  setTimeout(function(){ document.querySelectorAll('[data-rev],.clip').forEach(function(el){ el.classList.add('in'); }); },6000);

  // lightbox (Pictures)
  var lb=document.querySelector('.lb');
  if(lb){
    var lbImg=lb.querySelector('img'), x=lb.querySelector('.x');
    document.querySelectorAll('.gal a').forEach(function(a){
      a.addEventListener('click',function(ev){ ev.preventDefault(); lbImg.src=a.getAttribute('href'); lb.classList.add('open'); document.body.style.overflow='hidden'; });
    });
    function closeLb(){ lb.classList.remove('open'); document.body.style.overflow=''; }
    if(x) x.addEventListener('click',closeLb);
    lb.addEventListener('click',function(e){ if(e.target===lb) closeLb(); });
    addEventListener('keydown',function(e){ if(e.key==='Escape') closeLb(); });
  }

  // HOME preloader (only present on home)
  var pre=document.getElementById('pre');
  if(pre){
    var pct=document.getElementById('pct'), ring=document.getElementById('ring'), vid=document.getElementById('vid');
    var CIRC=364,p=0,done=false;
    function setP(v){ p=v; if(pct) pct.textContent=(v<10?'0':'')+v; if(ring) ring.style.strokeDashoffset=CIRC*(1-v/100); }
    var t=setInterval(function(){ if(p<90) setP(p+Math.max(1,Math.round((92-p)/9))); },70);
    function finish(){ if(done) return; done=true; clearInterval(t);
      var f=setInterval(function(){ if(p>=100){clearInterval(f); enter();} else setP(p+2); },22); }
    function enter(){ document.body.classList.add('ready');
      setTimeout(function(){ pre.classList.add('gone'); document.body.classList.add('entered'); },650);
      if(vid){ try{ vid.play(); }catch(e){} } }
    var ready=false; function vr(){ if(ready) return; ready=true; setTimeout(finish,350); }
    if(vid){ if(vid.readyState>=3) vr(); vid.addEventListener('canplay',vr,{once:true}); vid.addEventListener('loadeddata',vr,{once:true});
      vid.addEventListener('timeupdate',function(){ if(vid.currentTime>=6.98) vid.currentTime=0; }); }
    setTimeout(vr,2600);
    setTimeout(function(){ if(!document.body.classList.contains('ready')) enter(); },5200);
  }
})();
