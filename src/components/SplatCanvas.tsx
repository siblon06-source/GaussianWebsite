"use client";

import { useEffect, useRef, useState } from "react";

interface SplatCanvasProps {
  splatId: number;
  isOpen: boolean;
  showModel: boolean;
}

type LoadState =
  | { status: "loading"; pct: number; message: string }
  | { status: "ready" }
  | { status: "error"; title: string; message: string; detail?: string };

export default function SplatCanvas({ splatId, isOpen, showModel }: SplatCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const glbModelRef = useRef<any>(null);
  const customSceneRef = useRef<any>(null);
  const THREERef = useRef<any>(null);
  const animationFrameIdRef = useRef<number | null>(null); // För vår tvingade renderingsloop
  const [state, setState] = useState<LoadState>({ status: "loading", pct: 0, message: "Loading 3D scan..." });

  useEffect(() => {
    if (glbModelRef.current) {
      console.log(`[TOGGLE] Ändrar modellens synlighet till: ${showModel}`);
      glbModelRef.current.visible = showModel;
    }
  }, [showModel]);

  const teleportCameraToModel = () => {
    console.log("[TELEPORT] Startar teleportsekvens...");
    const viewer = viewerRef.current;
    const model = glbModelRef.current;
    const THREE = THREERef.current;

    if (!viewer || !model || !THREE) return console.warn("[TELEPORT] Något saknas.");

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    if (viewer.controls) {
      if (typeof viewer.controls.setTarget === "function") {
        viewer.controls.setTarget(center.x, center.y, center.z);
      } else if (viewer.controls.target) {
        viewer.controls.target.copy(center);
      }
    }

    if (viewer.camera) {
      const distance = maxDim > 0 ? maxDim * 2.5 : 8;
      // Flytta kameran lite snett uppifrån så vi ser modellen i 3D
      viewer.camera.position.set(center.x + distance * 0.5, center.y - distance * 0.8, center.z + distance);
      viewer.camera.lookAt(center);
      if (typeof viewer.camera.updateProjectionMatrix === "function") {
        viewer.camera.updateProjectionMatrix();
      }
    }

    if (viewer.controls && typeof viewer.controls.update === "function") {
      viewer.controls.update();
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    (async function load() {
      if (!containerRef.current) return;

      try {
        const GaussianSplats3D = await import("@mkkellogg/gaussian-splats-3d");
        const THREE = await import("three");
        THREERef.current = THREE;
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");

        if (cancelled) return;

        const customScene = new THREE.Scene();
        customSceneRef.current = customScene;
        
        // Starkt ljus så att modellen garanterat inte blir kolsvart
        customScene.add(new THREE.AmbientLight(0xffffff, 2.0));
        const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
        dirLight.position.set(5, 10, 7);
        customScene.add(dirLight);

        const viewer = new GaussianSplats3D.Viewer({
          cameraUp: [0, -1, 0],
          initialCameraPosition: [-1, -4, 6],
          initialCameraLookAt: [0, 0, 0],
          rootElement: containerRef.current,
          selfDrivenMode: true,
          useBuiltInControls: true,
          sharedMemoryForWorkers: false,
          sceneRevealMode: GaussianSplats3D.SceneRevealMode.Gradual,
          scene: customScene,
        });
        viewerRef.current = viewer;

        const baseUrl = window.location.origin;

        // Ladda Splat
        await viewer.addSplatScene(`${baseUrl}/splat${splatId}.splat`, {
          splatAlphaRemovalThreshold: 5,
          showLoadingUI: false,
          format: GaussianSplats3D.SceneFormat.Splat,
          onProgress: (raw, msg) => {
            if (cancelled) return;
            const pct = Math.max(0, Math.min(100, Math.round(raw <= 1 ? raw * 100 : raw)));
            setState({ status: "loading", pct, message: msg || `Downloading... ${pct}%` });
          },
        });

        if (cancelled) return;

        // Ladda GLB-modell
        new GLTFLoader().load(
          `${baseUrl}/model${splatId}.glb`,
          (gltf) => {
            if (cancelled) return;

            const model = gltf.scene;
            model.visible = showModel;

            // Centrera geometrin i origo (0,0,0)
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center); 

            // Ge modellen en elegant, mjuk och ljus shading
            model.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Om du vill behålla modellens originaltexturer men göra dem mjukare, 
                // kan du justera det befintliga materialet istället:
                if (child.material) {
                child.material.roughness = 0.85; // Högt värde = mattare yta, mjukare reflektioner
                child.material.metalness = 0.1;  // Lågt värde = mindre hård metallkänsla
                
                // Om du helt vill skriva över med en elegant, ljus och mjuk färg (t.ex. arkitektonisk off-white):
                /*
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xEAE8E4,      // Elegant, varmt ljusgrå / off-white
                    roughness: 0.85,      // Mycket matt yta för mjuka övergångar
                    metalness: 0.05,      // Minimalt med blänk
                    side: THREE.DoubleSide
                });
                */
                }
            }
            });

            model.scale.set(1.0, 1.0, 1.0);
            model.rotation.x += Math.PI;

            // Lägg till i scenen
            const targetScene = typeof viewer.getScene === "function" ? viewer.getScene() : (viewer.scene || customScene);
            targetScene.add(model);
            glbModelRef.current = model;

            console.log("[GLB] Modellen injicerad i scenen.");

            // 💡 FIXEN: Koppla på en extra renderings-loop som tvingar Three.js renderaren
            // att rita ut scenens vanliga 3D-objekt ovanpå/tillsammans med splatten i varje frame.
            const renderLoop = () => {
              if (cancelled) return;

              // Kontrollera om viewern har tillgång till sin interna WebGLRenderer
              if (viewer.renderer && viewer.camera) {
                // Tvinga Three.js att inte rensa skärmen (så splatten ligger kvar under)
                viewer.renderer.autoClear = false;
                // Rita ut vår scen med lampor och GLB-modell
                viewer.renderer.render(targetScene, viewer.camera);
              }

              animationFrameIdRef.current = requestAnimationFrame(renderLoop);
            };
            
            // Starta loopen
            renderLoop();
            console.log("[LOOP] Tvingad Three.js renderingsloop startad för externa objekt!");
          },
          undefined,
          (err) => console.error("[GLB-FEL]", err)
        );

        setState({ status: "ready" });
        viewer.start();

      } catch (err: any) {
        if (cancelled) return;
        setState({
          status: "error",
          title: "Could not load this scan",
          message: `Failed to process splat${splatId}`,
          detail: err?.message || String(err),
        });
      }
    })();

    return () => {
      cancelled = true;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (viewerRef.current) {
        if (customSceneRef.current && glbModelRef.current) {
          try { customSceneRef.current.remove(glbModelRef.current); } catch {}
        }
        try { viewerRef.current.dispose(); } catch {}
        viewerRef.current = null;
        glbModelRef.current = null;
        customSceneRef.current = null;
      }
    };
  }, [splatId, isOpen]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#0A0A0C", fontFamily: "sans-serif" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {state.status === "loading" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", background: "#0A0A0C", zIndex: 10 }}>
          <div style={{ width: "200px", height: "2px", background: "rgba(200,169,110,0.15)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${state.pct}%`, background: "#C8A96E", transition: "width 0.3s ease" }} />
          </div>
          <p style={{ fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8A96" }}>{state.message}</p>
        </div>
      )}

      {state.status === "error" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", background: "#0A0A0C", color: "#8A8A96", textAlign: "center", padding: "2rem", zIndex: 10 }}>
          <h3 style={{ color: "#F0EDE8", fontSize: "1rem" }}>{state.title}</h3>
          <p style={{ fontSize: "0.8rem", maxWidth: "420px" }}>{state.message}</p>
          {state.detail && (
            <pre style={{ fontSize: "0.7rem", color: "#C8A96E", background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "6px", padding: "0.75rem 1rem", maxWidth: "480px", whiteSpace: "pre-wrap" }}>{state.detail}</pre>
          )}
        </div>
      )}

      {state.status === "ready" && (
        <>
          <button
            onClick={teleportCameraToModel}
            style={{
              position: "absolute",
              bottom: "1rem",
              right: "1rem",
              zIndex: 30,
              padding: "0.5rem 1rem",
              background: "#C8A96E",
              color: "#0D0D12",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "0.75rem",
              textTransform: "uppercase",
              boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
            }}
          >
            🎯 Teleport Camera to CAD
          </button>

          <div style={{ position: "absolute", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "0.5rem", zIndex: 5, opacity: 0.5, fontSize: "0.65rem", letterSpacing: "0.08em", color: "#8A8A96", textTransform: "uppercase", pointerEvents: "none" }}>
            Drag to rotate &bull; Scroll to zoom &bull; Right-click to pan
          </div>
        </>
      )}
    </div>
  );
}