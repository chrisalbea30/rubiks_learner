import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { FACES, NORMALS, STICKERS, stickerColor, type CubeState, type Mask, type Vec3 } from "@/lib/cube";

export type CameraView = "standard" | "bottom" | "top";

const CAMERA_POS: Record<CameraView, Vec3> = {
  standard: [4.6, 5.2, 8.2],
  bottom: [4.6, -5.2, 8.2],
  top: [0, 10.5, 2.2],
};

interface Animation {
  pivot: THREE.Group;
  axis: THREE.Vector3;
  angle: number;
  start: number;
  duration: number;
  cubies: THREE.Group[];
  next: CubeState;
  resolve: () => void;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function labelTexture(text: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.font = "700 84px ui-sans-serif, system-ui, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineWidth = 10;
  g.strokeStyle = "rgba(10,12,20,0.85)";
  g.strokeText(text, 64, 68);
  g.fillStyle = "#ffffff";
  g.fillText(text, 64, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function roundedSquare(size: number, radius: number) {
  const s = size / 2;
  const r = radius;
  const shape = new THREE.Shape();
  shape.moveTo(-s + r, -s);
  shape.lineTo(s - r, -s);
  shape.quadraticCurveTo(s, -s, s, -s + r);
  shape.lineTo(s, s - r);
  shape.quadraticCurveTo(s, s, s - r, s);
  shape.lineTo(-s + r, s);
  shape.quadraticCurveTo(-s, s, -s, s - r);
  shape.lineTo(-s, -s + r);
  shape.quadraticCurveTo(-s, -s, -s + r, -s);
  return new THREE.ShapeGeometry(shape, 4);
}

export class CubeScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private root = new THREE.Group();
  private cubies = new Map<string, THREE.Group>();
  private stickerMats: THREE.MeshStandardMaterial[] = [];
  private labels: THREE.Sprite[] = [];
  private anim: Animation | null = null;
  private frame = 0;
  private visible = true;
  private observer: ResizeObserver;
  private io: IntersectionObserver;
  private mask: Mask = "full";
  private state: CubeState;
  private view: CameraView = "standard";

  constructor(private container: HTMLElement, state: CubeState) {
    this.state = state;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // The canvas fills its container absolutely, so it never gives the layout a minimum width.
    Object.assign(this.renderer.domElement.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
      // Vertical swipes scroll the page on phones; horizontal drags spin the cube.
      touchAction: "pan-y",
    });
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    this.camera.position.set(...CAMERA_POS.standard);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.enableDamping = true;
    this.controls.rotateSpeed = 0.7;

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(4, 9, 7);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.6);
    fill.position.set(-6, -4, -5);
    this.scene.add(fill);
    this.scene.add(this.root);

    this.build();
    this.applyColors();

    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.io = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting));
    this.io.observe(container);
    this.resize();
    this.loop();
  }

  private build() {
    const body = new RoundedBoxGeometry(0.97, 0.97, 0.97, 3, 0.1);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.55 });
    const stickerGeo = roundedSquare(0.84, 0.12);
    const zAxis = new THREE.Vector3(0, 0, 1);

    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;
          const g = new THREE.Group();
          g.position.set(x, y, z);
          g.add(new THREE.Mesh(body, bodyMat));
          this.root.add(g);
          this.cubies.set(`${x},${y},${z}`, g);
        }

    for (const s of STICKERS) {
      const mat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.32, metalness: 0 });
      this.stickerMats[s.index] = mat;
      const mesh = new THREE.Mesh(stickerGeo, mat);
      const n = new THREE.Vector3(...s.normal);
      mesh.position.copy(n.clone().multiplyScalar(0.487));
      mesh.quaternion.setFromUnitVectors(zAxis, n);
      this.cubies.get(s.pos.join(","))!.add(mesh);
    }

    for (const f of FACES) {
      const sprite = new THREE.Sprite(
        // depthTest hides the labels of faces turned away from the camera behind the cube
        new THREE.SpriteMaterial({ map: labelTexture(f), depthTest: true, transparent: true }),
      );
      const n = NORMALS[f];
      sprite.position.set(n[0] * 2.25, n[1] * 2.25, n[2] * 2.25);
      sprite.scale.setScalar(0.7);
      sprite.visible = false;
      sprite.renderOrder = 10;
      this.scene.add(sprite);
      this.labels.push(sprite);
    }
  }

  private applyColors() {
    for (let i = 0; i < 54; i++) this.stickerMats[i].color.set(stickerColor(this.state, i, this.mask));
  }

  setLabels(on: boolean) {
    this.labels.forEach((l) => (l.visible = on));
  }

  setMask(mask: Mask) {
    this.mask = mask;
    this.applyColors();
  }

  setView(view: CameraView) {
    this.view = view;
    this.camera.position.set(...CAMERA_POS[view]);
    this.camera.up.set(0, 1, 0);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  resetView() {
    this.setView(this.view);
  }

  /** Jump to a state immediately, cancelling any running animation. */
  setState(state: CubeState) {
    this.finishAnimation(false);
    this.state = state;
    this.applyColors();
  }

  /** Animate a layer turn, then show `next`. Resolves when the turn has finished. */
  animate(
    geom: { axis: 0 | 1 | 2; angle: number; inLayer: (p: Vec3) => boolean },
    durationMs: number,
    next: CubeState,
  ): Promise<void> {
    this.finishAnimation(false);
    return new Promise((resolve) => {
      const pivot = new THREE.Group();
      this.root.add(pivot);
      const cubies: THREE.Group[] = [];
      this.cubies.forEach((g, k) => {
        const p = k.split(",").map(Number) as Vec3;
        if (geom.inLayer(p)) {
          pivot.attach(g);
          cubies.push(g);
        }
      });
      const axis = new THREE.Vector3(geom.axis === 0 ? 1 : 0, geom.axis === 1 ? 1 : 0, geom.axis === 2 ? 1 : 0);
      this.anim = { pivot, axis, angle: geom.angle, start: performance.now(), duration: durationMs, cubies, next, resolve };
    });
  }

  private finishAnimation(applyNext = true) {
    const a = this.anim;
    if (!a) return;
    this.anim = null;
    for (const g of a.cubies) {
      this.root.attach(g);
    }
    this.cubies.forEach((g, k) => {
      const [x, y, z] = k.split(",").map(Number);
      g.position.set(x, y, z);
      g.quaternion.identity();
    });
    this.root.remove(a.pivot);
    if (applyNext) {
      this.state = a.next;
      this.applyColors();
    }
    a.resolve();
  }

  private loop = () => {
    this.frame = requestAnimationFrame(this.loop);
    if (!this.visible) return;
    if (this.anim) {
      const t = Math.min(1, (performance.now() - this.anim.start) / this.anim.duration);
      this.anim.pivot.quaternion.setFromAxisAngle(this.anim.axis, this.anim.angle * easeInOut(t));
      if (t >= 1) this.finishAnimation(true);
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Keep the whole cube in frame on narrow (portrait) canvases
    this.camera.fov = w < h ? 30 * (h / w) * 0.9 : 30;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.finishAnimation(false);
    this.observer.disconnect();
    this.io.disconnect();
    this.controls.dispose();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
      if (o instanceof THREE.Sprite) o.material.map?.dispose();
    });
    this.stickerMats.forEach((m) => m.dispose());
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
