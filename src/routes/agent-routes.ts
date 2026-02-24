import { Router } from "express";
import { userRequest } from "../services/agent-service.js";

const router = Router()

router.post("/chat", async (req, res) =>{
    const {message, external_id } = req.body
    const agentResponse = await userRequest(external_id, message)
    res.json(agentResponse)
}) 

export { router }