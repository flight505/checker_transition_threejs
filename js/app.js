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
import fnt from "../font/Roboto-Medium-msdf.fnt";
import png from "../font/Roboto-Medium.png";
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
    this.renderer.setClearColor(0x111111, 1);
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
    this.camera.position.set(0, 0, 3);
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
      uProgress1: 0,
      uProgress2: 0,
      uProgress3: 0,
      uProgress4: 0,
      gogo: () => {
        let d = 10; // duration of animation
        let stagger = 0.05; // stagger between each animation
        let tl = gsap.timeline();
        tl.to(this.material.uniforms.uProgress1, {
          value: 1,
          duration: d / 2,
          ease: "power4.out",
        });
        tl.to(this.material.uniforms.uProgress2, {
          value: 1,
          duration: d,
          ease: "power4.out",
        },stagger);
        tl.to(this.material.uniforms.uProgress3, {
          value: 1,
          duration: d,
          ease: "power4.out",
        },stagger*4);
        tl.to(this.material.uniforms.uProgress4, {
          value: 1,
          duration: d,
          ease: "power4.out",
        },stagger*8);
      },
    };
    this.gui = new GUI();
    this.gui.add(this.settings, "uProgress1", 0, 1, 0.01).onChange(() => {
      this.material.uniforms.uProgress1.value = this.settings.uProgress1
    }); 
    this.gui.add(this.settings, "uProgress2", 0, 1, 0.01).onChange(() => {
      this.material.uniforms.uProgress2.value = this.settings.uProgress2
    }); 
    this.gui.add(this.settings, "uProgress3", 0, 1, 0.01).onChange(() => {
      this.material.uniforms.uProgress3.value = this.settings.uProgress3
    }); 
    this.gui.add(this.settings, "uProgress4", 0, 1, 0.01).onChange(() => {
      this.material.uniforms.uProgress4.value = this.settings.uProgress4
    }); 
    this.gui.add(this.settings, "gogo");
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
        text: "STUNNING INTEGRATED DESIGN",
        font: fnt,
      });

      // const material = new MSDFTextMaterial();


      this.material = new THREE.ShaderMaterial({
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
            uProgress2: { value: 0 },
            uProgress3: { value: 0 },
            uProgress4: { value: 0 },
            time: { value: 0 },
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
            uniform float uProgress2;
            uniform float uProgress3;
            uniform float uProgress4;
            uniform float time;

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
                // #include <three_msdf_alpha_test>
    
                // Outputs
                #include <three_msdf_strokes_output>

                vec4 l1 = vec4(0.5, 0.5, 0.5, border);
                vec4 l2 = vec4(1.0, 0.1, 0.6, border);
                vec4 l3 = vec4(1.0, 0.1, 0.6, border);
                vec4 l4 = vec4(vec3(1.0),outset);
                float x = floor(vLayoutUv.x * 2.*3.8); // controls the number of x lines in the checkerboard
                float y = floor(vLayoutUv.y * 2.); // controls the number of y lines in the checkerboard
                float pattern = noise(vec2(x,y));

                float w = 0.1;
                float p1 = uProgress1;
                p1 = map(p1, 0.0, 1.0, -w, 1.0);
                p1 = smoothstep(p1,p1+w,vLayoutUv.x);
                float mix1 = 2.0*p1 -pattern;
                mix1 = clamp(mix1, 0.0, 1.0);

                float p2 = uProgress2;
                p2 = map(p2, 0.0, 1.0, -w, 1.0);
                p2 = smoothstep(p2,p2+w,vLayoutUv.x);
                float mix2 = 2.0*p2 -pattern;
                mix2 = clamp(mix2, 0.0, 1.0);

                float p3 = uProgress3;
                p3 = map(p3, 0.0, 1.0, -w, 1.0);
                p3 = smoothstep(p3,p3+w,vLayoutUv.x);
                float mix3 = 2.0*p3 -pattern;
                mix3 = clamp(mix3, 0.0, 1.0);

                float p4 = uProgress4;
                p4 = map(p4, 0.0, 1.0, -w, 1.0);
                p4 = smoothstep(p4,p4+w,vLayoutUv.x);
                float mix4 = 2.0*p4 -pattern;
                mix4 = clamp(mix4, 0.0, 1.0);


                vec4 layer0 = mix(vec4(0.0), l1, 1.0-mix1);
                vec4 layer1 = mix(layer0, l2, 1.0-mix2);
                vec4 layer2 = mix(layer1, l3, 1.0-mix3);
                vec4 layer3 = mix(layer2, l4, 1.0-mix4);

                // gl_FragColor = vec4(uProgress1*1.0, 0.0, 0.0, 1.0); 
                // gl_FragColor = l4;
                // gl_FragColor = vec4(vec3(pattern), 1.0);
                // gl_FragColor = vec4(vec3(p0_), 1.0);
                gl_FragColor = layer3;
                // gl_FragColor = mix(vec4(0.0), l1, 1.0-mix0);

            }
        `,
      });
      
        this.material.uniforms.uMap.value = atlas;

        const mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(mesh);
        mesh.scale.set(0.005, -0.005, 0.005);
        mesh.position.x = -1.35; // centers the text to the screen
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
