// readfilesync se utiliza para leer el contenido del archivo de texto que contiene la información de los servicios.
import { readFileSync } from "fs";
import { ChromaClient, Collection } from "chromadb";
import {  DefaultEmbeddingFunction } from "@chroma-core/default-embed"

// Crea la conexión con el servidor de ChromaDB que está corriendo en tu computador (el que levantaste con Docker).
const client = new ChromaClient({path: "http://localhost:8000"})

// Crea una instancia de la función de embeddings. Esta es la que transforma "Desarrollo de Aplicaciones Móviles" en algo como [0.23, -0.45, 0.87, ...].
const embedder = new DefaultEmbeddingFunction()

let collection: Collection


// Se ejecuta una sola vez cuando arranca el servidor. Su trabajo es cargar los documentos en ChromaDB.
export async function initRAG() {

    // Le pide a ChromaDB: "dame la colección llamada services. Si no existe, créala." Le pasa el embedder para que sepa cómo convertir texto en vectores. Es parecido a findOrCreateClient — busca primero, crea si no existe.
    collection = await client.getOrCreateCollection({
        name: "services",
        embeddingFunction: embedder
    })
    // Lee todo el archivo services.txt y lo guarda como un string largo. "utf-8" es la codificación para que lea caracteres como ñ y tildes correctamente.
    const servicesContent = readFileSync("src/knowledge/services.txt", "utf-8")
    // Divide el texto cada vez que hay una línea en blanco. Tu archivo tiene cada servicio separado por una línea en blanco, entonces chunks queda como un array donde cada elemento es un bloque de texto de un servicio.
    const chunks = servicesContent.split(/\r?\n\r?\n/)
    // Agrega los chunks a ChromaDB. Necesita dos cosas:
    // ids → Un identificador único para cada chunk. .map((_, i) => ...) recorre el array y usa el índice i para crear IDs como "service_0", "service_1", "service_2", etc. El _ es una convención que significa "no me importa este parámetro" (sería el chunk, pero no lo necesitamos acá).
    // documents → El texto real de cada chunk. ChromaDB los convierte en vectores automáticamente usando el embedder que le pasamos a la colección.
    await collection.add({
        ids: chunks.map((_, i) => `service_${i}`),
        documents: chunks
    })
    console.log("RAG initialized with", chunks.length, "chunks")
}

// Esta es la función que el agente llama cuando necesita buscar información. Recibe la pregunta del usuario como parámetro.
// Le dice a ChromaDB: "busca los 3 documentos más similares a esta pregunta". Por ejemplo, si el query es "cuánto cuesta una app móvil", ChromaDB convierte eso en un vector, lo compara con los vectores de todos los chunks, y devuelve los 3 más cercanos.
export async function searchKnowledge(query: string){
    const results = await collection.query({
        queryTexts: [query],
        nResults: 3
    })
    return results.documents?.[0]?.join("\n\n") || "No se encontró información relevante"
}
