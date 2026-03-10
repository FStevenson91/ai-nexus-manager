// 1. ¿Qué imports necesitás? (express y dotenv)
import  "dotenv/config"
import "./config/langfuse.js"
import  express  from "express"
import { router } from "./routes/agent-routes.js"
import { initRAG } from "./services/rag-service.js"
import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from "@as-integrations/express5"
import { typeDefs } from "./graphql/schema.js"
import { resolvers } from "./graphql/resolver.js"

// 2. ¿Cómo cargas las variables de entorno? (una línea de dotenv)

// 3. ¿Cómo creas la app de Express?
const app = express()

// 4. ¿Qué middleware necesitás para que Express entienda JSON?
app.use(express.json())

app.use("/api/agent", router)

// 5. Una ruta de prueba: GET /health que responda { status: "ok" }
app.get("/health", (req, res) =>{
    res.json({status: "okey"})
})

async function startServer() {
    const server = new ApolloServer({typeDefs, resolvers})
    await server.start()
    app.use("/graphql", express.json(), expressMiddleware(server))
    
    // 6. ¿Cómo ponés el servidor a escuchar? (usa PORT desde .env o 3000 por defecto)
    app.listen(process.env.PORT || 3000, ()=> {
        console.log("APP STARTED");
    
        initRAG()
            .then(() => console.log("RAG ready"))
            .catch((err) => console.log("RAG error:", err))
    })
}

startServer()

