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
  const animationFrameIdRef = useRef<number | null>(null); 
  const [state, setState] = useState<LoadState>({ status: "loading", pct: 0, message: "Loading 3D scan..." });

  // Funktion för att flytta kameran till CAD-modellens centrum
  const teleportCameraToModel = () => {
    const viewer = viewerRef.current;
    const THREE = THREERef.current;
    if (!viewer || !THREE) return;

    let targetPos = new THREE.Vector3(0, 0, 0);
    
    if (viewer.controls && viewer.controls.target) {
      if (glbModelRef.current) {
        const box = new THREE.Box3().setFromObject(glbModelRef.current);
        box.getCenter(targetPos);
      } else {
        targetPos.copy(viewer.controls.target);
      }
      
      viewer.controls.target.copy(targetPos);
      
      if (viewer.camera) {
        viewer.camera.position.set(targetPos.x, targetPos.y - 5, targetPos.z + 8);
        viewer.camera.lookAt(targetPos);
        if (typeof viewer.controls.update === "function") {
          viewer.controls.update();
        }
      }
      console.log("[TELEPORT] Flyttade kameran till:", targetPos);
    }
  };

  // Hantera synlighet på GLB-modellen
  useEffect(() => {
    if (glbModelRef.current) {
      console.log(`[TOGGLE] Ändrar modellens synlighet till: ${showModel}`);
      glbModelRef.current.visible = showModel;
    }
  }, [showModel]);

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

        const modelUrls: Record<number, string> = {
            2: "https://dl.dropboxusercontent.com/scl/fi/20ucx1zr59sgnmzp21cgu/model2.glb?rlkey=ishzd5vnbgz1cwgm65kw30uj3&st=5f076r2u&dl=0"
        };
        const splatUrls: Record<number, string> = {
            1: "https://dl.dropboxusercontent.com/scl/fi/bxept122250lt1h6drdpo/splat1.splat?rlkey=0asjiet4wihak3fjrx78vsagd&st=p70gccc2&raw=1",
            2: "https://dl.dropboxusercontent.com/scl/fi/rg4e6alq7sj9bx8py96ah/splat2.splat?rlkey=zrqk89869k92uq8drqwxpyhak&st=ik6jtyhn&raw=1",
            3: "https://dl.dropboxusercontent.com/scl/fi/ygob2d544ytcwom8xtcf8/splat3.splat?rlkey=g3djlhl34ahbhjcgn4btidfbj&st=bah16ypn&raw=1",
            4: "https://dl.dropboxusercontent.com/scl/fi/oyld9wt5ay3qffcvz4m5e/splat4.splat?rlkey=jts6rml7ac6ekdiqsa05nz2kg&st=e4lgujkn&raw=1",
            5: "https://dl.dropboxusercontent.com/scl/fi/h1bhffphfzpd2y5ps9pya/splat5.ply?rlkey=y1fqw6x5umo63bso9a04f5d4l&st=3a05eanl&raw=1"
        };

        await viewer.addSplatScene(splatUrls[splatId], {
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

        const targetScene = typeof viewer.getScene === "function" ? viewer.getScene() : (viewer.scene || customScene);

        if (modelUrls[splatId]) {
            new GLTFLoader().load(
                modelUrls[splatId],
                (gltf) => {
                    if (cancelled) return;

                    const model = gltf.scene;
                    model.visible = showModel;

                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.sub(center); 

                    model.traverse((child: any) => {
                      if (child.isMesh) {
                          child.castShadow = true;
                          child.receiveShadow = true;
                          
                          if (child.material) {
                            child.material.roughness = 0.85; 
                            child.material.metalness = 0.1;  
                          }
                      }
                    });

                    model.scale.set(1.0, 1.0, 1.0);
                    model.rotation.x += Math.PI;

                    targetScene.add(model);
                    glbModelRef.current = model;

                    console.log("[GLB] Modellen injicerad i scenen.");

                    const renderLoop = () => {
                      if (cancelled) return;

                      if (viewer.renderer && viewer.camera) {
                        viewer.renderer.autoClear = false;
                        viewer.renderer.render(targetScene, viewer.camera);
                      }

                      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
                    };
                    
                    renderLoop();
                },
                undefined,
                (err) => console.error("[GLB-FEL]", err)
            );
        } else {
            const renderLoop = () => {
              if (cancelled) return;
              if (viewer.renderer && viewer.camera) {
                viewer.renderer.autoClear = false;
                viewer.renderer.render(targetScene, viewer.camera);
              }
              animationFrameIdRef.current = requestAnimationFrame(renderLoop);
            };
            renderLoop();
        }

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
        const viewer = viewerRef.current;
        const THREE = THREERef.current;
        const targetScene = typeof viewer.getScene === "function" ? viewer.getScene() : (viewer.scene || customSceneRef.current);
        
        if (targetScene && THREE && glbModelRef.current) {
          try { targetScene.remove(glbModelRef.current); } catch {}
        }
        
        try { viewer.dispose(); } catch (e) {}
        viewerRef.current = null;
        glbModelRef.current = null;
        customSceneRef.current = null;
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [splatId, isOpen]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#0A0A0C", fontFamily: "sans-serif" }}>
      <div 
        ref={containerRef} 
        style={{ width: "100%", height: "100%" }} 
      />

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
            Drag to rotate &bull; Scroll to zoom
          </div>
        </>
      )}
    </div>
  );
}