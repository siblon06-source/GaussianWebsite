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
  const glbModelRef = useRef<any>(null); // Pekar nu på vår pivotGroup
  const customSceneRef = useRef<any>(null);
  const THREERef = useRef<any>(null);
  const animationFrameIdRef = useRef<number | null>(null); 
  const [state, setState] = useState<LoadState>({ status: "loading", pct: 0, message: "Loading 3D scan..." });

  // State för modellens position och skala med dina nya standardvärden
  const [transform, setTransform] = useState({
    x: 0.7,
    y: 0.1,
    z: -0.1,
    scale: 0.15,
  });

  // Nollställ till standardvärdena när splatId ändras
  useEffect(() => {
    setTransform({ x: 0.7, y: 0.1, z: -0.1, scale: 0.15 });
  }, [splatId]);


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

  // Applicera transformering (Lokal förflyttning & skalning kring centrum)
  useEffect(() => {
    if (glbModelRef.current) {
      const group = glbModelRef.current;

      // 1. Skala gruppen kring sitt eget origin
      group.scale.set(transform.scale, transform.scale, transform.scale);

      // 2. Nollställ positionen i världscenen först
      group.position.set(0, 0, 0);

      // 3. Flytta i LOKALT led!
      group.translateX(transform.x);
      group.translateY(transform.y);
      group.translateZ(transform.z);
    }
  }, [transform]);

  // Tangentbordskontroll (Piltangenter m.m.)
  useEffect(() => {
    const STEP = 0.02; // Mindre steglängd för finjustering

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!glbModelRef.current) return;

      // Lägg till de tangenter du vill fånga upp
      const keysToIntercept = [
        "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
        "w", "W", "s", "S", "+", "=", "-"
      ];

      if (keysToIntercept.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      setTransform((prev) => {
        let { x, y, z, scale } = prev;

        switch (e.key) {
          // Lokalt Sidled (X)
          case "ArrowLeft":
            x -= STEP;
            break;
          case "ArrowRight":
            x += STEP;
            break;

          // Lokalt Djup / Fram & Bak (Z)
          case "ArrowUp":
            z -= STEP;
            break;
          case "ArrowDown":
            z += STEP;
            break;

          // Lokalt Höjdled (Y) – Nu styrs höjden även av + och - !
          case "w":
          case "W":
          case "+":
          case "=":
            y += STEP;
            break;
          case "s":
          case "S":
          case "-":
            y -= STEP;
            break;

          default:
            return prev;
        }

        return { x, y, z, scale };
      });
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, []);

  // Ladda scenen och 3D-modellen
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
            2: "https://dl.dropboxusercontent.com/scl/fi/20ucx1zr59sgnmzp21cgu/model2.glb?rlkey=ishzd5vnbgz1cwgm65kw30uj3&st=5f076r2u&dl=0",
            5: "https://dl.dropboxusercontent.com/scl/fi/f36xvb6bzguvxfjxyoew0/model5.glb?rlkey=ok2bt2v52mw479hhxkrq7u4mq&st=q7y17eyz&dl=0"
        };
        const splatUrls: Record<number, string> = {
            1: "https://dl.dropboxusercontent.com/scl/fi/bxept122250lt1h6drdpo/splat1.splat?rlkey=0asjiet4wihak3fjrx78vsagd&st=p70gccc2&raw=1",
            2: "https://dl.dropboxusercontent.com/scl/fi/rg4e6alq7sj9bx8py96ah/splat2.splat?rlkey=zrqk89869k92uq8drqwxpyhak&st=ik6jtyhn&raw=1",
            3: "https://dl.dropboxusercontent.com/scl/fi/ygob2d544ytcwom8xtcf8/splat3.splat?rlkey=g3djlhl34ahbhjcgn4btidfbj&st=bah16ypn&raw=1",
            4: "https://dl.dropboxusercontent.com/scl/fi/oyld9wt5ay3qffcvz4m5e/splat4.splat?rlkey=jts6rml7ac6ekdiqsa05nz2kg&st=e4lgujkn&raw=1",
            5: "https://dl.dropboxusercontent.com/scl/fi/8ybx9nhircv536twrouup/splat5.splat?rlkey=126xxquyyhex9pdcf0xtbw9mj&st=txygahaw&raw=1"
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

                    // Centrera geometrin manuellt kring origin
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

                    // Skapa en pivot-grupp som omsluter modellen
                    const pivotGroup = new THREE.Group();
                    pivotGroup.add(model);
                    pivotGroup.visible = showModel;

                    targetScene.add(pivotGroup);
                    glbModelRef.current = pivotGroup;

                    console.log("[GLB] Modellen injicerad i scenen via pivotGroup.");

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

      const viewer = viewerRef.current;
      const THREE = THREERef.current;

      if (viewer) {
        const targetScene =
          typeof viewer.getScene === "function"
            ? viewer.getScene()
            : viewer.scene || customSceneRef.current;

        if (targetScene && THREE && glbModelRef.current) {
          try {
            targetScene.remove(glbModelRef.current);
          } catch (e) {}
        }

        try {
          if (typeof viewer.dispose === "function") {
            viewer.dispose();
          }
        } catch (e) {
          console.warn("[VIEWER DISPOSE WARN]", e);
        }

        viewerRef.current = null;
      }

      glbModelRef.current = null;
      customSceneRef.current = null;

      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
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
          {/* 🎛️ KONTROLLPANEL – Syns alltid när scenen är redo */}
          <div
            style={{
              position: "absolute",
              top: "1rem",
              left: "1rem",
              zIndex: 30,
              background: "rgba(13, 13, 18, 0.85)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(200, 169, 110, 0.2)",
              borderRadius: "8px",
              padding: "0.85rem 1rem",
              color: "#F0EDE8",
              fontSize: "0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
              width: "230px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.4)"
            }}
          >
            <div style={{ color: "#C8A96E", fontWeight: "bold", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              CAD Transformation
            </div>

            {/* Skalning */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#8A8A96", fontSize: "0.7rem" }}>
                <span>Skala</span>
                <span style={{ color: "#F0EDE8" }}>{transform.scale.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="1.5"
                step="0.02"
                value={transform.scale}
                onChange={(e) => setTransform((p) => ({ ...p, scale: parseFloat(e.target.value) }))}
                style={{ width: "100%", accentColor: "#C8A96E", cursor: "pointer" }}
              />
            </div>

            <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "0.1rem 0" }} />

            {/* X-position (Sidled) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#8A8A96", fontSize: "0.7rem" }}>
                <span>Position X (Sidled)</span>
                <span style={{ color: "#F0EDE8" }}>{transform.x.toFixed(2)}m</span>
              </div>
              <input
                type="range"
                min="-5.0"
                max="5.0"
                step="0.02"
                value={transform.x}
                onChange={(e) => setTransform((p) => ({ ...p, x: parseFloat(e.target.value) }))}
                style={{ width: "100%", accentColor: "#C8A96E", cursor: "pointer" }}
              />
            </div>

            {/* Y-position (Höjdled) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#8A8A96", fontSize: "0.7rem" }}>
                <span>Position Y (Höjd)</span>
                <span style={{ color: "#F0EDE8" }}>{transform.y.toFixed(2)}m</span>
              </div>
              <input
                type="range"
                min="-5.0"
                max="5.0"
                step="0.02"
                value={transform.y}
                onChange={(e) => setTransform((p) => ({ ...p, y: parseFloat(e.target.value) }))}
                style={{ width: "100%", accentColor: "#C8A96E", cursor: "pointer" }}
              />
            </div>

            {/* Z-position (Fram / Bak) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#8A8A96", fontSize: "0.7rem" }}>
                <span>Position Z (Djup)</span>
                <span style={{ color: "#F0EDE8" }}>{transform.z.toFixed(2)}m</span>
              </div>
              <input
                type="range"
                min="-5.0"
                max="5.0"
                step="0.02"
                value={transform.z}
                onChange={(e) => setTransform((p) => ({ ...p, z: parseFloat(e.target.value) }))}
                style={{ width: "100%", accentColor: "#C8A96E", cursor: "pointer" }}
              />
            </div>

            {/* Återställningsknapp */}
            <button
              onClick={() => setTransform({ x: 0.7, y: 0.1, z: -0.1, scale: 0.15 })}
              style={{
                marginTop: "0.2rem",
                padding: "0.3rem",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                color: "#8A8A96",
                fontSize: "0.65rem",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              🔄 Återställ Position
            </button>
          </div>

          {/* 🎯 Teleport-knapp */}
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

          {/* ℹ️ Instruktionstext */}
          <div style={{ position: "absolute", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "0.5rem", zIndex: 5, opacity: 0.5, fontSize: "0.65rem", letterSpacing: "0.08em", color: "#8A8A96", textTransform: "uppercase", pointerEvents: "none" }}>
            Drag to rotate &bull; Scroll to zoom
          </div>
        </>
      )}
    </div>
  );
}