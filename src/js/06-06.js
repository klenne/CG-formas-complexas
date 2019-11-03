function init() {

  // use the defaults
  var stats = initStats();
  var renderer = initRenderer();
  var camera = initCamera();
  // position and point the camera to the center of the scene
  // camera.position.set(-80, 80, 80);
  // camera.lookAt(new THREE.Vector3(60, -60, 0));

  var scene = new THREE.Scene();
  initDefaultLighting(scene);
  var groundPlane = addLargeGroundPlane(scene)
  groundPlane.position.y = -30;

  // call the render function
  var step = 0;
  var spGroup;



  klein = function (u, v, optionalTarget) {

    var result = optionalTarget || new THREE.Vector3();

    u *= Math.PI;
    v *= 2 * Math.PI;

    u = u * 2;
    var x, y, z;
    if (u < Math.PI) {
      x = 3 * Math.cos(u) * (1 + Math.sin(u)) + (2 * (1 - Math.cos(u) / 2)) * Math.cos(u) * Math.cos(v);
      z = -8 * Math.sin(u) - 2 * (1 - Math.cos(u) / 2) * Math.sin(u) * Math.cos(v);
    } else {
      x = 3 * Math.cos(u) * (1 + Math.sin(u)) + (2 * (1 - Math.cos(u) / 2)) * Math.cos(v + Math.PI);
      z = -8 * Math.sin(u);
    }

    y = -2 * (1 - Math.cos(u) / 2) * Math.sin(v);

    return result.set( x, y, z );
  };

  radialWave = function (u, v, optionalTarget) {

    var result = optionalTarget || new THREE.Vector3();
    var r = 50;

    var x = Math.sin(u) * r;
    var z = Math.sin(v / 2) * 2 * r;
    var y = (Math.sin(u * 4 * Math.PI) + Math.cos(v * 2 * Math.PI)) * 2.8;

    return result.set( x, y, z );
  };


  // setup the control gui



  var controls = new function () {
    this.appliedMaterial = applyMeshNormalMaterial
    this.castShadow = true;
    this.groundPlaneVisible = true;

    this.segments = 12;
    this.phiStart = 0;
    this.phiLength = 2 * Math.PI;

    // redraw function, updates the control UI and recreates the geometry.
    this.redraw = function () {
      redrawGeometryAndUpdateUI(gui, scene, controls, function () {
        return generatePoints(controls.segments, controls.phiStart, controls.phiLength)
      });
    };
  };





  var controls02 = new function () {
    this.appliedMaterial = applyMeshNormalMaterial
    this.castShadow = true;
    this.groundPlaneVisible = true;
    this.slices = 50;
    this.stacks = 50;
    this.position=0

    this.renderFunction = "radialWave"

    this.redraw = function () {
      redrawGeometryAndUpdateUI(gui, scene, controls02, function() {
        switch (controls02.renderFunction) {
          case "radialWave":
            var geom  = new THREE.ParametricGeometry(radialWave, controls02.slices, controls02.stacks);
            geom.center();
            return geom;
    
          case "klein":
            var geom = new THREE.ParametricGeometry(klein, controls02.slices, controls02.stacks);
            geom.center();
            return geom;

        }
      });
    }
  };

  var gui = new dat.GUI();
  var forma01 = gui.addFolder("Forma01")
  forma01.add(controls02, 'renderFunction', ["radialWave", "klein"]).onChange(controls02.redraw);
  forma01.add(controls02, 'appliedMaterial', {
    meshNormal: applyMeshNormalMaterial, 
    meshStandard: applyMeshStandardMaterial
  }).onChange(controls02.redraw)
  
  forma01.add(controls02, 'slices', 10, 120, 1).onChange(controls02.redraw);
  forma01.add(controls02, 'stacks', 10, 120, 1).onChange(controls02.redraw);
  forma01.add(controls02, 'castShadow').onChange(function(e) {controls02.mesh.castShadow = e})
  forma01.add(controls02, 'groundPlaneVisible').onChange(function(e) {groundPlane.material.visible = e})
  


  var forma02 = gui.addFolder("Forma02")
  forma02.add(controls, 'segments', 0, 50).step(1).onChange(controls.redraw);
  forma02.add(controls, 'phiStart', 0, 2 * Math.PI).onChange(controls.redraw);
  forma02.add(controls, 'phiLength', 0, 2 * Math.PI).onChange(controls.redraw);

  // add a material section, so we can switch between materials
  forma02.add(controls,
    'appliedMaterial',
    { meshNormal: applyMeshNormalMaterial, meshStandard: applyMeshStandardMaterial }
  ).onChange(controls.redraw)

  forma02.add(controls, 'redraw');
  forma02.add(controls, 'castShadow').onChange(function (e) { controls.mesh.castShadow = e })
  gui.add(controls, 'groundPlaneVisible').onChange(function (e) { groundPlane.material.visible = e })

  
  controls.redraw();

  render();

  var step = 0;
  controls02.redraw();

  

  function generatePoints() {

    if (spGroup) scene.remove(spGroup)
    // add 10 random spheres
    var points = [];
    for (var i = 0; i < 20; i++) {
      var randomX = -15 + Math.round(Math.random() * 30);
      var randomY = -15 + Math.round(Math.random() * 30);
      var randomZ = -15 + Math.round(Math.random() * 30);

      points.push(new THREE.Vector3(randomX, randomY, randomZ));
    }

    spGroup = new THREE.Object3D();
    var material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: false });
    points.forEach(function (point) {
      var spGeom = new THREE.SphereGeometry(0.2);
      var spMesh = new THREE.Mesh(spGeom, material);
      spMesh.position.copy(point);
      spGroup.add(spMesh);
    });
    // add the points as a group to the scene
    scene.add(spGroup);

    // use the same points to create a convexgeometry
    var convexGeometry = new THREE.ConvexGeometry(points);
    convexGeometry.computeVertexNormals();
    convexGeometry.computeFaceNormals();
    convexGeometry.normalsNeedUpdate = true;
    return convexGeometry;
  }



  function render() {
    stats.update();
  
    if (spGroup) {
      controls.mesh.position.x=50;
      spGroup.position.x= controls.mesh.position.x;

      spGroup.rotation.y = step;
      spGroup.rotation.x = step;
      spGroup.rotation.z = step;

      controls.mesh.rotation.y = step += 0.005;
      controls.mesh.rotation.x = step;
      controls.mesh.rotation.z = step;
    }else{
     
   
      controls02.mesh.rotation.y = step+=0.005;
      controls02.mesh.rotation.x = step;
      controls02.mesh.rotation.z = step;
  
    }
        
   
    // render using requestAnimationFrame
    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }
}