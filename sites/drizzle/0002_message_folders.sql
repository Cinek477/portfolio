ALTER TABLE messages ADD COLUMN folder TEXT NOT NULL DEFAULT 'inbox' CHECK(folder IN ('inbox','spam','trash'));
