import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Hero 3D element — a rotating "soil core": a sphere of granular
 * golden particles with a glowing wireframe heart and orbit ring.
 * Rotates slowly, reacts to pointer parallax. Additive glow.
 */
export default function SoilCore() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = container.current;
    if (!el) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    // ── Granular soil particle sphere ──
    const COUNT = 2600;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const tmpC = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      const r = 2.0 + Math.pow(Math.random(), 1.6) * 0.55; // slightly clumpy shell
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      // gold → amber gradient with specks of green (living soil)
      const t = Math.random();
      if (t > 0.92) tmpC.setHSL(0.33, 0.75, 0.55); // living-matter green
      else tmpC.setHSL(0.11 + Math.random() * 0.05, 0.85, 0.35 + Math.random() * 0.22);
      colors[i * 3] = tmpC.r;
      colors[i * 3 + 1] = tmpC.g;
      colors[i * 3 + 2] = tmpC.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ── Glowing wireframe heart ──
    const coreGeo = new THREE.IcosahedronGeometry(1.15, 1);
    const coreWire = new THREE.Mesh(
      coreGeo,
      new THREE.MeshBasicMaterial({ color: 0xf5c544, wireframe: true, transparent: true, opacity: 0.85 })
    );
    scene.add(coreWire);
    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.58, 0),
      new THREE.MeshBasicMaterial({ color: 0x7be08b, wireframe: true, transparent: true, opacity: 0.7 })
    );
    scene.add(inner);

    // ── Orbit ring ──
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.6, 0.012, 8, 128),
      new THREE.MeshBasicMaterial({ color: 0xf5c544, transparent: true, opacity: 0.55 })
    );
    ring.rotation.x = Math.PI / 2.35;
    scene.add(ring);

    // ── Lights (for the faint fill sphere) ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.PointLight(0xffc85e, 60, 30);
    key.position.set(4, 5, 5);
    scene.add(key);

    // ── Mouse parallax ──
    const pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      const t = clock.getElapsedTime();
      particles.rotation.y = t * 0.16;
      particles.rotation.x = Math.sin(t * 0.22) * 0.18;
      coreWire.rotation.y = -t * 0.4;
      coreWire.rotation.x = t * 0.25;
      coreWire.scale.setScalar(1 + Math.sin(t * 1.7) * 0.05);
      inner.rotation.y = t * 0.5;
      ring.rotation.z = t * 0.22;
      // ease camera toward pointer
      camera.position.x += (pointer.x * 1.6 - camera.position.x) * 0.045;
      camera.position.y += (-pointer.y * 1.1 - camera.position.y) * 0.045;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      if (!el) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      pGeo.dispose();
      pMat.dispose();
      coreGeo.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={container} className="absolute inset-0" aria-hidden />;
}
