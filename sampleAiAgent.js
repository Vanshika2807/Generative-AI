import readlineSync from 'readline-sync';
import { GoogleGenAI } from "@google/genai";


// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({apiKey: ""});

var history = [] 

function isPrime({num}) {
    if (num <= 1) return false; 
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }
    return true;
}

function sum({num1, num2}) {
    return num1 + num2;
}

async function getCryptoPrice({crypto}) {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${crypto}&vs_currencies=usd`);
    const data = await response.json();
    return data[crypto].usd;
}

//which function should be used to solve the problem
//what will be arguments to be passed to that function

const sumDeclaration = { //tell the ai model what does this function do and what parameters it takes
    name: "sum",
    description: "Returns the sum of two numbers.",
    parameters: {
        type: "object",
        properties: {
            num1: { type: "number", description: "The first number. Ex 10" },
            num2: { type: "number", description: "The second number. Ex 20" },
        },
        required: ["num1", "num2"],
    },
}

const isPrimeDeclaration = { //tell the ai model what does this function do and what parameters it takes
    name: "isPrime",
    description: "Checks if a number is prime.",
    parameters: {
        type: "object",
        properties: {
            num: { type: "number", description: "The number to check. Ex 7" },
        },
        required: ["num"],
    },
}

const getCryptoPriceDeclaration = { //tell the ai model what does this function do and what parameters it takes
    name: "getCryptoPrice",
    description: "Fetches the current price of a cryptocurrency in USD.",
    parameters: {
        type: "object",
        properties: {
            crypto: { type: "string", description: "The cryptocurrency to fetch price for. Ex bitcoin" },
        },
        required: ["crypto"],
    },
}

const availableFunctions = {
    sum: sum, //key with function name and value with actual function
    isPrime: isPrime,
    getCryptoPrice: getCryptoPrice
}

async function runAgent(userProblem) {
    console.log("Running Agent for Problem: ", userProblem);
    history.push({
        role:'user',
        parts:[{text:userProblem}]
    })

    while(true){
        console.log("in while loop") //it may be possibility that user ask for multiple things in single question and llm responds to these one by one 
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents:history,
            config: {
                systemInstruction: `you are an ai agent having access to 3 tools like to calculate sum of 2 numbers, to check if a number is prime or not and to get crypto price of any cryptocurrency.
                also if user asks any question not related to these tools then reply them if you dont even need help of these tools.`,
                tools: [
                    {functionDeclarations: [sumDeclaration, isPrimeDeclaration, getCryptoPriceDeclaration]}
                ]
            }
        });
        console.log("Model Response: ", response);

        if(response.functionCalls && response.functionCalls.length > 0){ //this returns an array
            console.log("Function Call Detected: ", response.functionCalls[0]);
            const {name, args, thought_signature } = response.functionCalls[0]; //taking first function call
            const funcTools = availableFunctions[name]; //getting function from available functions
            const result = await funcTools(args);

            const functionResponsePart = {
                name: name,
                response: {
                    result: result
                }
            }

            // NOW PUSH TO HISTORY THE MODEL RESPONSE AND FUNCTION CALL RESULT SO THAT IT CAN USE IT FOR NEXT QUESTION
            // history.push({
            //     role:'model',
            //     parts:[{
            //         functionCall: {
            //                             name,
            //                             args,
            //                             thought_signature
            //                         }
            //         }]
            // })

            history.push({
                role:'user',
                parts:[
                    {functionResponse:functionResponsePart}
                ]
            })
        }
        else{
            history.push({ //stores llm response so as to share chat history with it for next question
                role:'model',
                parts:[{text:response.text}]
            })
            console.log("Agent Response: ", response.text);
            break;
        }
    }
    
    
}

async function main() {
    const userProblem = readlineSync.question("Describe your problem: ");
    console.log("User Problem: ", userProblem);
    await runAgent(userProblem)
    main()
}


main();
