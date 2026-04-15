# AI Nexus Manager

Sistema de gestión de clientes impulsado por IA para **Nexus Manager Solutions**, una consultora de servicios digitales. Un agente conversacional inteligente que califica leads usando metodología BANT, responde consultas basándose en la base de conocimiento de la empresa, y persiste toda la información en tiempo real.

## Qué hace

El agente "Ulises" atiende clientes a través de una API REST. Mantiene conversaciones naturales, identifica necesidades, consulta precios y servicios reales desde una base vectorial (RAG), actualiza datos del cliente automáticamente, y agenda reuniones con especialistas. Todo el flujo queda registrado con observabilidad completa.

## Stack técnico

**Backend:** Node.js, TypeScript, Express 5

**IA y agentes:** LangChain, Groq (Llama 3.3 70B), prompt engineering con CoT, Few-Shot y ReAct

**Base de datos:** Supabase (PostgreSQL) — tablas clients, conversations, messages con RLS

**RAG:** ChromaDB (Chroma Cloud) con embeddings para búsqueda semántica de servicios y precios

**API:** REST + GraphQL (Apollo Server v5)

**Observabilidad:** Langfuse — trazas completas de cada interacción, tool calls y latencia

**Infraestructura:** Azure App Service (CI/CD con GitHub Actions), Cloudflare Workers como proxy/gateway

**Protocolos:** MCP Server para exponer tools vía protocolo estándar

## Arquitectura

```
Cliente (WhatsApp/Web/API)
        │
        ▼
Cloudflare Worker (edge proxy, validación, rate limiting)
        │
        ▼
Azure App Service (Express + LangChain)
        │
        ├── Groq API (Llama 3.3 70B)
        ├── Supabase (persistencia)
        ├── ChromaDB Cloud (RAG)
        └── Langfuse (observabilidad)
```

El Worker de Cloudflare actúa como punto de entrada: recibe requests de cualquier canal, valida el payload, y los reenvía a Azure. Azure nunca queda expuesto directamente.

## Cómo funciona el agente

1. El cliente envía un mensaje a través del endpoint `/api/agent/chat`
2. El agente evalúa en qué fase está (Opening → BANT → Ending → Escalate)
3. Decide qué tools necesita: `update_client_info` para guardar datos, `search_knowledge_info` para consultar la base de conocimiento
4. Ejecuta las tools y recibe los resultados via ToolMessage (flujo correcto de LangChain tool use)
5. Genera una respuesta natural usando los datos reales obtenidos
6. Todo queda trazado en Langfuse

### Tools disponibles

- **update_client_info:** Actualiza nombre, necesidad, presupuesto, timeline y datos de contacto del cliente en Supabase. Se ejecuta automáticamente cuando el usuario proporciona información.
- **search_knowledge_info:** Busca en la base vectorial de ChromaDB información sobre servicios, precios, tecnologías y plazos. Siempre se consulta antes de responder sobre costos.

## Endpoints

### REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/agent/chat` | Enviar mensaje al agente |
| GET | `/health` | Health check |

**Body de `/api/agent/chat`:**
```json
{
  "external_id": "+56912345678",
  "message": "Hola, necesito una página web"
}
```

### GraphQL

Disponible en `/graphql`. Permite consultar clientes, conversaciones y mensajes con queries tipadas.

### Cloudflare Worker

```
POST https://ai-nexus-worker.felipe-stevenson77.workers.dev
```
Mismo body que el endpoint REST. El Worker valida y reenvía a Azure.

## Cómo probar el proyecto

### Para probar en producción (sin instalación)
Usa el endpoint `POST https://ai-nexus-worker.felipe-stevenson77.workers.dev` con el body de ejemplo. Esto es ideal para recruiters que quieren una demo rápida sin configurar entornos.

### Para desarrollo local
Sigue las instrucciones de "Configuración local" (requiere Node.js, cuentas en servicios externos y setup manual).

## Configuración local

### Prerrequisitos

- Node.js 20+
- Cuenta en Groq (API key)
- Cuenta en Supabase (proyecto con tablas creadas)
- Cuenta en Chroma Cloud (base de datos y API key)
- Cuenta en Langfuse (proyecto configurado)

### Instalación

```bash
git clone https://github.com/FStevenson91/ai-nexus-manager.git
cd ai-nexus-manager
npm install
```

### Variables de entorno

Crear archivo `.env` en la raíz:

```env
PORT=3000
GROQ_API_KEY=tu_groq_api_key

SUPABASE_URL=tu_supabase_url
SUPABASE_KEY=tu_supabase_key

CHROMA_API_KEY=tu_chroma_api_key
CHROMA_TENANT=tu_tenant_id
CHROMA_DATABASE=tu_database_name

LANGFUSE_SECRET_KEY=tu_langfuse_secret
LANGFUSE_PUBLIC_KEY=tu_langfuse_public
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

### Ejecución

```bash
# Desarrollo (hot reload)
npm run dev

# Build y producción
npm run build
npm start

# MCP Server
npm run mcp
```

## Base de datos (Supabase)

Tres tablas con relaciones:

- **clients:** external_id, name, email, phone, company, need, budget, timeline, authority, status
- **conversations:** client_id (FK), status, created_at
- **messages:** conversation_id (FK), role, content, created_at

Row Level Security (RLS) habilitado.

## RAG (ChromaDB)

Los documentos de la base de conocimiento están en `src/knowledge/services.txt`. Al iniciar, el servidor carga automáticamente los chunks en Chroma Cloud. El agente consulta esta base cada vez que necesita información sobre servicios, precios o plazos.

## Deploy

### Azure (App Service)

El deploy es automático vía GitHub Actions. Cada push a `main` dispara el workflow `.github/workflows/deploy.yml` que:

1. Instala dependencias
2. Compila TypeScript
3. Despliega a Azure App Service

### Cloudflare Worker

```bash
cd ai-nexus-worker
npx wrangler deploy
```

## Prompt Engineering

El system prompt usa técnicas avanzadas:

- **Chain of Thought (CoT):** Sección `<Thinking>` donde el agente evalúa fase actual, datos faltantes, herramientas necesarias y validación antes de cada respuesta
- **Few-Shot:** Sección `<Examples>` con conversaciones completas — flujo ideal y manejo de usuarios difíciles
- **ReAct (Reasoning + Acting):** El flujo de tools sigue el patrón Thought → Action → Observation → Response. El agente razona qué tool necesita, la ejecuta, recibe el resultado vía ToolMessage, y responde con los datos obtenidos
- **Flow estructurado:** Fases claras (Opening → BANT → Ending → Escalate) con transiciones definidas por el estado de la conversación
- **Restricciones explícitas:** Nunca inventar precios, siempre consultar `search_knowledge_info`, ofrecer alternativas cuando no hay información
- **Técnicas complementarias:** Role prompting, negative prompting, XML tags para estructura, output formatting

## Estructura del proyecto

```
src/
├── config/
│   ├── prompt.ts          # System prompt con CoT, Few-Shot, ReAct, Flow
│   ├── supabase.ts        # Cliente Supabase
│   └── langfuse.ts        # Configuración Langfuse
├── services/
│   ├── agent-service.ts   # Lógica del agente (LangChain + tools)
│   ├── db-service.ts      # Operaciones Supabase
│   └── rag-service.ts     # ChromaDB Cloud + embeddings
├── tools/
│   ├── update-client.ts   # Tool: actualizar info del cliente
│   └── search-knowledge.ts # Tool: buscar en base de conocimiento
├── routes/
│   └── agent-routes.ts    # Rutas Express
├── graphql/
│   ├── schema.ts          # TypeDefs GraphQL
│   └── resolver.ts        # Resolvers
├── mcp/
│   └── server.ts          # MCP Server
├── knowledge/
│   └── services.txt       # Base de conocimiento
└── index.ts               # Entry point
```

## Autor

**Felipe Stevenson** — Backend & AI Developer

- [GitHub](https://github.com/FStevenson91)
- [Portfolio](https://portfolio-felipe-orpin.vercel.app)
