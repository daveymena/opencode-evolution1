import pkg from 'pg';
const { Client } = pkg;

const connectionString = "postgresql://postgres.rzkmwvvezpijejiasowe:OpenCode_Evo_2026!@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

async function checkSchema() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Conectado a la base de datos.");
    
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects';
    `);
    
    console.log("Columnas en la tabla 'projects':");
    res.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

    const hasModel = res.rows.some(row => row.column_name === 'model');
    if (hasModel) {
      console.log("\n✅ La columna 'model' EXISTE.");
    } else {
      console.log("\n❌ La columna 'model' NO EXISTE.");
    }

  } catch (err) {
    console.error("Error al conectar o consultar:", err);
  } finally {
    await client.end();
  }
}

checkSchema();
