import {
    GoogleGenAI
} from "@google/genai";

import ApiError from "../utils/ApiError.js";

const apiKey =
    process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn(
        "GEMINI_API_KEY is not configured. AI features will use fallback handling."
    );
}

const ai = apiKey
    ? new GoogleGenAI({
        apiKey
    })
    : null;

const PRE_VISIT_MODEL =
    process.env.GEMINI_MODEL ||
    "gemini-3.6-flash";

const PRE_VISIT_PROMPT_VERSION =
    "v1";

const buildPreVisitPrompt = (
    symptoms
) => {
    return `
You are assisting a healthcare appointment workflow.

Analyze the patient's symptoms and produce a concise pre-visit summary for the doctor.

Patient symptoms:
"""
${symptoms}
"""

Return ONLY valid JSON.

The JSON must have exactly this structure:

{
  "urgency": "low | medium | high",
  "chiefComplaint": "short summary of the main complaint",
  "suggestedQuestions": [
    {
      "question": "question for the doctor to ask"
    }
  ]
}

Rules:

1. Do not diagnose the patient.
2. Do not prescribe medication.
3. Do not invent symptoms that were not provided.
4. Urgency should describe how quickly the doctor may need to review the case.
5. Keep the chief complaint concise.
6. Provide 3 to 5 useful follow-up questions.
7. Questions should help the doctor clarify symptoms, duration, severity, triggers, associated symptoms, or relevant history.
8. Return JSON only.
9. Do not include markdown code fences.
`;
};

const extractText = (
    response
) => {
    if (
        typeof response?.text ===
        "string"
    ) {
        return response.text;
    }

    if (
        typeof response?.text ===
        "function"
    ) {
        return response.text();
    }

    return null;
};

export const generatePreVisitAssessment =
    async (symptoms) => {
        if (!ai) {
            throw new ApiError(
                503,
                "AI service is not configured"
            );
        }

        try {
            const response =
                await ai.models.generateContent(
                    {
                        model:
                            PRE_VISIT_MODEL,

                        contents:
                            buildPreVisitPrompt(
                                symptoms
                            ),

                        config: {
                            temperature: 0.2,

                            responseMimeType:
                                "application/json"
                        }
                    }
                );

            const text =
                extractText(response);

            if (!text) {
                throw new Error(
                    "Gemini returned an empty response"
                );
            }

            return {
                text,
                model:
                    PRE_VISIT_MODEL,
                promptVersion:
                    PRE_VISIT_PROMPT_VERSION
            };
        } catch (error) {
            console.error(
                "Gemini pre-visit analysis failed:",
                error.message
            );

            throw new ApiError(
                503,
                "AI pre-visit analysis is temporarily unavailable"
            );
        }
    };

const POST_VISIT_PROMPT_VERSION = "v1";

const buildPostVisitPrompt = (clinicalNotes, prescription, followUpInstructions) => {
    return `
You are assisting a healthcare follow-up workflow.

Convert the doctor's clinical notes, prescription, and follow-up instructions into a patient-friendly summary.

Clinical Notes:
"""
${clinicalNotes}
"""

Prescription:
"""
${JSON.stringify(prescription, null, 2)}
"""

Follow-up Instructions:
"""
${followUpInstructions}
"""

Return ONLY valid JSON. Do not include markdown code fences.

The JSON must have exactly this structure:
{
  "summary": "a patient-friendly, compassionate summary explaining the clinical notes and instructions in simple terms",
  "medicationSchedule": [
    {
      "medicine": "name of the medicine",
      "instructions": "clear patient-friendly instructions on how/when to take this medicine, deriving directly from dosage, frequency, duration, and instructions entered by the doctor"
    }
  ],
  "followUpSteps": [
    "each step or instruction for the patient's recovery process"
  ]
}

Rules:
1. Do not diagnose the patient with anything not mentioned by the doctor.
2. Do not invent medical information.
3. Do not change the doctor's prescription, dosage, frequency, duration, or instructions.
4. Keep instructions clear and simple.
`;
};

export const generatePostVisitSummary = async ({
    clinicalNotes,
    prescription,
    followUpInstructions
}) => {
    if (!ai) {
        throw new ApiError(503, "AI service is not configured");
    }

    try {
        const response = await ai.models.generateContent({
            model: PRE_VISIT_MODEL,
            contents: buildPostVisitPrompt(clinicalNotes, prescription, followUpInstructions),
            config: {
                temperature: 0.2,
                responseMimeType: "application/json"
            }
        });

        const text = extractText(response);
        if (!text) {
            throw new Error("Gemini returned an empty response");
        }

        return {
            text,
            model: PRE_VISIT_MODEL,
            promptVersion: POST_VISIT_PROMPT_VERSION
        };
    } catch (error) {
        console.error("Gemini post-visit summary generation failed:", error.message);
        throw new ApiError(503, "AI summary generation is temporarily unavailable");
    }
};