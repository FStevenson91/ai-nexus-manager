import  "dotenv/config"
import "./config/langfuse.js"
import  express  from "express"
import { router } from "./routes/agent-routes.js"
import { initRAG } from "./services/rag-service.js"
import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from "@as-integrations/express5"
import { typeDefs } from "./graphql/schema.js"
import { resolvers } from "./graphql/resolver.js"

const app = express()

app.use(express.json())

app.use("/api/agent", router)

// Ruta de prueba: GET /health { status: "ok" }
app.get("/health", (req, res) =>{
    res.json({status: "ok"})
})

async function startServer() {
    const server = new ApolloServer({typeDefs, resolvers})
    await server.start()
    app.use("/graphql", express.json(), expressMiddleware(server))
    
    app.listen(process.env.PORT || 3000, ()=> {
        console.log("APP STARTED");
    
        initRAG()
            .then(() => console.log("RAG ready"))
            .catch((err) => console.log("RAG error:", err))
    })
}

startServer()

