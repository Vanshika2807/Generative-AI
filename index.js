import { GoogleGenAI } from "@google/genai";
import readlineSync from 'readline-sync';

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({apiKey: ""});

const chat = ai.chats.create({
    model:"gemini-3-flash-preview",
    history:[],
    config: {
      systemInstruction: `You are a Data Structure And Algorithm(DSA) instructor. So if any one ask questions 
      in context of Data Structure And Algorithm then reply them politely and in the simplest possible 
      way otherwise if the question is not in DSA context then reply them as rudely as possible
      `,
    },
})

async function main(){
    const userProblem =  readlineSync.question('ask me anything: ')
    const response = await chat.sendMessage({
        message: userProblem
    })
    console.log(response.text)
    main()
}

main();