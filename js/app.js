import * as THREE from "three";
import { MSDFTextGeometry, MSDFTextMaterial , uniforms} from "three-msdf-text";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertex.glsl";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
// import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import GUI from "lil-gui";
import gsap from "gsap";
import fnt from "../font/FontsFree-Net-DINPro-1-msdf.fnt";
import png from "../font/FontsFree-Net-DINPro-1.png";
// console.log(fnt, "fnt");

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio, 2);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );

    // let frustumSize = 10;
    // let aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    this.camera.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement); 
    this.time = 0;

    this.isPlaying = true;

    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
    this.settings(); // enable for gui
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
    };
    this.gui = new GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01).onChange(() => {
      this.material.uniforms.progress.value = this.settings.progress
    }); 
  }
  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  } 

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    let that = this;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        progress: { value: 0 },
        resolution: { value: new THREE.Vector4() },
        // uvRate1: {
        //   value: new THREE.Vector2(1, 1),
        // },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    this.plane = new THREE.Mesh(this.geometry, this.material);
    // this.scene.add(this.plane);

    Promise.all([loadFontAtlas(png)]).then(([atlas]) => {
      const geometry = new MSDFTextGeometry({
        text: "HELLO",
        font: fnt,
      });
      // const material = new MSDFTextMaterial();
      const material = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        defines: {
          IS_SMALL: false,
        },
        extensions: {
          derivatives: true,
        },
        uniforms: {
          // Common
          ...uniforms.common,

          // Rendering
          ...uniforms.rendering,

          // Strokes
          ...uniforms.strokes,
          ...{
            uStrokeColor: { value: new THREE.Color(0x00ff00) },
            uProgress1: { value: 0 },
          }
        },
        vertexShader: `
            // Attribute
            #include <three_msdf_attributes>
    
            // Varyings
            #include <three_msdf_varyings>
    
            void main() {
                #include <three_msdf_vertex>
            }
        `,
        fragmentShader: `
            // Varyings
            #include <three_msdf_varyings>
    
            // Uniforms
            #include <three_msdf_common_uniforms>
            #include <three_msdf_strokes_uniforms>
    
            // Utils
            #include <three_msdf_median>
            uniform float uProgress1;

float rand(float n){return fract(sin(n) * 43758.5453123);}
float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(float p){
		float fl = floor(p);
	float fc = fract(p);
		return mix(rand(fl), rand(fl + 1.0), fc);
}
float noise(vec2 n) {
		const vec2 d = vec2(0.0, 1.0);
	vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
		return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}
// map GLSL
float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}
    
            void main() {
                // Common
                #include <three_msdf_common>
    
                // Strokes
                #include <three_msdf_strokes>
    
                // Alpha Test
                #include <three_msdf_alpha_test>
    
                // Outputs
                #include <three_msdf_strokes_output>
                gl_FragColor = vec4(uProgress1*1.0, 0.0, 0.0, 1.0); 
            }
        `,
      });
      material.uniforms.uMap.value = atlas;
      
        material.uniforms.uMap.value = atlas;

        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        mesh.scale.set(0.02, -0.02, 0.02);
        mesh.position.x = -1.35;
    });
    function loadFontAtlas(path) {
      const promise = new Promise((resolve, reject) => {
        const loader = new THREE.TextureLoader();
        loader.load(path, resolve);
      });
      return promise;
    }
    // function loadFont(path) {
    //   const promise = new Promise((resolve, reject) => {
    //     const loader = new FontLoader();
    //     loader.load(path, resolve);
    //   });

    //   return promise;
    // }
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.render();
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("container"),
});
