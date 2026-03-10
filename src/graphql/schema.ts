export const typeDefs = `#graphql
type Client {
    id: ID
    external_id: String
    name: String
    phone: String
    email: String
    budget: String
    authority: String
    need: String
    timeline: String
    bant_status: String
    created_at: String
}

type Conversation {
    id: ID
    client_id: String
    active: Boolean
    started_at: String
    updated_at: String
}

type Message {
    id: ID
    conversation_id: String
    role: String
    content: String
    created_at: String
}

type Query {
    getAllClients: [Client]
    getClient(external_id: String): Client
    getConversations(client_id: String): [Conversation]
    getMessages(conversation_id: String): [Message]
}

type Mutation {
    chat(external_id: String, message: String): String
    deleteClient(external_id: String): Boolean
}
`