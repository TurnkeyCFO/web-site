/* Texas Sky Florals — interactions */
(function(){
  "use strict";
  var d = document;

  // year
  var y = d.getElementById('y'); if(y) y.textContent = new Date().getFullYear();

  // mobile menu
  var burger = d.getElementById('burger'), mnav = d.getElementById('mnav');
  if(burger && mnav){
    function close(){ mnav.classList.remove('open'); d.body.classList.remove('menu-open');
      burger.classList.remove('x'); burger.setAttribute('aria-expanded','false'); mnav.setAttribute('aria-hidden','true'); }
    burger.addEventListener('click', function(){
      var open = mnav.classList.toggle('open');
      d.body.classList.toggle('menu-open', open);
      burger.classList.toggle('x', open);
      burger.setAttribute('aria-expanded', open?'true':'false');
      mnav.setAttribute('aria-hidden', open?'false':'true');
    });
    mnav.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', close); });
  }

  // nav shrink on scroll
  var navEl = d.querySelector('nav');
  function onScroll(){
    if(navEl) navEl.classList.toggle('shrink', window.scrollY > 40);
    // hero parallax
    if(heroBg){ var off = window.scrollY * 0.35; heroBg.style.transform = 'translateY('+off+'px) scale(1.06)'; }
  }
  var heroBg = d.querySelector('.phero .bg'); // parallax only on inner page heroes (home uses kenburns)
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  // scroll reveal w/ stagger
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        var t = e.target;
        var sibs = Array.prototype.slice.call(t.parentNode.children).filter(function(n){
          return n.classList && (n.classList.contains('rv')||n.classList.contains('rv-l')||n.classList.contains('rv-r')||n.classList.contains('rv-s'));
        });
        var i = sibs.indexOf(t);
        t.style.transitionDelay = Math.min(i,7)*0.08 + 's';
        t.classList.add('in');
        if(t.classList.contains('tstep')) t.classList.add('in');
        io.unobserve(t);
      }
    });
  }, {threshold:0.12, rootMargin:'0px 0px -8% 0px'});
  d.querySelectorAll('.rv,.rv-l,.rv-r,.rv-s,.tstep').forEach(function(el){ io.observe(el); });

  // journey progress bar
  var bar = d.querySelector('.timeline .bar');
  if(bar){
    var tio = new IntersectionObserver(function(en){
      en.forEach(function(e){ if(e.isIntersecting){ bar.style.width = '84%'; tio.unobserve(e.target);} });
    }, {threshold:0.4});
    tio.observe(bar.parentNode);
  }

  // hero text load
  window.addEventListener('load', function(){
    d.querySelectorAll('.hero .rv, .phero .rv').forEach(function(el,i){
      el.style.transitionDelay = (0.12 + i*0.13)+'s'; el.classList.add('in');
    });
  });
  // fallback if load already fired
  setTimeout(function(){ d.querySelectorAll('.hero .rv, .phero .rv').forEach(function(el){ el.classList.add('in'); }); }, 900);

  // lightbox for any [data-lb] image
  var imgs = Array.prototype.slice.call(d.querySelectorAll('[data-lb] img'));
  if(imgs.length){
    var lb = d.createElement('div'); lb.className='lb';
    lb.innerHTML = '<button class="x" aria-label="Close">&times;</button>'+
      '<button class="nav prev" aria-label="Previous">&#8249;</button>'+
      '<img alt="">'+
      '<button class="nav next" aria-label="Next">&#8250;</button>';
    d.body.appendChild(lb);
    var lbImg = lb.querySelector('img'), cur=0;
    function show(i){ cur=(i+imgs.length)%imgs.length; lbImg.src=imgs[cur].src; lbImg.alt=imgs[cur].alt; }
    function open(i){ show(i); lb.classList.add('open'); d.body.style.overflow='hidden'; }
    function close(){ lb.classList.remove('open'); d.body.style.overflow=''; }
    imgs.forEach(function(im,i){ im.parentNode.addEventListener('click', function(){ open(i); }); });
    lb.querySelector('.x').addEventListener('click', close);
    lb.querySelector('.prev').addEventListener('click', function(e){ e.stopPropagation(); show(cur-1); });
    lb.querySelector('.next').addEventListener('click', function(e){ e.stopPropagation(); show(cur+1); });
    lb.addEventListener('click', function(e){ if(e.target===lb) close(); });
    d.addEventListener('keydown', function(e){ if(!lb.classList.contains('open'))return;
      if(e.key==='Escape')close(); if(e.key==='ArrowLeft')show(cur-1); if(e.key==='ArrowRight')show(cur+1); });
  }

  // contact form -> mailto
  var form = d.getElementById('inq');
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var g=function(n){ var el=form.elements[n]; return el?encodeURIComponent(el.value||''):''; };
      var body = "Name: "+g('name')+"%0D%0A"+
                 "Event date: "+g('date')+"%0D%0A"+
                 "Venue / location: "+g('venue')+"%0D%0A"+
                 "Guest count: "+g('guests')+"%0D%0A"+
                 "Service: "+g('service')+"%0D%0A%0D%0A"+
                 "About us / inspiration:%0D%0A"+g('msg');
      window.location.href = "mailto:flowerstreetandco@gmail.com?subject="+
        encodeURIComponent("Texas Sky Florals Inquiry — "+(form.elements['name'].value||''))+"&body="+body;
    });
  }
})();
