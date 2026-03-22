import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { db } from "./src/index";
import { sql } from "drizzle-orm";

async function checkSchema() {
  try {
    console.log("Consultando information_schema...");
    const res = await db.execute(sql`
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
    console.error("Error al consultar:", err);
  } finally {
    process.exit(0);
  }
}

checkSchema();
