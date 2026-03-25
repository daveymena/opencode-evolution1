import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

interface McpServiceConfig {
  name: string;
  command: string;
  args: string[];
}

export class McpIntegration {
  private clients: Map<string, Client> = new Map();

  // Lista de servicios MCP externos que mencionaste (Google, MercadoPago, PayPal)
  private services: McpServiceConfig[] = [
    {
      name: "google-workspace",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-google-workspace"] // Calendar, Gmail, Drive
    },
    {
      name: "mercadopago-tools",
      command: "npx",
      args: ["-y", "@opencode-evo/mcp-mercadopago"] // Herramientas de cobro
    },
    {
      name: "paypal-tools",
      command: "npx",
      args: ["-y", "@opencode-evo/mcp-paypal"] // Integración PayPal
    }
  ];

  constructor() {
    console.log("MCP Manager Initialized: Preparando conexiones con ecosistema Google y pasarelas de pago.");
  }

  async connectAllServices() {
    console.log("Iniciando conexión MCP con herramientas externas...");

    for (const service of this.services) {
      try {
        const client = new Client(
          { name: `opencode-evolved-${service.name}`, version: "1.0.0" },
          { capabilities: {} }
        );

        const transport = new StdioClientTransport({
          command: service.command,
          args: service.args
        });

        await client.connect(transport);
        this.clients.set(service.name, client);
        
        console.log(`[MCP] Conectado exitosamente a: ${service.name}`);
      } catch (error) {
        console.error(`[MCP] Error al conectar con ${service.name}:`, error);
      }
    }
    
    console.log("Integración de herramientas MCP (Gmail, Calendar, Drive, MercadoPago, PayPal) completada.");
  }

  getClient(name: string): Client | undefined {
    return this.clients.get(name);
  }
}

export const mcpManager = new McpIntegration();
