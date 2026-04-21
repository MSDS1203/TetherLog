import bcrypt from "bcrypt";
import { getDb, saveDatabase } from "./database.js";

async function seed() {
  const db = await getDb();

  // reseting app data
  db.run(`DELETE FROM follows`);
  db.run(`DELETE FROM reading_updates`);
  db.run(`DELETE FROM books`);
  db.run(`DELETE FROM reading_status`);

  // building demo users for testing 
  const hashedPassword = await bcrypt.hash("password123", 10);

  const users = [
    { id: "u1", name: "Alex", email: "alex@test.com" },
    { id: "u2", name: "Jane", email: "jane@test.com" },
    { id: "u3", name: "Sam", email: "sam@test.com" }
  ];

  for (const u of users) {
    db.run(
      `
      INSERT OR IGNORE INTO users (id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
      `,
      [u.id, u.name, u.email, hashedPassword, "reader"]
    );
  }

  // Books
  db.run(
    `
    INSERT INTO books (id, title, author, description, cover_url, genre, total_pages, published_year)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      "b1",
      "Dune",
      "Frank Herbert",
      "Sci-fi epic",
      null,
      "Sci-fi",
      500,
      1965
    ]
  );

  db.run(
    `
    INSERT INTO books (id, title, author, description, cover_url, genre, total_pages, published_year)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      "b2",
      "The Hobbit",
      "J.R.R. Tolkien",
      "Fantasy adventure",
      null,
      "Fantasy",
      300,
      1937
    ]
  );

  // following relationships 
  db.run(
    `INSERT OR IGNORE INTO follows (id, follower_id, following_id)
     VALUES (?, ?, ?)`,
    ["f1", "u1", "u2"]
  );

  db.run(
    `INSERT OR IGNORE INTO follows (id, follower_id, following_id)
     VALUES (?, ?, ?)`,
    ["f2", "u1", "u3"]
  );

  db.run(
    `INSERT OR IGNORE INTO follows (id, follower_id, following_id)
     VALUES (?, ?, ?)`,
    ["f3", "u2", "u3"]
  );

  // feed data/dummy updates
  db.run(
    `
    INSERT INTO reading_updates (id, user_id, book_id, page_reached, note)
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      "r1",
      "u2",
      "b1",
      120,
      "Getting really good"
    ]
  );

  db.run(
    `
    INSERT INTO reading_updates (id, user_id, book_id, page_reached, note)
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      "r2",
      "u3",
      "b2",
      300,
      "Finished it!"
    ]
  );

  saveDatabase();

  console.log("Seeding completed.");
}

seed();