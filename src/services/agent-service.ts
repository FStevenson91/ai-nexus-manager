import { ChatGroq } from "@langchain/groq"
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages"
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

    const tools = createUpdateClientTool(external_id)

    const modelWithTools = model.bindTools([tools, searchKnowledgeTool], { tool_choice: "required" })
    const extraction = await modelWithTools.invoke([systemMessage, ...historyMessages, humanMessage], { callbacks: [langfuseHandler] })
    let knowledgeResult = ""

    if (extraction.tool_calls && extraction.tool_calls.length > 0) {
        for (const toolCall of extraction.tool_calls) {
            if (toolCall.name === "update_client_info") {
                await supabase.from("clients").update(toolCall.args).eq("external_id", external_id)
                console.log("CLIENT UPDATED:", toolCall.args)
            } if (toolCall.name === "search_knowledge_info") {
                knowledgeResult = await searchKnowledge(toolCall.args.query)
            }
        }
    }


    const contextMessages = knowledgeResult 
    ? [systemMessage, ...historyMessages, new SystemMessage({ content: "Información encontrada: " + knowledgeResult }), humanMessage]
    : [systemMessage, ...historyMessages, humanMessage]


    const response = await model.invoke(contextMessages, { callbacks: [langfuseHandler] })
    const responseText = response.content as string

    await saveMessage(createChat.id, "assistant", responseText)

    return responseText
}