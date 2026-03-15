import { ChatGroq } from "@langchain/groq"
import { SystemMessage, HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages"
import { SYSTEM_PROMPT } from "../config/prompt.js"
import { findOrCreateClient, saveMessage, getConversationMessage, findOrCreateConversation } from "./db-service.js"
import { supabase } from "../config/supabase.js"
import { createUpdateClientTool } from "../tools/update-client.js"
import { searchKnowledgeTool } from "../tools/search-knowledge.js"
import { searchKnowledge } from "./rag-service.js"
import { CallbackHandler } from "@langfuse/langchain"

const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile"
});

const systemMessage = new SystemMessage({
    content: SYSTEM_PROMPT
});

export async function userRequest(external_id: string, message: string) {
    
    const findOrCreate = await findOrCreateClient(external_id)
    const createChat = await findOrCreateConversation(findOrCreate.id)
    const getHistory = await getConversationMessage(createChat.id) || []

    const historyMessages = getHistory.map((msg) => {
        if (msg.role === "user"){
            return new HumanMessage(msg.content)
        } else {
            return new AIMessage(msg.content)
        }
    });

    await saveMessage(createChat.id, "user", message)

    const humanMessage = new HumanMessage({
        content: message
    });

    const langfuseHandler = new CallbackHandler({
    sessionId: createChat.id,
    userId: external_id,
    })

const updateClientTool = createUpdateClientTool(external_id)

    // Primera invocación: el modelo decide qué tools usar
    const modelWithTools = model.bindTools([updateClientTool, searchKnowledgeTool])
    const toolResponse = await modelWithTools.invoke(
        [systemMessage, ...historyMessages, humanMessage], 
        { callbacks: [langfuseHandler] }
    )

    // Procesar tool calls y construir ToolMessages
    const toolMessages: ToolMessage[] = []

    if (toolResponse.tool_calls && toolResponse.tool_calls.length > 0) {
        for (const toolCall of toolResponse.tool_calls) {
            if (toolCall.name === "update_client_info") {
                await supabase.from("clients").update(toolCall.args).eq("external_id", external_id)
                console.log("CLIENT UPDATED:", toolCall.args)
                toolMessages.push(new ToolMessage({
                    tool_call_id: toolCall.id!,
                    content: "Cliente actualizado correctamente: " + JSON.stringify(toolCall.args)
                }))
            }
            if (toolCall.name === "search_knowledge_info") {
                const result = await searchKnowledge(toolCall.args.query)
                console.log("SEARCH RESULT:", result)
                toolMessages.push(new ToolMessage({
                    tool_call_id: toolCall.id!,
                    content: result || "No se encontró información. NO inventes datos. Ofrece agendar una reunión con el equipo técnico."
                }))
            }
        }
    }

    // Segunda invocación: el modelo responde con el contexto de las tools
    const finalMessages = toolMessages.length > 0
        ? [systemMessage, ...historyMessages, humanMessage, toolResponse, ...toolMessages]
        : [systemMessage, ...historyMessages, humanMessage]

    try {
        const response = await model.invoke(finalMessages, { callbacks: [langfuseHandler] })
        const responseText = response.content as string

        await saveMessage(createChat.id, "assistant", responseText)
        return responseText
    } catch (error) {
        console.error("SECOND INVOKE ERROR:", error)
        // Fallback: intentar sin tool messages
        const fallbackResponse = await model.invoke(
            [systemMessage, ...historyMessages, humanMessage], 
            { callbacks: [langfuseHandler] }
        )
        const fallbackText = fallbackResponse.content as string
        await saveMessage(createChat.id, "assistant", fallbackText)
        return fallbackText
    }
}