import { ChatGroq } from "@langchain/groq"
import { SystemMessage, HumanMessage } from "@langchain/core/messages"
import { SYSTEM_PROMPT } from "../config/prompt.js"
import { findOrCreateClient, saveMessage, getConversationMessage, findOrCreateConversation } from "./db-service.js"

const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile"
})

const systemMessage = new SystemMessage({
    content: SYSTEM_PROMPT
    
})

export async function userRequest(external_id: string, message: string) {

    const findOrCreate = await findOrCreateClient(external_id)
    const createChat = await findOrCreateConversation(findOrCreate.id)
    const getHistory = await getConversationMessage(createChat.id) || []

    await saveMessage(createChat.id, "user", message)

    const humanMessage = new HumanMessage({
        content: message
    });

    const response = await model.invoke([systemMessage, ...getHistory, humanMessage])
    const responseText = response.content as string

    await saveMessage(createChat.id, "assistant", responseText)

    return responseText

}

