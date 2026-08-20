import ApiError from "./ApiError.js";

const VALID_URGENCY_VALUES = [
    "low",
    "medium",
    "high"
];

export const parsePreVisitResponse =
    (text) => {
        if (
            typeof text !== "string" ||
            !text.trim()
        ) {
            throw new ApiError(
                502,
                "AI returned an empty response"
            );
        }

        let parsed;

        try {
            parsed = JSON.parse(
                text.trim()
            );
        } catch {
            throw new ApiError(
                502,
                "AI returned invalid JSON"
            );
        }

        if (
            !VALID_URGENCY_VALUES.includes(
                parsed.urgency
            )
        ) {
            throw new ApiError(
                502,
                "AI returned an invalid urgency value"
            );
        }

        if (
            typeof parsed.chiefComplaint !==
                "string" ||
            !parsed.chiefComplaint.trim()
        ) {
            throw new ApiError(
                502,
                "AI returned an invalid chief complaint"
            );
        }

        if (
            !Array.isArray(
                parsed.suggestedQuestions
            )
        ) {
            throw new ApiError(
                502,
                "AI returned invalid suggested questions"
            );
        }

        const suggestedQuestions =
            parsed.suggestedQuestions
                .filter(
                    (item) =>
                        item &&
                        typeof item.question ===
                            "string" &&
                        item.question.trim()
                )
                .slice(0, 5)
                .map(
                    (item) => ({
                        question:
                            item.question.trim()
                    })
                );

        if (
            suggestedQuestions.length < 3
        ) {
            throw new ApiError(
                502,
                "AI returned fewer than 3 useful questions"
            );
        }

        return {
            urgency:
                parsed.urgency,

            chiefComplaint:
                parsed.chiefComplaint.trim(),

            suggestedQuestions
        };
    };

export const cleanJsonText = (text) => {
    if (typeof text !== "string") return "";
    let clean = text.trim();
    if (clean.startsWith("```")) {
        const match = clean.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
        if (match) {
            clean = match[1].trim();
        }
    }
    return clean;
};

export const parsePostVisitResponse = (text) => {
    const clean = cleanJsonText(text);
    if (!clean) {
        throw new ApiError(502, "AI returned an empty response");
    }

    let parsed;
    try {
        parsed = JSON.parse(clean);
    } catch {
        throw new ApiError(502, "AI returned invalid JSON");
    }

    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const medicationSchedule = Array.isArray(parsed.medicationSchedule)
        ? parsed.medicationSchedule.filter(
              (item) =>
                  item &&
                  typeof item.medicine === "string" &&
                  typeof item.instructions === "string"
          )
        : [];
    const followUpSteps = Array.isArray(parsed.followUpSteps)
        ? parsed.followUpSteps
              .filter((step) => typeof step === "string")
              .map((step) => step.trim())
        : [];

    return {
        summary,
        medicationSchedule,
        followUpSteps
    };
};