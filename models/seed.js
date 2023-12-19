const mongoose = require('mongoose');
const faker = require('faker');
const Book = require('./models/Book');
const Category = require('./models/Category');
const Publisher = require('./models/Publisher');
const Author = require('./models/Author');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/your-database-name', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Function to generate fake data for categories
const generateCategories = (count) => {
  const categories = [];
  for (let i = 0; i < count; i++) {
    const category = {
      name: faker.random.word(),
      book: [],
    };
    categories.push(category);
  }
  return categories;
};

// Function to generate fake data for publishers
const generatePublishers = (count) => {
  const publishers = [];
  for (let i = 0; i < count; i++) {
    const publisher = {
      name: faker.company.companyName(),
      book: [],
    };
    publishers.push(publisher);
  }
  return publishers;
};

// Function to generate fake data for authors
const generateAuthors = (count) => {
  const authors = [];
  for (let i = 0; i < count; i++) {
    const author = {
      name: faker.name.findName(),
      book: [],
    };
    authors.push(author);
  }
  return authors;
};

// Seed categories, publishers, and authors
const seedCategoriesPublishersAuthors = async () => {
  try {
    // Remove existing data
    await Category.deleteMany({});
    await Publisher.deleteMany({});
    await Author.deleteMany({});

    // Generate fake data and insert into the database
    const categoriesToInsert = generateCategories(5); // Adjust the count as needed
    const publishersToInsert = generatePublishers(5); // Adjust the count as needed
    const authorsToInsert = generateAuthors(5); // Adjust the count as needed

    await Category.insertMany(categoriesToInsert);
    await Publisher.insertMany(publishersToInsert);
    await Author.insertMany(authorsToInsert);

    console.log('Categories, Publishers, and Authors seeded successfully');
  } catch (error) {
    console.error('Seed failed:', error);
  }
};

// Seed books
const seedBooks = async () => {
  try {
    // Remove existing data
    await Book.deleteMany({});

    // Generate fake books and insert into the database
    const categories = await Category.find({});
    const publishers = await Publisher.find({});
    const authors = await Author.find({});

    const booksToInsert = generateBooks(10, categories, publishers, authors); // Adjust the count as needed
    await Book.insertMany(booksToInsert);

    console.log('Books seeded successfully');
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    // Disconnect from MongoDB
    mongoose.disconnect();
  }
};

// Function to generate fake data for books
const generateBooks = (count, categories, publishers, authors) => {
  const books = [];
  for (let i = 0; i < count; i++) {
    const book = {
      ISBN: faker.random.uuid(),
      title: faker.lorem.words(),
      bookImage: faker.image.imageUrl(),
      publisher: faker.random.arrayElement(publishers)._id,
      author: faker.random.arrayElement(authors)._id,
      numberOfPages: faker.random.number(),
      bookCountAvailable: faker.random.number(),
      bookStatus: faker.random.arrayElement(['Available', 'Borrowed']),
      category: faker.random.arrayElement(categories)._id,
      transactions: [],
      description: faker.lorem.paragraph(),
    };
    books.push(book);
  }
  return books;
};

// Run the seed functions
seedCategoriesPublishersAuthors();
seedBooks();
