import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function sendMessageToAI(
  messages: { role: 'user' | 'model'; content: string }[],
  topicTitle: string,
  userLevel: string,
  vocabularyList: string[] = []
) {
  const vocabInstruction = vocabularyList.length > 0 
    ? `\nCRITICAL: The user has a designated vocabulary list: ${vocabularyList.join(', ')}. YOU MUST try to use these words in your 'suggestedResponses' or 'reply' if natural.`
    : '';

  const systemInstruction = `You are an AI English tutor. The user's level is ${userLevel}.
The current conversation topic is: ${topicTitle}.
Roleplay casually with the user and provide a natural, engaging conversation.${vocabInstruction}
After responding to the user's message, also analyze the user's latest message for English grammar or vocabulary errors.
Return your response in JSON format.
If there are errors, provide a helpful 'feedback' string in Vietnamese.
Provide a 'translation' of your reply in Vietnamese as well.
Provide 'suggestedResponses' which is an array of 2-3 natural, short English sentences the user could use to reply to your CURRENT 'reply'.`;

  try {
    const formattedHistory = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: formattedHistory,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: "Your conversational response in English.",
            },
            translation: {
              type: Type.STRING,
              description: "The Vietnamese translation of your reply.",
            },
            feedback: {
              type: Type.STRING,
              description: "Grammar or vocabulary feedback for the user's latest message in Vietnamese. Leave empty if perfect.",
            },
            suggestedResponses: {
              type: Type.ARRAY,
              description: "A few (2-3) short, natural English sentences the user could use to reply to your current message.",
              items: {
                type: Type.STRING
              }
            },
          },
          required: ["reply", "translation", "suggestedResponses"],
        },
      },
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("AI Generation Error:", error);
    return { reply: "I'm having trouble connecting right now. Please try again later.", translation: "Tôi đang gặp khó khăn khi kết nối. Vui lòng thử lại sau.", feedback: "" };
  }
}

export async function scorePronunciation(transcript: string, expectedText: string) {
  // Using an AI model to evaluate how well the spoken transcript matches the expected text
  const prompt = `Evaluate the pronunciation/speaking accuracy.
Expected text: "${expectedText}"
Actual recognized speech: "${transcript}"

Provide a score from 0 to 100 based on how closely the recognized speech matches the expected meaning and words. 
Provide a brief encouraging feedback in Vietnamese. 
IMPORTANT: If you mention specific English words that the user mispronounced or should practice, YOU MUST wrap them in single quotes like 'word'.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.INTEGER,
              description: "Pronunciation score from 0 to 100",
            },
            feedback: {
              type: Type.STRING,
              description: "Brief feedback in Vietnamese",
            },
          },
          required: ["score", "feedback"],
        },
      },
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error(error);
    return { score: 0, feedback: "Không thể chấm điểm lúc này." };
  }
}

export async function extractVocabularyFromFile(inlineData: { mimeType: string; data: string }): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Extract useful English vocabulary, phrasal verbs, collocations, and word patterns from this document. Return ONLY a JSON array of strings." },
            { inlineData }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "An array of extracted vocabulary strings.",
        },
      },
    });

    const jsonText = response.text || "[]";
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Vocabulary Extraction Error:", error);
    return [];
  }
}

export async function generatePracticeSentences(vocabularyList: string[], currentLevel: string): Promise<{english: string, vietnamese: string, phonetic: string}[]> {
  try {
    const vocabPrompt = vocabularyList.length > 0 
      ? `Ensure you heavily prioritize using these words: ${vocabularyList.join(', ')}.` 
      : 'Use general daily life vocabulary.';
      
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            { text: `Generate 10 English practice sentences for a Vietnamese learner at ${currentLevel} level. ${vocabPrompt} Return an array of objects, where each object has 'english' (the English sentence), 'phonetic' (the American English IPA pronunciation), and 'vietnamese' (the Vietnamese translation).` }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              english: { type: Type.STRING },
              phonetic: { type: Type.STRING },
              vietnamese: { type: Type.STRING },
            },
            required: ["english", "phonetic", "vietnamese"],
          },
          description: "An array of practice sentences.",
        },
      },
    });

    const jsonText = response.text || "[]";
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Sentence Generation Error:", error);
    return [
      { english: "I would like to order a large latte, please.", phonetic: "/aɪ wʊd laɪk tʊ ˈɔrdər ə lɑrdʒ ˈlɑˌteɪ, plz/", vietnamese: "Tôi muốn gọi một cốc latte lớn, làm ơn." },
      { english: "What time does the next flight to New York leave?", phonetic: "/wʌt taɪm dʌz ðə nɛkst flaɪt tʊ nu jɔrk liv?/", vietnamese: "Chuyến bay tiếp theo đến New York khởi hành lúc mấy giờ?" },
      { english: "Could you tell me more about your experience in this field?", phonetic: "/kʊd ju tɛl mi mɔr əˈbaʊt jʊər ɪkˈspɪriəns ɪn ðɪs fild?/", vietnamese: "Bạn có thể cho tôi biết thêm về kinh nghiệm của bạn trong lĩnh vực này không?" },
      { english: "It's a beautiful day to go for a run in the park.", phonetic: "/ɪts ə ˈbjutəfəl deɪ tʊ goʊ fɔr ə rʌn ɪn ðə pɑrk./", vietnamese: "Hôm nay là một ngày đẹp trời để đi chạy bộ trong công viên." },
    ];
  }
}

export async function explainWord(word: string, currentLevel: string): Promise<{ meaning: string, example: string, pronunciation: string }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            { text: `Explain the English word/phrase "${word}" for a Vietnamese learner at ${currentLevel} level. Provide the Vietnamese meaning, an English example sentence, and the International Phonetic Alphabet (IPA) pronunciation.` }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meaning: {
              type: Type.STRING,
              description: "The meaning of the word/phrase in Vietnamese.",
            },
            example: {
              type: Type.STRING,
              description: "A natural English example sentence using the word/phrase.",
            },
            pronunciation: {
               type: Type.STRING,
               description: "The IPA pronunciation of the word/phrase.",
            }
          },
          required: ["meaning", "example", "pronunciation"],
        },
      },
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Word Explanation Error:", error);
    return { meaning: "Không thể tra cứu từ vựng lúc này.", example: "", pronunciation: "" };
  }
}
