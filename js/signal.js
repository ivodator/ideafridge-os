import * as THREE from '../vendor/three.module.min.js';

export function initSignal() {
  const canvas = document.querySelector('#signal-canvas');
  const host = canvas.parentElement;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); } catch { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0xffffff, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(0, 0, 9.1);
  const group = new THREE.Group();
  group.rotation.set(-0.08, -0.25, -0.04);
  scene.add(group);
  scene.add(new THREE.AmbientLight(0xffffff, 2.3));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(-3, 5, 6);
  scene.add(light);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xc6c6c0, transparent: true, opacity: 0.75 });
  const rimMaterial = new THREE.MeshStandardMaterial({ color: 0xe4e4de, metalness: 0.15, roughness: 0.45 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.75 });
  const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const nodeGeometry = new THREE.SphereGeometry(0.065, 12, 8);
  const pulseGeometry = new THREE.SphereGeometry(0.021, 8, 6);
  const positions = [
    [-1.67, 0.88, 0.1], [-0.4, 1.66, -0.55], [1.38, 1.13, 0.15],
    [1.84, -0.38, -0.5], [0.55, -1.62, 0.48], [-1.16, -1.25, -0.25],
  ].map(point => new THREE.Vector3(...point));
  const origin = new THREE.Vector3(0, 0, 0);
  const edges = [];
  positions.forEach((position, i) => {
    const node = new THREE.Mesh(nodeGeometry, i % 2 ? rimMaterial : darkMaterial);
    node.position.copy(position);
    group.add(node);
    const next = positions[(i + 1) % positions.length];
    [ [origin, position], [position, next] ].forEach(([from, to]) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
      group.add(new THREE.Line(geometry, lineMaterial));
      edges.push({ from, to });
    });
  });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.92, 0.12), darkMaterial);
  frame.rotation.z = 0.05;
  group.add(frame);
  const mark = new THREE.Shape();
  mark.moveTo(-0.09, 0.15); mark.lineTo(0.16, 0); mark.lineTo(-0.09, -0.15); mark.closePath();
  const play = new THREE.Mesh(new THREE.ShapeGeometry(mark), whiteMaterial);
  play.position.z = 0.065;
  group.add(play);
  const pulses = edges.filter((_, index) => index % 2 === 0).map((edge, index) => {
    const mesh = new THREE.Mesh(pulseGeometry, darkMaterial);
    group.add(mesh);
    return { ...edge, mesh, offset: index / 6 };
  });
  let width = 0; let height = 0; let visible = true; let frameId; let disposed = false;
  const resize = () => {
    width = host.clientWidth; height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  let pointerX = 0; let pointerY = 0;
  const pointer = event => {
    const rect = host.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.13;
    pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.1;
  };
  host.addEventListener('pointermove', pointer, { passive: true });
  function animate(time) {
    frameId = undefined;
    if (!visible || document.hidden || disposed) return;
    const t = time * 0.001;
    group.rotation.y += (-0.25 + Math.sin(t * 0.12) * 0.14 + pointerX - group.rotation.y) * 0.025;
    group.rotation.x += (-0.08 + pointerY - group.rotation.x) * 0.025;
    pulses.forEach(pulse => pulse.mesh.position.lerpVectors(pulse.from, pulse.to, (t * 0.095 + pulse.offset) % 1));
    renderer.render(scene, camera);
    host.classList.add('has-webgl');
    frameId = requestAnimationFrame(animate);
  }
  const resume = () => { if (!frameId && visible && !document.hidden && !disposed) frameId = requestAnimationFrame(animate); };
  const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; resume(); }, { rootMargin: '70px' });
  visibility.observe(host);
  document.addEventListener('visibilitychange', resume);
  const dispose = () => {
    disposed = true; cancelAnimationFrame(frameId); observer.disconnect(); visibility.disconnect();
    host.removeEventListener('pointermove', pointer); document.removeEventListener('visibilitychange', resume);
    scene.traverse(object => object.geometry?.dispose());
    [lineMaterial, rimMaterial, darkMaterial, whiteMaterial].forEach(material => material.dispose());
    renderer.dispose(); host.classList.remove('has-webgl');
    preference.removeEventListener('change', onPreference);
  };
  const onPreference = event => { if (event.matches) dispose(); };
  preference.addEventListener('change', onPreference);
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); dispose(); }, { once: true });
  window.addEventListener('pagehide', dispose, { once: true });
  resume();
}
