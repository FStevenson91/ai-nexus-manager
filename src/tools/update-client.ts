import { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"


const updateClientSchema = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    budget: z.string().optional(),
    authority: z.string().optional(), 
    need: z.string().optional(),
    timeline: z.string().optional()
})

const updateClientTool = new DynamicStructuredTool({
    name: "update_client_info",
    description: "actualiza la informacion del cliente mediante el uso de esta herramienta, para propiedades tales como name, phone, email, budget, authority, need, timeline, etc.",
    schema: updateClientSchema,
    func: async (input) => {
        
    }

})