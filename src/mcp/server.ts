import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import { searchKnowledge } from "../services/rag-service.js"
import { supabase } from "../config/supabase.js"

const transport = new StdioServerTransport()

const server = new McpServer({name: "nexus-manager-mcp", version: "1.0.0"})

server.tool("searchKnowledge", "busca en los archivos", {search: z.string().describe("busqueda para documentos")}, async({search})=>{
    const result = await searchKnowledge(search)
    return {
        content: [{type: "text", text: result}]
    }
})

server.tool("updateclienttool", "actualiza el cliente con la ultima informacion recibida", 
{
    external_id: z.string().describe("ID externo del cliente"),
    name: z.string().optional().describe("Nombre"),
    email: z.string().optional().describe("Email"),
    phone: z.string().optional().describe("Telefono"),
    budget: z.string().optional().describe("Presupuesto"),
    authority: z.string().optional().describe("autoridad"),
    need: z.string().optional().describe("necesidad"),
    timeline: z.string().optional().describe("plazo")


}, async({external_id, name, email, phone, budget, authority, need, timeline})=> {

    const data: any = {}
        if (name) data.name = name
        if (email) data.email = email
        if (phone) data.phone = phone
        if (budget) data.budget = budget
        if (authority) data.authority = authority
        if (need) data.need = need
        if (timeline) data.timeline = timeline

        const updateClient = await supabase.from("clients").update(data).eq("external_id", external_id)

            return { content: [{type: "text", text: "Información del cliente actualizada correctamente"}]}
})

server.connect(transport)