// Clean standalone X, built directly in Three.js — replaces the broken prxdigy-x.glb
// (1,114 verts for a 4-point shape; raster-trace artifact, see README.md).
// Requires: THREE.RoomEnvironment + PMREMGenerator for the environment map (see README.md),
// same chrome-red PBR values as prxdigy-wordmark.glb's "inner red enamel" material.

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
    color: 0x701212,
    emissive: 0x0a0000,
    metalness: 0.76,
    roughness: 0.22
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2; // lies flat like prxdigy-wordmark.glb — rotate to face camera same way
  return mesh;
}
