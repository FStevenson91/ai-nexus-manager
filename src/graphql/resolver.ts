import { supabase } from "../config/supabase.js";
import { userRequest } from "../services/agent-service.js";

export const resolvers = {
    Query: {
        getAllClients: async () => {
            const allClients = await supabase.from("clients").select("*")
            return allClients.data
        },
        getClient: async (_: any, args: any) => {
            const client = await supabase.from("clients").select("*").eq("external_id", args.external_id).single()
            return client.data
        },
        getConversations: async (_: any, args: any) => {
            const conversations = await supabase.from("conversations").select("*").eq("client_id", args.client_id)
            return conversations.data
        },
        getMessages: async (_: any, args: any) => {
            const messages = await supabase.from("messages").select("*").eq("conversation_id", args.conversation_id).order("created_at", {ascending: true})
            return messages.data
        }
    },
    Mutation: {
        chat: async (_: any, args: any ) => {
            const response = await userRequest(args.external_id, args.message)
            return response
        },
        deleteClient: async (_: any, args: any) => {
            const deleteClient = await supabase.from("clients").delete().eq("external_id", args.external_id)
            return true
        } 

    }
}