const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: { 
    responseMimeType: "application/json",
  }
});

async function test() {
  console.log("Using key:", process.env.GEMINI_API_KEY ? "Present" : "Missing");
  try {
    const result = await model.generateContent("Return JSON { 'hello': 'world' }");
    console.log("Success:", result.response.text());
  } catch (err) {
    console.error("Test Failed:", err);
  }
}

test();
