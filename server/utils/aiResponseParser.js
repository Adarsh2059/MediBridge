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