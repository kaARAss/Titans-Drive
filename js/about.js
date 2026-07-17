/* Титаны-Драйва — About interactions (GSAP + ScrollTrigger + Lenis) */
(function(){
  'use strict';
  var doc=document;

  var hasGSAP=!!(window.gsap && window.ScrollTrigger);
  if(hasGSAP){ doc.documentElement.classList.add('gsap'); gsap.registerPlugin(ScrollTrigger); }

  // split intro lead into words
  doc.querySelectorAll('[data-splitwords]').forEach(function(el){
    var words=el.textContent.trim().split(/\s+/);
    el.innerHTML=words.map(function(w){return '<span class="w">'+w+'</span>';}).join(' ');
  });

  // split display headings into characters (preserve <br>/<em>)
  function splitChars(el){
    (function walk(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(k){
        if(k.nodeType===3){
          var frag=doc.createDocumentFragment();
          // Split into words + whitespace. Each word is wrapped in a .wrd span so
          // it can NEVER break mid-word (no lone "\u044c" on the next line); only
          // the spaces between words are allowed to wrap.
          k.textContent.split(/(\s+)/).forEach(function(part){
            if(part==='') return;
            if(/^\s+$/.test(part)){ frag.appendChild(doc.createTextNode(part)); return; }
            var wrd=doc.createElement('span'); wrd.className='wrd';
            part.split('').forEach(function(ch){
              var s=doc.createElement('span'); s.className='ch'; s.textContent=ch; wrd.appendChild(s);
            });
            frag.appendChild(wrd);
          });
          node.replaceChild(frag,k);
        } else if(k.nodeType===1 && k.tagName!=='BR'){ walk(k); }
      });
    })(el);
  }
  doc.querySelectorAll('[data-splitchars]').forEach(splitChars);

  // smooth scroll (Lenis)
  var lenis=null;
  if(window.Lenis){
    lenis=new Lenis({lerp:0.1, smoothWheel:true});
    if(hasGSAP){ lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(function(t){ lenis.raf(t*1000); }); gsap.ticker.lagSmoothing(0); }
    else { var raf=function(t){ lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }

  // progress bar + solid nav
  var nav=doc.getElementById('nav'), prog=doc.getElementById('aprog');
  function onScrollBasic(){
    var y=window.pageYOffset||doc.documentElement.scrollTop||0;
    var h=doc.documentElement.scrollHeight-window.innerHeight;
    if(prog) prog.style.width=(h>0?(y/h)*100:0)+'%';
    if(nav) nav.classList.toggle('solid', y>60);
  }
  window.addEventListener('scroll', onScrollBasic, {passive:true});
  if(lenis) lenis.on('scroll', onScrollBasic);
  onScrollBasic();

  // preloader counter
  var pre=doc.getElementById('pre'), preNum=doc.getElementById('preNum');
  var n=0, started=false;
  var pt=setInterval(function(){
    n+=Math.floor(Math.random()*8)+4; if(n>=100){ n=100; clearInterval(pt); }
    if(preNum) preNum.textContent=n;
    if(n>=100){ setTimeout(function(){ if(pre){ pre.classList.add('done'); setTimeout(function(){ pre.style.display='none'; }, 650);} kickoff(); }, 250); }
  }, 85);

  function kickoff(){
    if(started) return; started=true;
    if(!hasGSAP){ return; }

    // hero accordion: unfolds from center on load, folds toward center with scroll velocity
    gsap.to('.hero__eyebrow',{y:0,opacity:1,duration:.8,ease:'power3.out',delay:.45});
    gsap.to('.hero__sub',{y:0,opacity:1,duration:.85,ease:'power3.out',delay:.68});
    var foldPanels=gsap.utils.toArray('.fold__panel');
    var N=foldPanels.length, mid=(N-1)/2;
    var BASE=30, MAXA=78;
    var heroEl=doc.getElementById('hero'), heroH=heroEl?heroEl.offsetHeight:window.innerHeight;
    window.addEventListener('resize',function(){ heroH=heroEl?heroEl.offsetHeight:window.innerHeight; });
    var curY=window.pageYOffset||0;
    if(lenis){ lenis.on('scroll',function(e){ curY=(e&&typeof e.scroll==='number')?e.scroll:(window.pageYOffset||0); }); }
    window.addEventListener('scroll',function(){ curY=window.pageYOffset||0; },{passive:true});
    var foldSt={entry:1}; gsap.to(foldSt,{entry:0,duration:1.9,ease:'expo.out',delay:.15});
    var spEased=0;
    // u:0 = open accordion at top (base folds visible, seams closed) .. 1 = fully converged to centre. Scroll down -> converge, scroll up -> expand (tied to scroll position).
    (function foldLoop(){ var targetP=Math.max(0,Math.min(curY/(heroH*0.7),1)); spEased+=(targetP-spEased)*0.12; var u=Math.min(foldSt.entry+spEased,1); var a=BASE+u*(MAXA-BASE); for(var i=0;i<N;i++){ var d=mid-i; gsap.set(foldPanels[i],{xPercent:d*100*u, rotationY:(i%2===0?1:-1)*a, z:-Math.abs(d)*80*u, scale:1-0.06*u, transformOrigin:'50% 50%'}); } requestAnimationFrame(foldLoop); })();
    var foldStage=doc.getElementById('foldStage');
    if(foldStage){ window.addEventListener('pointermove',function(e){ var cx=e.clientX/window.innerWidth-0.5, cy=e.clientY/window.innerHeight-0.5; gsap.to(foldStage,{rotationY:cx*8,rotationX:4-cy*5,duration:.9,ease:'power2.out',overwrite:'auto'}); },{passive:true}); }

    gsap.utils.toArray('[data-reveal]').forEach(function(el){
      gsap.to(el,{y:0,opacity:1,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 86%'}});
    });

    gsap.utils.toArray('[data-splitwords]').forEach(function(el){
      gsap.to(el.querySelectorAll('.w'),{opacity:1,stagger:.06,ease:'none',scrollTrigger:{trigger:el,start:'top 82%',end:'bottom 62%',scrub:true}});
    });

    gsap.utils.toArray('.work__media').forEach(function(el){
      gsap.to(el,{clipPath:'inset(0% 0% 0% 0%)',duration:1.1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 84%'}});
    });

    // hero parallax
    gsap.utils.toArray('[data-parallax]').forEach(function(el){
      var k=parseFloat(el.getAttribute('data-parallax'))||0.15;
      gsap.to(el,{yPercent:k*100,ease:'none',scrollTrigger:{trigger:el,start:'top top',end:'bottom top',scrub:true}});
    });
    // inner image parallax
    // NOTE: '.hgal__img' intentionally excluded -- those images live inside the
    // horizontally-pinned gallery, so a vertical scroll-parallax on them fights
    // the pin and makes the strip stutter. They stay static for a smooth glide.
    ['.work__img','.quote__bg','.cta__bg'].forEach(function(sel){
      gsap.utils.toArray(sel).forEach(function(el){
        gsap.fromTo(el,{yPercent:-8},{yPercent:8,ease:'none',scrollTrigger:{trigger:el.parentNode,start:'top bottom',end:'bottom top',scrub:true}});
      });
    });

    // counters
    gsap.utils.toArray('.cnt').forEach(function(el){
      var end=parseFloat(el.getAttribute('data-count'))||0, obj={v:0};
      gsap.to(obj,{v:end,duration:1.6,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 90%'},onUpdate:function(){ el.textContent=Math.round(obj.v); }});
    });

    // horizontal pinned gallery (desktop)
    var track=doc.getElementById('hgalTrack');
    if(track && window.innerWidth>760){
      var getLen=function(){ return Math.max(0, track.scrollWidth - window.innerWidth + 96); };
      gsap.to(track,{x:function(){ return -getLen(); },ease:'none',scrollTrigger:{trigger:'#hgal',start:'top top',end:function(){ return '+='+getLen(); },pin:true,scrub:1,invalidateOnRefresh:true,anticipatePin:1}});
    }

    // char reveal on display headings
    gsap.utils.toArray('[data-splitchars]').forEach(function(el){
      gsap.fromTo(el.querySelectorAll('.ch'),{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:.9,ease:'expo.out',stagger:0.02,scrollTrigger:{trigger:el,start:'top 88%'}});
    });

    // 3D tilt on media under cursor
    function addTilt(sel,max){ gsap.utils.toArray(sel).forEach(function(el){ el.addEventListener('pointermove',function(e){ var r=el.getBoundingClientRect(); var px=(e.clientX-r.left)/r.width-0.5, py=(e.clientY-r.top)/r.height-0.5; gsap.to(el,{rotationY:px*max,rotationX:-py*max,transformPerspective:900,duration:.5,ease:'power2.out',overwrite:'auto'}); }); el.addEventListener('pointerleave',function(){ gsap.to(el,{rotationX:0,rotationY:0,duration:.6,ease:'power3.out'}); }); }); }
    addTilt('.work__media',7); addTilt('.hgal__item',6);

    // magnetic CTA button
    var btn=doc.querySelector('.cta__btn');
    if(btn){ var bs=btn.querySelector('span'); btn.addEventListener('pointermove',function(e){ var r=btn.getBoundingClientRect(); var mx=e.clientX-r.left-r.width/2, my=e.clientY-r.top-r.height/2; gsap.to(btn,{x:mx*0.35,y:my*0.5,scale:1.04,duration:.5,ease:'power3.out',overwrite:'auto'}); if(bs) gsap.to(bs,{x:8+mx*0.12,duration:.5,ease:'power3.out',overwrite:'auto'}); }); btn.addEventListener('pointerleave',function(){ gsap.to(btn,{x:0,y:0,scale:1,duration:.7,ease:'elastic.out(1,0.4)'}); if(bs) gsap.to(bs,{x:0,duration:.4}); }); }

    // ===== Texture-projection hero: photo tiles scatter & reassemble, driven by scroll =====
    (function projHero(){
      if(typeof THREE==='undefined') return;
      var canvas=doc.getElementById('projCanvas'); var heroEl2=doc.getElementById('hero'); var stick=doc.querySelector('.hero__sticky');
      if(!canvas||!heroEl2) return;
      var W=stick.clientWidth, H=stick.clientHeight;
      var renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:false});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
      renderer.setSize(W,H,false); renderer.setClearColor(0x060608,1);
      if('outputEncoding' in renderer && THREE.sRGBEncoding){ renderer.outputEncoding=THREE.sRGBEncoding; }
      var scene=new THREE.Scene();
      var camera=new THREE.PerspectiveCamera(42,W/H,0.1,100); camera.position.z=6;
      var group=new THREE.Group(); group.visible=false; scene.add(group);
      var CARD_ASPECT=1.5, COLS=9, ROWS=6, cardW, cardH;
      function visH(){ return 2*Math.tan((camera.fov*Math.PI/180)/2)*camera.position.z; }
      function computeCard(){ var vh=visH(); cardH=vh*0.66; cardW=cardH*CARD_ASPECT; var vw=vh*(W/H); if(cardW>vw*0.9){ cardW=vw*0.9; cardH=cardW/CARD_ASPECT; } }
      computeCard();
      var sharedMat=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});
      var tiles=[];
      function cellUV(g,cx,cy){ var uv=g.attributes.uv; var u0=cx/COLS,u1=(cx+1)/COLS,v0=1-(cy+1)/ROWS,v1=1-cy/ROWS; uv.setXY(0,u0,v1); uv.setXY(1,u1,v1); uv.setXY(2,u0,v0); uv.setXY(3,u1,v0); uv.needsUpdate=true; }
      function layout(){ var cw=cardW/COLS, ch=cardH/ROWS, k=0; for(var cy=0;cy<ROWS;cy++){ for(var cx=0;cx<COLS;cx++){ var m=tiles[k++]; if(m.geometry) m.geometry.dispose(); var g=new THREE.PlaneGeometry(cw*0.99,ch*0.99); cellUV(g,cx,cy); m.geometry=g; var bx=-cardW/2+cw*(cx+0.5), by=cardH/2-ch*(cy+0.5); m.userData.bx=bx; m.userData.by=by; } } }
      for(var cy=0;cy<ROWS;cy++){ for(var cx=0;cx<COLS;cx++){ var mm=new THREE.Mesh(new THREE.PlaneGeometry(1,1),sharedMat); mm.userData={bx:0,by:0,dx:(Math.random()*2-1),dy:(Math.random()*2-1),dz:(Math.random()*2-1),rx:(Math.random()*2-1),ry:(Math.random()*2-1),rz:(Math.random()*2-1),ph:Math.random()*6.28}; group.add(mm); tiles.push(mm); } }
      layout();
      var PHOTOS=['img/new-5.webp','img/new-16.webp','img/new-12.webp','img/photo-7.webp'], NIMG=PHOTOS.length;
      var textures=[], curTex=-1, loader=new THREE.TextureLoader();
      function cover(tex){ if(!tex.image) return; var ia=tex.image.width/tex.image.height, ca=CARD_ASPECT; tex.center.set(0.5,0.5); if(ia>ca){ tex.repeat.set(ca/ia,1); } else { tex.repeat.set(1,ia/ca); } tex.offset.set((1-tex.repeat.x)/2,(1-tex.repeat.y)/2); tex.needsUpdate=true; }
      PHOTOS.forEach(function(src,i){ loader.load(src,function(tex){ if(THREE.sRGBEncoding) tex.encoding=THREE.sRGBEncoding; tex.minFilter=THREE.LinearMipmapLinearFilter; cover(tex); textures[i]=tex; if(i===0){ sharedMat.map=tex; sharedMat.needsUpdate=true; group.visible=true; } }); });
      function setTex(idx){ idx=Math.max(0,Math.min(NIMG-1,idx)); if(idx===curTex||!textures[idx]) return; sharedMat.map=textures[idx]; sharedMat.needsUpdate=true; curTex=idx; }
      var targetP=0, curP=0;
      var mx=0,my=0; window.addEventListener('pointermove',function(e){ mx=e.clientX/window.innerWidth-0.5; my=e.clientY/window.innerHeight-0.5; },{passive:true});
      var entry=0; gsap.to({v:0},{v:1,duration:1.7,ease:'expo.out',delay:.15,onUpdate:function(){ entry=this.targets()[0].v; }});
      function resize(){ W=stick.clientWidth; H=stick.clientHeight; renderer.setSize(W,H,false); camera.aspect=W/H; camera.updateProjectionMatrix(); computeCard(); layout(); }
      window.addEventListener('resize',resize);
      var clock=new THREE.Clock();
      (function loop(){ requestAnimationFrame(loop);
        var ts=clock.getElapsedTime();
        var _r=heroEl2.getBoundingClientRect(); var _sc=heroEl2.offsetHeight-window.innerHeight; var _pr=_sc>0?(-_r.top)/_sc:0; if(_pr<0)_pr=0; if(_pr>1)_pr=1; targetP=_pr*(NIMG-1);
        curP+=(targetP-curP)*0.09;
        setTex(Math.round(curP));
        var frac=curP-Math.round(curP);
        var scatter=1-Math.cos(Math.abs(frac)*Math.PI);
        var s=Math.max(scatter,1-entry);
        for(var i=0;i<tiles.length;i++){ var m=tiles[i], u=m.userData; var fl=1+0.15*Math.sin(ts*0.9+u.ph);
          m.position.x=u.bx+s*u.dx*cardW*0.55;
          m.position.y=u.by+s*u.dy*cardH*0.45;
          m.position.z=s*u.dz*2.4*fl;
          m.rotation.x=s*u.rx*1.5; m.rotation.y=s*u.ry*1.5; m.rotation.z=s*u.rz*0.9;
          var sc=1-s*0.14; m.scale.set(sc,sc,1);
        }
        group.rotation.y+=((mx*0.28)-group.rotation.y)*0.05;
        group.rotation.x+=((-my*0.2)-group.rotation.x)*0.05;
        renderer.render(scene,camera);
      })();
    })();

    ScrollTrigger.refresh();
  }
})();
