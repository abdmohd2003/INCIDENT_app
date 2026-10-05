import "dotenv/config"
import app from "./app.js";

const PORT = process.env.PORT || 3000 || 5000;

app.listen(PORT, ()=>{
    console.log(`Server is Running on port ${PORT}`)
});
