import { ExplainerInput, LLMExplanation } from "./types";

const phenotypeNames: Record<string, string> = {
  PM: "Poor Metabolizer",
  IM: "Intermediate Metabolizer",
  NM: "Normal Metabolizer",
  RM: "Rapid Metabolizer",
  URM: "Ultra-Rapid Metabolizer",
  Unknown: "Unknown Metabolizer Status",
};

export function fallbackExplanation(input: ExplainerInput): LLMExplanation {
  const phenotypeFull = phenotypeNames[input.phenotype] || "Unknown Metabolizer Status";

  return {
    summary: `Patient has ${input.phenotype} (${phenotypeFull}) phenotype for ${input.gene}, affecting ${input.drug} metabolism. Risk assessment: ${input.risk_label}. This finding is based on the detected diplotype ${input.diplotype} and established CPIC pharmacogenomic guidelines.`,
    biological_mechanism: `${input.gene} encodes a key enzyme responsible for metabolizing ${input.drug}. The detected diplotype ${input.diplotype} results in ${phenotypeFull} enzyme activity, which directly affects how the body processes this medication. Variations in this gene alter enzyme structure and catalytic efficiency.`,
    variant_impact: `The diplotype ${input.diplotype} in ${input.gene} produces ${phenotypeFull} enzyme function. This means the enzyme processes ${input.drug} at an altered rate compared to normal metabolizers, which has direct implications for drug efficacy and safety.`,
    clinical_context: `This pharmacogenomic profile has direct implications for ${input.drug} dosing and selection. Based on CPIC guidelines, the risk assessment for this gene-drug interaction is: ${input.risk_label}. Healthcare providers should consider this information when making prescribing decisions.`,
    safe_alternatives: input.risk_label === "High Risk" 
      ? ["Please consult your physician for alternative medications in the same therapeutic class that bypass this genetic pathway."]
      : ["Current medication appears pharmacogenomically optimal."],
    disclaimer:
      "This is AI-generated clinical decision support only. All treatment decisions require qualified healthcare provider review. This information is for educational purposes and does not constitute medical advice.",
  };
}
