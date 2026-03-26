import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import * as dotenv from 'dotenv';
dotenv.config();


// Step 1: Load the PDF file
const PDF_PATH = './dsa.pdf';
const pdfLoader = new PDFLoader(PDF_PATH);
const rawDocs = await pdfLoader.load();
console.log(rawDocs.length);
console.log("file loaded successfully");

// Step 2: Create the chunk of the PDF
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200 // it tells how much the chunk should overlap with the previous chunk, it is useful to maintain the context of the document so that the previous chunk can provide the context to the next chunk and it will be helpful for the model to understand the document better
});
const docs = await textSplitter.splitDocuments(rawDocs);

console.log(docs.length);
console.log(docs[0].pageContent);
console.log("file chunked successfully");

// Step 3: Initializing the Embedding model - this is just to tell which model will be used to create the embedding vector of the document

const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'embedding-001', //this model will convert words into vectors
  });

console.log("embedding model initialized successfully");

// Step4:  Initialize Pinecone Client - configure the database
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
console.log("Pinecone client initialized successfully");

const testEmbedding = await embeddings.embedQuery("hello world");
console.log("Embedding length:", testEmbedding.length);


// Step 5: Embed Chunks and Upload to Pinecone - just tell it the chunk docs , the model to be used , and the database where the vector will be stored
await PineconeStore.fromDocuments(docs, embeddings, {
    pineconeIndex,
    maxConcurrency: 5, //it tells the chunkes to be uploaded in parallel and the number of parallel uploads
  });
    console.log("chunks embedded and uploaded to Pinecone successfully");
