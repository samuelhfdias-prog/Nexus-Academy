import { createClient } from '@libsql/client';
const c = createClient({ url: 'file:./sqlite.db' });


const migrations = [
  // Projects table: approval workflow columns
  "ALTER TABLE projects ADD COLUMN approvalStatus TEXT NOT NULL DEFAULT 'aprovado'",
  "ALTER TABLE projects ADD COLUMN submittedAt TEXT",
  "ALTER TABLE projects ADD COLUMN reviewedBy INTEGER REFERENCES users(id)",
  "ALTER TABLE projects ADD COLUMN reviewedAt TEXT",
  "ALTER TABLE projects ADD COLUMN rejectionReason TEXT",

  // Users table: data de nascimento
  "ALTER TABLE users ADD COLUMN birthDate TEXT",
  
  // Student projects table (create if not exists)
  `CREATE TABLE IF NOT EXISTS student_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    thematicArea TEXT NOT NULL,
    studentId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'rascunho',
    submittedAt TEXT,
    reviewedBy INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewedAt TEXT,
    rejectionReason TEXT,
    linkedProjectId INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    tags TEXT,
    suggestedMaxMembers INTEGER DEFAULT 5,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // Indexes for student_projects
  "CREATE INDEX IF NOT EXISTS student_projects_student_idx ON student_projects (studentId)",
  "CREATE INDEX IF NOT EXISTS student_projects_status_idx ON student_projects (status)",
  "CREATE INDEX IF NOT EXISTS student_projects_area_idx ON student_projects (thematicArea)",
  "CREATE INDEX IF NOT EXISTS student_projects_reviewed_by_idx ON student_projects (reviewedBy)",
  "CREATE INDEX IF NOT EXISTS student_projects_linked_idx ON student_projects (linkedProjectId)",
  
  // Indexes for projects approval columns
  "CREATE INDEX IF NOT EXISTS projects_approval_idx ON projects (approvalStatus)",
  "CREATE INDEX IF NOT EXISTS projects_reviewed_by_idx ON projects (reviewedBy)",

  // Notifications table
  `CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  "CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (userId)",
];

(async () => {
  for (const sql of migrations) {
    try {
      await c.execute(sql);
      console.log('OK:', sql.substring(0, 70));
    } catch(e) {
      if (e.message && (e.message.includes('duplicate column') || e.message.includes('already exists'))) {
        console.log('SKIP (already exists):', sql.substring(0, 70));
      } else {
        console.error('ERROR:', e.message, '\n  SQL:', sql.substring(0, 70));
      }
    }
  }
  console.log('\nMigration complete.');
  process.exit(0);
})();
