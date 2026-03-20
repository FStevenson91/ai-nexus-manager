import { Router } from "express";
import { userRequest } from "../services/agent-service.js";

const router = Router()

router.post("/chat", async (req, res) => {
    const { external_id, message } = req.body

    if (!external_id || !message) {
        res.status(400).json({ error: "external_id y message son requeridos" })
        return
    }

    try {
        const agentResponse = await userRequest(external_id, message)
        res.json(agentResponse)
    } catch (error) {
        console.error("ROUTE ERROR:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

export { router }
