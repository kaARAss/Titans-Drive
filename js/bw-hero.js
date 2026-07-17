/*
  BuildingsWave hero — adapted from Codrops "Buildings Wave" by iondrimba (MIT).
  Demo 1: https://tympanus.net/Tutorials/BuildingsWave/  Repo: github.com/iondrimba/buildings-wave
  Requires globals: THREE (r110), THREE.OBJLoader, THREE.OrbitControls, TweenMax (+ Quint ease).
  Code copied from the original repo; only labels/colors/model-url adapted for this project.
*/
(function () {
  'use strict';
  var THREE = window.THREE;

  // Loading UI: "Загрузка" + progress bar (ползунок)
  var BWLoad = (function () {
    var fill, pctEl, pct = 0, done = false, timer = null;
    function set(p) {
      p = Math.min(100, Math.max(pct, p));
      pct = p;
      if (fill) fill.style.width = p + '%';
      if (pctEl) pctEl.textContent = Math.round(p) + '%';
    }
    return {
      start: function () {
        fill = document.getElementById('bwFill');
        pctEl = document.getElementById('bwPct');
        pct = 0; done = false; set(0);
        timer = setInterval(function () {
          if (done) return;
          if (pct < 90) set(pct + (90 - pct) * 0.05 + 0.5);
        }, 110);
      },
      progress: function (loaded, total) {
        if (done || !total) return;
        set((loaded / total) * 100);
      },
      finish: function () {
        done = true;
        if (timer) { clearInterval(timer); timer = null; }
        set(100);
      }
    };
  })();

  class App {
    init() {
      this.group = new THREE.Object3D();
      this.bgColor = window.getComputedStyle(document.body, null).getPropertyValue('background-color');
      this.gridSize = window.innerWidth < 760 ? 22 : 40;
      this.buildings = [];
      this.fogConfig = {
        color: '#353c3c',
        near: 1,
        far: 208
      };

      this.width = window.innerWidth;
      this.height = window.innerHeight;

      this.createScene();
      this.createCamera();
      this.addCameraControls();
      this.addFloor();
      this.addBackgroundShape();
      this.loadModels('https://cdn.jsdelivr.net/gh/iondrimba/images@master/buildings.obj', this.onLoadModelsComplete.bind(this));
      this.animate();

      this.pointLightObj3 = {
        color: '#ff3b30',
        intensity: 8.2,
        position: {
          x: 16,
          y: 100,
          z: -68,
        }
      };

      this.addPointLight(this.pointLightObj3);
    }

    createScene() {
      this.scene = new THREE.Scene();

      const mob = window.innerWidth < 760;
      this.renderer = new THREE.WebGLRenderer({ antialias: !mob, alpha: true, powerPreference: 'high-performance' });
      this.renderer.setSize(this.width, this.height);
      // Cap pixel ratio: retina screens otherwise render 2-3x the pixels every frame,
      // which is what makes the scroll stutter while the scene is on screen.
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mob ? 1 : 1.5));

      // Shadows disabled: no light here casts them, so this only saves GPU work (no visual change).
      this.renderer.shadowMap.enabled = false;

      document.body.querySelector('.canvas-wrapper').appendChild(this.renderer.domElement);

      this.scene.fog = new THREE.Fog(this.fogConfig.color, this.fogConfig.near, this.fogConfig.far);
    }

    createCamera() {
      this.camera = new THREE.PerspectiveCamera(20, this.width / this.height, 1, 1000);
      this.camera.position.set(3, 50, 155);

      this.scene.add(this.camera);
    }

    addCameraControls() {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

      this.controls.enabled = false;
    }

    addBackgroundShape() {
      const planeGeometry = new THREE.PlaneGeometry(400, 100);
      const planeMaterial = new THREE.MeshPhysicalMaterial({ color: '#fff' });
      this.backgroundShape = new THREE.Mesh(planeGeometry, planeMaterial);

      this.backgroundShape.position.y = 10;
      this.backgroundShape.position.z = -150;

      this.scene.add(this.backgroundShape);

      this.mouseX = 3;
      this.lastMouseX = 3;
      this.lastMouseY = 65;
      this.lastScale = 155;
      this.tiltFx = {
        body: document.body,
        docEl: document.documentElement,
        getMousePos: (e, docScrolls) => {
          let posx = 0;
          let posy = 0;
          if (!e) { e = window.event; }
          if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
          }
          else if (e.clientX || e.clientY) {
            posx = e.clientX + docScrolls.left;
            posy = e.clientY + docScrolls.top;
          }
          return { x: posx, y: posy }
        },
        lerp: (a, b, n) => (1 - n) * a + n * b,
        lineEq: (y2, y1, x2, x1, currentVal) => {
          let m = (y2 - y1) / (x2 - x1);
          let b = y1 - m * x1;
          return m * currentVal + b;
        }
      };

      this.docheight = Math.max(this.tiltFx.body.scrollHeight, this.tiltFx.body.offsetHeight, this.tiltFx.docEl.clientHeight, this.tiltFx.docEl.scrollHeight, this.tiltFx.docEl.offsetHeight);

      this.requestId = requestAnimationFrame(() => this.tilt());

      // Pause the WebGL render loop when the hero is scrolled out of view so the
      // content below scrolls smoothly (no GPU work competing with Lenis smooth scroll).
      this._visible = true;
      const heroEl = document.querySelector('.bw-hero');
      if (heroEl && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          this._visible = entries[0].isIntersecting;
        }, { threshold: 0, rootMargin: '120px 0px' });
        io.observe(heroEl);
      }

      window.addEventListener('mousemove', (ev) => {
        const docScrolls = { left: this.tiltFx.body.scrollLeft + this.tiltFx.docEl.scrollLeft, top: this.tiltFx.body.scrollTop + this.tiltFx.docEl.scrollTop };
        const mp = this.tiltFx.getMousePos(ev, docScrolls);
        this.mouseX = mp.x - docScrolls.left;
      });

      window.addEventListener('resize', () => this.docheight = Math.max(this.tiltFx.body.scrollHeight, this.tiltFx.body.offsetHeight, this.tiltFx.docEl.clientHeight,
        this.tiltFx.docEl.scrollHeight, this.tiltFx.docEl.offsetHeight));
    }

    tilt() {
      if (this._visible === false) { this.requestId = requestAnimationFrame(() => this.tilt()); return; }
      // 1:1 with the original demo: the DIVISOR is the hero's full height, while the
      // furthest you can scroll is (fullHeight - viewport). So the zoom only reaches
      // ~1/3 of its way (a medium zoom) exactly like the original 300vh page — it never
      // flies into the buildings/textures.
      const hero = document.querySelector('.bw-hero');
      const heroH = hero ? hero.offsetHeight : this.docheight;
      const maxScroll = Math.max(1, heroH - window.innerHeight);
      const newScrollingPos = Math.min(window.pageYOffset, maxScroll);
      this.lastMouseX = this.tiltFx.lerp(this.lastMouseX, this.tiltFx.lineEq(6, 0, this.width, 0, this.mouseX), 0.05);
      this.lastMouseY = this.tiltFx.lerp(this.lastMouseY, this.tiltFx.lineEq(0, 65, heroH, 0, newScrollingPos), 0.05);
      this.lastScale = this.tiltFx.lerp(this.lastScale, this.tiltFx.lineEq(0, 158, heroH, 0, newScrollingPos), 0.05);
      this.camera.position.set(this.lastMouseX, this.lastMouseY, this.lastScale);
      this.requestId = requestAnimationFrame(() => this.tilt());
    }

    addFloor() {
      const floor = { color: '#000000' };
      const planeGeometry = new THREE.PlaneGeometry(200, 200);
      const planeMaterial = new THREE.MeshStandardMaterial({
        color: floor.color,
        metalness: 0,
        emissive: '#000000',
        roughness: 0,
      });

      const plane = new THREE.Mesh(planeGeometry, planeMaterial);

      planeGeometry.rotateX(- Math.PI / 2);
      plane.position.y = 0;

      this.scene.add(plane);
    }

    addPointLight(params) {
      const pointLight = new THREE.PointLight(params.color, params.intensity);

      pointLight.position.set(params.position.x, params.position.y, params.position.z);

      this.scene.add(pointLight);
    }

    getRandomBuiding() {
      return this.models[Math.floor(Math.random() * Math.floor(this.models.length))];
    }

    onLoadModelsComplete(obj) {
      this.models = [...obj.children].map((model) => {
        const scale = .01;

        model.scale.set(scale, scale, scale);
        model.position.set(0, -14, 0);
        model.receiveShadow = true;
        model.castShadow = true;

        return model;
      });

      this.draw();

      setTimeout(() => {
        this.removeLoader();
        this.showBuildings();
      }, 500);

      window.addEventListener('resize', this.onResize.bind(this));
    }

    removeLoader() {
      BWLoad.finish();
      const l = document.querySelector('.bw-loader');
      if (l) setTimeout(() => l.classList.add('bw-loader--done'), 350);
    }

    showBuildings() {
      this.sortBuildingsByDistance();

      if (!window.TweenMax) {
        this.buildings.forEach((building) => { building.position.y = 1; });
        return;
      }

      const ease = window.Quint ? window.Quint.easeOut : window.Power2.easeOut;

      this.buildings.forEach((building, index) => {
        window.TweenMax.to(building.position, .6 + (index / 4000), { y: 1, ease: ease, delay: index / 4000 });
      });
    }

    sortBuildingsByDistance() {
      this.buildings.sort((a, b) => {
        if (a.position.z > b.position.z) {
          return 1;
        }
        if (a.position.z < b.position.z) {
          return -1;
        }
        return 0;
      }).reverse();
    }

    loadModels(name, callback) {
      const objLoader = new THREE.OBJLoader();

      objLoader.load(name, callback, (xhr) => {
        if (xhr && xhr.total > 0) BWLoad.progress(xhr.loaded, xhr.total);
      });
    }

    draw() {
      const boxSize = 3;
      const meshParams = {
        color: '#000',
        metalness: 0,
        emissive: '#000',
        roughness: .77,
      };

      const max = .009;
      const min = .001;
      const material = new THREE.MeshPhysicalMaterial(meshParams);

      for (let i = 0; i < this.gridSize; i++) {
        for (let j = 0; j < this.gridSize; j++) {
          const building = this.getRandomBuiding().clone();

          building.material = material;
          building.scale.y = Math.random() * (max - min + .01);
          building.position.x = (i * boxSize);
          building.position.z = (j * boxSize);

          this.group.add(building);

          this.buildings.push(building);
        }
      }

      this.scene.add(this.group);
      this.group.position.set(-this.gridSize - 10, 1, -this.gridSize - 10);
    }

    onResize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;

      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    }

    animate() {
      requestAnimationFrame(this.animate.bind(this));

      // Skip heavy GPU work while the hero is off-screen (smooth content scroll below).
      if (this._visible === false) return;

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
  }

  function boot() {
    if (!document.querySelector('.bw-hero') || !document.body.querySelector('.canvas-wrapper')) return;
    if (!THREE || !THREE.OBJLoader) { console.warn('BuildingsWave: THREE / OBJLoader not loaded'); return; }
    try {
      BWLoad.start();
      const app = new App();
      app.init();
    } catch (e) {
      console.warn('BuildingsWave init failed', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
