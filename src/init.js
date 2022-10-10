import "dotenv/config";
import "./db";
import "./models/Video";
import "./models/User";
import app from "./server";

const PORT = 4000

const handleListening = () => console.log(`Server listening on port http://localhost:${PORT} 📡`)

// listen은 callback 함수를 인자로 가진다. 
app.listen(PORT, handleListening)