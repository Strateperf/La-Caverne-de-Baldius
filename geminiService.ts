
import { GoogleGenAI, Type } from "@google/genai";
import { AdventureIdea, NPC } from "./types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAdventureIdea = async (genre: string): Promise<AdventureIdea> => {
  const prompt = `Génère une idée d'aventure courte pour un jeu de rôle de type ${genre}.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Un titre accrocheur pour l'aventure." },
          setting: { type: Type.STRING, description: "Le lieu ou le contexte de l'intrigue." },
          hook: { type: Type.STRING, description: "L'accroche qui lance les joueurs dans l'action." },
          antagonist: { type: Type.STRING, description: "L'ennemi principal ou la menace." },
        },
        required: ["title", "setting", "hook", "antagonist"],
      },
    },
  });

  // Extracting text output from GenerateContentResponse using the .text property
  const text = response.text || "{}";
  return JSON.parse(text) as AdventureIdea;
};

export const generateNPC = async (context: string): Promise<NPC> => {
  const prompt = `Génère un Personnage Non-Joueur (PNJ) mémorable pour un JdR. Contexte optionnel: ${context}`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          race: { type: Type.STRING },
          occupation: { type: Type.STRING },
          personality: { type: Type.STRING },
          secret: { type: Type.STRING, description: "Un secret inavouable ou une motivation cachée." },
        },
        required: ["name", "race", "occupation", "personality", "secret"],
      },
    },
  });

  // Extracting text output from GenerateContentResponse using the .text property
  const text = response.text || "{}";
  return JSON.parse(text) as NPC;
};
