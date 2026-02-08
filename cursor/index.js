import readlineSync from 'readline-sync';
import { GoogleGenAI } from "@google/genai";
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({apiKey: "AIzaSyCIGukqfeCkkJYSmjrVxVPB2hXbjt4XWYE"});

const platform = os.platform();

const execAsync = promisify(exec);

var history = [] 

async function executeCommand({command}){
    try{
        const {stdout, stderr} = await execAsync(command);
        if(stderr){
            return `Error: ${stderr}`;
        }
        return `Success stdout: ${stdout}`;
    }
    catch(error){
        return `Error executing command: ${error}`;
    }
}

const executeCommandDeclaration = { //tell the ai model what does this function do and what parameters it takes
    name: "executeCommand",
    description: "Execute a single shell command. Create a file/folder or edit a file or write in a file or delete a file/folder.",
    parameters: {
        type: "object",
        properties: {
            command: { type: "string", description: "The shell command to execute. Ex mkdir calculator" },
        },
        required: ["command"],
    },
}

const availableFunctions = {
    executeCommand: executeCommand
}

async function runAgent(userProblem) {
    console.log("Running Agent for Problem: ", userProblem);
    history.push({
        role:'user',
        parts:[{text:userProblem}]
    })
        console.log("in while loop") //it may be possibility that user ask for multiple things in single question and llm responds to these one by one 
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents:history,
            config: {
                systemInstruction: `You are a website builder expert. You have to make websites based on user requirements. You can use the tool executeCommand 
                to execute shell/terminal commands to create files/folders, edit files, write in files or delete files/folders. The current system platform 
                is ${platform}. Give command to user according to its operating system.

                <----  what is your task? ---->
                1.analyse what type of website user wants to build and what are the requirements of that website by reading user question.
                2. Give the commands to user one by one and step by step
                3. Use the executeCommand tool to execute those commands in terminal.
                4.Avoid duplicating the commands.

                <---- how to use executeCommand tool? ---->
                1. First create a folder . Ex "mkir calculator"
                2. Inside folder create index.html . Ex "cd calculator && touch index.html"
                3. Then create style.css. ex Same as above 
                4. Then create script.js
                5. Then write code in these files according to user requirements.

                You have to provide the terminal or shell command to user to execute it in their system.Avoid duplicating the commands.

                `,
                tools: [
                    {functionDeclarations: [executeCommandDeclaration]}
                ]
            }
        });
        console.log("Model Response: ", response);

        if(response.functionCalls && response.functionCalls.length > 0){ //this returns an array
            console.log("Function Call Detected: ", response.functionCalls[0]);
            const {name, args} = response.functionCalls[0]; //taking first function call
        
            // NOW PUSH TO HISTORY THE MODEL RESPONSE AND FUNCTION CALL RESULT SO THAT IT CAN USE IT FOR NEXT QUESTION
            // history.push({
            //     role:'model',
            //     parts:[{
            //         functionCall: {
            //                             name,
            //                             args
            //                         }
            //         }]
            // })

            const funcTools = await availableFunctions[name]; //getting function from available functions
            const result = await funcTools(args);

            const functionResponsePart = {
                name: name,
                response: {
                    result: result
                }
            }

            history.push({
                role: "model",
                parts: [
                {
                    functionResponse: functionResponsePart
                }
                ]
            });
        }
        else{
            console.log("\nAgent Response:\n", response.text);
            history.push({ //stores llm response so as to share chat history with it for next question
                role:'model',
                parts:[{text:response.text}]
            })
            console.log("Agent Response: ", response.text);
        }
    }

async function main() {
    console.log("Welcome to the AI Website Builder Agent!");
    const userProblem = readlineSync.question("Ask me anything: ");
    console.log("User Problem: ", userProblem);
    await runAgent(userProblem)
    main()
}


main();
