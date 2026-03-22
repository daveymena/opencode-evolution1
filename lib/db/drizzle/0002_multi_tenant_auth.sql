-- Tabla de usuarios
CREATE TABLE "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Tabla de API keys por usuario (encriptadas)
CREATE TABLE "user_api_keys" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "provider" text NOT NULL,
  "key_encrypted" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_api_keys" ADD CONSTRAINT "user_api_keys_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Agregar user_id a projects
ALTER TABLE "projects" ADD COLUMN "user_id" integer;
--> statement-breakpoint

-- Crear usuario por defecto para proyectos existentes (si los hay)
INSERT INTO "users" ("email", "password_hash", "name")
  VALUES ('admin@localhost', '$2b$10$placeholder_will_be_reset', 'Admin')
  ON CONFLICT DO NOTHING;
--> statement-breakpoint

-- Asignar proyectos existentes al primer usuario
UPDATE "projects" SET "user_id" = (SELECT "id" FROM "users" LIMIT 1) WHERE "user_id" IS NULL;
--> statement-breakpoint

-- Ahora hacer la columna NOT NULL y agregar FK
ALTER TABLE "projects" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
