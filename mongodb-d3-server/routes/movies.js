const express = require('express');
const { Netflix, Hulu, AmazonPrime, Disney } = require('../models');
const router = express.Router();

// Route to fetch all movies from Netflix
router.get('/netflix-movies', async (req, res) => {
  try {
    const netflix_movies = await Netflix.find({ type: "Movie" });
    res.json(netflix_movies);
  } catch (error) {
    res.status(500).json({ error: "Error fetching data" });
  }
});

router.get("/prime-movies", async (req, res) => {
  try {
    const prime_movies = await AmazonPrime.find({ type: "Movie" });
    res.json(prime_movies);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Data" });
  }
});

router.get("/hulu-movies", async (req, res) => {
  try {
    const hulu_movies = await Hulu.find({ type: "Movie" });
    res.json(hulu_movies);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Data" });
  }
});

router.get("/disney-movies", async (req, res) => {
  try {
    const disney_movies = await Disney.find({ type: "Movie" });
    res.json(disney_movies);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Data" });
  }
});

// Example of another endpoint for fetching data from other collections
router.get('/all-movies', async (req, res) => {
  try {
    const netflixMovies = await Netflix.find({ type: "Movie" });
    const huluMovies = await Hulu.find({ type: "Movie" });
    const amazonMovies = await AmazonPrime.find({ type: "Movie" });
    const disneyMovies = await Disney.find({ type: "Movie" });
    res.json({ netflixMovies, huluMovies, amazonMovies, disneyMovies });
  } catch (error) {
    res.status(500).json({ error: "Error fetching data" });
  }
});

router.get("/directors-data", async (req, res) => {
  try {
    const netflix_directors = await Netflix.find({ type: "director" });
    const hulu_directors = await Hulu.find({ type: "director" });
    const amazon_directors = await AmazonPrime.find({ type: "director" });
    const disney_directors = await Disney.find({ type: "director" });
    res.json({ netflix_directors, hulu_directors, amazon_directors, disney_directors });
  } catch (error) {
    res.status(500).json({ error: "Error fetching Data" });
  }
});

// Route to fetch movies by year and genre
router.get('/movies-by-year-and-genre', async (req, res) => {
  try {
    const allMovies = await Promise.all([
      Netflix.find({ type: "Movie" }),
      Hulu.find({ type: "Movie" }),
      AmazonPrime.find({ type: "Movie" }),
      Disney.find({ type: "Movie" })
    ]);

    // Combine all movies into a single array
    const flatMovies = allMovies.flat();

    // Create a data structure grouped by year and genre
    const moviesByYearAndGenre = flatMovies.reduce((acc, movie) => {
      const year = new Date(movie.release_year).getFullYear();
      if (!acc[year]) acc[year] = {};

      movie.listed_in.split(',').forEach(genre => {
        const cleanGenre = genre.trim();
        if (!acc[year][cleanGenre]) acc[year][cleanGenre] = 0;
        acc[year][cleanGenre]++;
      });
      return acc;
    }, {});

    res.json(moviesByYearAndGenre);
  } catch (error) {
    res.status(500).json({ error: "Error fetching data" });
  }
});

// Route to fetch top 10 genres
router.get('/top-genres', async (req, res) => {
  try {
    const allMovies = await Promise.all([
      Netflix.find({}),
      Hulu.find({}),
      AmazonPrime.find({}),
      Disney.find({})
    ]);

    const genres = allMovies.flat().reduce((acc, movie) => {
      movie.listed_in.split(',').forEach(genre => {
        const cleanGenre = genre.trim();
        acc[cleanGenre] = (acc[cleanGenre] || 0) + 1;
      });
      return acc;
    }, {});

    const sortedGenres = Object.entries(genres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    res.json(sortedGenres);
  } catch (error) {
    res.status(500).json({ error: "Error fetching data" });
  }
});

module.exports = router;
