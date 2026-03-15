import { readFileSync } from "fs";
import { ChromaClient, Collection } from "chromadb";
import {  DefaultEmbeddingFunction } from "@chroma-core/default-embed"

const client = new ChromaClient({
    path: "https://api.trychroma.com",
    auth: {
        provider: "token",
        credentials: process.env.CHROMA_API_KEY!,
    },
    tenant: process.env.CHROMA_TENANT!,
    database: process.env.CHROMA_DATABASE!,
})

const embedder = new DefaultEmbeddingFunction()

let collection: Collection


export async function initRAG() {
    try{

    collection = await client.getOrCreateCollection({
        name: "services",
        embeddingFunction: embedder
    })
    console.log("CHROMA CONNECTED OK")

    const servicesContent = readFileSync("src/knowledge/services.txt", "utf-8")

    const chunks = servicesContent.split(/\r?\n\r?\n/)
    
    await collection.add({
        ids: chunks.map((_, i) => `service_${i}`),
        documents: chunks
    })
    console.log("RAG initialized with", chunks.length, "chunks")
} catch (error) {
    console.error("CHROMA CONNECTION ERROR:", error)
}
}


export async function searchKnowledge(query: string){
    if (!collection) return "No hay información disponible en este momento"
    const results = await collection.query({
        queryTexts: [query],
        nResults: 3
    })
    return results.documents?.[0]?.join("\n\n") || "No se encontró información relevante"
}
