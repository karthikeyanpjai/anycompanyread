/**
 * Seed script — populates the DynamoDB Books table with 12 sample books.
 * Usage: npx ts-node scripts/seed.ts
 * Requires AWS credentials and TABLE_BOOKS env var (defaults to 'Books').
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION ?? 'us-east-1' }));
const TABLE = process.env.TABLE_BOOKS ?? 'Books';

const books = [
  { title: 'The Pragmatic Programmer', author: 'David Thomas & Andrew Hunt', isbn: '978-0135957059', genre: 'Technology', description: 'Your journey to mastery. A classic guide to software craftsmanship.', price: 49.99, rating: 4.8, pageCount: 352, publishedYear: 2019, coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780135957059-L.jpg' },
  { title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0132350884', genre: 'Technology', description: 'A handbook of agile software craftsmanship. Learn to write readable, maintainable code.', price: 44.99, rating: 4.7, pageCount: 431, publishedYear: 2008, coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg' },
  { title: 'Dune', author: 'Frank Herbert', isbn: '978-0441013593', genre: 'Science Fiction', description: 'Set in the distant future, Dune tells the story of young Paul Atreides on the desert planet Arrakis.', price: 16.99, rating: 4.9, pageCount: 688, publishedYear: 1965, coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg' },
  { title: 'The Hitchhiker\'s Guide to the Galaxy', author: 'Douglas Adams', isbn: '978-0345391803', genre: 'Science Fiction', description: 'Seconds before Earth is demolished for a hyperspace bypass, Arthur Dent is whisked off the planet.', price: 14.99, rating: 4.8, pageCount: 224, publishedYear: 1979, coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780345391803-L.jpg' },
  { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '978-0062316097', genre: 'History', description: 'A brief history of humankind, from the Stone Age to the present.', price: 18.99, rating: 4.6, pageCount: 443, publishedYear: 2011, coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg' },
  { title: 'Atomic Habits', author: 'James Clear', isbn: '978-0735211292', genre: 'Self-Help', description: 'An easy and proven way to build good habits and break bad ones.', price: 19.99, rating: 4.8, pageCount: 320, publishedYear: 2018, coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg' },
  { title: 'The Name of the Wind', author: 'Patrick Rothfuss', isbn: '978-0756404741', genre: 'Fantasy', description: 'The tale of Kvothe, a legendary figure who grew from a gifted young man into a notorious wizard.', price: 17.99, rating: 4.7, pageCount: 662, publishedYear: 2007, coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780756404741-L.jpg' },
  { title: 'Gone Girl', author: 'Gillian Flynn', isbn: '978-0307588371', genre: 'Thriller', description: 'On the morning of their fifth wedding anniversary, Nick Dunne\'s wife Amy disappears.', price: 15.99, rating: 4.5, pageCount: 422, publishedYear: 2012, coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780307588371-L.jpg' },
  { title: 'Steve Jobs', author: 'Walter Isaacson', isbn: '978-1451648539', genre: 'Biography', description: 'The exclusive biography of Steve Jobs, based on more than forty interviews.', price: 22.99, rating: 4.6, pageCount: 656, publishedYear: 2011, coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9781451648539-L.jpg' },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0743273565', genre: 'Fiction', description: 'A portrait of the Jazz Age in all of its decadence and excess.', price: 12.99, rating: 4.4, pageCount: 180, publishedYear: 1925, coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg' },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '978-0374533557', genre: 'Non-Fiction', description: 'A groundbreaking tour of the mind and explains the two systems that drive the way we think.', price: 17.99, rating: 4.6, pageCount: 499, publishedYear: 2011, coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg' },
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '978-0547928227', genre: 'Fantasy', description: 'Bilbo Baggins is a hobbit who enjoys a comfortable life until a wizard and dwarves arrive.', price: 14.99, rating: 4.9, pageCount: 310, publishedYear: 1937, coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg' },
];

async function seed() {
  console.log(`Seeding ${books.length} books into table: ${TABLE}`);
  for (const book of books) {
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: { bookId: uuidv4(), ...book, createdAt: new Date().toISOString() },
    }));
    console.log(`  ✓ ${book.title}`);
  }
  console.log('Seed complete!');
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
