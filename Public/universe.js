// Utility functions
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    }
}

function createPlanetTooltip() {
    const tooltip = document.createElement('div');
    tooltip.id = 'planet-tooltip';
    document.body.appendChild(tooltip);
    return tooltip;
}

function isObjectVisible(object, camera) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(object.children);
    return intersects.length > 0;
}

// Move createPlanets outside as a separate function
function createPlanets(movies) {
    const planetSystem = new THREE.Group();
    
    // Group by directors with 10+ movies
    const significantDirectors = movies.reduce((acc, movie) => {
        if (!movie.director) return acc;
        if (!acc[movie.director]) {
            acc[movie.director] = {
                count: 0,
                movies: []
            };
        }
        acc[movie.director].count++;
        acc[movie.director].movies.push(movie);
        return acc;
    }, {});

    // Group by genres with 10+ movies
    const significantGenres = movies.reduce((acc, movie) => {
        if (!movie.listed_in) return acc;
        const genres = movie.listed_in.split(',').map(g => g.trim());
        
        genres.forEach(genre => {
            if (!acc[genre]) {
                acc[genre] = {
                    count: 0,
                    movies: []
                };
            }
            acc[genre].count++;
            acc[genre].movies.push(movie);
        });
        return acc;
    }, {});

    // Planet colors
    const directorColors = [
        0x4b6cb7,  // Earth blue
        0xff6b6b,  // Light red
        0xe67e22,  // Orange
    ];

    const genreColors = [
        0x9b59b6,  // Purple
        0x1abc9c,  // Turquoise
        0xf1c40f   // Yellow
    ];

    // Create director planets
    Object.entries(significantDirectors)
        .filter(([_, data]) => data.count >= 10)
        .forEach(([director, data], index) => {
            const size = Math.max(10, Math.min(28, data.count * 1.05));
            
            const geometry = new THREE.SphereGeometry(size, 32, 32);
            const material = new THREE.MeshPhongMaterial({
                color: directorColors[index % directorColors.length],
                shininess: 30,
                metalness: 0.3
            });

            const planet = new THREE.Mesh(geometry, material);

            // Position planets within the galaxy radius
            const radius = Math.random() * 800;
            const angle = Math.random() * Math.PI * 2;
            const yOffset = (Math.random() - 0.5) * 200;

            planet.position.set(
                Math.cos(angle) * radius,
                yOffset,
                Math.sin(angle) * radius
            );

            planet.userData = {
                type: 'director',
                name: director,
                movieCount: data.count,
                movies: data.movies.slice(0, 5)
            };

            planetSystem.add(planet);
        });

    // Create genre planets
    Object.entries(significantGenres)
        .filter(([_, data]) => data.count >= 10)
        .forEach(([genre, data], index) => {
            const size = Math.max(14, Math.min(35, data.count * 0.84));
            
            const geometry = new THREE.SphereGeometry(size, 32, 32);
            const material = new THREE.MeshPhongMaterial({
                color: genreColors[index % genreColors.length],
                shininess: 40,
                metalness: 0.5,
                roughness: 0.7
            });

            const planet = new THREE.Mesh(geometry, material);

            // Position genre planets in a different orbital plane
            const radius = Math.random() * 800;
            const angle = Math.random() * Math.PI * 2;
            const yOffset = (Math.random() - 0.5) * 200 + 100;

            planet.position.set(
                Math.cos(angle) * radius,
                yOffset,
                Math.sin(angle) * radius
            );

            planet.userData = {
                type: 'genre',
                name: genre,
                movieCount: data.count,
                movies: data.movies.slice(0, 5)
            };

            planetSystem.add(planet);
        });

    return planetSystem;
}

// Move other helper functions outside
function createGalaxyLabel() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    // Style the text with Netflix's red color
    context.fillStyle = 'rgba(229, 9, 20, 0.9)'; // Netflix red
    context.font = 'bold 80px Arial';
    context.textAlign = 'center';
    context.fillText('Netflix', canvas.width/2, canvas.height/2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(500, 125, 1);
    sprite.position.set(0, 200, 0); // Position above Netflix galaxy

    return sprite;
}

function createHuluLabel() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    // Style the text with Hulu's green color
    context.fillStyle = 'rgba(28, 231, 131, 0.9)'; // Hulu green
    context.font = 'bold 80px Arial';
    context.textAlign = 'center';
    context.fillText('Hulu', canvas.width/2, canvas.height/2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(500, 125, 1);
    sprite.position.set(2100, 1000, -1000); // Position above Hulu galaxy

    return sprite;
}

// Main visualization function
function visualizeStreamingUniverse(streamingServicesData) {
    const container = document.getElementById('galaxy-container');
    const width = window.innerWidth;
    const height = window.innerHeight * 0.75;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000005);

    // Camera setup with adjusted parameters for wider view
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    camera.position.set(2000, 1000, 2000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Add window resize handler
    window.addEventListener('resize', () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight * 0.75;
        
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });

    // Initialize controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 5000;
    controls.minDistance = 100;

    // Add lighting for planets
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 0);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Your existing createGalaxy function here
    function createGalaxy(movies) {
        const galaxy = new THREE.Group();
        
        // Group movies by genre for better performance
        const groupedMovies = movies.reduce((acc, movie) => {
            const genre = movie.listed_in ? movie.listed_in.split(',')[0].trim() : 'Unknown';
            if (!acc[genre]) {
                acc[genre] = [];
            }
            acc[genre].push(movie);
            return acc;
        }, {});

        // Parameters for galaxy shape
        const params = {
            radius: 1000,
            randomness: 0.3,
            randomnessPower: 3,
            branches: Object.keys(groupedMovies).length || 4
        };

        // Create stars for each genre group
        Object.entries(groupedMovies).forEach(([genre, genreMovies], branchIndex) => {
            const starsCount = genreMovies.length;
            const positions = new Float32Array(starsCount * 3);
            const scales = new Float32Array(starsCount);
            const colors = new Float32Array(starsCount * 3);

            // Calculate branch angle based on genre
            const branchAngle = (branchIndex / params.branches) * Math.PI * 2;

            for(let i = 0; i < starsCount; i++) {
                const i3 = i * 3;

                // Position stars along branch
                const radius = (i / starsCount) * params.radius;
                const spinAngle = radius * 0.01;
                const angle = branchAngle + spinAngle;

                // Add controlled randomness
                const randomRadius = radius + (Math.random() - 0.5) * 100;
                const randomAngle = angle + (Math.random() - 0.5) * 0.5;

                positions[i3] = Math.cos(randomAngle) * randomRadius;
                positions[i3 + 1] = (Math.random() - 0.5) * params.radius * 0.2; // Y-axis spread
                positions[i3 + 2] = Math.sin(randomAngle) * randomRadius;

                // Brightness based on distance from center
                const brightness = 0.8 + (radius / params.radius) * 0.2;
                colors[i3] = brightness;
                colors[i3 + 1] = brightness;
                colors[i3 + 2] = brightness;

                // Size based on movie rating or year
                const movieAge = 2024 - genreMovies[i].release_year;
                scales[i] = Math.max(1, 3 - (movieAge / 20)); // Newer movies are bigger
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(scales, 1));

            const material = new THREE.ShaderMaterial({
                vertexShader: `
                    attribute float size;
                    varying vec3 vColor;
                    void main() {
                        vColor = color;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_PointSize = size * (300.0 / -mvPosition.z);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    varying vec3 vColor;
                    void main() {
                        float r = distance(gl_PointCoord, vec2(0.5));
                        if(r > 0.5) discard;
                        float intensity = pow(1.0 - (r * 2.0), 1.5);
                        gl_FragColor = vec4(vColor, intensity);
                    }
                `,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                transparent: true,
                vertexColors: true
            });

            const stars = new THREE.Points(geometry, material);
            galaxy.add(stars);
        });

        return galaxy;
    }

    // Then create galaxies and labels
    const netflixGalaxy = createGalaxy(streamingServicesData.Netflix);
    const netflixPlanetSystem = createPlanets(streamingServicesData.Netflix);
    const galaxyLabel = createGalaxyLabel();

    const huluGalaxy = createGalaxy(streamingServicesData.Hulu);
    const huluPlanetSystem = createPlanets(streamingServicesData.Hulu);
    const huluLabel = createHuluLabel();

    // Position Hulu elements (move to the right side)
    huluGalaxy.position.set(3500, 800, 0); // Changed from (2100, 800, -1000)
    huluPlanetSystem.position.set(3500, 800, 0);
    huluLabel.position.set(3500, 1000, 0); // Adjust label position to match

    // Add everything to the scene
    scene.add(netflixGalaxy);
    scene.add(netflixPlanetSystem);
    scene.add(galaxyLabel);

    scene.add(huluGalaxy);
    scene.add(huluPlanetSystem);
    scene.add(huluLabel);

    // Add Disney+ label creation function
    function createDisneyLabel() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;

        // Style the text with Disney+ blue color
        context.fillStyle = 'rgba(10, 132, 255, 0.9)'; // Disney+ blue
        context.font = 'bold 80px Arial';
        context.textAlign = 'center';
        context.fillText('Disney+', canvas.width/2, canvas.height/2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 1
        });

        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(500, 125, 1);
       
        sprite.position.set(-3500, 700, 2500); 

        return sprite;
    }

    // Create Disney+ elements (add after Netflix and Hulu creation)
    const disneyGalaxy = createGalaxy(streamingServicesData.Disney);
    const disneyPlanetSystem = createPlanets(streamingServicesData.Disney);
    const disneyLabel = createDisneyLabel();

    // Position Disney+ elements (keep on left side, but adjust z-coordinate)
    disneyGalaxy.position.set(-3500, 500, 0); 
    disneyPlanetSystem.position.set(-3500, 500, 0);
    disneyLabel.position.set(-3500, 700, 0); // Adjust label position to match

    // Add Disney+ elements to scene
    scene.add(disneyGalaxy);
    scene.add(disneyPlanetSystem);
    scene.add(disneyLabel);

    // Add planet hover functionality
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Throttle mousemove event
    const throttledMouseMove = throttle((event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        
        const netflixIntersects = raycaster.intersectObjects(netflixPlanetSystem.children);
        const huluIntersects = raycaster.intersectObjects(huluPlanetSystem.children);
        const disneyIntersects = raycaster.intersectObjects(disneyPlanetSystem.children);
        const intersects = [...netflixIntersects, ...huluIntersects, ...disneyIntersects];

        if (intersects.length > 0) {
            const planet = intersects[0].object;
            document.body.style.cursor = 'pointer';
            
            const tooltip = document.getElementById('planet-tooltip') || createPlanetTooltip();
            
            if (planet.userData.type === 'director') {
                tooltip.innerHTML = `
                    Director: ${planet.userData.name}<br>
                    Movies: ${planet.userData.movieCount}<br>
                    <br>
                    Top Movies:<br>
                    ${planet.userData.movies.map(m => m.title).join('<br>')}
                `;
            } else {
                tooltip.innerHTML = `
                    Genre: ${planet.userData.name}<br>
                    Movies: ${planet.userData.movieCount}<br>
                    <br>
                    Recent Movies:<br>
                    ${planet.userData.movies.map(m => m.title).join('<br>')}
                `;
            }
            
            tooltip.style.left = event.clientX + 10 + 'px';
            tooltip.style.top = event.clientY - 10 + 'px';
            tooltip.style.opacity = '1';
        } else {
            document.body.style.cursor = 'default';
            const tooltip = document.getElementById('planet-tooltip');
            if (tooltip) tooltip.style.opacity = '0';
        }
    }, 50); // Throttle to 50ms

    // Replace the existing mousemove listener
    container.addEventListener('mousemove', throttledMouseMove);

    // Add after Disney+ label but before event listeners
    function createPrimeLabel() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
    
        // Style the text with Prime's blue color
        context.fillStyle = 'rgba(0, 168, 225, 0.9)'; // Prime blue
        context.font = 'bold 80px Arial';
        context.textAlign = 'center';
        context.fillText('Prime', canvas.width/2, canvas.height/2);
    
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 1
        });
    
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(500, 125, 1);
        sprite.position.set(0, 500, -3500); // Updated to match galaxy position (with slight Y offset for visibility)
    
        return sprite;
    }

    // Create Prime elements (add after Disney+ creation)
    const primeGalaxy = createGalaxy(streamingServicesData.Prime);
    const primePlanetSystem = createPlanets(streamingServicesData.Prime);
    const primeLabel = createPrimeLabel();

    // Position Prime elements (move to the back, but further away)
    primeGalaxy.position.set(0, 500, -3500); // Changed from (-2000, 0, -1000)
    primePlanetSystem.position.set(0, 500, -3500);
    primeLabel.position.set(0, 700, -3500); // Adjust label position to match

    // Add Prime elements to scene
    scene.add(primeGalaxy);
    scene.add(primePlanetSystem);
    scene.add(primeLabel);

    // Movement configuration
    const MOVEMENT = {
        maxSpeed: 50,
        acceleration: 2.5,
        deceleration: 0.95,
        velocities: {
            x: 0,
            y: 0,
            z: 0
        }
    };

    // Keyboard controls setup
    const keyboardControls = {
        keys: {
            'KeyW': false,
            'KeyS': false,
            'KeyA': false,
            'KeyD': false,
            'Space': false,
            'ShiftLeft': false
        }
    };

    // Add keyboard event listeners
    window.addEventListener('keydown', (event) => {
        if (keyboardControls.keys.hasOwnProperty(event.code)) {
            keyboardControls.keys[event.code] = true;
        }
    });

    window.addEventListener('keyup', (event) => {
        if (keyboardControls.keys.hasOwnProperty(event.code)) {
            keyboardControls.keys[event.code] = false;
        }
    });

    // Update the processKeyboardControls function
    function processKeyboardControls() {
        // Update velocities based on key states
        if (keyboardControls.keys['KeyW']) {
            MOVEMENT.velocities.z = Math.max(
                MOVEMENT.velocities.z - MOVEMENT.acceleration,
                -MOVEMENT.maxSpeed
            );
        }
        if (keyboardControls.keys['KeyS']) {
            MOVEMENT.velocities.z = Math.min(
                MOVEMENT.velocities.z + MOVEMENT.acceleration,
                MOVEMENT.maxSpeed
            );
        }
        if (keyboardControls.keys['KeyA']) {
            MOVEMENT.velocities.x = Math.max(
                MOVEMENT.velocities.x - MOVEMENT.acceleration,
                -MOVEMENT.maxSpeed
            );
        }
        if (keyboardControls.keys['KeyD']) {
            MOVEMENT.velocities.x = Math.min(
                MOVEMENT.velocities.x + MOVEMENT.acceleration,
                MOVEMENT.maxSpeed
            );
        }
        if (keyboardControls.keys['Space']) {
            MOVEMENT.velocities.y = Math.min(
                MOVEMENT.velocities.y + MOVEMENT.acceleration,
                MOVEMENT.maxSpeed
            );
        }
        if (keyboardControls.keys['ShiftLeft']) {
            MOVEMENT.velocities.y = Math.max(
                MOVEMENT.velocities.y - MOVEMENT.acceleration,
                -MOVEMENT.maxSpeed
            );
        }

        // Apply deceleration
        if (!keyboardControls.keys['KeyW'] && !keyboardControls.keys['KeyS']) {
            MOVEMENT.velocities.z *= MOVEMENT.deceleration;
        }
        if (!keyboardControls.keys['KeyA'] && !keyboardControls.keys['KeyD']) {
            MOVEMENT.velocities.x *= MOVEMENT.deceleration;
        }
        if (!keyboardControls.keys['Space'] && !keyboardControls.keys['ShiftLeft']) {
            MOVEMENT.velocities.y *= MOVEMENT.deceleration;
        }

        // Apply movement
        if (Math.abs(MOVEMENT.velocities.x) > 0.01) {
            camera.position.x += MOVEMENT.velocities.x;
            mapControls.target.x += MOVEMENT.velocities.x;
        }
        if (Math.abs(MOVEMENT.velocities.y) > 0.01) {
            camera.position.y += MOVEMENT.velocities.y;
            mapControls.target.y += MOVEMENT.velocities.y;
        }
        if (Math.abs(MOVEMENT.velocities.z) > 0.01) {
            camera.position.z += MOVEMENT.velocities.z;
            mapControls.target.z += MOVEMENT.velocities.z;
        }
    }

    // Create a custom control system
    const mapControls = new THREE.MapControls(camera, renderer.domElement);
    mapControls.enableDamping = true;
    mapControls.dampingFactor = 0.05;
    mapControls.screenSpacePanning = true;
    mapControls.maxDistance = 5000;
    mapControls.minDistance = 100;

    // Configure map-like controls
    mapControls.enableRotate = true;
    mapControls.rotateSpeed = 0.5;
    mapControls.enableZoom = true;
    mapControls.zoomSpeed = 2.5;
    mapControls.enablePan = true;
    mapControls.panSpeed = 1.0;

    // Set up constraints
    mapControls.maxPolarAngle = Math.PI / 2;
    mapControls.minPolarAngle = 0;
    mapControls.maxAzimuthAngle = Infinity;
    mapControls.minAzimuthAngle = -Infinity;

    // Add zoom acceleration
    let currentZoomSpeed = 2.5;
    const maxZoomSpeed = 4.0;
    const zoomAcceleration = 0.1;

    // Add wheel event listener for dynamic zoom speed
    renderer.domElement.addEventListener('wheel', (event) => {
        // Check if we're already at max distance before allowing zoom out
        const currentDistance = camera.position.distanceTo(mapControls.target);
        if (event.deltaY > 0 && currentDistance >= mapControls.maxDistance) {
            return; // Prevent zooming out if we're at max distance
        }
        
        // Increase zoom speed while zooming
        currentZoomSpeed = Math.min(currentZoomSpeed + zoomAcceleration, maxZoomSpeed);
        mapControls.zoomSpeed = currentZoomSpeed;
    }, { passive: true });

    // Reset zoom speed when not zooming
    setInterval(() => {
        if (currentZoomSpeed > 2.5) {
            currentZoomSpeed = Math.max(2.5, currentZoomSpeed - zoomAcceleration);
            mapControls.zoomSpeed = currentZoomSpeed;
        }
    }, 100);

    // Throttle wheel event
    const throttledWheel = throttle((event) => {
        currentZoomSpeed = Math.min(currentZoomSpeed + zoomAcceleration, maxZoomSpeed);
        mapControls.zoomSpeed = currentZoomSpeed;
    }, 50);

    // Replace the existing wheel listener
    renderer.domElement.addEventListener('wheel', throttledWheel, { passive: true });

    // Debounce resize event
    const debouncedResize = debounce(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, 250); // Debounce to 250ms

    // Replace the existing resize listener
    window.addEventListener('resize', debouncedResize);

    // Add this at the start of visualizeStreamingUniverse function
    function createFPSCounter() {
        const fpsDiv = document.createElement('div');
        fpsDiv.className = 'fps-counter';
        document.body.appendChild(fpsDiv);
        
        let frameCount = 0;
        let lastTime = performance.now();
        
        function updateFPS() {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                fpsDiv.textContent = `FPS: ${fps}`;
                frameCount = 0;
                lastTime = currentTime;
            }
        }
        
        return updateFPS;
    }

    // Add the FPS counter to your animation loop
    const updateFPS = createFPSCounter();

    // Update your animate function
    function animate() {
        requestAnimationFrame(animate);
        
        // Update FPS counter
        updateFPS();
        
        // Process keyboard controls every frame
        processKeyboardControls();
        
        // Calculate distances and update labels
        const distanceToNetflix = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
        const distanceToHulu = camera.position.distanceTo(new THREE.Vector3(2500, 0, 0));
        const distanceToDisney = camera.position.distanceTo(new THREE.Vector3(-2500, 0, 0));
        const distanceToPrime = camera.position.distanceTo(new THREE.Vector3(0, 0, -2500));
        
        mapControls.update();
        renderer.render(scene, camera);
    }

    // Start animation
    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Replace the existing controls setup with this enhanced version
    // Remove the existing OrbitControls initialization
    controls.dispose(); // Clean up existing controls

    const instructions = document.createElement('div');
    instructions.className = 'instructions';
    instructions.innerHTML = `
        Controls:<br>
        WASD - Move horizontally<br>
        Space/Shift - Move up/down<br>
        Left Mouse - Rotate view<br>
        Right Mouse - Pan<br>
        Mouse Wheel - Zoom
    `;
    document.body.appendChild(instructions);
}
// Export the universe object with the visualization function
export const universe = {
    visualizeStreamingUniverse
};
