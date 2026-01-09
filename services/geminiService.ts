
import { GoogleGenAI, Type } from "@google/genai";

// Standard function to perform OCR on ID card images using Gemini
export const performIDCardOCR = async (imageBase64: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
          { text: "Extract information from this ID card. Return JSON with fields: idNumber, firstName, lastName, dob, nationality, gender." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            idNumber: { type: Type.STRING },
            firstName: { type: Type.STRING },
            lastName: { type: Type.STRING },
            dob: { type: Type.STRING },
            nationality: { type: Type.STRING },
            gender: { type: Type.STRING }
          },
          required: ["idNumber", "firstName", "lastName"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("OCR failed", error);
    return null;
  }
};

// Fetches dynamic SSF Hospital list simulating an SSO API call with Provincial Categorization
export const fetchSSFHospitals = async () => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "List 30 major Social Security Fund (SSF) registered hospitals in Thailand. Include the province (e.g. Bangkok, Samut Prakan, Chonburi). Return as a JSON array of objects with 'id', 'name', and 'province'.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              province: { type: Type.STRING }
            },
            required: ["id", "name", "province"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Failed to fetch hospitals", error);
    return [
      { id: '1', name: 'Siriraj Hospital', province: 'Bangkok' },
      { id: '2', name: 'King Chulalongkorn Memorial Hospital', province: 'Bangkok' },
      { id: '3', name: 'Ramathibodi Hospital', province: 'Bangkok' },
      { id: '4', name: 'Vajira Hospital', province: 'Bangkok' },
      { id: '5', name: 'Kasemrad Hospital', province: 'Samut Prakan' }
    ];
  }
};
