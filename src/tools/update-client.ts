import { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"
import { supabase } from "../config/supabase.js"


const updateClientSchema = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    budget: z.string().optional(),
    authority: z.string().optional(), 
    need: z.string().optional(),
    timeline: z.string().optional()
})


export function createUpdateClientTool(external_id: string){
    const updateClientTool = new DynamicStructuredTool({
        name: "update_client_info",
        description: "actualiza la informacion del cliente mediante el uso de esta herramienta, para propiedades tales como name, phone, email, budget, authority, need, timeline, etc.",
        schema: updateClientSchema,
        func: async (input) => {
            console.log("TOOL EJECUTADA:", input)

            const updateClient = await supabase.from("clients").update(input).eq("external_id", external_id)
            console.log("SUPABASE UPDATE RESULT:", JSON.stringify(updateClient))
            
            return "Información del cliente actualizada correctamente"
        }
    })
    return updateClientTool
}