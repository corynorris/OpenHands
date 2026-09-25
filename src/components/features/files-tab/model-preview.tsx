import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";

/**
 * 3D model preview for the Files tab. three.js is dynamically imported so
 * the bundle only pays for it when a model is actually opened. Supports
 * glTF (.glb / .gltf), Wavefront OBJ and STL. Loads from the workspace
 * fileserver URL (same-origin cookie auth, same as the image/iframe
 * previews), auto-frames the model, orbit + zoom + pan.
 */

interface ModelPreviewProps {
  /** Static fileserver URL for the model file (cache-busted). */
  url: string;
  /** Lowercase file extension (glb / gltf / obj / stl). */
  ext: string;
}

export function ModelPreview({ url, ext }: ModelPreviewProps) {
  const { t } = useTranslation("openhands");
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let disposed = false;
    let frameId = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let camera: import("three").PerspectiveCamera | null = null;

    const run = async () => {
      try {
        const THREE = await import("three");
        const { OrbitControls } = await import(
          "three/examples/jsm/controls/OrbitControls.js" // eslint-disable-line import-x/extensions -- three requires the .js suffix
        );
        const { GLTFLoader } = await import(
          "three/examples/jsm/loaders/GLTFLoader.js" // eslint-disable-line import-x/extensions -- three requires the .js suffix
        );
        const { OBJLoader } = await import(
          "three/examples/jsm/loaders/OBJLoader.js" // eslint-disable-line import-x/extensions -- three requires the .js suffix
        );
        const { STLLoader } = await import(
          "three/examples/jsm/loaders/STLLoader.js" // eslint-disable-line import-x/extensions -- three requires the .js suffix
        );

        if (disposed) return;

        const width = mount.clientWidth || 1;
        const height = mount.clientHeight || 1;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x14161c);

        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
        camera.position.set(2, 1.5, 3);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mount.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // Simple studio-ish lighting
        scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.9));
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
        keyLight.position.set(3, 5, 2);
        scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0x8899bb, 0.5);
        fillLight.position.set(-3, 2, -4);
        scene.add(fillLight);

        // Reference ground grid (matches the preview backdrop)
        const grid = new THREE.GridHelper(10, 10, 0x4b5563, 0x374151);
        scene.add(grid);

        // Load + frame the model
        const model = await (async () => {
          const loadGltf = () =>
            new Promise<import("three").Object3D>((resolve, reject) => {
              const loader = new GLTFLoader();
              loader.load(
                url,
                (gltf) => resolve(gltf.scene),
                undefined,
                (error) =>
                  reject(
                    error instanceof Error ? error : new Error(String(error)),
                  ),
              );
            });
          const loadObj = () =>
            new Promise<import("three").Object3D>((resolve, reject) => {
              const loader = new OBJLoader();
              loader.load(
                url,
                (object) => resolve(object),
                undefined,
                (error) =>
                  reject(
                    error instanceof Error ? error : new Error(String(error)),
                  ),
              );
            });
          const loadStl = () =>
            new Promise<import("three").Object3D>((resolve, reject) => {
              const loader = new STLLoader();
              loader.load(
                url,
                (geometry) => {
                  const mesh = new THREE.Mesh(
                    geometry,
                    new THREE.MeshStandardMaterial({
                      color: 0x9ca3af,
                      roughness: 0.55,
                      metalness: 0.15,
                    }),
                  );
                  resolve(mesh);
                },
                undefined,
                (error) =>
                  reject(
                    error instanceof Error ? error : new Error(String(error)),
                  ),
              );
            });

          if (ext === "glb" || ext === "gltf") return loadGltf();
          if (ext === "obj") return loadObj();
          if (ext === "stl") return loadStl();
          throw new Error(`Unsupported model format: ${ext}`);
        })();

        if (disposed) return;

        // Auto-frame: center the object and size the camera to fit it.
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const distance = maxDim * 2.2;
        camera.position.set(distance * 0.8, distance * 0.6, distance);
        camera.near = Math.max(maxDim / 1000, 0.001);
        camera.far = Math.max(maxDim * 100, 100);
        camera.updateProjectionMatrix();
        controls.target.copy(center);
        controls.update();

        scene.add(model);
        setStatus("ready");

        const animate = () => {
          if (disposed || !camera) return;
          frameId = requestAnimationFrame(animate);
          controls.update();
          renderer?.render(scene, camera);
        };
        animate();
      } catch (error) {
        if (!disposed) {
          setStatus("error");
          setErrorMessage(
            error instanceof Error ? error.message : String(error),
          );
        }
      }
    };
    void run();

    const resizeObserver = new ResizeObserver(() => {
      if (!mount || !renderer || !camera) return;
      const nextWidth = mount.clientWidth || 1;
      const nextHeight = mount.clientHeight || 1;
      if (nextWidth === 0 || nextHeight === 0) return;
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    });
    resizeObserver.observe(mount);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, [url, ext]);

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[var(--oh-surface-deep)]"
      data-testid="model-preview"
    >
      <div ref={mountRef} className="h-full w-full" />
      {status === "loading" ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--oh-muted)]">
          {t(I18nKey.FILES$MODEL_PREVIEW_LOADING)}
        </div>
      ) : null}
      {status === "error" ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-[var(--oh-muted)]">
          {t(I18nKey.FILES$MODEL_PREVIEW_ERROR, {
            message: errorMessage ?? "",
          })}
        </div>
      ) : null}
    </div>
  );
}
