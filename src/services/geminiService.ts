import { GoogleGenAI, Type } from "@google/genai";
import { User, MatchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const improveSkillDescription = async (skills: string[], bio: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Improve this student's bio and skill descriptions for a skill exchange platform. 
    Skills: ${skills.join(", ")}
    Bio: ${bio}
    Return a professional, engaging bio.`,
  });
  return response.text || bio;
};

export const getMatches = async (currentUser: User, allUsers: User[]): Promise<MatchResult[]> => {
  const otherUsers = allUsers.filter(u => 
    u.id !== currentUser.id && 
    !currentUser.blockedUsers.includes(u.id) &&
    !u.blockedUsers.includes(currentUser.id)
  );
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a matching engine for a skill exchange platform. 
    Current User: ${JSON.stringify({
      skillsOffered: currentUser.skillsOffered,
      skillsWanted: currentUser.skillsWanted,
      level: currentUser.level,
      location: currentUser.location
    })}
    
    Potential Matches: ${JSON.stringify(otherUsers.map(u => ({
      id: u.id,
      name: u.name,
      skillsOffered: u.skillsOffered,
      skillsWanted: u.skillsWanted,
      level: u.level,
      location: u.location
    })))}
    
    Match based on:
    1. Skill Compatibility: If Current User's skillsWanted overlaps with Potential Match's skillsOffered (and vice versa).
    2. Location: Prioritize same city, then same state, then same country.
    3. Skill level balance.
    
    Return a JSON array of MatchResult objects: 
    { 
      userId: string, 
      score: number (0-100), 
      explanation: string (human-readable, e.g., "You can teach X which they want, and they can teach Y which you want. Plus, you're both in Z!"),
      isNearby: boolean (true if same city or state)
    }.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            userId: { type: Type.STRING },
            score: { type: Type.NUMBER },
            explanation: { type: Type.STRING },
            isNearby: { type: Type.BOOLEAN }
          },
          required: ["userId", "score", "explanation", "isNearby"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse matches", e);
    return [];
  }
};

export const generateLearningPlan = async (skill: string, level: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a 4-session learning plan for a student learning ${skill}. 
    Current level: ${level}.
    Format as a list of 4 sessions with titles and brief objectives.`,
  });
  return response.text || "No plan generated.";
};

export const getSkillSuggestions = async (skillsOffered: string[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on these skills offered: ${skillsOffered.join(", ")}, suggest 3 related skills this student might want to learn next to complement their profile.`,
  });
  return response.text || "";
};
