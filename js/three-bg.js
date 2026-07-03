import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('bg-canvas');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = window.innerWidth < 768;

if (!canvas || reduceMotion) {
  // Skip heavy 3D scene entirely — CSS gradient background already applied.
} else {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) {
    renderer = null;
  }

  if (renderer) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 13);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const green = 0x14e07f;
    const gold = 0xf5b942;

    // ---- Floating crates (low-poly boxes) ----
    const crateGroup = new THREE.Group();
    const crateCount = isSmall ? 6 : 12;
    const crates = [];

    for (let i = 0; i < crateCount; i++) {
      const size = 0.4 + Math.random() * 0.9;
      const geo = new THREE.BoxGeometry(size, size, size);
      const edges = new THREE.EdgesGeometry(geo);
      const color = i % 3 === 0 ? gold : green;
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 + Math.random() * 0.25 });
      const wire = new THREE.LineSegments(edges, mat);

      const spread = 9;
      wire.position.set(
        (Math.random() - 0.5) * spread * 1.6,
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * 6 - 2
      );
      wire.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      const speed = 0.15 + Math.random() * 0.25;
      const axis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const floatOffset = Math.random() * Math.PI * 2;

      crates.push({ mesh: wire, speed, axis, floatOffset, baseY: wire.position.y });
      crateGroup.add(wire);
    }
    scene.add(crateGroup);

    // ---- Particle network ----
    const particleCount = isSmall ? 60 : 130;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({ color: green, size: 0.045, transparent: true, opacity: 0.55 });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ---- Connecting lines between nearby particles (network feel) ----
    const linePositions = [];
    const maxDist = 2.6;
    const maxLines = isSmall ? 40 : 90;
    let lineCount = 0;
    outer:
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < maxDist) {
          linePositions.push(positions[i*3], positions[i*3+1], positions[i*3+2]);
          linePositions.push(positions[j*3], positions[j*3+1], positions[j*3+2]);
          lineCount++;
          if (lineCount >= maxLines) break outer;
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    const lineMat = new THREE.LineBasicMaterial({ color: green, transparent: true, opacity: 0.08 });
    const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lineMesh);

    // ---- Mouse parallax ----
    let mouseX = 0, mouseY = 0;
    window.addEventListener('pointermove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5);
      mouseY = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);

    let running = true;
    document.addEventListener('visibilitychange', () => {
      running = document.visibilityState === 'visible';
      if (running) animate();
    });

    const clock = new THREE.Clock();

    function animate() {
      if (!running) return;
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      crates.forEach((c) => {
        c.mesh.rotation.x += c.speed * 0.006;
        c.mesh.rotation.y += c.speed * 0.008;
        c.mesh.position.y = c.baseY + Math.sin(t * 0.5 + c.floatOffset) * 0.4;
      });

      particles.rotation.y = t * 0.015;
      lineMesh.rotation.y = t * 0.015;

      camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 1.2 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    animate();
  }
}
