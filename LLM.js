import { GoogleGenAI } from "@google/genai";
import readlineSync from 'readline-sync';

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({apiKey: "AIzaSyA8q2O6qz5pCywVSKhIFZoKk-7jdboOShY"});

var history = [] //while starting the chat ask that what is todays temperature and date - wont be able to tell

//but when we give these questions to chat gpt then clearly tells answer as they use the external tools 

async function chatting(userProblem) {

    history.push({
        role:'user',
        parts:[{text:userProblem}]
    })
    const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents:history,
    config: {
      systemInstruction: `You are a Data Structure And Algorithm(DSA) instructor. So if any one ask questions 
      in context of Data Structure And Algorithm then reply them politely and in the simplest possible 
      way otherwise if the question is not in DSA context then reply them as rudely as possible
      `,
    }
    // contents: [  //manual process for passing history with llm from terminal
    //     { //this is just like sharing history with llm model so that it has context of that chat 
    //         role:'user',
    //         parts:[{text:"Hi my name is Vanshika"}]
    //     },
    //     {
    //         role:'model',
    //         parts:[{text:"Hi Vanshika! It's nice to meet you. How can I help you today?"}]
    //     },
    //     {
    //         role:'user',
    //         parts:[{text:"whats your name"}]
    //     },
    //     {
    //         role:'model',
    //         parts:[{text:"I don't have a name! I am a large language model, trained by Google. How can I help you today, Vanshika?"}]
    //     },
    //     {
    //         role:'user',
    //         parts:[{text:"tell my friends name"}]
    //     },
    //     {
    //         role:'model',
    //         parts:[{text:"I'm sorry, Vanshika, but I don't know who your friends are! As an AI, I don’t have access to your personal life, your phone's contacts, or your social media accounts. We’ve only just started talking, so I only know what you tell me.If you'd like to tell me their names or a story about them, I'm all ears! Who is your best friend?"}]
    //     }

    // ],
  });

    history.push({ //stores llm response so as to share chat history with it for next question
        role:'model',
        parts:[{text:response.text}]
    })
    console.log(response.text);
}

async function main(){
    const userProblem =  readlineSync.question('ask me anything: ')
    await chatting(userProblem) //when await used then it does not execute any line after it until the current is executed fully 
    main() //to continuosly run the chat 
}

main();