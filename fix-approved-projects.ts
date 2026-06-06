import { createClient } from "@libsql/client";

async function main() {
  const client = createClient({ url: "file:./sqlite.db" });

  // Pega projetos aprovados que não têm linkedProjectId
  const result = await client.execute(`
    SELECT * FROM student_projects
    WHERE status = 'aprovado' AND linkedProjectId IS NULL
  `);

  const proposals = result.rows;
  if (proposals.length === 0) {
    console.log("Nenhum projeto antigo pendente de migração encontrado.");
    process.exit(0);
  }

  console.log(`Encontrados ${proposals.length} projetos para atualizar.`);

  for (const p of proposals) {
    // Insere na tabela projects
    const insertRes = await client.execute({
      sql: `
        INSERT INTO projects (
          title, description, thematicArea, status, approvalStatus, ownerId,
          maxMembers, isPublic, startDate, createdAt, updatedAt
        ) VALUES (?, ?, ?, 'ativo', 'aprovado', ?, ?, 1, ?, ?, ?)
      `,
      args: [
        p.title,
        p.description,
        p.thematicArea,
        p.studentId, // owner
        p.suggestedMaxMembers || 10,
        p.createdAt || new Date().toISOString(),
        p.createdAt || new Date().toISOString(),
        p.updatedAt || new Date().toISOString(),
      ],
    });

    const newProjectId = insertRes.lastInsertRowid;

    // Atualiza o student_projects
    await client.execute({
      sql: `UPDATE student_projects SET linkedProjectId = ? WHERE id = ?`,
      args: [newProjectId, p.id]
    });

    console.log(`Projeto "${p.title}" migrado -> Novo ID: ${newProjectId}`);
  }

  console.log("Migração de projetos antigos concluída.");
  process.exit(0);
}

main().catch(console.error);
