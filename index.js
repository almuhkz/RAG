require('dotenv').config();
let { Pinecone } = require('@pinecone-database/pinecone');
let OpenAI = require("openai");
let { OpenAIEmbeddings } = require("@langchain/openai");
let { loadQAStuffChain } = require("langchain/chains");
let { Document } = require("langchain/document");
const LangchainOpenAI = require("@langchain/openai").OpenAI;
let { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
let { ChatGoogleGenerativeAI } = require("@langchain/google-genai");


async function main() {
    const schedule = [
        "3/3/2024 6:00 AM - Wake Up",
        "3/3/2024 7:00 AM - Eat Breakfast",
        "3/3/2024 8:00 AM - Go to Incubator",
        "3/3/2024 10:00 AM - Work on Project",
        "3/3/2024 12:00 PM - Eat Lunch at McDonalds",
        "3/3/2024 1:00 PM - Go to UniHub",
        "3/3/2024 2:00 PM - Meet with Team",
        "3/3/2024 3:00 PM - Greet Alidar Panaguzhiyev",
        "3/3/2024 4:00 PM - Continue Working on Project",
        "3/3/2024 5:00 PM - Go Home",
        "3/3/2024 6:00 PM - Eat Dinner",
        "3/3/2024 7:00 PM - Relax",
        "3/3/2024 8:00 PM - Plan Next Day"
    ];


    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
    });

    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    });

    const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "embedding-001", // 768 dimensions
    });

    const indexName = 'alibekai';

    const index = pc.index(indexName);

    const scheduleEmbeddings = await embeddings.embedDocuments(schedule);

    console.log("length of embeddings: " + scheduleEmbeddings.length);

    const scheduleVectors = scheduleEmbeddings.map((embedding, i) => ({
        id: schedule[i],
        values: embedding,
        metadata: {
            text: schedule[i],
        }
    }));

    await index.upsert(scheduleVectors);

    const query = "when i will greet the legend Alidar?";

    const queryEmbedding = await new GoogleGenerativeAIEmbeddings().embedQuery(query);

    let queryResponse = await index.query({
        vector: queryEmbedding,
        topK: 3,
        includeMetadata: true,
    });

    const concatenatedText = queryResponse.matches
        .map((match) => match.metadata.text)
        .join(" ");

    console.log(`Concatenated Text: ${concatenatedText}`);
    const llm = new ChatGoogleGenerativeAI({
        model: "gemini-pro",
        maxOutputTokens: 2048,
        googleApiKey: process.env.GOOGLE_API_KEY,
    });

    // const llm = new LangchainOpenAI({
    //     openAIApiKey: process.env.OPENAI_API_KEY,
    // });
    const chain = loadQAStuffChain(llm);

    const result = await chain.call({
        input_documents: [new Document({ pageContent: concatenatedText })],
        question: query,
    });

    console.log(`Answer: ${result.text}`);
}

main().catch(console.error);