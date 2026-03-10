import { z } from "zod"
import { DynamicStructuredTool } from "@langchain/core/tools"
import { searchKnowledge } from "../services/rag-service.js"

const searchKnowledgSchema = z.object({
    query: z.string()
})

export const searchKnowledgeTool = new DynamicStructuredTool({
        name: "search_knowledge_info",
        description: "busca en los servicios de la empresa la información relevante para satisfacer las dudas de los clientes",
        schema: searchKnowledgSchema,
        func: async(input) => {
            const search = await searchKnowledge(input.query)
            return search
        }
    })
