import { readFileSync } from "fs";
import { CloudClient, Collection } from "chromadb";
import {  DefaultEmbeddingFunction } from "@chroma-core/default-embed"

const client = new CloudClient({
    apiKey: process.env.CHROMA_API_KEY!,
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

    // IMPORTANTE: Si actualizas services.txt, debes borrar la colección "services"
    // desde app.trychroma.com y reiniciar el servidor para recargar los chunks.
    const existing = await collection.count()
        if (existing > 0) {
            console.log(`RAG already initialized with ${existing} chunks. For reload, delete collection at Chroma Cloud and restart.`)
            return
        }

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
