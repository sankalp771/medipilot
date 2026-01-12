import { prisma } from "@/lib/db";
import { mistral, MISTRAL_MODEL } from "@/lib/mistral";

export async function updateMedicalMemory(userId: string, newReportData: any) {
    try {
        // 1. Fetch existing profile
        const profile = await prisma.patientProfile.findUnique({
            where: { userId },
        });

        // 2. Prepare the prompt for Mistral
        const currentMemory = profile ? JSON.stringify(profile, null, 2) : "No existing profile.";
        const newInformation = JSON.stringify(newReportData, null, 2);

        const prompt = `
        You are an expert Medical Archivist AI.
        Your goal is to maintain a single, up-to-date "Patient Profile" by merging new report data into the existing history.

        EXISTING PROFILE:
        ${currentMemory}

        NEW REPORT DATA:
        ${newInformation}

        INSTRUCTIONS:
        1. Compare the NEW data with the EXISTING profile.
        2. MERGE them into a single coherent profile.
        3. Rules for updates:
           - **Conditions**: Add new diagnoses. Do not duplicate.
           - **Medications**: Update the list. If the new report mentions a medication change (e.g. stopped taking X), reflect that.
           - **Allergies**: Accumulate all known allergies.
           - **Height/Weight/BloodType**: Update if the new report is more recent/accurate.
           - **Additional Notes**: Summarize key ongoing health context (e.g. "Recovering from surgery", "History of high BP").

        OUTPUT FORMAT (JSON ONLY):
        {
          "conditions": string[],
          "medications": string[],
          "allergies": string[],
          "bloodType": string | null,
          "height": string | null,
          "weight": string | null,
          "additionalNotes": string
        }
        `;

        // 3. Call Mistral
        const response = await mistral.chat.complete({
            model: "mistral-small-latest", // Good enough for text merging
            messages: [{ role: "user", content: prompt }],
            responseFormat: { type: "json_object" },
        });

        const rawContent = response.choices?.[0]?.message?.content;

        if (typeof rawContent !== 'string') {
            console.error("Mistral returned non-string content");
            return null;
        }

        let mergedData;

        try {
            mergedData = JSON.parse(rawContent);
        } catch (e) {
            console.error("Failed to parse memory merge JSON", e);
            return null;
        }

        // 4. Update DB
        const updatedProfile = await prisma.patientProfile.upsert({
            where: { userId },
            update: {
                conditions: mergedData.conditions || [],
                medications: mergedData.medications || [],
                allergies: mergedData.allergies || [],
                bloodType: mergedData.bloodType || profile?.bloodType,
                height: mergedData.height || profile?.height,
                weight: mergedData.weight || profile?.weight,
                additionalNotes: mergedData.additionalNotes || profile?.additionalNotes,
            },
            create: {
                userId,
                conditions: mergedData.conditions || [],
                medications: mergedData.medications || [],
                allergies: mergedData.allergies || [],
                bloodType: mergedData.bloodType,
                height: mergedData.height,
                weight: mergedData.weight,
                additionalNotes: mergedData.additionalNotes,
            },
        });

        console.log("Health Memory Updated for User:", userId);
        return updatedProfile;

    } catch (error) {
        console.error("Error updating medical memory:", error);
        return null;
    }
}
