import { universe } from './universe.js'; 


Promise.all([
  fetch('https://streaming-service-catalog-visualisation-5f9ev0wl1.vercel.app/api/movies/netflix-movies').then(response => response.json()),
  fetch('https://streaming-service-catalog-visualisation-5f9ev0wl1.vercel.app/api/movies/prime-movies').then(response => response.json()),
  fetch('https://streaming-service-catalog-visualisation-5f9ev0wl1.vercel.app/api/movies/hulu-movies').then(response => response.json()),
  fetch('https://streaming-service-catalog-visualisation-5f9ev0wl1.vercel.app/api/movies/disney-movies').then(response => response.json()),
])
.then(([netflixData, primeData, huluData, disneyData]) => {
  // Create streaming services data object first
  const streamingServicesData = {
    Netflix: netflixData,
    Prime: primeData,
    Hulu: huluData,
    Disney: disneyData
  };

  // Initialize universe visualization
  const galaxyContainer = document.getElementById('galaxy-container');
  const placeholder = document.createElement('div');
  placeholder.style.cssText = `
      width: 100%;
      height: 400px;
      background: linear-gradient(to bottom, #0f0f1f, #1f1f3f);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      color: white;
      text-align: center;
      transition: background 0.3s ease;
  `;

  placeholder.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 15px;">
          <i class="fas fa-galaxy"></i> Streaming Universe Visualization
      </div>
      <div style="font-size: 16px; opacity: 0.8;">
          Click to explore the interactive 3D visualization of streaming services catalog
      </div>
  `;

  let universeInitialized = false;
  placeholder.addEventListener('click', () => {
      if (!universeInitialized) {
          galaxyContainer.innerHTML = '';
          universe.visualizeStreamingUniverse(streamingServicesData);
          universeInitialized = true;
      }
  });

  placeholder.addEventListener('mouseover', () => {
      placeholder.style.background = 'linear-gradient(to bottom, #1f1f3f, #2f2f5f)';
  });

  placeholder.addEventListener('mouseout', () => {
      placeholder.style.background = 'linear-gradient(to bottom, #0f0f1f, #1f1f3f)';
  });

  galaxyContainer.appendChild(placeholder);

  // Continue with other visualizations
  const allMovies = [...netflixData, ...primeData, ...huluData, ...disneyData];
  visualizeStackedBarChart(allMovies);

  
  create3DTreemapWithLabels(allMovies, "#treemap");


  // Create data structure for directors
  const directorStats = allMovies.reduce((acc, movie) => {
    // Skip if no director
    if (!movie.director) return acc;
    
    const directorName = movie.director;
    
    // Initialize director entry if doesn't exist
    if (!acc[directorName]) {
      acc[directorName] = {
        name: directorName,
        movieCount: 0,
        genres: {},
        movies: []
      };
    }
    
    // Update director statistics
    acc[directorName].movieCount++;
    
    // Add movie to director's filmography
    acc[directorName].movies.push({
      title: movie.title,
      year: movie.release_year,
      genre: movie.listed_in
    });
    
    // Update genre counts
    movie.listed_in.split(',').forEach(genre => {
      const cleanGenre = genre.trim();
      acc[directorName].genres[cleanGenre] = (acc[directorName].genres[cleanGenre] || 0) + 1;
    });
    
    return acc;
  }, {});

  // Convert to array and sort by movie count
  const directorsArray = Object.values(directorStats)
    .map(director => ({
      ...director,
      dominantGenre: Object.entries(director.genres)
        .sort((a, b) => b[1] - a[1])[0][0]
    }))
    .filter(director => director.movieCount >= 10)
    .sort((a, b) => b.movieCount - a.movieCount)
    .slice(0, 30);

  console.log(`Number of directors being visualized: ${directorsArray.length}`);
  console.log('Top directors:', directorsArray.slice(0, 10));

  // Continue with your existing year/genre processing code...
  const moviesByYearAndGenre = allMovies.reduce((acc, movie) => {
    const year = movie.release_year;
    if (!acc[year]) acc[year] = {};
    
    movie.listed_in.split(',').forEach(genre => {
      const cleanGenre = genre.trim();
      if (!acc[year][cleanGenre]) acc[year][cleanGenre] = 0;
      acc[year][cleanGenre]++;
    });
    return acc;
  }, {});


  //Process data for river flow chart
  const contentAdditions = Object.entries(streamingServicesData).reduce((acc, [service, data]) => {
    acc[service] = data.reduce((serviceAcc, movie) => {
      if (!movie.date_added) return serviceAcc;
      
      const date = new Date(movie.date_added);
      const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!serviceAcc[yearMonth]) {
        serviceAcc[yearMonth] = {
          date: yearMonth,
          count: 0,
          totalCount: 0
        };
      }
      
      serviceAcc[yearMonth].count++;
      return serviceAcc;
    }, {});
    return acc;
  }, {});

  const allDates = [...new Set(
    Object.values(contentAdditions)
      .flatMap(service => Object.keys(service))
  )].sort();

  // Create final formatted data
  const streamingTimelineData = allDates.map(date => {
    const dataPoint = { date };
    let serviceTotals = {};
    
    Object.entries(contentAdditions).forEach(([service, serviceData]) => {
      const monthData = serviceData[date] || { count: 0 };
      dataPoint[service] = monthData.count;
      
      // Calculate running total
      serviceTotals[service] = (serviceTotals[service] || 0) + monthData.count;
      dataPoint[`${service}Total`] = serviceTotals[service];
    });
    
    return dataPoint;
  });

  console.log('Streaming Timeline Data:', streamingTimelineData);

  // Process the data for stacked area chart
  const years = Object.keys(moviesByYearAndGenre).sort();
  const genres = new Set();
  
  // Get unique genres
  Object.values(moviesByYearAndGenre).forEach(yearData => {
    Object.keys(yearData).forEach(genre => genres.add(genre));
  });

  // Format data for d3.stack()
  const formattedData = years.map(year => {
    const yearData = { year: parseInt(year) };
    genres.forEach(genre => {
      yearData[genre] = moviesByYearAndGenre[year][genre] || 0;
    });
    return yearData;
  });

  const stack = d3.stack()
    .keys(Array.from(genres))
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);

  const series = stack(formattedData);
  
  visualizeData(series, years, Array.from(genres));
  //visualizeBubbleChart(directorsArray);
  visualize3DBubbleChart(directorsArray); // Pass the processed directors data
  visualizeStreamingTimeline(streamingTimelineData);
  visualize3DStreamingComparison(streamingTimelineData);
  visualizeStackedBarChart(allMovies);
  universe.visualizeStreamingUniverse(streamingServicesData);

  // Add button click handler
  const expandButton = document.getElementById('expand-universe');
  if (expandButton) {
    expandButton.addEventListener('click', () => {
      // Store the current data in localStorage
      localStorage.setItem('streamingData', JSON.stringify(streamingServicesData));
      // Open in new tab
      window.open('universe-view.html', '_blank');
    });
  }

})
.catch(error => console.error('Error fetching data:', error));

function visualizeStackedBarChart(data) {
  // Group data by type and further by rating
  const groupedData = data.reduce((acc, movie) => {
    const type = movie.type || "Unknown"; // e.g., "Movie" or "TV Show"
    const rating = movie.rating || "Not Rated";

    if (!acc[type]) acc[type] = {};
    if (!acc[type][rating]) acc[type][rating] = 0;

    acc[type][rating]++;
    return acc;
  }, {});

  // Convert grouped data to a format suitable for D3 stack()
  const types = Object.keys(groupedData);
  const ratings = new Set();

  const formattedData = types.map(type => {
    const typeData = { type };
    Object.keys(groupedData[type]).forEach(rating => {
      typeData[rating] = groupedData[type][rating];
      ratings.add(rating);
    });
    return typeData;
  });

  // Create stacked series
  const stack = d3.stack().keys(Array.from(ratings));
  const series = stack(formattedData);

  // Set dimensions and margins
  const margin = { top: 20, right: 20, bottom: 50, left: 70 };
  const width = 1200;
  const height = 700;

  // Clear existing chart
  d3.select("#stacked-bar-chart").html("");

  // Create SVG container
  const svg = d3.select("#stacked-bar-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create scales
  const x = d3.scaleBand()
    .domain(types)
    .range([0, width - margin.left - margin.right])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
    .nice()
    .range([height - margin.top - margin.bottom, 0]);

  const color = d3.scaleOrdinal()
    .domain(Array.from(ratings))
    .range(d3.schemeSet3);

  // Add axes
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  svg.append("g").call(d3.axisLeft(y));

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("id", "stacked-bar-tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.8)")
    .style("color", "white")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("font-size", "12px")
    .style("opacity", 0)
    .style("pointer-events", "none");

  // Add stacks
  svg.append("g")
    .selectAll("g")
    .data(series)
    .enter()
    .append("g")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .enter()
    .append("rect")
    .attr("x", d => x(d.data.type))
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth())
    .on("mouseover", function (event, d) {
      d3.select(this).style("opacity", 0.8);
      tooltip
        .html(
          `<strong>Type:</strong> ${d.data.type}<br>
          <strong>Rating:</strong> ${this.parentNode.__data__.key}<br>
          <strong>Count:</strong> ${d[1] - d[0]}`
        )
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 10}px`)
        .style("opacity", 1);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 10}px`);
    })
    .on("mouseout", function () {
      d3.select(this).style("opacity", 1);
      tooltip.style("opacity", 0);
    });
}


function create3DTreemapWithLabels(data, containerId) {
  
    // Prepare data for treemap
    const genreStats = data.reduce((acc, movie) => {
        const genres = movie.listed_in.split(',').map(genre => genre.trim());
        genres.forEach(genre => {
            if (!acc[genre]) acc[genre] = { name: genre, value: 0 };
            acc[genre].value++;
        });
        return acc;
    }, {});
    const hierarchyData = {
        name: "Genres",
        children: Object.values(genreStats)
    };
    // Set dimensions
    const width = 1200;
    const height = 700;
    // Create SVG
    const svg = d3.select(containerId)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    // Create hierarchy and treemap layout
    const root = d3.hierarchy(hierarchyData).sum(d => d.value);
    const treemap = d3.treemap()
        .size([width, height])
        .padding(1);
    treemap(root);
    // Use muted color scheme
    const color = d3.scaleOrdinal(d3.schemePastel1);
    // Add rectangles
    const nodes = svg.selectAll('g')
        .data(root.leaves())
        .enter()
        .append('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);
    nodes.append('rect')
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('fill', d => color(d.data.name));
    // Add labels conditionally
    nodes.append('text')
        .attr('x', 5)
        .attr('y', 15)
        .text(d => {
            const rectWidth = d.x1 - d.x0;
            const rectHeight = d.y1 - d.y0;
            return rectWidth > 50 && rectHeight > 20 ? d.data.name : ''; // Display text only if space is enough
        })
        .attr('font-size', '12px')
        .attr('fill', 'black'); // Use black text for better contrast
    // Tooltip
    const tooltip = d3.select('body')
        .append('div')
        .attr('id', 'treemap-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '10px')
        .style('border-radius', '5px')
        .style('font-size', '12px')
        .style('opacity', 0);
    nodes.on('mouseover', function (event, d) {
        tooltip.transition().style('opacity', 1);
        tooltip.html(`<strong>${d.data.name}</strong><br>Movies: ${d.data.value}`)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`);
    }).on('mouseout', function () {
        tooltip.transition().style('opacity', 0);
    });
}


// Function to visualize data using D3
function visualizeData(selectedDirectors) {
  // Set up dimensions and margins for the chart
  const width = 1200;
  const height = 600;
  const margin = { top: 20, right: 200, bottom: 50, left: 70 };

  // Clear existing chart
  d3.select("#chart").html("");

  // Create SVG element
  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Process data for stacking
  const yearRange = d3.range(2000, 2025);
  const formattedData = yearRange.map(year => {
    const yearData = { year };
    selectedDirectors.forEach(director => {
      // Check if movies array exists and handle missing data
      const moviesInYear = director.movies?.filter(m => m.year === year) || [];
      yearData[director.name] = moviesInYear.length;
    });
    return yearData;
  });

  // Log the formatted data for debugging
  console.log('Formatted Data:', formattedData);
  console.log('Selected Directors:', selectedDirectors);

  // Create stack generator
  const stack = d3.stack()
    .keys(selectedDirectors.map(d => d.name))
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);

  const series = stack(formattedData);

  // Create color scale
  const color = d3.scaleOrdinal()
    .domain(selectedDirectors.map(d => d.name))
    .range(d3.schemeSet3);

  // Define the scales
  const x = d3.scaleLinear()
    .domain([2000, 2024])
    .range([0, width - margin.left - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
    .range([height - margin.top - margin.bottom, 0]);

  // Create area generator
  const area = d3.area()
    .x(d => x(d.data.year))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]))
    .curve(d3.curveMonotoneX);

  // Add areas
  svg.selectAll(".area")
    .data(series)
    .enter()
    .append("path")
    .attr("class", "area")
    .attr("d", area)
    .style("fill", d => color(d.key))
    .style("opacity", 0.8)
    .on("mouseover", function(event, d) {
      d3.select(this)
        .style("opacity", 1)
        .style("stroke", "#000")
        .style("stroke-width", 1);
      
      // Show tooltip with director name and movie count
      const total = d3.sum(d, dd => dd[1] - dd[0]);
      tooltip.style("opacity", 1)
        .html(`Director: ${d.key}<br>Total Movies: ${total}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
    })
    .on("mouseout", function() {
      d3.select(this)
        .style("opacity", 0.8)
        .style("stroke", "none");
      tooltip.style("opacity", 0);
    });

  // Add tooltip div if it doesn't exist
  const tooltip = d3.select("body").selectAll("#director-tooltip")
    .data([0])
    .join("div")
    .attr("id", "director-tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.8)")
    .style("color", "white")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("font-size", "12px")
    .style("opacity", 0)
    .style("pointer-events", "none");

  // Add x-axis
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
    .call(d3.axisBottom(x)
      .tickFormat(d3.format("d"))
      .ticks(12)
      .tickValues(d3.range(2000, 2025, 2)));

  // Add y-axis
  svg.append("g")
    .call(d3.axisLeft(y));

  // Add axis labels
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Number of Movies");

  svg.append("text")
    .attr("transform", `translate(${(width - margin.left - margin.right) / 2}, ${height - margin.top})`)
    .style("text-anchor", "middle")
    .text("Year");

  // Add legend
  const legend = svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "start")
    .attr("transform", `translate(${width - margin.left - margin.right + 10},0)`);

  const legendItems = legend.selectAll("g")
    .data(selectedDirectors)
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(0,${i * 20})`);

  legendItems.append("rect")
    .attr("x", 0)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", d => color(d.name));

  legendItems.append("text")
    .attr("x", 24)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text(d => d.name);
}

  function visualize3DBubbleChart(directorsData) {
    // Set up scene
    const container = document.getElementById('bubble-chart');
    
    // Get container dimensions
    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height || 600; // Fallback height if not set

    // Update renderer size
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Update camera
    

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 100;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Create color scale for genres
    const genres = [...new Set(directorsData.map(d => d.dominantGenre))];
    const colorScale = d3.scaleOrdinal()
        .domain(genres)
        .range(genres.map((_, i) => new THREE.Color(d3.schemeSet3[i]));

    // Size scale for bubbles
    const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(directorsData, d => d.movieCount)])
        .range([0.5, 5]);

    // Fibonacci sphere distribution
    function fibonacciSphere(i, n) {
        const phi = Math.acos(1 - 2 * (i + 0.5) / n);
        const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
        const radius = Math.min(width, height) / 25; // Adjust radius based on container size

        return {
            x: radius * Math.cos(theta) * Math.sin(phi),
            y: radius * Math.sin(theta) * Math.sin(phi),
            z: radius * Math.cos(phi)
        };
    }

    // Create bubbles
    const bubbles = directorsData.map((director, i) => {
        const position = fibonacciSphere(i, directorsData.length);
        const geometry = new THREE.SphereGeometry(sizeScale(director.movieCount), 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: colorScale(director.dominantGenre),
            transparent: true,
            opacity: 0.8,
            shininess: 100
        });

        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(position.x, position.y, position.z);
        sphere.userData = director; // Store director data for interaction
        scene.add(sphere);

        // Add label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = '48px Arial';
        context.fillStyle = 'white';
        context.fillText(director.name, 0, 48);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(position.x, position.y + sizeScale(director.movieCount) + 1, position.z);
        sprite.scale.set(10, 5, 1);
        sprite.visible = false; // Hide initially
        scene.add(sprite);

        return { sphere, sprite };
    });

    // Raycaster for interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Add orbit controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // After creating bubbles array, add links
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.2,
        linewidth: 1
    });

    // Create links between bubbles that share genres
    directorsData.forEach((director1, i) => {
        const pos1 = bubbles[i].sphere.position;
        
        // Connect to next few bubbles to avoid too many connections
        for(let j = i + 1; j < Math.min(i + 4, directorsData.length); j++) {
            const pos2 = bubbles[j].sphere.position;
            
            // Create line geometry
            const points = [];
            points.push(new THREE.Vector3(pos1.x, pos1.y, pos1.z));
            points.push(new THREE.Vector3(pos2.x, pos2.y, pos2.z));
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            scene.add(line);
        }
    });

    // Remove compare button and modify selection tracking
    let selectedBubbles = new Set();
    
    // Update the selection counter styles
    const selectionCounter = document.createElement('div');
    selectionCounter.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        color: white;
        background: rgba(0, 0, 0, 0.7);
        padding: 10px;
        border-radius: 4px;
        z-index: 1000;
        font-size: 14px;
        pointer-events: none;
    `;

    // Create a wrapper div for the renderer and counter
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
        position: relative;
        width: 100%;
        height: 100%;
    `;

    // Append renderer and counter to wrapper, then wrapper to container
    wrapper.appendChild(renderer.domElement);
    wrapper.appendChild(selectionCounter);
    container.innerHTML = '';
    container.appendChild(wrapper);

    function updateSelectionCounter() {
        selectionCounter.textContent = `Selected: ${selectedBubbles.size}/10`;
        
        // Dynamically update the stacked area chart when selection changes
        if (selectedBubbles.size >= 3 && selectedBubbles.size <= 10) {
            const selectedDirectors = Array.from(selectedBubbles).map(bubble => bubble.sphere.userData);
            visualizeData(selectedDirectors);
        } else if (selectedBubbles.size < 3) {
            // Clear the chart when less than 3 directors are selected
            d3.select("#chart").html("");
        }
    }
    updateSelectionCounter();

    // Modify click handler for bubble selection
    container.addEventListener('click', (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(bubbles.map(b => b.sphere));

        if (intersects.length > 0) {
            const bubble = bubbles.find(b => b.sphere === intersects[0].object);
            
            if (selectedBubbles.has(bubble)) {
                // Deselect bubble
                selectedBubbles.delete(bubble);
                bubble.sphere.material.emissive.setHex(0x000000);
            } else if (selectedBubbles.size < 10) {
                // Select bubble
                selectedBubbles.add(bubble);
                bubble.sphere.material.emissive.setHex(0x444444);
            }
            
            updateSelectionCounter();
        }
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Tooltip functions
    function showTooltip(director, event) {
        const tooltip = document.getElementById('bubble-tooltip') || createTooltip();
        tooltip.innerHTML = `
            <strong>${director.name}</strong><br/>
            Movies: ${director.movieCount}<br/>
            Main Genre: ${director.dominantGenre}<br/>
            <br/>
            <strong>Top Movies:</strong><br/>
            ${director.movies.slice(0, 3).map(m => `${m.title} (${m.year})`).join('<br/>')}
        `;
        tooltip.style.left = (event.clientX + 10) + 'px';
        tooltip.style.top = (event.clientY - 10) + 'px';
        tooltip.style.opacity = 1;
    }

    function hideTooltip() {
        const tooltip = document.getElementById('bubble-tooltip');
        if (tooltip) tooltip.style.opacity = 0;
    }

    function createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.id = 'bubble-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 14px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 1000;
        `;
        document.body.appendChild(tooltip);
        return tooltip;
    }

    // Add resize handler
    window.addEventListener('resize', () => {
        const newRect = container.getBoundingClientRect();
        const newWidth = newRect.width;
        const newHeight = newRect.height || 600;

        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });
}

function processGenreData(allMovies) {
    const genreStats = allMovies.reduce((acc, movie) => {
        if (!movie.listed_in) return acc;
        
        const genres = movie.listed_in.split(',').map(g => g.trim());
        genres.forEach(genre => {
            if (!acc[genre]) {
                acc[genre] = {
                    name: genre,
                    movieCount: 0,
                    movies: [],
                    relatedGenres: new Set()
                };
            }
            acc[genre].movieCount++;
            acc[genre].movies.push({
                title: movie.title,
                year: movie.release_year,
                director: movie.director
            });
            
            // Add related genres
            genres.forEach(relatedGenre => {
                if (relatedGenre !== genre) {
                    acc[genre].relatedGenres.add(relatedGenre);
                }
            });
        });
        return acc;
    }, {});

    return Object.values(genreStats)
        .sort((a, b) => b.movieCount - a.movieCount)
        .map(genre => ({
            ...genre,
            relatedGenres: Array.from(genre.relatedGenres)
        }));
}

function visualize3DGenreBubbleChart(genreData) {
    // Set up scene
    const container = document.getElementById('genre-bubble-chart');
    const width = 1200;
    const height = 800;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Create color scale for genres
    const colorScale = d3.scaleOrdinal()
        .domain(genreData.map(d => d.name))
        .range(d3.schemeSet3);

    // Size scale for bubbles
    const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(genreData, d => d.movieCount)])
        .range([1, 8]); // Slightly larger than directors for better visibility

    // Create bubbles
    const bubbles = genreData.map((genre, i) => {
        const position = fibonacciSphere(i, genreData.length);
        const geometry = new THREE.SphereGeometry(sizeScale(genre.movieCount), 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: colorScale(genre.name),
            transparent: true,
            opacity: 0.8,
            shininess: 100
        });

        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(position.x, position.y, position.z);
        sphere.userData = genre;
        scene.add(sphere);

        // Add label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = '48px Arial';
        context.fillStyle = 'white';
        context.fillText(genre.name, 0, 48);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(position.x, position.y + sizeScale(genre.movieCount) + 1, position.z);
        sprite.scale.set(10, 5, 1);
        sprite.visible = false;
        scene.add(sprite);

        return { sphere, sprite };
    });

    // Create connections between related genres
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.2
    });

    genreData.forEach((genre1, i) => {
        const pos1 = bubbles[i].sphere.position;
        
        // Connect to related genres (limit to top 3 relationships)
        genre1.relatedGenres.slice(0, 3).forEach(relatedGenreName => {
            const relatedIndex = genreData.findIndex(g => g.name === relatedGenreName);
            if (relatedIndex > i) { // Avoid duplicate connections
                const pos2 = bubbles[relatedIndex].sphere.position;
                
                const points = [];
                points.push(new THREE.Vector3(pos1.x, pos1.y, pos1.z));
                points.push(new THREE.Vector3(pos2.x, pos2.y, pos2.z));
                
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, lineMaterial);
                scene.add(line);
            }
        });
    });

    // Interaction setup
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Add orbit controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Mouse interaction
    container.addEventListener('mousemove', (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(bubbles.map(b => b.sphere));

        // Reset all bubbles and lines
        bubbles.forEach(({ sphere, sprite }) => {
            sprite.visible = false;
            sphere.material.opacity = 0.8;
        });
        scene.children.forEach(child => {
            if (child instanceof THREE.Line) {
                child.material.opacity = 0.2;
            }
        });

        if (intersects.length > 0) {
            const bubble = bubbles.find(b => b.sphere === intersects[0].object);
            bubble.sprite.visible = true;
            bubble.sphere.material.opacity = 1;

            // Highlight connected lines and bubbles
            const selectedPos = bubble.sphere.position;
            scene.children.forEach(child => {
                if (child instanceof THREE.Line) {
                    const positions = child.geometry.attributes.position.array;
                    const point1 = new THREE.Vector3(positions[0], positions[1], positions[2]);
                    const point2 = new THREE.Vector3(positions[3], positions[4], positions[5]);
                    
                    if (point1.equals(selectedPos) || point2.equals(selectedPos)) {
                        child.material.opacity = 0.8;
                        bubbles.forEach(b => {
                            if (b.sphere.position.equals(point1) || b.sphere.position.equals(point2)) {
                                b.sphere.material.opacity = 1;
                            }
                        });
                    }
                }
            });

            showGenreTooltip(bubble.sphere.userData, event);
        } else {
            hideGenreTooltip();
        }
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Tooltip functions
    function showGenreTooltip(genre, event) {
        const tooltip = document.getElementById('genre-bubble-tooltip') || createGenreTooltip();
        tooltip.innerHTML = `
            <strong>${genre.name}</strong><br/>
            Movies: ${genre.movieCount}<br/>
            <br/>
            <strong>Related Genres:</strong><br/>
            ${genre.relatedGenres.slice(0, 3).join('<br/>')}<br/>
            <br/>
            <strong>Top Movies:</strong><br/>
            ${genre.movies.slice(0, 3).map(m => `${m.title} (${m.year})`).join('<br/>')}
        `;
        tooltip.style.left = (event.clientX + 10) + 'px';
        tooltip.style.top = (event.clientY - 10) + 'px';
        tooltip.style.opacity = 1;
    }

    function hideGenreTooltip() {
        const tooltip = document.getElementById('genre-bubble-tooltip');
        if (tooltip) tooltip.style.opacity = 0;
    }

    function createGenreTooltip() {
        const tooltip = document.createElement('div');
        tooltip.id = 'genre-bubble-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 14px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 1000;
        `;
        document.body.appendChild(tooltip);
        return tooltip;
    }
}


visualize3DGenreBubbleChart(processGenreData(allMovies));
