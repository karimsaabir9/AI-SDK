import connectDB from './connection';
import Movie from './models/Movie';
import User from './models/User';
import Review from './models/Review';

const SEED_MOVIES = [
  {
    title: 'Interstellar',
    year: 2014,
    genre: 'Sci-Fi',
    rating: 8.6,
    director: 'Christopher Nolan',
    description:
      "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
  },
  {
    title: 'The Matrix',
    year: 1999,
    genre: 'Sci-Fi',
    rating: 8.7,
    director: 'Lana Wachowski',
    description:
      'A computer hacker learns from mysterious rebels about the true nature of his reality.',
  },
  {
    title: 'Inception',
    year: 2010,
    genre: 'Sci-Fi',
    rating: 8.8,
    director: 'Christopher Nolan',
    description:
      'A thief who steals corporate secrets through the use of dream-sharing technology is given the task of planting an idea.',
  },
  {
    title: 'The Dark Knight',
    year: 2008,
    genre: 'Action',
    rating: 9.0,
    director: 'Christopher Nolan',
    description:
      'When the menace known as the Joker wreaks havoc on Gotham City, Batman must confront chaos and corruption.',
  },
  {
    title: 'Parasite',
    year: 2019,
    genre: 'Drama',
    rating: 8.5,
    director: 'Bong Joon Ho',
    description:
      'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
  },
  {
    title: 'Blade Runner 2049',
    year: 2017,
    genre: 'Sci-Fi',
    rating: 8.0,
    director: 'Denis Villeneuve',
    description:
      "A young blade runner's discovery of a long-buried secret leads him to track down former blade runner Rick Deckard.",
  },
  {
    title: 'Everything Everywhere All at Once',
    year: 2022,
    genre: 'Sci-Fi',
    rating: 7.8,
    director: 'Daniel Kwan',
    description:
      'An aging Chinese immigrant is swept up in an insane adventure, where she alone can save existence by exploring other universes.',
  },
  {
    title: 'The Godfather',
    year: 1972,
    genre: 'Crime',
    rating: 9.2,
    director: 'Francis Ford Coppola',
    description:
      'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
  },
  {
    title: 'Pulp Fiction',
    year: 1994,
    genre: 'Crime',
    rating: 8.9,
    director: 'Quentin Tarantino',
    description:
      "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
  },
  {
    title: 'Avatar',
    year: 2009,
    genre: 'Sci-Fi',
    rating: 7.8,
    director: 'James Cameron',
    description:
      'A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home.',
  },
];

const SEED_USERS = [
  { name: 'Sarah Jenkins', email: 'sarah@example.com', age: 28, favoriteGenre: 'Sci-Fi' },
  { name: 'Marcus Thorne', email: 'marcus@example.com', age: 22, favoriteGenre: 'Action' },
  { name: 'Elena Rostova', email: 'elena@example.com', age: 31, favoriteGenre: 'Drama' },
  { name: 'Kai Nakamura', email: 'kai@example.com', age: 19, favoriteGenre: 'Sci-Fi' },
  { name: 'Amara Osei', email: 'amara@example.com', age: 35, favoriteGenre: 'Crime' },
  { name: 'Jordan Blake', email: 'jordan@example.com', age: 27, favoriteGenre: 'Sci-Fi' },
  { name: 'Priya Sharma', email: 'priya@example.com', age: 24, favoriteGenre: 'Drama' },
  { name: 'Lucas Ferreira', email: 'lucas@example.com', age: 42, favoriteGenre: 'Action' },
];

export async function seedDatabase(): Promise<{ message: string; counts: Record<string, number> }> {
  await connectDB();


  await Promise.all([Movie.deleteMany({}), User.deleteMany({}), Review.deleteMany({})]);

  const [movies, users] = await Promise.all([
    Movie.insertMany(SEED_MOVIES),
    User.insertMany(SEED_USERS),
  ]);

  const reviewsData = [
    { movieId: movies[0]._id, userId: users[0]._id, rating: 9, comment: 'A visually stunning masterpiece about love and sacrifice.' },
    { movieId: movies[0]._id, userId: users[3]._id, rating: 8, comment: 'Hans Zimmer\'s score is hauntingly beautiful.' },
    { movieId: movies[1]._id, userId: users[1]._id, rating: 10, comment: 'Changed cinema forever. Still holds up perfectly.' },
    { movieId: movies[2]._id, userId: users[0]._id, rating: 9, comment: 'A dream within a dream within a dream. Incredible.' },
    { movieId: movies[3]._id, userId: users[4]._id, rating: 10, comment: 'Heath Ledger\'s Joker is the greatest villain performance.' },
    { movieId: movies[4]._id, userId: users[2]._id, rating: 9, comment: 'Bold, unpredictable, and deeply moving.' },
    { movieId: movies[5]._id, userId: users[5]._id, rating: 8, comment: 'Breathtakingly gorgeous cinematography.' },
    { movieId: movies[7]._id, userId: users[4]._id, rating: 10, comment: 'The gold standard of all crime dramas.' },
  ];

  const reviews = await Review.insertMany(reviewsData);

  return {
    message: 'Database seeded successfully',
    counts: {
      movies: movies.length,
      users: users.length,
      reviews: reviews.length,
    },
  };
}

export default seedDatabase;
