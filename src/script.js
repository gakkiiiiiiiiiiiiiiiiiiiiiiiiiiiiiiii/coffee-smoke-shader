import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import coffeeSmokeVertexShader from './shaders/coffeeSmoke/vertex.glsl';
import coffeeSmokeFragmentShader from './shaders/coffeeSmoke/fragment.glsl';

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

// Loaders
const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();

/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

window.addEventListener('resize', () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 100);
camera.position.x = 8;
camera.position.y = 10;
camera.position.z = 12;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.y = 3;
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Model
 */
gltfLoader.load('./bakedModel.glb', (gltf) => {
	const baked = gltf.scene.getObjectByName('baked');

	// 打印材质和贴图信息
	console.log('Material:', baked.material);
	console.log('UV Map:', baked.material.map);
	console.log('UV Coordinates:', baked.geometry.attributes.uv);

	// 保存原有贴图的引用
	const originalMap = baked.material.map;

	// 加载新图片并更新贴图
	textureLoader.load('./baked.jpg', (texture) => {
		// 复制所有原有贴图的变换属性
		texture.anisotropy = originalMap.anisotropy;
		texture.wrapS = originalMap.wrapS;
		texture.wrapT = originalMap.wrapT;
		texture.repeat.copy(originalMap.repeat);
		texture.offset.copy(originalMap.offset);
		texture.rotation = originalMap.rotation;
		texture.center.copy(originalMap.center);
		texture.flipY = originalMap.flipY;
		texture.encoding = originalMap.encoding;
		texture.minFilter = originalMap.minFilter;
		texture.magFilter = originalMap.magFilter;
		texture.mapping = originalMap.mapping;
		texture.premultiplyAlpha = originalMap.premultiplyAlpha;
		texture.matrix.copy(originalMap.matrix);
		texture.matrixAutoUpdate = originalMap.matrixAutoUpdate;

		// 更新材质贴图
		baked.material.map = texture;
		baked.material.needsUpdate = true;
	});

	scene.add(gltf.scene);
});

/**
 * Smoke
 */
// Geometry
const smokeGeometry = new THREE.PlaneGeometry(1, 1, 16, 64);
smokeGeometry.translate(0, 0.5, 0);
smokeGeometry.scale(1.5, 6, 1.5);

// Perlin texture
const perlinTexture = textureLoader.load('./perlin.png');
perlinTexture.wrapS = THREE.RepeatWrapping;
perlinTexture.wrapT = THREE.RepeatWrapping;

// Material
const smokeMaterial = new THREE.ShaderMaterial({
	vertexShader: coffeeSmokeVertexShader,
	fragmentShader: coffeeSmokeFragmentShader,
	uniforms: {
		uTime: new THREE.Uniform(0),
		uPerlinTexture: new THREE.Uniform(perlinTexture),
	},
	side: THREE.DoubleSide,
	transparent: true,
	depthWrite: false,
	// wireframe: true
});

// Mesh
const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
smoke.position.y = 1.83;
scene.add(smoke);

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
	const elapsedTime = clock.getElapsedTime();

	// Update smoke
	smokeMaterial.uniforms.uTime.value = elapsedTime;

	// Update controls
	controls.update();

	// Render
	renderer.render(scene, camera);

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

tick();
