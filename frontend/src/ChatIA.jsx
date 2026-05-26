import { useState } from "react";
import axios from "axios";

function ChatIA() {

    const [mensaje, setMensaje] = useState("");
    const [respuesta, setRespuesta] = useState("");

    const enviarMensaje = async () => {

        try {

            const res = await axios.post(
                "http://localhost:8080/api/ia",
                {
                    mensaje
                }
            );

            setRespuesta(res.data.respuesta);

        } catch (error) {

            console.log(error);

        }

    };

    return (

        <div style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "350px",
            background: "#1e1e1e",
            color: "white",
            padding: "20px",
            borderRadius: "15px",
            zIndex: 9999
        }}>

            <h2>?? Sommelier IA</h2>

            <input
                type="text"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Pregunta algo..."
                style={{
                    width: "100%",
                    padding: "10px"
                }}
            />

            <button
                onClick={enviarMensaje}
                style={{
                    marginTop: "10px",
                    width: "100%",
                    padding: "10px"
                }}
            >
                Preguntar
            </button>

            <p style={{
                marginTop: "15px"
            }}>
                {respuesta}
            </p>

        </div>

    );

}

export default ChatIA;
