const express = require("express");
const router = express.Router();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("TU_API_KEY");

router.post("/", async (req, res) => {

    try {

        const { mensaje } = req.body;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash"
        });

        const prompt = `
        Eres un sommelier experto de una licorería premium.

        Recomiendas:
        - vinos
        - whisky
        - tequila
        - vodka
        - ron

        Usuario: ${mensaje}
        `;

        const result = await model.generateContent(prompt);

        const respuesta = result.response.text();

        res.json({
            respuesta
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: "Error IA"
        });

    }

});

module.exports = router;
