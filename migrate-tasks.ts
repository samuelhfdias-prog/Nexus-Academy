import { createClient } from "@libsql/client";

async function main() {
  const client = createClient({ url: "file:./sqlite.db" });
  await client.execute(`
    CREATE TABLE IF NOT EXISTS project_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pendente',
      assignedTo INTEGER,
      createdBy INTEGER NOT NULL,
      dueDate TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (createdBy) REFERENCES users(id)
    )
  `);
  console.log("Table project_tasks created or already exists.");

  await client.execute(`
    CREATE INDEX IF NOT EXISTS project_tasks_project_idx ON project_tasks(projectId)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS project_tasks_assigned_idx ON project_tasks(assignedTo)
  `);
  console.log("Indexes created.");
  process.exit(0);
}

main().catch(console.error);
