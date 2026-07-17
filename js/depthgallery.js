import * as THREE from 'three'

/* ==========================================================================
   Titan Drive — Depth Gallery
   Ported from Codrops "Atmospheric Depth Gallery" (MIT). Runs without a build
   step: three via CDN importmap, inline GLSL, no tweakpane/stats.
   ========================================================================== */

class Stats {
  constructor(){ this.dom = document.createElement('div'); this.dom.style.display = 'none' }
  showPanel(){} begin(){} end(){}
}
class MiniTimer {
  constructor(){ this._prev = null; this._delta = 0 }
  update(t){ const n = (t === undefined || t === null) ? performance.now() : t; if (this._prev === null) this._prev = n; this._delta = Math.max(0, (n - this._prev) / 1000); this._prev = n; return this }
  getDelta(){ return this._delta }
}
class Debug {
  constructor(){ this.isVisible = false }
  init(){ return null }
  setVisible(v){ this.isVisible = !!v }
  getFolder(){ return null }
  addBinding(){ return { on(){} } }
  dispose(){}
}

const vertexShader = `varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const fragmentShader = `varying vec2 vUv;

uniform vec3 uBackgroundColor;
uniform vec3 uBlob1Color;
uniform vec3 uBlob2Color;
uniform float uNoiseStrength;
uniform float uBlobRadius;
uniform float uBlobRadiusSecondary;
uniform float uBlobStrength;
uniform float uTime;
uniform float uVelocityIntensity;

float random(vec2 coord) {
  return fract(sin(dot(coord, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  // Flat background color
  vec3 color = uBackgroundColor;

  // Blob centers subtely animated
  float animTime = uTime * 0.00028;
  vec2 blob1Center = vec2(
    0.50 + sin(animTime * 1.000) * 0.13 + sin(animTime * 1.618) * 0.05,
    0.48 + cos(animTime * 0.794) * 0.09 + cos(animTime * 1.272) * 0.03
  );
  vec2 blob2Center = vec2(
    0.35 + cos(animTime * 0.927) * 0.11 + cos(animTime * 1.414) * 0.04,
    0.55 + sin(animTime * 1.175) * 0.07 + sin(animTime * 0.618) * 0.03
  );

  // Two blobs: 1 at center, 0 at edge
  float blob1 = smoothstep(uBlobRadius, 0.0, distance(vUv, blob1Center));
  float blob2 = smoothstep(uBlobRadiusSecondary, 0.0, distance(vUv, blob2Center));

  // Soften blob colors toward background before applying
  vec3 blob1SoftColor = mix(uBlob1Color, uBackgroundColor, 0.35);
  vec3 blob2SoftColor = mix(uBlob2Color, uBackgroundColor, 0.35);
  color = mix(color, blob1SoftColor, blob1 * uBlobStrength);
  color = mix(color, blob2SoftColor, blob2 * uBlobStrength);

  // Velocity luminance lift
  color += uVelocityIntensity * 0.10;

  // Film grain
  float grain = random(vUv * vec2(1387.13, 947.91)) - 0.5;
  color += grain * uNoiseStrength;
  color = clamp(color, 0.0, 1.0);

  gl_FragColor = vec4(color, 1.0);
}
`

const galleryPlaneData = [
  { fallbackColor:'#ff3b30', accentColor:'#ff3b30', textureSrc:'img/tours/petra-1.webp', position:{x:-0.6,y:0}, backgroundColor:'#0e0d10', blob1Color:'#3a1512', blob2Color:'#241014', label:{ word:'Петра Гронского', loc:'Скалы Петра Гронского', gear:'Эндуро', color:'' } },
  { fallbackColor:'#f6b53f', accentColor:'#f6b53f', textureSrc:'img/tours/goluboy-1.webp', position:{x:0.7,y:0}, backgroundColor:'#0f0e0b', blob1Color:'#3a2a10', blob2Color:'#241d10', label:{ word:'Голубой карьер', loc:'Затопленный карьер', gear:'Эндуро', color:'' } },
  { fallbackColor:'#ff5a3c', accentColor:'#ff5a3c', textureSrc:'img/tours/gorodishe-1.webp', position:{x:-0.7,y:0}, backgroundColor:'#120d0c', blob1Color:'#3a1a12', blob2Color:'#26130f', label:{ word:'Чёртово Городище', loc:'Урочище Чёртово Городище', gear:'Эндуро', color:'' } },
  { fallbackColor:'#3fbfd6', accentColor:'#3fbfd6', textureSrc:'img/tours/tavatuy-1.webp', position:{x:0.9,y:0}, backgroundColor:'#0a1013', blob1Color:'#123236', blob2Color:'#0f2226', label:{ word:'Озеро Таватуй', loc:'7 Братьев · Таватуй', gear:'Тур на весь день', color:'' } },
  { fallbackColor:'#4f8ef0', accentColor:'#4f8ef0', textureSrc:'img/tours/kamenny-1.webp', position:{x:-0.7,y:0}, backgroundColor:'#0a0e14', blob1Color:'#122036', blob2Color:'#0f1826', label:{ word:'Каменный цветок', loc:'Скалы Каменный цветок', gear:'Эндуро', color:'' } },
  { fallbackColor:'#5fd08a', accentColor:'#5fd08a', textureSrc:'img/tours/aduy-1.webp', position:{x:0.8,y:0}, backgroundColor:'#0a120e', blob1Color:'#123a26', blob2Color:'#0f261b', label:{ word:'Аэродром Адуй', loc:'Заброшенный аэродром', gear:'Офф-роуд', color:'' } },
  { fallbackColor:'#f2d24a', accentColor:'#f2d24a', textureSrc:'img/tours/krasnouf-1.webp', position:{x:-0.9,y:0}, backgroundColor:'#100f0a', blob1Color:'#33300f', blob2Color:'#22200d', label:{ word:'Красноуфимск', loc:'Тёплая пещера · Марьин Утёс', gear:'Тур на весь день', color:'' } },
  { fallbackColor:'#c9ccd6', accentColor:'#c9ccd6', textureSrc:'img/tours/sokol-1.webp', position:{x:0.7,y:0}, backgroundColor:'#0e0f12', blob1Color:'#20242e', blob2Color:'#161a22', label:{ word:'Соколиный камень', loc:'Сосновый лес', gear:'Эндуро', color:'' } },
  { fallbackColor:'#ff3b30', accentColor:'#ff3b30', textureSrc:'img/tours/berez-1.webp', position:{x:-0.8,y:0}, backgroundColor:'#0e0d10', blob1Color:'#3a1512', blob2Color:'#241014', label:{ word:'Берёзовские пески', loc:'Берёзовские карьеры', gear:'Эндуро', color:'' } },
  { fallbackColor:'#f6b53f', accentColor:'#f6b53f', textureSrc:'img/tours/zabkar-1.webp', position:{x:0.8,y:0}, backgroundColor:'#0f0e0b', blob1Color:'#3a2a10', blob2Color:'#241d10', label:{ word:'Тропа Тролля', loc:'Заброшенный карьер', gear:'Эндуро', color:'' } },
  { fallbackColor:'#ff5a3c', accentColor:'#ff5a3c', textureSrc:'img/tours/staropyshminsk-1.webp', position:{x:-0.6,y:0}, backgroundColor:'#120d0c', blob1Color:'#3a1a12', blob2Color:'#26130f', label:{ word:'Старопышминск', loc:'Окрестности Старопышминска', gear:'Эндуро', color:'' } },
  { fallbackColor:'#3fbfd6', accentColor:'#3fbfd6', textureSrc:'img/tours/maloe-1.webp', position:{x:0.7,y:0}, backgroundColor:'#0a1013', blob1Color:'#123236', blob2Color:'#0f2226', label:{ word:'Малое Городище', loc:'Скалы-останцы', gear:'Эндуро', color:'' } },
  { fallbackColor:'#4f8ef0', accentColor:'#4f8ef0', textureSrc:'img/tours/svoboda-1.webp', position:{x:-0.7,y:0}, backgroundColor:'#0a0e14', blob1Color:'#122036', blob2Color:'#0f1826', label:{ word:'Свободный заезд', loc:'Подготовленная территория', gear:'Аренда без гида', color:'' } },
  { fallbackColor:'#5fd08a', accentColor:'#5fd08a', textureSrc:'img/tours/sorevnovaniya-1.webp', position:{x:0.9,y:0}, backgroundColor:'#0a120e', blob1Color:'#123a26', blob2Color:'#0f261b', label:{ word:'Соревнования', loc:'Эндуро-старт', gear:'Спорт', color:'' } },
  { fallbackColor:'#f2d24a', accentColor:'#f2d24a', textureSrc:'img/tours/kvadro-1.webp', position:{x:-0.7,y:0}, backgroundColor:'#100f0a', blob1Color:'#33300f', blob2Color:'#22200d', label:{ word:'Квадроциклы 4×4', loc:'Лесное бездорожье', gear:'Квадроцикл 4×4', color:'' } },
  { fallbackColor:'#c9ccd6', accentColor:'#c9ccd6', textureSrc:'img/tours/kvadro2-1.webp', position:{x:0.8,y:0}, backgroundColor:'#0e0f12', blob1Color:'#20242e', blob2Color:'#161a22', label:{ word:'Квадроцикл 200-250', loc:'Задний привод', gear:'Квадроцикл', color:'' } },
  { fallbackColor:'#ff3b30', accentColor:'#ff3b30', textureSrc:'img/tours/pitbike-1.webp', position:{x:-0.9,y:0}, backgroundColor:'#0e0d10', blob1Color:'#3a1512', blob2Color:'#241014', label:{ word:'Питбайки', loc:'Аренда питбайков', gear:'Питбайк', color:'' } },
  { fallbackColor:'#f6b53f', accentColor:'#f6b53f', textureSrc:'img/tours/pesok-1.webp', position:{x:0.7,y:0}, backgroundColor:'#0f0e0b', blob1Color:'#3a2a10', blob2Color:'#241d10', label:{ word:'Песочница', loc:'Песчаная площадка', gear:'Питбайк', color:'' } },
  { fallbackColor:'#ff5a3c', accentColor:'#ff5a3c', textureSrc:'img/tours/doroga-1.webp', position:{x:-0.8,y:0}, backgroundColor:'#120d0c', blob1Color:'#3a1a12', blob2Color:'#26130f', label:{ word:'Дорожный круизёр', loc:'Honda Steed 400', gear:'Круизёр', color:'' } },
  { fallbackColor:'#3fbfd6', accentColor:'#3fbfd6', textureSrc:'img/tours/petra-2.webp', position:{x:0.8,y:0}, backgroundColor:'#0a1013', blob1Color:'#123236', blob2Color:'#0f2226', label:{ word:'Петра Гронского', loc:'Скалы Петра Гронского', gear:'Эндуро', color:'' } },
  { fallbackColor:'#4f8ef0', accentColor:'#4f8ef0', textureSrc:'img/tours/goluboy-2.webp', position:{x:-0.6,y:0}, backgroundColor:'#0a0e14', blob1Color:'#122036', blob2Color:'#0f1826', label:{ word:'Голубой карьер', loc:'Затопленный карьер', gear:'Эндуро', color:'' } },
  { fallbackColor:'#5fd08a', accentColor:'#5fd08a', textureSrc:'img/tours/gorodishe-2.webp', position:{x:0.7,y:0}, backgroundColor:'#0a120e', blob1Color:'#123a26', blob2Color:'#0f261b', label:{ word:'Чёртово Городище', loc:'Урочище Чёртово Городище', gear:'Эндуро', color:'' } },
  { fallbackColor:'#f2d24a', accentColor:'#f2d24a', textureSrc:'img/tours/tavatuy-2.webp', position:{x:-0.7,y:0}, backgroundColor:'#100f0a', blob1Color:'#33300f', blob2Color:'#22200d', label:{ word:'Озеро Таватуй', loc:'7 Братьев · Таватуй', gear:'Тур на весь день', color:'' } },
  { fallbackColor:'#c9ccd6', accentColor:'#c9ccd6', textureSrc:'img/tours/kamenny-2.webp', position:{x:0.9,y:0}, backgroundColor:'#0e0f12', blob1Color:'#20242e', blob2Color:'#161a22', label:{ word:'Каменный цветок', loc:'Скалы Каменный цветок', gear:'Эндуро', color:'' } },
  { fallbackColor:'#ff3b30', accentColor:'#ff3b30', textureSrc:'img/tours/aduy-2.webp', position:{x:-0.7,y:0}, backgroundColor:'#0e0d10', blob1Color:'#3a1512', blob2Color:'#241014', label:{ word:'Аэродром Адуй', loc:'Заброшенный аэродром', gear:'Офф-роуд', color:'' } },
  { fallbackColor:'#f6b53f', accentColor:'#f6b53f', textureSrc:'img/tours/krasnouf-2.webp', position:{x:0.8,y:0}, backgroundColor:'#0f0e0b', blob1Color:'#3a2a10', blob2Color:'#241d10', label:{ word:'Красноуфимск', loc:'Тёплая пещера · Марьин Утёс', gear:'Тур на весь день', color:'' } },
  { fallbackColor:'#ff5a3c', accentColor:'#ff5a3c', textureSrc:'img/tours/sokol-2.webp', position:{x:-0.9,y:0}, backgroundColor:'#120d0c', blob1Color:'#3a1a12', blob2Color:'#26130f', label:{ word:'Соколиный камень', loc:'Сосновый лес', gear:'Эндуро', color:'' } },
  { fallbackColor:'#3fbfd6', accentColor:'#3fbfd6', textureSrc:'img/tours/berez-2.webp', position:{x:0.7,y:0}, backgroundColor:'#0a1013', blob1Color:'#123236', blob2Color:'#0f2226', label:{ word:'Берёзовские пески', loc:'Берёзовские карьеры', gear:'Эндуро', color:'' } },
  { fallbackColor:'#4f8ef0', accentColor:'#4f8ef0', textureSrc:'img/tours/zabkar-2.webp', position:{x:-0.8,y:0}, backgroundColor:'#0a0e14', blob1Color:'#122036', blob2Color:'#0f1826', label:{ word:'Тропа Тролля', loc:'Заброшенный карьер', gear:'Эндуро', color:'' } },
  { fallbackColor:'#5fd08a', accentColor:'#5fd08a', textureSrc:'img/tours/staropyshminsk-2.webp', position:{x:0.8,y:0}, backgroundColor:'#0a120e', blob1Color:'#123a26', blob2Color:'#0f261b', label:{ word:'Старопышминск', loc:'Окрестности Старопышминска', gear:'Эндуро', color:'' } },
  { fallbackColor:'#f2d24a', accentColor:'#f2d24a', textureSrc:'img/tours/maloe-2.webp', position:{x:-0.6,y:0}, backgroundColor:'#100f0a', blob1Color:'#33300f', blob2Color:'#22200d', label:{ word:'Малое Городище', loc:'Скалы-останцы', gear:'Эндуро', color:'' } },
  { fallbackColor:'#c9ccd6', accentColor:'#c9ccd6', textureSrc:'img/tours/svoboda-2.webp', position:{x:0.7,y:0}, backgroundColor:'#0e0f12', blob1Color:'#20242e', blob2Color:'#161a22', label:{ word:'Свободный заезд', loc:'Подготовленная территория', gear:'Аренда без гида', color:'' } },
  { fallbackColor:'#ff3b30', accentColor:'#ff3b30', textureSrc:'img/tours/sorevnovaniya-2.webp', position:{x:-0.7,y:0}, backgroundColor:'#0e0d10', blob1Color:'#3a1512', blob2Color:'#241014', label:{ word:'Соревнования', loc:'Эндуро-старт', gear:'Спорт', color:'' } },
  { fallbackColor:'#f6b53f', accentColor:'#f6b53f', textureSrc:'img/tours/kvadro-2.webp', position:{x:0.9,y:0}, backgroundColor:'#0f0e0b', blob1Color:'#3a2a10', blob2Color:'#241d10', label:{ word:'Квадроциклы 4×4', loc:'Лесное бездорожье', gear:'Квадроцикл 4×4', color:'' } },
  { fallbackColor:'#ff5a3c', accentColor:'#ff5a3c', textureSrc:'img/tours/kvadro2-2.webp', position:{x:-0.7,y:0}, backgroundColor:'#120d0c', blob1Color:'#3a1a12', blob2Color:'#26130f', label:{ word:'Квадроцикл 200-250', loc:'Задний привод', gear:'Квадроцикл', color:'' } },
  { fallbackColor:'#3fbfd6', accentColor:'#3fbfd6', textureSrc:'img/tours/pitbike-2.webp', position:{x:0.8,y:0}, backgroundColor:'#0a1013', blob1Color:'#123236', blob2Color:'#0f2226', label:{ word:'Питбайки', loc:'Аренда питбайков', gear:'Питбайк', color:'' } },
  { fallbackColor:'#4f8ef0', accentColor:'#4f8ef0', textureSrc:'img/tours/pesok-2.webp', position:{x:-0.9,y:0}, backgroundColor:'#0a0e14', blob1Color:'#122036', blob2Color:'#0f1826', label:{ word:'Песочница', loc:'Песчаная площадка', gear:'Питбайк', color:'' } },
  { fallbackColor:'#5fd08a', accentColor:'#5fd08a', textureSrc:'img/tours/doroga-2.webp', position:{x:0.7,y:0}, backgroundColor:'#0a120e', blob1Color:'#123a26', blob2Color:'#0f261b', label:{ word:'Дорожный круизёр', loc:'Honda Steed 400', gear:'Круизёр', color:'' } },
  { fallbackColor:'#f2d24a', accentColor:'#f2d24a', textureSrc:'img/tours/petra-3.webp', position:{x:-0.8,y:0}, backgroundColor:'#100f0a', blob1Color:'#33300f', blob2Color:'#22200d', label:{ word:'Петра Гронского', loc:'Скалы Петра Гронского', gear:'Эндуро', color:'' } },
  { fallbackColor:'#c9ccd6', accentColor:'#c9ccd6', textureSrc:'img/tours/goluboy-3.webp', position:{x:0.8,y:0}, backgroundColor:'#0e0f12', blob1Color:'#20242e', blob2Color:'#161a22', label:{ word:'Голубой карьер', loc:'Затопленный карьер', gear:'Эндуро', color:'' } },
  { fallbackColor:'#ff3b30', accentColor:'#ff3b30', textureSrc:'img/titany-hero.webp', position:{x:0,y:0}, backgroundColor:'#0e0d10', blob1Color:'#3a1512', blob2Color:'#241014', label:{ word:'', loc:'', gear:'', color:'' } },
]

class Gallery {
  constructor(debug = null) {
    this.isInitialized = false
    this.isDebugBound = false
    this.debug = debug

    // Planes
    this.planes = []
    this.texturesBySource = new Map()
    this.useTextures = true
    this.planeGap = 5
    this.desktopPlaneScale = 0.9
    this.mobilePlaneScale = 0.68
    this.mobileXSpreadFactor = 0.25
    this.mobileBreakpoint = 768
    this.planeConfig = (typeof window !== 'undefined' && window.innerWidth <= 768)
      ? galleryPlaneData.slice(0, 15).concat([galleryPlaneData[galleryPlaneData.length - 1]])
      : galleryPlaneData
    this.moodSampleOffset = 1
    this.planeFadeSampleOffset = 1
    this.planeFadeSmoothing = 0.14

    // Parallax
    this.parallaxEnabled = true
    this.parallaxAmountX = 0.16
    this.parallaxAmountY = 0.08
    this.parallaxSmoothing = 0.08
    this.pointerTarget = new THREE.Vector2(0, 0)
    this.pointerCurrent = new THREE.Vector2(0, 0)

    // Breath
    this.breathEnabled = true
    this.breathTiltAmount = 0.045
    this.breathScaleAmount = 0.03
    this.breathSmoothing = 0.14
    this.breathGain = 1.1
    this.breathIntensity = 0
    this.targetBreathIntensity = 0

    // Gesture drift
    this.gestureParallaxEnabled = true
    this.gestureParallaxAmountY = 0.05
    this.gestureParallaxSmoothing = 0.05
    this.driftCurrent = 0
    this.driftTarget = 0

    // Pointer events
    this.onPointerMove = (event) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1
      const y = (event.clientY / window.innerHeight) * 2 - 1
      this.pointerTarget.set(x, -y)
    }
    this.onPointerLeave = () => {
      this.pointerTarget.set(0, 0)
    }
  }

  async init(scene) {
    if (this.isInitialized) return

    this.setPlanes(scene)
    this.updatePlaneMaterialMode()
    this.updatePlaneScale()
    this.layoutPlanes()
    this.bindPointerEvents()
    this.bindDebug()

    this.isInitialized = true
  }

  setPlanes(scene) {
    const planeGeometry = new THREE.PlaneGeometry(3, 3)

    this.planeConfig.forEach((plane, index) => {
      const texture = this.texturesBySource.get(plane.textureSrc) || null
      const textureImage = texture?.image
      const aspectRatio =
        textureImage && textureImage.width > 0 && textureImage.height > 0
          ? textureImage.width / textureImage.height
          : 1
      const fallbackColor = plane.fallbackColor || '#ffffff'
      const accentColor = plane.accentColor || fallbackColor
      const backgroundColor = plane.backgroundColor || fallbackColor
      const blob1Color = plane.blob1Color || fallbackColor
      const blob2Color = plane.blob2Color || fallbackColor
      const labelData = this.getPlaneLabelData(plane, this.planes.length)
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: fallbackColor,
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        opacity: index === 0 ? 1 : 0,
      })
      const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
      planeMesh.userData.basePosition = plane.position
      planeMesh.userData.baseColor = fallbackColor
      planeMesh.userData.accentColor = accentColor
      planeMesh.userData.backgroundColor = backgroundColor
      planeMesh.userData.blob1Color = blob1Color
      planeMesh.userData.blob2Color = blob2Color
      planeMesh.userData.label = labelData
      planeMesh.userData.texture = texture
      planeMesh.userData.aspectRatio = aspectRatio
      scene.add(planeMesh)
      this.planes.push(planeMesh)
    })
  }

  getPlaneLabelData(planeDefinition, index) {
    const fallback = { word: `Кадр ${String(index + 1).padStart(2, '0')}`, loc: '', gear: '', color: '' }
    const label = planeDefinition.label || fallback
    return {
      word: label.word || fallback.word,
      loc: label.loc || fallback.loc,
      gear: label.gear || fallback.gear,
      color: label.color || fallback.color,
    }
  }

  updatePlaneScale() {
    const isMobileViewport = window.innerWidth <= this.mobileBreakpoint
    const scale = isMobileViewport ? this.mobilePlaneScale : this.desktopPlaneScale

    this.planes.forEach((plane) => {
      const aspectRatio = plane.userData.aspectRatio || 1
      plane.scale.set(scale * aspectRatio, scale, 1)
    })
  }

  layoutPlanes() {
    const xSpreadFactor = this.getXSpreadFactor()

    this.planes.forEach((plane, index) => {
      const basePosition = plane.userData.basePosition || { x: 0, y: 0 }
      const xPosition = basePosition.x * xSpreadFactor
      plane.position.set(xPosition, basePosition.y, -index * this.planeGap)
    })
  }

  getXSpreadFactor() {
    const isMobileViewport = window.innerWidth <= this.mobileBreakpoint
    return isMobileViewport ? this.mobileXSpreadFactor : 1
  }

  getDepthRange() {
    if (!this.planes.length) {
      return { nearestZ: 0, deepestZ: 0 }
    }

    const zPositions = this.planes.map((plane) => plane.position.z)
    return {
      nearestZ: Math.max(...zPositions),
      deepestZ: Math.min(...zPositions),
    }
  }

  getDepthProgress(cameraZ) {
    const { nearestZ, deepestZ } = this.getDepthRange()
    const depthSpan = nearestZ - deepestZ
    if (depthSpan <= 0) return 0

    return THREE.MathUtils.clamp((nearestZ - cameraZ) / depthSpan, 0, 1)
  }

  getActivePlaneIndex(cameraZ) {
    if (!this.planes.length) return -1

    let closestPlaneIndex = 0
    let smallestDistance = Infinity

    this.planes.forEach((plane, index) => {
      const distanceToPlane = Math.abs(cameraZ - plane.position.z)
      if (distanceToPlane < smallestDistance) {
        smallestDistance = distanceToPlane
        closestPlaneIndex = index
      }
    })

    return closestPlaneIndex
  }

  getMoodColorsByIndex(index) {
    if (index < 0 || index >= this.planes.length) return null

    const { backgroundColor, blob1Color, blob2Color } = this.planes[index].userData
    if (!backgroundColor) return null

    return { background: backgroundColor, blob1: blob1Color, blob2: blob2Color }
  }

  getMoodBlendData(cameraZ) {
    if (!this.planes.length) return null

    const safeCameraZ = Number.isFinite(cameraZ) ? cameraZ : this.planes[0].position.z
    const moodSampleZ = safeCameraZ - this.planeGap * this.moodSampleOffset
    const lastPlaneIndex = this.planes.length - 1

    if (lastPlaneIndex === 0 || this.planeGap <= 0) {
      const singleMood = this.getMoodColorsByIndex(0)
      if (!singleMood) return null

      return {
        currentMood: singleMood,
        nextMood: singleMood,
        blend: 0,
      }
    }

    const firstPlaneZ = this.planes[0].position.z
    const normalizedDepth = THREE.MathUtils.clamp(
      (firstPlaneZ - moodSampleZ) / this.planeGap,
      0,
      lastPlaneIndex
    )
    const currentPlaneIndex = Math.floor(normalizedDepth)
    const nextPlaneIndex = Math.min(currentPlaneIndex + 1, lastPlaneIndex)
    const blend = normalizedDepth - currentPlaneIndex

    const currentMood = this.getMoodColorsByIndex(currentPlaneIndex)
    const nextMood = this.getMoodColorsByIndex(nextPlaneIndex) || currentMood
    if (!currentMood || !nextMood) return null

    return {
      currentMood,
      nextMood,
      blend,
    }
  }

  getPlaneBlendData(cameraZ) {
    if (!this.planes.length) return null

    const planeGap = Math.max(this.planeGap, 0.0001)
    const firstPlaneZ = this.planes[0].position.z
    const lastPlaneIndex = this.planes.length - 1
    const sampledCameraZ = cameraZ - planeGap * this.planeFadeSampleOffset
    const normalizedDepth = THREE.MathUtils.clamp(
      (firstPlaneZ - sampledCameraZ) / planeGap,
      0,
      lastPlaneIndex
    )
    const currentPlaneIndex = Math.floor(normalizedDepth)
    const nextPlaneIndex = Math.min(currentPlaneIndex + 1, lastPlaneIndex)
    const blend = normalizedDepth - currentPlaneIndex

    return {
      currentPlaneIndex,
      nextPlaneIndex,
      blend,
    }
  }

  getActiveMoodColors(cameraZ) {
    const moodBlendData = this.getMoodBlendData(cameraZ)
    return moodBlendData?.currentMood || null
  }

  getTextureSources() {
    const textureSources = this.planeConfig
      .map((planeDefinition) => planeDefinition.textureSrc)
      .filter(Boolean)

    return [...new Set(textureSources)]
  }

  setPreloadedTextures(texturesBySource) {
    this.texturesBySource = texturesBySource instanceof Map ? texturesBySource : new Map()
  }

  updatePlaneMaterialMode() {
    this.planes.forEach((plane) => {
      const planeMaterial = plane.material
      const texture = plane.userData.texture || null
      const hasTexture = Boolean(texture)

      planeMaterial.map = this.useTextures && hasTexture ? texture : null
      planeMaterial.color.set(this.useTextures && hasTexture ? '#ffffff' : plane.userData.baseColor)
      planeMaterial.needsUpdate = true
    })
  }

  bindDebug() {
    if (!this.debug || this.isDebugBound) return

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'planeGap',
      label: 'Gap',
      options: {
        min: 0.4,
        max: 10,
        step: 0.1,
      },
      onChange: () => {
        this.layoutPlanes()
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'useTextures',
      label: 'Use Textures',
      onChange: () => {
        this.updatePlaneMaterialMode()
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'moodSampleOffset',
      label: 'Mood Offset',
      options: {
        min: 0,
        max: 1.5,
        step: 0.01,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'parallaxEnabled',
      label: 'Plane Parallax',
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'parallaxAmountX',
      label: 'Parallax X',
      options: {
        min: 0,
        max: 0.5,
        step: 0.01,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'parallaxAmountY',
      label: 'Parallax Y',
      options: {
        min: 0,
        max: 0.3,
        step: 0.01,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'gestureParallaxEnabled',
      label: 'Gesture Parallax',
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'gestureParallaxAmountY',
      label: 'Gesture Y',
      options: {
        min: 0,
        max: 0.5,
        step: 0.01,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'breathEnabled',
      label: 'Plane Breath',
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'breathTiltAmount',
      label: 'Breath Tilt',
      options: {
        min: 0,
        max: 0.2,
        step: 0.005,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'breathScaleAmount',
      label: 'Breath Scale',
      options: {
        min: 0,
        max: 0.1,
        step: 0.001,
      },
    })

    this.isDebugBound = true
  }

  updatePlaneVisibility(cameraZ) {
    const blendData = this.getPlaneBlendData(cameraZ)
    if (!blendData) return

    const { currentPlaneIndex, nextPlaneIndex, blend } = blendData

    this.planes.forEach((plane, index) => {
      let targetOpacity = 0

      if (index === currentPlaneIndex) {
        targetOpacity = 1 - blend
      }
      if (index === nextPlaneIndex) {
        targetOpacity = Math.max(targetOpacity, blend)
      }

      const currentOpacity = Number.isFinite(plane.material.opacity) ? plane.material.opacity : 0
      plane.material.opacity = THREE.MathUtils.lerp(
        currentOpacity,
        targetOpacity,
        this.planeFadeSmoothing
      )
      plane.material.needsUpdate = true
    })
  }

  bindPointerEvents() {
    window.addEventListener('pointermove', this.onPointerMove, { passive: true })
    window.addEventListener('pointerleave', this.onPointerLeave, { passive: true })
  }

  updatePlaneMotion(scroll = null) {
    // Smooth pointer toward target
    this.pointerCurrent.lerp(this.pointerTarget, this.parallaxSmoothing)

    // Velocity → breath + drift
    const velocityMax = Math.max(scroll?.velocityMax || 1, 0.0001)
    const velocityNormalized = THREE.MathUtils.clamp(
      Math.abs(scroll?.velocity || 0) / velocityMax,
      0,
      1
    )
    const scrollDrift = THREE.MathUtils.clamp((scroll?.velocity || 0) / velocityMax, -1, 1)
    this.targetBreathIntensity = this.breathEnabled
      ? THREE.MathUtils.clamp(velocityNormalized * this.breathGain, 0, 1)
      : 0
    this.breathIntensity = THREE.MathUtils.lerp(
      this.breathIntensity,
      this.targetBreathIntensity,
      this.breathSmoothing
    )
    this.driftTarget = this.gestureParallaxEnabled ? scrollDrift : 0
    this.driftCurrent = THREE.MathUtils.lerp(
      this.driftCurrent,
      this.driftTarget,
      this.gestureParallaxSmoothing
    )

    // Per-plane: position, rotation, scale
    const xSpreadFactor = this.getXSpreadFactor()

    this.planes.forEach((plane, index) => {
      const basePosition = plane.userData.basePosition || { x: 0, y: 0 }
      const xPosition = basePosition.x * xSpreadFactor
      const yPosition = basePosition.y
      const zPosition = -index * this.planeGap
      const opacity = Number.isFinite(plane.material.opacity) ? plane.material.opacity : 0
      const depthInfluence = 1 + index * 0.05
      const parallaxInfluence = this.parallaxEnabled ? opacity * depthInfluence : 0

      const parallaxOffsetX = this.pointerCurrent.x * this.parallaxAmountX * parallaxInfluence
      const parallaxOffsetY = this.pointerCurrent.y * this.parallaxAmountY * parallaxInfluence
      const gestureOffsetY = this.driftCurrent * this.gestureParallaxAmountY

      plane.position.x = xPosition + parallaxOffsetX
      plane.position.y = yPosition + parallaxOffsetY + gestureOffsetY
      plane.position.z = zPosition

      const breathInfluence = this.breathEnabled ? this.breathIntensity * opacity : 0
      const tiltX = -this.pointerCurrent.y * this.breathTiltAmount * breathInfluence
      const tiltY = this.pointerCurrent.x * this.breathTiltAmount * breathInfluence
      plane.rotation.x = tiltX
      plane.rotation.y = tiltY
      plane.rotation.z = 0

      const aspectRatio = plane.userData.aspectRatio || 1
      const baseScale =
        window.innerWidth <= this.mobileBreakpoint ? this.mobilePlaneScale : this.desktopPlaneScale
      const scalePulse = 1 + this.breathScaleAmount * breathInfluence
      plane.scale.x = baseScale * aspectRatio * scalePulse
      plane.scale.y = baseScale * scalePulse
      plane.scale.z = 1

      // Last plane blooms to fullscreen as the camera reaches the very end
      if (this._camera && this.planes.length > 1 && index === this.planes.length - 1) {
        const gap = Math.max(this.planeGap, 0.0001)
        const focusFloat = 1 - (this._camera.position.z / gap)
        let p = THREE.MathUtils.clamp(focusFloat - (this.planes.length - 2), 0, 1)
        p = p * p * (3 - 2 * p)
        if (typeof document !== 'undefined' && document.body) { document.body.classList.toggle('gallery-finale', p > 0.55) }
        const dist = Math.max(this._camera.position.z - zPosition, 0.001)
        const vFov = (this._camera.fov || 45) * Math.PI / 180
        const viewH = 2 * dist * Math.tan(vFov / 2)
        const viewW = viewH * (this._camera.aspect || 1)
        const cover = 1.04 * Math.max(viewH / 3, viewW / (3 * aspectRatio))
        const baseY = baseScale * scalePulse
        const finalY = THREE.MathUtils.lerp(baseY, cover, p)
        plane.scale.x = finalY * aspectRatio
        plane.scale.y = finalY
        plane.position.x = xPosition * (1 - p)
      }
    })
  }

  update(camera = null, scroll = null) {
    if (!camera) return
    this._camera = camera
    this.updatePlaneVisibility(camera.position.z)
    this.updatePlaneMotion(scroll)
  }

  dispose() {
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerleave', this.onPointerLeave)
  }
}

class Background {
  constructor(debug = null) {
    this.debug = debug
    this.isInitialized = false
    this.isDebugBound = false

    this.scene = null
    this.camera = null
    this.material = null
    this.mesh = null

    this.backgroundColor = new THREE.Color('#FBE8CD')
    this.blob1Color = new THREE.Color('#FFD56D')
    this.blob2Color = new THREE.Color('#5D816A')
    this.nextBackgroundColor = new THREE.Color()
    this.nextBlob1Color = new THREE.Color()
    this.nextBlob2Color = new THREE.Color()

    this.baseBlobRadius = 0.65
    this.secondaryBlobRadiusRatio = 0.78
    this.baseBlobStrength = 0.9

    this.depthToRadiusAmount = 0.08
    this.velocityToStrengthAmount = 0.1
    this.motionSmoothing = 0.1
    this.motionDepthProgress = 0
    this.motionVelocityIntensity = 0
    this.smoothedDepthProgress = 0
    this.smoothedVelocityIntensity = 0

    this.blobRadius = this.baseBlobRadius
    this.blobStrength = this.baseBlobStrength
    this.noiseStrength = 0.04
  }

  init() {
    if (this.isInitialized) return

    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uBackgroundColor: { value: this.backgroundColor },
        uBlob1Color: { value: this.blob1Color },
        uBlob2Color: { value: this.blob2Color },
        uNoiseStrength: { value: this.noiseStrength },
        uBlobRadius: { value: this.blobRadius },
        uBlobRadiusSecondary: { value: this.blobRadius * this.secondaryBlobRadiusRatio },
        uBlobStrength: { value: this.blobStrength },
        uTime: { value: 0 },
        uVelocityIntensity: { value: 0 },
      },
    })

    const geometry = new THREE.PlaneGeometry(2, 2)
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.scene.add(this.mesh)
    this.applyMotionToBlob()
    this.bindDebug()

    this.isInitialized = true
  }

  setMoodColors({ background, blob1, blob2 } = {}) {
    if (background) this.backgroundColor.set(background)
    if (blob1) this.blob1Color.set(blob1)
    if (blob2) this.blob2Color.set(blob2)

    this.updateUniformColors()
  }

  setMoodBlend({ currentMood, nextMood, blend } = {}) {
    if (!currentMood) return

    const safeBlend = THREE.MathUtils.clamp(blend ?? 0, 0, 1)
    if (!nextMood || safeBlend <= 0) {
      this.setMoodColors(currentMood)
      return
    }

    this.backgroundColor
      .set(currentMood.background)
      .lerp(this.nextBackgroundColor.set(nextMood.background), safeBlend)
    this.blob1Color.set(currentMood.blob1).lerp(this.nextBlob1Color.set(nextMood.blob1), safeBlend)
    this.blob2Color.set(currentMood.blob2).lerp(this.nextBlob2Color.set(nextMood.blob2), safeBlend)

    this.updateUniformColors()
  }

  updateUniformColors() {
    if (!this.material) return

    this.material.uniforms.uBackgroundColor.value.copy(this.backgroundColor)
    this.material.uniforms.uBlob1Color.value.copy(this.blob1Color)
    this.material.uniforms.uBlob2Color.value.copy(this.blob2Color)
    this.material.uniforms.uNoiseStrength.value = this.noiseStrength
  }

  updateBlobUniforms() {
    if (!this.material) return

    this.material.uniforms.uBlobRadius.value = this.blobRadius
    this.material.uniforms.uBlobRadiusSecondary.value =
      this.blobRadius * this.secondaryBlobRadiusRatio
    this.material.uniforms.uBlobStrength.value = this.blobStrength
  }

  setMotionResponse({ depthProgress, velocityIntensity } = {}) {
    if (Number.isFinite(depthProgress)) {
      this.motionDepthProgress = THREE.MathUtils.clamp(depthProgress, 0, 1)
    }
    if (Number.isFinite(velocityIntensity)) {
      this.motionVelocityIntensity = THREE.MathUtils.clamp(velocityIntensity, 0, 1)
    }
  }

  applyMotionToBlob() {
    const nextBlobRadius =
      this.baseBlobRadius + this.smoothedDepthProgress * this.depthToRadiusAmount
    const nextBlobStrength =
      this.baseBlobStrength + this.smoothedVelocityIntensity * this.velocityToStrengthAmount

    this.blobRadius = THREE.MathUtils.clamp(nextBlobRadius, 0.05, 1)
    this.blobStrength = THREE.MathUtils.clamp(nextBlobStrength, 0, 1)

    this.updateBlobUniforms()
  }

  bindDebug() {
    if (!this.debug || this.isDebugBound) return

    this.debug.addBinding({
      folderTitle: 'Background',
      targetObject: this,
      property: 'baseBlobRadius',
      label: 'Blob Radius',
      options: { min: 0.1, max: 1, step: 0.01 },
      onChange: () => {
        this.applyMotionToBlob()
      },
    })

    this.debug.addBinding({
      folderTitle: 'Background',
      targetObject: this,
      property: 'secondaryBlobRadiusRatio',
      label: 'Blob 2 Size',
      options: { min: 0.3, max: 1.2, step: 0.01 },
      onChange: () => {
        this.applyMotionToBlob()
      },
    })

    this.debug.addBinding({
      folderTitle: 'Background',
      targetObject: this,
      property: 'baseBlobStrength',
      label: 'Blob Strength',
      options: { min: 0, max: 1, step: 0.01 },
      onChange: () => {
        this.applyMotionToBlob()
      },
    })

    this.debug.addBinding({
      folderTitle: 'Background',
      targetObject: this,
      property: 'noiseStrength',
      label: 'Noise',
      options: { min: 0, max: 0.2, step: 0.005 },
      onChange: () => {
        this.updateUniformColors()
      },
    })

    this.isDebugBound = true
  }

  update(time = 0) {
    this.smoothedDepthProgress = THREE.MathUtils.lerp(
      this.smoothedDepthProgress,
      this.motionDepthProgress,
      this.motionSmoothing
    )
    this.smoothedVelocityIntensity = THREE.MathUtils.lerp(
      this.smoothedVelocityIntensity,
      this.motionVelocityIntensity,
      this.motionSmoothing
    )

    if (this.material) {
      this.material.uniforms.uTime.value = time
      this.material.uniforms.uVelocityIntensity.value = this.smoothedVelocityIntensity
    }

    this.applyMotionToBlob()
  }

  render(renderer) {
    if (!this.isInitialized) return
    renderer.render(this.scene, this.camera)
  }

  dispose() {
    if (!this.isInitialized) return

    this.mesh.geometry.dispose()
    this.material.dispose()
    this.scene.clear()

    this.scene = null
    this.camera = null
    this.mesh = null
    this.material = null
    this.isInitialized = false
  }
}

class Label {
  constructor(gallery){ this.gallery = gallery; this.overlayElement = null; this.leftIndexElement = null; this.wordElement = null; this.chipElement = null; this.locElement = null; this.gearElement = null; this.activePlaneIndex = -1 }
  createElement(){
    const element = document.createElement('section')
    element.className = 'plane-label-overlay'
    element.innerHTML = `
      <div class="plane-label-overlay__left">
        <p class="plane-label-overlay__index"></p>
        <p class="plane-label-card__word"></p>
        <span class="plane-label-overlay__chip"></span>
      </div>`
    return { element, leftIndexElement: element.querySelector('.plane-label-overlay__index'), wordElement: element.querySelector('.plane-label-card__word'), chipElement: element.querySelector('.plane-label-overlay__chip'), locElement: null, gearElement: null }
  }
  init(){ if (this.overlayElement) return; const r = this.createElement(); this.overlayElement = r.element; this.leftIndexElement = r.leftIndexElement; this.wordElement = r.wordElement; this.chipElement = r.chipElement; this.locElement = r.locElement; this.gearElement = r.gearElement; this.overlayElement.style.opacity = '0'; document.body.append(this.overlayElement) }
  getTargetPlaneIndex(cameraZ){ const b = this.gallery.getPlaneBlendData(cameraZ); if (!b) return -1; return b.blend >= 0.5 ? b.nextPlaneIndex : b.currentPlaneIndex }
  applyPlaneContent(planeIndex){ const plane = this.gallery.planes[planeIndex]; if (!plane || this.activePlaneIndex === planeIndex) return; const l = plane.userData.label || {}; const _empty = !(l.word); this.leftIndexElement.textContent = _empty ? '' : String(planeIndex + 1).padStart(2, '0'); this.wordElement.textContent = l.word || ''; this.chipElement.style.display = _empty ? 'none' : ''; this.chipElement.style.backgroundColor = plane.userData.accentColor || '#fff'; this.overlayElement.style.color = l.color || ''; this.activePlaneIndex = planeIndex }
  resize(){}
  update(camera = null){ if (!camera || !this.overlayElement) return; const t = this.getTargetPlaneIndex(camera.position.z); if (t < 0){ this.overlayElement.style.opacity = '0'; return } this.applyPlaneContent(t); this.overlayElement.style.opacity = '1' }
  render(){}
  dispose(){ this.overlayElement && this.overlayElement.remove(); this.overlayElement = null; this.activePlaneIndex = -1 }
}

class Scroll {
  constructor(camera, gallery, debug = null) {
    this.isInitialized = false
    this.isDebugBound = false
    this.camera = camera
    this.gallery = gallery
    this.debug = debug

    // Scroll state
    this.scrollTarget = 0
    this.scrollCurrent = 0
    this.scrollSmoothing = 0.08
    this.scrollToWorldFactor = 0.01
    this.wheelScrollSpeed = 1
    this.touchScrollSpeed = 1.8
    this.previousScrollCurrent = 0
    this.invertScroll = false

    // Velocity
    this.rawVelocity = 0
    this.velocity = 0
    this.velocityDamping = 0.12
    this.velocityMax = 1.5
    this.velocityStopThreshold = 0.0001

    // Bounds
    this.useScrollBounds = true
    this.firstPlaneViewOffset = 5
    this.lastPlaneViewOffset = 5
    this.minCameraZ = -Infinity
    this.maxCameraZ = Infinity
    this.cameraStartZ = this.camera.position.z

    // Debug UI
    this.showVelocityVisualizer = true
    this.debugUiVisible = false
    this.touchY = 0
    this.velocityVisualizerElement = null
    this.velocityVisualizerFillElement = null
    this.velocityVisualizerValueElement = null

    // Input events
    this.onWheel = (event) => {
      event.preventDefault()
      const normalizedWheelDelta = this.normalizeWheelDelta(event) * this.wheelScrollSpeed
      this.addScrollInput(normalizedWheelDelta)
    }
    this.onTouchStart = (event) => {
      this.touchY = event.touches[0]?.clientY ?? 0
    }
    this.onTouchMove = (event) => {
      event.preventDefault()
      const currentTouchY = event.touches[0]?.clientY ?? this.touchY
      const deltaY = this.touchY - currentTouchY
      this.addScrollInput(deltaY * this.touchScrollSpeed)
      this.touchY = currentTouchY
    }
  }

  init() {
    if (this.isInitialized) return

    this.updateCameraBounds()
    this.cameraStartZ = this.maxCameraZ
    this.camera.position.z = this.cameraStartZ
    this.scrollTarget = 0
    this.scrollCurrent = 0
    this.previousScrollCurrent = this.scrollCurrent
    this.rawVelocity = 0
    this.velocity = 0
    this.createVelocityVisualizer()
    this.updateVelocityVisualizer()
    this.bindDebug()

    this.isInitialized = true
  }

  bindEvents() {
    window.addEventListener('wheel', this.onWheel, { passive: false })
    window.addEventListener('touchstart', this.onTouchStart, { passive: true })
    window.addEventListener('touchmove', this.onTouchMove, { passive: false })
  }

  updateCameraBounds() {
    const depthRange = this.gallery.getDepthRange()
    this.maxCameraZ = depthRange.nearestZ + this.firstPlaneViewOffset
    this.minCameraZ = depthRange.deepestZ + this.lastPlaneViewOffset

    if (this.minCameraZ > this.maxCameraZ) {
      this.minCameraZ = this.maxCameraZ
    }
  }

  cameraZFromScroll(scrollAmount) {
    return this.cameraStartZ - scrollAmount * this.scrollToWorldFactor
  }

  scrollFromCameraZ(cameraZ) {
    if (this.scrollToWorldFactor === 0) return 0
    return (this.cameraStartZ - cameraZ) / this.scrollToWorldFactor
  }

  normalizeWheelDelta(event) {
    if (event.deltaMode === 1) return event.deltaY * 16
    if (event.deltaMode === 2) return event.deltaY * window.innerHeight
    return event.deltaY
  }

  addScrollInput(deltaY) {
    const scrollDirection = this.invertScroll ? -1 : 1
    this.scrollTarget += deltaY * scrollDirection
  }

  updateVelocity() {
    this.rawVelocity = this.scrollCurrent - this.previousScrollCurrent
    this.velocity = THREE.MathUtils.lerp(this.velocity, this.rawVelocity, this.velocityDamping)
    this.velocity = THREE.MathUtils.clamp(this.velocity, -this.velocityMax, this.velocityMax)

    if (Math.abs(this.velocity) < this.velocityStopThreshold) {
      this.velocity = 0
    }

    this.previousScrollCurrent = this.scrollCurrent
  }

  createVelocityVisualizer() {
    if (this.velocityVisualizerElement) return

    const container = document.createElement('div')
    container.className = 'velocity-visualizer'

    const label = document.createElement('p')
    label.className = 'velocity-visualizer__label'
    label.textContent = 'Velocity'

    const value = document.createElement('p')
    value.className = 'velocity-visualizer__value'
    value.textContent = '0.0000'

    const track = document.createElement('div')
    track.className = 'velocity-visualizer__track'

    const fill = document.createElement('div')
    fill.className = 'velocity-visualizer__fill'
    track.append(fill)

    container.append(label, value, track)
    document.body.append(container)

    this.velocityVisualizerElement = container
    this.velocityVisualizerFillElement = fill
    this.velocityVisualizerValueElement = value
    this.setVelocityVisualizerVisible(this.showVelocityVisualizer)
  }

  setVelocityVisualizerVisible(isVisible) {
    if (!this.velocityVisualizerElement) return
    const shouldShow = Boolean(isVisible) && this.debugUiVisible
    this.velocityVisualizerElement.style.display = shouldShow ? 'block' : 'none'
  }

  setDebugUiVisible(isVisible) {
    this.debugUiVisible = Boolean(isVisible)
    this.setVelocityVisualizerVisible(this.showVelocityVisualizer)
  }

  updateVelocityVisualizer() {
    if (
      !this.velocityVisualizerElement ||
      !this.velocityVisualizerFillElement ||
      !this.velocityVisualizerValueElement
    ) {
      return
    }

    const velocitySign = this.velocity === 0 ? 0 : Math.sign(this.velocity)
    const normalizedVelocity = THREE.MathUtils.clamp(
      Math.abs(this.velocity) / this.velocityMax,
      0,
      1
    )
    const fillPercent = normalizedVelocity * 50

    if (velocitySign >= 0) {
      this.velocityVisualizerFillElement.style.left = '50%'
      this.velocityVisualizerFillElement.style.width = `${fillPercent}%`
    } else {
      this.velocityVisualizerFillElement.style.left = `${50 - fillPercent}%`
      this.velocityVisualizerFillElement.style.width = `${fillPercent}%`
    }

    this.velocityVisualizerFillElement.style.backgroundColor =
      velocitySign >= 0 ? '#7fffd4' : '#ff8fab'
    this.velocityVisualizerValueElement.textContent = this.velocity.toFixed(4)
  }

  update() {
    this.updateCameraBounds()
    this.scrollCurrent = THREE.MathUtils.lerp(
      this.scrollCurrent,
      this.scrollTarget,
      this.scrollSmoothing
    )

    if (this.useScrollBounds) {
      const minimumScroll = this.scrollFromCameraZ(this.maxCameraZ)
      const maximumScroll = this.scrollFromCameraZ(this.minCameraZ)

      this.scrollTarget = THREE.MathUtils.clamp(this.scrollTarget, minimumScroll, maximumScroll)
      this.scrollCurrent = THREE.MathUtils.clamp(this.scrollCurrent, minimumScroll, maximumScroll)
    }

    this.updateVelocity()
    this.updateVelocityVisualizer()

    const nextCameraZ = this.cameraZFromScroll(this.scrollCurrent)
    if (this.useScrollBounds) {
      this.camera.position.z = THREE.MathUtils.clamp(nextCameraZ, this.minCameraZ, this.maxCameraZ)
      return
    }

    this.camera.position.z = nextCameraZ
  }

  bindDebug() {
    if (!this.debug || this.isDebugBound) return

    this.debug.addBinding({
      folderTitle: 'Scroll',
      targetObject: this,
      property: 'useScrollBounds',
      label: 'Use Bounds',
    })

    this.debug.addBinding({
      folderTitle: 'Scroll',
      targetObject: this,
      property: 'invertScroll',
      label: 'Invert Scroll',
    })

    this.debug.addBinding({
      folderTitle: 'Scroll',
      targetObject: this,
      property: 'showVelocityVisualizer',
      label: 'Debug Velocity',
      onChange: (value) => {
        this.setVelocityVisualizerVisible(value)
      },
    })

    this.debug.addBinding({
      folderTitle: 'Scroll',
      targetObject: this,
      property: 'velocityDamping',
      label: 'Velocity Damping',
      options: {
        min: 0.01,
        max: 1,
        step: 0.01,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Scroll',
      targetObject: this,
      property: 'velocityMax',
      label: 'Velocity Max',
      options: {
        min: 0.1,
        max: 5,
        step: 0.1,
      },
    })

    this.isDebugBound = true
  }

  dispose() {
    window.removeEventListener('wheel', this.onWheel)
    window.removeEventListener('touchstart', this.onTouchStart)
    window.removeEventListener('touchmove', this.onTouchMove)

    if (this.velocityVisualizerElement) {
      this.velocityVisualizerElement.remove()
    }
    this.velocityVisualizerElement = null
    this.velocityVisualizerFillElement = null
    this.velocityVisualizerValueElement = null
  }
}

class Trail {
  constructor() {
    this.group = new THREE.Group()
    this.points = []
    this.mesh = null

    this.minDistance = 0.006 // Minimum movement before adding a point
    this.maxPoints = 220 // Maximum points kept in the trail
    this.curveTension = 0.5 // Curviness of Catmull-Rom spline
    this.curveSegments = 220 // Max tube segments along the curve
    this.radialSegments = 8 // Tube roundness (sides around)
    this.radiusHead = 0.012 // Radius near latest point
    this.radiusTail = 0.003 // Radius near oldest point
    this.pointSmoothing = 0.3 // Lerp smoothing when adding points
    this.maxTrimPerFrame = 4 // Max point removals per frame
    this.jumpResetDistance = 999 // Hard reset threshold for huge jumps

    this.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#f6f9ff'),
      emissive: new THREE.Color('#7fd5ff'),
      emissiveIntensity: 1.35,
      roughness: 0.2,
      metalness: 0.05,
      transparent: true,
      opacity: 0.84,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
    })
  }

  get object() {
    return this.group
  }

  addPoint(position) {
    if (!(position instanceof THREE.Vector3)) return

    const lastPoint = this.points[this.points.length - 1] || null // Current trail tip

    if (lastPoint && position.distanceToSquared(lastPoint) < this.minDistance * this.minDistance) {
      return
    }

    const nextPoint = position.clone() // Safe copy of incoming point

    // On large jumps, restart the trail so it snaps cleanly.
    if (lastPoint && nextPoint.distanceTo(lastPoint) > this.jumpResetDistance) {
      this.points = [nextPoint]

      if (this.mesh) {
        this.mesh.geometry.dispose()
        this.group.remove(this.mesh)
        this.mesh = null
      }

      return
    }

    const easedPoint = lastPoint
      ? lastPoint.clone().lerp(nextPoint, this.pointSmoothing)
      : nextPoint
    this.points.push(easedPoint)

    let trimBudget = this.maxTrimPerFrame // Removal budget this frame
    while (this.points.length > this.maxPoints && trimBudget > 0) {
      this.points.shift()
      trimBudget -= 1
    }

    if (this.points.length < 2) {
      return
    }

    const curve = new THREE.CatmullRomCurve3(this.points, false, 'centripetal', this.curveTension)
    const segments = Math.max(24, Math.min(this.curveSegments, this.points.length * 4))
    const nextGeometry = this.createTaperedTube(curve, segments, this.radiusHead, this.radiusTail)

    if (!this.mesh) {
      this.mesh = new THREE.Mesh(nextGeometry, this.material)
      this.mesh.renderOrder = 1200
      this.group.add(this.mesh)
      return
    }

    this.mesh.geometry.dispose()
    this.mesh.geometry = nextGeometry
  }

  createTaperedTube(curve, segments, radiusHead, radiusTail) {
    const pathPoints = curve.getSpacedPoints(segments) // Points sampled on the curve
    const radialSegments = this.radialSegments // Number of points per ring
    const ringPoints = radialSegments + 1 // Closed ring needs one extra point

    const vertices = []
    const indices = []

    const up = new THREE.Vector3(0, 0, 1) // Reference up direction
    const tangent = new THREE.Vector3() // Forward direction on curve
    const normal = new THREE.Vector3() // Right/side direction on ring
    const binormal = new THREE.Vector3() // Up direction on ring plane
    const radialOffset = new THREE.Vector3() // Offset from path center to ring vertex
    const vertexPosition = new THREE.Vector3() // Final vertex position

    for (let i = 0; i < pathPoints.length; i += 1) {
      const t = i / Math.max(pathPoints.length - 1, 1) // 0..1 position on path
      const radius = radiusHead + (radiusTail - radiusHead) * Math.pow(t, 1.5) // Taper from head to tail

      curve.getTangent(t, tangent).normalize()
      normal.crossVectors(up, tangent).normalize()

      if (normal.lengthSq() === 0) {
        normal.set(1, 0, 0) // Fallback when tangent is parallel to up
      }

      binormal.crossVectors(tangent, normal).normalize()

      for (let j = 0; j <= radialSegments; j += 1) {
        const angle = (j / radialSegments) * Math.PI * 2 // Angle around current ring
        const cx = -Math.cos(angle) * radius // Ring X offset in local frame
        const cy = Math.sin(angle) * radius // Ring Y offset in local frame

        radialOffset.copy(normal).multiplyScalar(cx).addScaledVector(binormal, cy)

        vertexPosition.copy(pathPoints[i]).add(radialOffset)
        vertices.push(vertexPosition.x, vertexPosition.y, vertexPosition.z)
      }
    }

    for (let i = 0; i < pathPoints.length - 1; i += 1) {
      for (let j = 0; j < radialSegments; j += 1) {
        const baseIndex = i * ringPoints + j // Current quad corner index
        indices.push(baseIndex, baseIndex + ringPoints, baseIndex + 1)
        indices.push(baseIndex + ringPoints, baseIndex + ringPoints + 1, baseIndex + 1)
      }
    }

    const geometry = new THREE.BufferGeometry() // Output geometry
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()

    return geometry
  }

  dispose() {
    this.reset()
    this.material.dispose()
  }

  reset() {
    if (this.mesh) {
      this.mesh.geometry.dispose()
      this.group.remove(this.mesh)
      this.mesh = null
    }

    this.points = []
  }
}

class TrailHeadParticles {
  constructor() {
    this.group = new THREE.Group()
    this.group.renderOrder = 1300

    this.isEnabled = true // Master on/off switch
    this.maxParticles = 18 // Pool size (max particles alive)
    this.spawnPerSecond = 20 // Spawn rate when active
    this.spawnRadius = 0.52 // Spawn radius around trail head
    this.speedMin = 0.05 // Minimum particle drift speed
    this.speedMax = 0.22 // Maximum particle drift speed
    this.lifeMin = 0.25 // Minimum life in seconds
    this.lifeMax = 0.6 // Maximum life in seconds
    this.sizeMin = 0.007 // Minimum particle size
    this.sizeMax = 0.02 // Maximum particle size
    this.dragPerFrame = 0.94 // Velocity damping per frame

    this.spawnAccumulator = 0 // Keeps fractional spawn remainder
    this.nextSpawnIndex = 0 // Circular index in particle pool
    this.sharedGeometry = new THREE.SphereGeometry(1, 5, 4) // Reused mesh geometry
    this.particles = [] // Particle pool

    for (let index = 0; index < this.maxParticles; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#f6f9ff'),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
      })

      const mesh = new THREE.Mesh(this.sharedGeometry, material)
      mesh.visible = false
      this.group.add(mesh)

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(), // Current movement vector
        lifeRemaining: 0, // Remaining life in seconds
        totalLife: 0, // Initial life used for fade ratio
      })
    }
  }

  get object() {
    return this.group
  }

  setEnabled(isEnabled) {
    if (this.isEnabled && !isEnabled) {
      this.clear()
    }

    this.isEnabled = Boolean(isEnabled)
    this.group.visible = this.isEnabled
  }

  update(deltaSeconds, headPosition, opacity = 1, shouldSpawn = true) {
    const safeDelta = Math.min(Math.max(deltaSeconds || 0, 0), 0.1) // Clamp unstable frame delta

    if (this.isEnabled && shouldSpawn && safeDelta > 0) {
      this.spawnAccumulator += safeDelta * this.spawnPerSecond
      const spawnCount = Math.floor(this.spawnAccumulator)
      this.spawnAccumulator -= spawnCount

      for (let index = 0; index < spawnCount; index += 1) {
        this.spawnParticle(headPosition)
      }
    } else {
      this.spawnAccumulator = 0
    }

    const clampedOpacity = THREE.MathUtils.clamp(opacity, 0, 1)
    const drag = Math.pow(this.dragPerFrame, safeDelta * 60)

    this.particles.forEach((particle) => {
      if (particle.lifeRemaining <= 0) return

      particle.lifeRemaining -= safeDelta
      if (particle.lifeRemaining <= 0) {
        particle.lifeRemaining = 0
        particle.mesh.visible = false
        particle.mesh.material.opacity = 0
        return
      }

      particle.velocity.multiplyScalar(drag)
      particle.mesh.position.addScaledVector(particle.velocity, safeDelta)

      const lifeRatio = particle.lifeRemaining / particle.totalLife // 1 at birth, 0 at death
      particle.mesh.material.opacity = lifeRatio * clampedOpacity * 0.75
    })
  }

  spawnParticle(headPosition) {
    const particle = this.particles[this.nextSpawnIndex]
    this.nextSpawnIndex = (this.nextSpawnIndex + 1) % this.particles.length

    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * this.spawnRadius

    particle.mesh.position.set(
      headPosition.x + Math.cos(angle) * radius,
      headPosition.y + (Math.random() - 0.5) * this.spawnRadius * 0.6,
      headPosition.z + Math.sin(angle) * radius
    )

    const size = THREE.MathUtils.lerp(this.sizeMin, this.sizeMax, Math.random())
    particle.mesh.scale.setScalar(size)
    particle.mesh.visible = true

    const speed = THREE.MathUtils.lerp(this.speedMin, this.speedMax, Math.random())
    particle.velocity.set(
      (Math.random() - 0.5) * speed,
      (Math.random() - 0.5) * speed * 0.6,
      (Math.random() - 0.5) * speed
    )

    particle.totalLife = THREE.MathUtils.lerp(this.lifeMin, this.lifeMax, Math.random())
    particle.lifeRemaining = particle.totalLife
    particle.mesh.material.opacity = 0.4
  }

  dispose() {
    this.clear()
    this.particles.forEach((particle) => {
      particle.mesh.material.dispose()
    })
    this.sharedGeometry.dispose()
    this.group.clear()
    this.particles = []
  }

  clear() {
    this.spawnAccumulator = 0
    this.particles.forEach((particle) => {
      particle.lifeRemaining = 0
      particle.totalLife = 0
      particle.mesh.visible = false
      particle.mesh.material.opacity = 0
    })
  }
}

const FULL_CIRCLE_RADIANS = Math.PI * 2 // 360 degrees in radians.

class TrailController {
  constructor({ gallery, debug = null }) {
    this.trail = new Trail()
    this.trailHeadParticles = new TrailHeadParticles() // Optional sparkle experiment near trail head.
    this.gallery = gallery
    this.debug = debug
    this.hasBoundDebug = false
    this.trailHeadPosition = new THREE.Vector3() // Reused head position vector
    this.timer = new MiniTimer()

    this.configuration = {
      isEnabled: true,
      pathSettings: {
        startXPosition: -0.96, // Base X where the path starts
        startYPosition: -1.05, // Base Y where the path starts
        horizontalWidth: 3, // How wide the path goes left/right
        horizontalCycles: 1.85, // Number of horizontal waves
        verticalAmplitude: 0.78, // How much the path moves up/down
        verticalCycles: 2.1, // Number of vertical waves
        distanceAheadOfCamera: 1.65, // Base forward offset from camera
        baseDepthOffset: 4.78, // Base depth subtraction
        depthSpan: 6.52, // Extra depth across full progress
        progressDepthOffset: -0.1, // Bias so trail appears earlier at start
      },
      responsiveSettings: {
        mobileBreakpoint: 768, // Mobile viewport limit in pixels.
        mobileWidthScale: 0.35, // Horizontal width multiplier on mobile.
        mobileStartXOffset: 0.35, // Extra X offset applied on mobile.
      },
      pointSettings: {
        minimumPointCount: 14, // Trail length near start
        maximumPointCount: 220, // Trail length near end
        reverseLengthScale: 0.55, // Shrink length while reversing
        initialSeedPointCount: 10, // Number of startup seed points
        initialSeedStepZ: 0.12, // Z spacing between startup points
        trimPerFrameForward: 4, // Max old points removed per frame (forward)
        trimPerFrameReverse: 32, // Max old points removed per frame (reverse)
      },
      opacitySettings: {
        baseOpacity: 0.51, // Max material opacity
        idleOpacityAtStart: 0.55, // Opacity when user has not moved yet
        idleProgressThreshold: 0.01, // Progress considered as "at start"
        startVisibilityBias: 0.1, // Boost visibility near start
        edgeFadeStart: 0.04, // Edge fade lower bound
        edgeFadeEnd: 0.2, // Edge fade upper bound
        opacitySmoothing: 0.12, // Opacity lerp speed
      },
      visualSettings: {
        trailColor: '#f6f9ff', // Main trail color
        glowColor: '#ffffff', // Emissive color
        glowIntensity: 1.35, // Emissive intensity
        curveTension: 0.67, // Curviness of the generated spline
        pointSmoothing: 0.53, // Smoothing when adding new points
      },
      specialEffectsSettings: {
        showHeadParticles: true, // Quick toggle for the experimental sparkle effect.
      },
      directionChangeEpsilon: 0.0005, // Ignore tiny direction noise
    }

    this.runtimeState = {
      hasSeededInitialPoints: false, // Avoid seeding twice
      hasUserMovedFromStart: false, // Becomes true after first real scroll
      previousProgress: null, // Last frame progress
      previousDirection: 0, // Last non-zero direction (-1 or 1)
      currentOpacity: this.configuration.opacitySettings.baseOpacity, // Smoothed opacity value
    }

    this.applyVisualSettings()
  }

  applyVisualSettings() {
    const { visualSettings, opacitySettings } = this.configuration
    this.trail.material.color.set(visualSettings.trailColor)
    this.trail.material.emissive.set(visualSettings.glowColor)
    this.trail.material.emissiveIntensity = visualSettings.glowIntensity
    this.trail.material.opacity = opacitySettings.baseOpacity
    this.trail.material.needsUpdate = true
    this.trail.curveTension = visualSettings.curveTension
    this.trail.pointSmoothing = visualSettings.pointSmoothing
    this.trailHeadParticles.particles.forEach((particle) => {
      particle.mesh.material.color.set(visualSettings.trailColor)
    })
  }

  init(scene, camera) {
    scene.add(this.trail.object)
    scene.add(this.trailHeadParticles.object)
    this.seedInitialPoints(camera)
    this.bindDebug()
  }

  dispose() {
    this.trail.dispose()
    this.trailHeadParticles.dispose()
    this.runtimeState.hasSeededInitialPoints = false
    this.runtimeState.hasUserMovedFromStart = false
    this.runtimeState.previousProgress = null
    this.runtimeState.previousDirection = 0
    this.hasBoundDebug = false
  }

  update(camera = null, scroll = null, time = null) {
    if (!camera) return
    if (Number.isFinite(time)) {
      this.timer.update(time)
    } else {
      this.timer.update()
    }
    const deltaSeconds = this.timer.getDelta()

    this.trail.object.visible = this.configuration.isEnabled
    const shouldShowHeadParticles =
      this.configuration.isEnabled && this.configuration.specialEffectsSettings.showHeadParticles
    this.trailHeadParticles.setEnabled(shouldShowHeadParticles)
    if (!this.configuration.isEnabled) return

    const currentProgress = this.getProgress(camera, scroll) // Normalized 0..1 progress.
    if (currentProgress > this.configuration.opacitySettings.idleProgressThreshold) {
      this.runtimeState.hasUserMovedFromStart = true
    }

    const currentDirection = this.getDirection(currentProgress) // -1, 0, or 1.
    const hasDirectionReversed =
      currentDirection !== 0 &&
      this.runtimeState.previousDirection !== 0 &&
      currentDirection !== this.runtimeState.previousDirection

    this.updateLength(currentProgress, currentDirection || this.runtimeState.previousDirection)
    const trailHeadPosition = this.computeHeadPosition(camera.position.z, currentProgress)
    this.updateOpacity(currentProgress)

    if (hasDirectionReversed) {
      this.trail.reset()
      const restartLeadPosition = trailHeadPosition.clone() // Small lead point after reset.
      restartLeadPosition.z += currentDirection * this.configuration.pointSettings.initialSeedStepZ
      this.trail.addPoint(restartLeadPosition)
    }

    this.trail.addPoint(trailHeadPosition)

    if (currentDirection !== 0) {
      this.runtimeState.previousDirection = currentDirection
    }
    this.runtimeState.previousProgress = currentProgress

    this.trailHeadParticles.update(
      deltaSeconds,
      trailHeadPosition,
      this.runtimeState.currentOpacity,
      true
    )
  }

  bindDebug() {
    if (!this.debug || this.hasBoundDebug) return

    this.debug.addBinding({
      folderTitle: 'Trail',
      targetObject: this.configuration,
      property: 'isEnabled',
      label: 'Enabled',
      onChange: (value) => {
        this.trail.object.visible = Boolean(value)
      },
    })

    this.debug.addBinding({
      folderTitle: 'Trail',
      targetObject: this.configuration.pathSettings,
      property: 'horizontalWidth',
      label: 'Width',
      options: { min: 0.2, max: 6, step: 0.01 },
    })

    this.debug.addBinding({
      folderTitle: 'Trail',
      targetObject: this.configuration.pathSettings,
      property: 'horizontalCycles',
      label: 'Curves',
      options: { min: 0.2, max: 4, step: 0.01 },
    })

    this.debug.addBinding({
      folderTitle: 'Trail',
      targetObject: this.configuration.opacitySettings,
      property: 'baseOpacity',
      label: 'Opacity',
      options: { min: 0, max: 1, step: 0.01 },
    })

    this.debug.addBinding({
      folderTitle: 'Trail',
      targetObject: this.configuration.specialEffectsSettings,
      property: 'showHeadParticles',
      label: 'Particles',
    })

    this.hasBoundDebug = true
  }

  getProgress(camera, scroll) {
    const scrollRange = (scroll?.maxCameraZ ?? 0) - (scroll?.minCameraZ ?? 0) // Scroll camera range.

    if (Number.isFinite(scrollRange) && scrollRange > 0) {
      return THREE.MathUtils.clamp(
        ((scroll?.maxCameraZ ?? camera.position.z) - camera.position.z) / scrollRange,
        0,
        1
      )
    }

    const blend = this.gallery.getPlaneBlendData(camera.position.z) // Fallback blended progress.
    if (blend) {
      const lastIndex = Math.max(this.gallery.planes.length - 1, 1) // Safe divisor.
      return THREE.MathUtils.clamp((blend.currentPlaneIndex + blend.blend) / lastIndex, 0, 1)
    }

    return this.gallery.getDepthProgress(camera.position.z) // Final fallback.
  }

  computeHeadPosition(cameraZ, progress) {
    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1) // Keep values stable.
    const { pathSettings, responsiveSettings } = this.configuration // Local shortcut.
    const horizontalCycles = Math.max(pathSettings.horizontalCycles, 0.0001) // Avoid zero cycles.
    const verticalCycles = Math.max(pathSettings.verticalCycles, 0.0001) // Avoid zero cycles.
    const isMobileViewport =
      typeof window !== 'undefined' && window.innerWidth <= responsiveSettings.mobileBreakpoint
    const responsiveStartXPosition =
      pathSettings.startXPosition + (isMobileViewport ? responsiveSettings.mobileStartXOffset : 0)
    const responsiveHorizontalWidth =
      pathSettings.horizontalWidth * (isMobileViewport ? responsiveSettings.mobileWidthScale : 1)

    const xPosition =
      responsiveStartXPosition +
      Math.sin(clampedProgress * FULL_CIRCLE_RADIANS * horizontalCycles) * responsiveHorizontalWidth

    const yPosition =
      pathSettings.startYPosition +
      Math.sin(clampedProgress * FULL_CIRCLE_RADIANS * verticalCycles) *
        pathSettings.verticalAmplitude

    const depthProgress =
      pathSettings.progressDepthOffset + clampedProgress * (1 - pathSettings.progressDepthOffset)

    const zPosition =
      cameraZ +
      pathSettings.distanceAheadOfCamera -
      (pathSettings.baseDepthOffset + depthProgress * pathSettings.depthSpan)

    this.trailHeadPosition.set(xPosition, yPosition, zPosition)
    return this.trailHeadPosition
  }

  seedInitialPoints(camera) {
    if (this.runtimeState.hasSeededInitialPoints || !camera) return

    const startPosition = this.computeHeadPosition(camera.position.z, 0).clone() // Seed anchor point.

    for (
      let index = this.configuration.pointSettings.initialSeedPointCount;
      index >= 0;
      index -= 1
    ) {
      const seedPosition = startPosition.clone() // One startup seed point.
      seedPosition.z -= index * this.configuration.pointSettings.initialSeedStepZ
      this.trail.addPoint(seedPosition)
    }

    this.runtimeState.hasSeededInitialPoints = true
  }

  getDirection(progress) {
    if (this.runtimeState.previousProgress === null) return 0

    const progressDelta = progress - this.runtimeState.previousProgress // Progress movement this frame.
    if (Math.abs(progressDelta) <= this.configuration.directionChangeEpsilon) return 0

    return Math.sign(progressDelta)
  }

  updateLength(progress, direction) {
    const { pointSettings } = this.configuration // Local shortcut.
    const lengthProgress = direction < 0 ? progress * pointSettings.reverseLengthScale : progress

    this.trail.maxPoints = Math.round(
      THREE.MathUtils.lerp(
        pointSettings.minimumPointCount,
        pointSettings.maximumPointCount,
        THREE.MathUtils.clamp(lengthProgress, 0, 1)
      )
    )

    this.trail.maxTrimPerFrame =
      direction < 0 ? pointSettings.trimPerFrameReverse : pointSettings.trimPerFrameForward
  }

  updateOpacity(progress) {
    const { opacitySettings } = this.configuration // Local shortcut.

    const startDistance = THREE.MathUtils.clamp(
      progress + opacitySettings.startVisibilityBias,
      0,
      1
    ) // Distance from start edge.

    const endDistance = 1 - progress // Distance from end edge.
    const closestEdgeDistance = Math.min(startDistance, endDistance) // Nearest edge distance.

    const edgeVisibility = THREE.MathUtils.smoothstep(
      closestEdgeDistance,
      opacitySettings.edgeFadeStart,
      opacitySettings.edgeFadeEnd
    )

    const startupVisibility =
      !this.runtimeState.hasUserMovedFromStart && progress <= opacitySettings.idleProgressThreshold
        ? opacitySettings.idleOpacityAtStart
        : 0

    const visibility = Math.max(edgeVisibility, startupVisibility) // Keep strongest visibility.
    const targetOpacity = opacitySettings.baseOpacity * visibility

    this.runtimeState.currentOpacity = THREE.MathUtils.lerp(
      this.runtimeState.currentOpacity,
      targetOpacity,
      opacitySettings.opacitySmoothing
    )

    this.trail.material.opacity = this.runtimeState.currentOpacity
  }
}

class Experience {
  constructor() {
    this.isInitialized = false
    this.isDisposed = false
    this.frameDarkPlaneCount = 2
    this.isFrameTextDark = null
    this.debug = new Debug()
    this.gallery = new Gallery(this.debug)
    this.label = new Label(this.gallery)
    this.background = new Background(this.debug)
    this.trailController = new TrailController({
      gallery: this.gallery,
      debug: this.debug,
    })
  }

  async init(scene, camera) {
    if (this.isInitialized) return

    await this.gallery.init(scene)
    this.label.init()
    this.background.init()
    this.trailController.init(scene, camera)

    const initialPlaneBlendData = this.gallery.getPlaneBlendData(camera.position.z)
    this.updateFrameTextTone(initialPlaneBlendData)

    this.isInitialized = true
  }

  updateFrameTextTone(planeBlendData) {
    if (!planeBlendData) return

    const nearestPlaneIndex =
      planeBlendData.blend >= 0.5 ? planeBlendData.nextPlaneIndex : planeBlendData.currentPlaneIndex
    const shouldUseDarkText = nearestPlaneIndex < this.frameDarkPlaneCount

    if (this.isFrameTextDark === shouldUseDarkText) return

    this.isFrameTextDark = shouldUseDarkText
    document.body.classList.toggle('frame-text-dark', shouldUseDarkText)
  }

  update(time, camera = null, scroll = null) {
    this.trailController.update(camera, scroll, time)

    // Gallery + label
    this.gallery.update(camera, scroll)
    this.label.update(camera)

    // Camera-driven updates
    if (camera) {
      // Frame text tone
      const planeBlendData = this.gallery.getPlaneBlendData(camera.position.z)
      this.updateFrameTextTone(planeBlendData)

      // Mood colors
      const moodBlendData = this.gallery.getMoodBlendData(camera.position.z)
      if (moodBlendData) {
        this.background.setMoodBlend(moodBlendData)
      }

      // Depth + velocity -> background motion response
      const depthProgress = this.gallery.getDepthProgress(camera.position.z)
      const velocityMax = scroll?.velocityMax || 1
      const velocityIntensity = THREE.MathUtils.clamp(
        Math.abs(scroll?.velocity || 0) / Math.max(velocityMax, 0.0001),
        0,
        1
      )
      const blend = planeBlendData?.blend ?? 0
      const distanceFromBlendCenter = Math.abs(blend - 0.5) * 2
      const transitionStability = THREE.MathUtils.smoothstep(distanceFromBlendCenter, 0.35, 1)
      const stabilizedVelocityIntensity = velocityIntensity * transitionStability

      this.background.setMotionResponse({
        depthProgress,
        velocityIntensity: stabilizedVelocityIntensity,
      })
    }

    // Background tick
    this.background.update(time)
  }

  dispose() {
    if (this.isDisposed) return

    this.trailController.dispose()
    this.gallery.dispose()
    this.label.dispose()
    this.background.dispose()
    this.isDisposed = true
  }
}

const world = new Experience()

class Engine {
  constructor(canvas, experience = world) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Engine requires a valid canvas element')
    }

    // Initialization
    this.canvas = canvas
    this.experience = experience
    this.debug = this.experience.debug
    this.isInitialized = false
    this.isRunning = false
    this.isDebugBound = false
    this.animationFrameRequestId = null
    this.preloadedTextures = new Map()
    this.stats = null
    this.showFps = true
    this.isDebugUiVisible = false
    this.scene = new THREE.Scene()

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    this.camera.position.set(0, 0, 6)

    // Scroll
    this.scroll = new Scroll(this.camera, this.experience.gallery, this.debug)

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.autoClear = false

    this.onResize = () => {
      this.resize()
    }
    this.onKeyDown = (event) => {
      if (event.repeat) return
      if (event.key.toLowerCase() !== 'd') return
      this.setDebugUiVisible(!this.isDebugUiVisible)
    }

    this.animate = this.update.bind(this)
  }

  async init() {
    if (this.isInitialized) return

    document.body.classList.add('loading')

    try {
      this.preloadedTextures = await this.preloadTextures()
      this.experience.gallery.setPreloadedTextures(this.preloadedTextures)

      await this.experience.init(this.scene, this.camera)
      this.scroll.init()
      this.initStats()
      this.bindDebug()
      this.setDebugUiVisible(false)

      this.resize()
      window.addEventListener('resize', this.onResize)
      window.addEventListener('keydown', this.onKeyDown)
      this.scroll.bindEvents()

      this.isInitialized = true
      this.start()
    } finally {
      document.body.classList.remove('loading')
    }
  }

  start() {
    if (!this.isInitialized || this.isRunning) return

    this.isRunning = true
    this.update()
  }

  resize() {
    const width = this.canvas.clientWidth || window.innerWidth || 1
    const height = this.canvas.clientHeight || window.innerHeight || 1
    if (width <= 0 || height <= 0) return

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
    this.experience.gallery.updatePlaneScale()
    this.experience.gallery.layoutPlanes()
    this.experience.label.resize(width, height)
  }

  async preloadTextures() {
    const textureSources = this.experience.gallery.getTextureSources()
    if (!textureSources.length) return new Map()

    const textureLoader = new THREE.TextureLoader()
    const loadedTextures = new Map()

    await Promise.all(
      textureSources.map(async (textureSource) => {
        try {
          const texture = await textureLoader.loadAsync(textureSource)
          texture.colorSpace = THREE.SRGBColorSpace
          loadedTextures.set(textureSource, texture)
        } catch (error) {
          console.warn(`Texture failed to load: ${textureSource}`, error)
        }
      })
    )

    return loadedTextures
  }

  update() {
    if (!this.isRunning) return

    this.animationFrameRequestId = requestAnimationFrame(this.animate)
    this.stats?.begin()

    const time = performance.now()

    this.scroll.update()
    this.experience.update(time, this.camera, this.scroll)

    this.renderer.clear(true, true, true)
    this.experience.background.render(this.renderer)
    this.renderer.clearDepth()
    this.renderer.render(this.scene, this.camera)
    this.experience.label.render()
    this.stats?.end()
  }

  initStats() {
    if (this.stats) return

    this.stats = new Stats()
    this.stats.showPanel(0)
    this.stats.dom.classList.add('fps-stats')
    document.body.append(this.stats.dom)
    this.setFpsVisible(this.showFps)
  }

  setFpsVisible(isVisible) {
    if (!this.stats) return
    const shouldShow = Boolean(isVisible) && this.isDebugUiVisible
    this.stats.dom.style.display = shouldShow ? 'block' : 'none'
  }

  setDebugUiVisible(isVisible) {
    this.isDebugUiVisible = Boolean(isVisible)
    this.debug?.setVisible(this.isDebugUiVisible)
    this.scroll?.setDebugUiVisible(this.isDebugUiVisible)
    this.setFpsVisible(this.showFps)
  }

  bindDebug() {
    if (!this.debug || this.isDebugBound) return

    this.debug.addBinding({
      folderTitle: 'Engine',
      targetObject: this,
      property: 'showFps',
      label: 'Show FPS',
      onChange: (value) => {
        this.setFpsVisible(value)
      },
    })

    this.isDebugBound = true
  }

  dispose() {
    this.isRunning = false

    if (this.animationFrameRequestId !== null) {
      cancelAnimationFrame(this.animationFrameRequestId)
      this.animationFrameRequestId = null
    }

    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('keydown', this.onKeyDown)
    this.scroll.dispose()

    this.preloadedTextures.forEach((texture) => {
      texture.dispose()
    })
    this.preloadedTextures.clear()
    this.stats?.dom.remove()
    this.stats = null
    this.experience.dispose?.()
  }
}

/* ---- bootstrap ---- */
const canvas = document.querySelector('.webgl')
if (canvas instanceof HTMLCanvasElement) {
  const engine = new Engine(canvas)
  engine.init().catch((error) => { console.error('Depth gallery init failed', error) })
} else {
  console.error('Missing .webgl canvas element')
}
