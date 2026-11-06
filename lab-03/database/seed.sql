CREATE TABLE IF NOT EXISTS book (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  author TEXT,
  price INTEGER,
  pages INTEGER
);

INSERT INTO book (title, author, price, pages) VALUES
('Wings of Fire', 'A.P.J. Abdul Kalam', 250, 180),
('The Alchemist', 'Paulo Coelho', 300, 200),
('Atomic Habits', 'James Clear', 450, 320),
('Rich Dad Poor Dad', 'Robert Kiyosaki', 350, 240),
('Ikigai', 'Hector Garcia', 280, 190),
('Think and Grow Rich', 'Napoleon Hill', 320, 250),
('Deep Work', 'Cal Newport', 400, 280),
('The Power of Habit', 'Charles Duhigg', 380, 300),
('Zero to One', 'Peter Thiel', 290, 210),
('The Psychology of Money', 'Morgan Housel', 350, 250);
