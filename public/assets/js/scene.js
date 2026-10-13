/**
 * Persistent WebGL background: a 3D rendition of the Infinite Clicks
 * cursor/infinity mark that drifts and rotates as the page scrolls.
 * Fails silently (canvas stays empty) if WebGL or THREE is unavailable.
 */
(() => {
  'use strict';

  const canvas = document.getElementById('webgl-bg');
  if (!canvas || typeof THREE === 'undefined') return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    return;
  }
  if (!renderer) return;

  canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 6.5);

  // Lighting — cool ambient base plus cyan/blue accent rim lights
  scene.add(new THREE.AmbientLight(0x30405c, 1.4));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.position.set(4, 5, 6);
  scene.add(keyLight);
  const cyanLight = new THREE.PointLight(0x22d3ee, 22, 24);
  cyanLight.position.set(-3, 1.6, 3);
  scene.add(cyanLight);
  const blueLight = new THREE.PointLight(0x2f6fed, 16, 24);
  blueLight.position.set(3, -1.6, 2);
  scene.add(blueLight);

  // Infinity mark geometry — lemniscate of Gerono, extruded into a tube
  function buildInfinityCurve(scale) {
    const points = [];
    const segments = 220;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const x = Math.cos(t) * scale;
      const y = Math.sin(t) * Math.cos(t) * scale;
      const z = Math.sin(t * 2) * scale * 0.12;
      points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(points, true);
  }

  const curve = buildInfinityCurve(1.7);
  const tubeGeometry = new THREE.TubeGeometry(curve, 260, 0.16, 32, true);
  const tubeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x3b7fd6,
    metalness: 0.9,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    emissive: 0x0c2a3a,
    emissiveIntensity: 0.55,
  });
  const infinityMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
  infinityMesh.position.set(isMobile ? 0.3 : 1.2, 0, 0);
  scene.add(infinityMesh);

  // Ambient particle field, echoing the brand mockups' drifting-dot swirl
  const particleCount = prefersReducedMotion ? 180 : isMobile ? 420 : 900;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const r = 5 + Math.random() * 6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi) - 4;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x22d3ee,
    size: 0.03,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  // Static pose for users who prefer reduced motion: render once, then stop.
  if (prefersReducedMotion) {
    camera.lookAt(infinityMesh.position);
    renderer.render(scene, camera);
    window.addEventListener('resize', () => renderer.render(scene, camera));
    return;
  }

  // Mouse parallax (lerped for smoothness)
  const mouse = { x: 0, y: 0 };
  const mouseTarget = { x: 0, y: 0 };
  window.addEventListener(
    'pointermove',
    (e) => {
      mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseTarget.y = (e.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true }
  );

  // Scroll progress (0 -> 1 across the whole page) drives the mesh through
  // the scene so it reads differently each time it peeks through a section gap.
  let scrollProgress = 0;
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: (self) => {
        scrollProgress = self.progress;
      },
    });
  } else {
    window.addEventListener(
      'scroll',
      () => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        scrollProgress = max > 0 ? window.scrollY / max : 0;
      },
      { passive: true }
    );
  }

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    mouse.x += (mouseTarget.x - mouse.x) * 0.04;
    mouse.y += (mouseTarget.y - mouse.y) * 0.04;

    infinityMesh.rotation.y = scrollProgress * Math.PI * 5 + elapsed * 0.12 + mouse.x * 0.3;
    infinityMesh.rotation.x = Math.sin(elapsed * 0.2) * 0.15 + scrollProgress * Math.PI * 0.6 + mouse.y * 0.2;
    infinityMesh.position.y = Math.sin(scrollProgress * Math.PI * 2) * 1.1;
    infinityMesh.position.x = (isMobile ? 0.3 : 1.2) - scrollProgress * 0.6;

    particles.rotation.y = elapsed * 0.015 + scrollProgress * Math.PI * 0.5;

    camera.position.x += (mouse.x * 0.4 - camera.position.x) * 0.05;
    camera.position.y += (-mouse.y * 0.3 - camera.position.y) * 0.05;
    camera.lookAt(infinityMesh.position);

    renderer.render(scene, camera);
  }

  animate();
})();
