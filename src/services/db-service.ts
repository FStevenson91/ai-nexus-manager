import { supabase } from "../config/supabase.js";


export async function findOrCreateClient(id: string){
    const result = await supabase.from("clients").select("*").eq("external_id", id)
    if (result.data && result.data.length > 0) { // primero verificamos que data no sea null y luego que tenga al menos un elemento
        return result.data[0]
    } else {
    const newClient = await supabase.from("clients").insert({ external_id: id }).select()
    return newClient.data?.[0] // El ?. es optional chaining — si data es null, devuelve undefined en vez de explotar. Esto pasa por que naturalmente data devuelve un array, pero si no se inserta nada, data es null. Entonces, al intentar acceder a [0] de null, se rompe el código. Con el optional chaining, si data es null, simplemente devuelve undefined en vez de intentar acceder a [0].
    }
}

export async function findOrCreateConversation(clientId: string) {
    const findConversation = await supabase.from("conversations").select("*").eq("client_id", clientId).eq("active", true)
    if (findConversation.data && findConversation.data.length > 0) {
        return findConversation.data[0]
    } else {
        const createConversation = await supabase.from("conversations").insert({ client_id: clientId }).select()
    return createConversation.data?.[0]
    }
 
}

export async function saveMessage(conversationId: string, role: string, content: string){
    const result = await supabase.from("messages").insert({ conversation_id: conversationId, role: role, content: content }).select()
    return result.data?.[0]

}

export async function getConversationMessage(conversationId: string){
    const result = await supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true})
    return result.data
}