import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { earthRadius } from "satellite.js/lib/constants";

import circle from './assets/circle.png';
import Albedo from './assets/earthmap-high.jpg';
import Bump from './assets/Bump.jpg';
import Ocean from './assets/Ocean.png';
import Clouds from './assets/Clouds.png';
import NightLights from './assets/night_lights_modified.png';
import GaiaSky from './assets/Gaia_EDR3_darkened.png';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

import { parseTleFile, getPositionFromTle } from './tle';
// import { earthRadius } from 'satellite.js/lib/constants';
import * as satellite from 'satellite.js/lib/index';

const params = {
    sunIntensity: 1.3,
    speedFactor: 2.0,
    metalness: 0.1,
    atmOpacity: { value: 0.7 },
    atmPowFactor: { value: 4.1 },
    atmMultiplier: { value: 9.5 },
};

function loadTexture(url) {
    return new Promise((resolve, reject) => {
        const loader = new THREE.TextureLoader();
        loader.load(
            url,
            (texture) => {
                resolve(texture);
            },
            undefined,
            (error) => {
                console.error(`Failed to load texture: ${url}`, error);
                reject(error);
            }
        );
    });
}


const SatelliteSize = 50;
const MinutesPerDay = 1440;
const ixpdotp = MinutesPerDay / (2.0 * 3.141592654);

let TargetDate = new Date();

const defaultOptions = {
    backgroundColor: 0x041119,
    defaultSatelliteColor: 0xff0000,
    onStationClicked: null
};

const defaultStationOptions = {
    orbitMinutes: 0,
    satelliteSize: 50
};

export class Engine {

    stations = [];
    referenceFrame = 1;

    initialize(container, options = {}) {
        this.el = container;
        this.raycaster = new THREE.Raycaster();
        this.options = { ...defaultOptions, ...options };
    
        this._setupScene();
        this._setupLights();

        
    
        // Removed: this._addBaseObjects();
    
        // Load textures and create Earth
        this.loadTextures().then(textures => {
            this.addEarthToScene(textures);
            this.render();
        });
    
        window.addEventListener('resize', this.handleWindowResize);
        window.addEventListener('pointerdown', this.handleMouseDown);
    }
    

    dispose() {
        window.removeEventListener('pointerdown', this.handleMouseDown);
        window.removeEventListener('resize', this.handleWindowResize);

        this.raycaster = null;
        this.el = null;

        this.controls.dispose();
        if (this.renderer) {
            this.renderer.dispose();
        }
    }

    handleWindowResize = () => {
        const width = this.el.clientWidth;
        const height = this.el.clientHeight;

        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.render();
    };

    handleMouseDown = (e) => {
        const mouse = new THREE.Vector2(
            (e.clientX / this.el.clientWidth) * 2 - 1,
            -(e.clientY / this.el.clientHeight) * 2 + 1
        );

        this.raycaster.setFromCamera(mouse, this.camera);

        let station = null;

        var intersects = this.raycaster.intersectObjects(this.scene.children, true);
        if (intersects && intersects.length > 0) {
            const picked = intersects[0].object;
            if (picked) {
                station = this._findStationFromMesh(picked);
            }
        }

        const cb = this.options.onStationClicked;
        if (cb) cb(station);
    }

    async loadTextures() {
        const albedoMap = await loadTexture(Albedo);
        albedoMap.colorSpace = THREE.SRGBColorSpace;

        const bumpMap = await loadTexture(Bump);
        const cloudsMap = await loadTexture(Clouds);
        const oceanMap = await loadTexture(Ocean);
        const lightsMap = await loadTexture(NightLights);
        const envMap = await loadTexture(GaiaSky);
        envMap.mapping = THREE.EquirectangularReflectionMapping;

        return { albedoMap, bumpMap, cloudsMap, oceanMap, lightsMap, envMap };
    }

    addEarthToScene(textures) {
        const { albedoMap, bumpMap, cloudsMap, oceanMap, lightsMap, envMap } = textures;

        // Create Earth
        console.log('Creating Earth...');
        let earthGeo = new THREE.SphereGeometry(earthRadius, 50, 50);
        let earthMat = new THREE.MeshStandardMaterial({
            map: albedoMap,
            bumpMap: bumpMap,
            bumpScale: 0.03,
            roughnessMap: oceanMap,
            metalness: params.metalness,
            metalnessMap: oceanMap,
            emissiveMap: lightsMap,
            emissive: new THREE.Color(0xffff88),
        });
        this.earth = new THREE.Mesh(earthGeo, earthMat);
        console.log('Earth created:', this.earth);

        // Create Clouds
        let cloudGeo = new THREE.SphereGeometry(10.05, 64, 64);
        let cloudsMat = new THREE.MeshStandardMaterial({
            alphaMap: cloudsMap,
            transparent: true,
        });
        this.clouds = new THREE.Mesh(cloudGeo, cloudsMat);

        // Create Atmosphere
        let atmosGeo = new THREE.SphereGeometry(12.5, 64, 64);
        let atmosMat = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                atmOpacity: params.atmOpacity,
                atmPowFactor: params.atmPowFactor,
                atmMultiplier: params.atmMultiplier,
            },
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
        });
        this.atmos = new THREE.Mesh(atmosGeo, atmosMat);

        // Group and add to scene
        this.earthGroup = new THREE.Group();
        this.earthGroup.rotation.z = 23.5 / 360 * 2 * Math.PI; // Earth's tilt
        this.earthGroup.add(this.earth);
        this.earthGroup.add(this.clouds);
        this.earthGroup.add(this.atmos);
        this.scene.add(this.earthGroup);
        console.log('Earth added to scene.');
    }

    updateScene(interval) {
        // Rotate the Earth and Clouds
        this.earth.rotateY(interval * 0.005 * params.speedFactor);
        this.clouds.rotateY(interval * 0.01 * params.speedFactor);

        // Update shaders if necessary
        const shader = this.earth.material.userData.shader;
        if (shader) {
            let offset = (interval * 0.005 * params.speedFactor) / (2 * Math.PI);
            shader.uniforms.uv_xOffset.value += offset % 1;
        }

        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }

    addSatellite = (station, color, size) => {
        const sat = this._getSatelliteSprite(color, size);
        const pos = this._getSatellitePositionFromTle(station);
        if (!pos) return;

        sat.position.set(pos.x, pos.y, pos.z);
        station.mesh = sat;

        this.stations.push(station);

        if (station.orbitMinutes > 0) this.addOrbit(station);

        this.earth.add(sat);
    }

    loadLteFileStations = (url, color, stationOptions) => {
        const options = { ...defaultStationOptions, ...stationOptions };

        return fetch(url).then(res => {
            if (res.ok) {
                return res.text().then(text => {
                    return this._addTleFileStations(text, color, options);
                });
            }
        });
    }

    addOrbit = (station) => {
        if (station.orbitMinutes > 0) return;

        const revsPerDay = station.satrec.no * ixpdotp;
        const intervalMinutes = 1;
        const minutes = station.orbitMinutes || MinutesPerDay / revsPerDay;
        const initialDate = new Date();

        if (!this.orbitMaterial) {
            this.orbitMaterial = new THREE.LineBasicMaterial({ color: 0x999999, opacity: 1.0, transparent: true });
        }

        var points = [];

        for (var i = 0; i <= minutes; i += intervalMinutes) {
            const date = new Date(initialDate.getTime() + i * 60000);

            const pos = getPositionFromTle(station, date, this.referenceFrame);
            if (!pos) continue;

            points.push(new THREE.Vector3(pos.x, pos.y, pos.z));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        var orbitCurve = new THREE.Line(geometry, this.orbitMaterial);
        station.orbit = orbitCurve;
        station.mesh.material = this.selectedMaterial;

        this.earth.add(orbitCurve);
        this.render();
    }

    removeOrbit = (station) => {
        if (!station || !station.orbit) return;

        this.earth.remove(station.orbit);
        station.orbit.geometry.dispose();
        station.orbit = null;
        station.mesh.material = this.material;
        this.render();
    }

    highlightStation = (station) => {
        station.mesh.material = this.highlightedMaterial;
    }

    clearStationHighlight = (station) => {
        station.mesh.material = this.material;
    }

    setReferenceFrame = (type) => {
        this.referenceFrame = type;
    }

    _addTleFileStations = (lteFileContent, color, stationOptions) => {
        const stations = parseTleFile(lteFileContent, stationOptions);

        const { satelliteSize } = stationOptions;

        stations.forEach(s => {
            this.addSatellite(s, color, satelliteSize);
        });

        this.render();

        return stations;
    }

    _getSatelliteMesh = (color, size) => {
        color = color || this.options.defaultSatelliteColor;
        size = size || SatelliteSize;
    
        let geometry = new THREE.SphereGeometry(size, 16, 16); // Increase segments for smoother sphere
        let material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: 0xFF4040,
            flatShading: false,
            side: THREE.DoubleSide,
        });
    
        return new THREE.Mesh(geometry, material);
    }
    
    _setupSpriteMaterials = (color) => {
        if (this.material && this.lastColor === color) return;

        this._satelliteSprite = new THREE.TextureLoader().load(circle, this.render);
        this.selectedMaterial = new THREE.SpriteMaterial({
            map: this._satelliteSprite,
            color: 0xFF0000,
            sizeAttenuation: false
        });
        this.highlightedMaterial = new THREE.SpriteMaterial({
            map: this._satelliteSprite,
            color: 0xfca300,
            sizeAttenuation: false
        });
        this.material = new THREE.SpriteMaterial({
            map: this._satelliteSprite,
            color: color,
            sizeAttenuation: false
        });
        this.lastColor = color;
    }

    _getSatelliteSprite = (color, size) => {
        const SpriteScaleFactor = 5000;

        this._setupSpriteMaterials(color);

        const result = new THREE.Sprite(this.material);
        result.scale.set(size / SpriteScaleFactor, size / SpriteScaleFactor, 1);
        return result;
    }

    _getSatellitePositionFromTle = (station, date) => {
        date = date || TargetDate;
        return getPositionFromTle(station, date, this.referenceFrame);
    }

    updateSatellitePosition = (station, date) => {
        date = date || TargetDate;

        const pos = getPositionFromTle(station, date, this.referenceFrame);
        if (!pos) return;

        station.mesh.position.set(pos.x, pos.y, pos.z);
    }

    updateAllPositions = (date) => {
        if (!this.stations) return;

        this.stations.forEach(station => {
            this.updateSatellitePosition(station, date);
        });

        if (this.referenceFrame === 2)
            this._updateEarthRotation(date);
        else
            this.render();
    }

    _updateEarthRotation = (date) => {
        const gst = satellite.gstime(date)
        this.earthMesh.setRotationFromEuler(new THREE.Euler(0, gst, 0));

        this.render();
    }

    _setupScene = () => {
        const width = this.el.clientWidth;
        const height = this.el.clientHeight;

        this.scene = new THREE.Scene();

        this._setupCamera(width, height);

        this.renderer = new THREE.WebGLRenderer({
            logarithmicDepthBuffer: true,
            antialias: true
        });

        this.renderer.setClearColor(new THREE.Color(this.options.backgroundColor));
        this.renderer.setSize(width, height);

        this.el.appendChild(this.renderer.domElement);
    };

    _setupCamera(width, height) {
        var NEAR = 1e-6, FAR = 1e27;
        this.camera = new THREE.PerspectiveCamera(54, width / height, NEAR, FAR);
        this.controls = new OrbitControls(this.camera, this.el);
        this.controls.enablePan = false;
        this.controls.addEventListener('change', () => this.render());
        this.camera.position.z = -15000;
        this.camera.position.x = 15000;
        this.camera.lookAt(0, 0, 0);
    }
    

    _setupLights = () => {
        const sun = new THREE.DirectionalLight(0xffffff, params.sunIntensity);
        sun.position.set(50, 50, 50);  // Position the sun to illuminate the Earth
        this.scene.add(sun);
    
        const ambient = new THREE.AmbientLight(0x404040);  // Dim ambient light
        this.scene.add(ambient);
    }
    

    render = () => {
        this.renderer.render(this.scene, this.camera);
    };

    _findStationFromMesh = (threeObject) => {
        for (var i = 0; i < this.stations.length; ++i) {
            const s = this.stations[i];

            if (s.mesh === threeObject) return s;
        }

        return null;
    }
}
