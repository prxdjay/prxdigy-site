// Clean standalone X, built directly in Three.js — replaces the broken prxdigy-x.glb
// (1,114 verts for a 4-point shape; raster-trace artifact, see README.md).
// Requires: THREE.RoomEnvironment + PMREMGenerator for the environment map, plus the bloom
// recipe below (EffectComposer + UnrealBloomPass) for the glow. Material color matches
// prxdigy-wordmark.glb's own "inner red enamel" values exactly — confirmed by rendering,
// do not substitute a hand-picked hex color, that's what produced a pink/washed-out result
// in testing. Calibrated against assets/public/creative-projects-ident.mp4's chrome/glow,
// which was already correct.

function buildPrxdigyX(outerRadius = 1.28, innerRadius = 0.30) {
  const shape = new THREE.Shape();
  const angles = [45, 90, 135, 180, 225, 270, 315, 0].map(d => d * Math.PI / 180);
  const radii = [outerRadius, innerRadius, outerRadius, innerRadius, outerRadius, innerRadius, outerRadius, innerRadius];
  angles.forEach((a, i) => {
    const r = radii[i];
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  });
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.045,
    bevelSegments: 6,
    curveSegments: 1
  });
  geometry.center();

  const material = new THREE.MeshStandardMaterial({
    metalness: 0.76,
    roughness: 0.24
  });
  material.color.setRGB(0.44, 0.008, 0.013);      // exact match to the GLB's "inner red enamel"
  material.emissive.setRGB(0.035, 0.0003, 0.0005); // same, not a guessed value

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2; // lies flat like prxdigy-wordmark.glb — rotate to face camera same way
  return mesh;
}

// Required lighting/glow recipe — without this the chrome reads as dull gray and the ruby
// as flat red, confirmed by testing both with and without:
//
//   const pmrem = new THREE.PMREMGenerator(renderer);
//   scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
//   renderer.outputEncoding = THREE.sRGBEncoding;
//   renderer.toneMapping = THREE.ACESFilmicToneMapping;
//   renderer.toneMappingExposure = 1.1;
//
//   const composer = new THREE.EffectComposer(renderer);
//   composer.addPass(new THREE.RenderPass(scene, camera));
//   composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(W,H), 0.18, 0.3, 0.9));
//   // render via composer.render(), not renderer.render()
//
// Bloom params (strength 0.18, radius 0.3, threshold 0.9) are deliberately restrained — higher
// strength or lower threshold blows the chrome out to flat white fast, confirmed by testing;
// this is a glow accent on the ruby, not a general bloom over the whole scene.
