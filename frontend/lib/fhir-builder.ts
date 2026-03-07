import { AnalysisResult } from "./types";

/**
 * Builds an HL7 FHIR R4 Bundle from an AnalysisResult.
 * This bundle contains:
 * 1. A Patient resource.
 * 2. An Observation resource (for the pharmacogenomic phenotype).
 * 3. A ClinicalImpression resource (for the risk assessment and recommendation).
 */
export function buildFHIRBundle(result: AnalysisResult) {
  return {
    resourceType: "Bundle",
    type: "document",
    timestamp: new Date().toISOString(),
    entry: [
      {
        resource: {
          resourceType: "Patient",
          id: result.patient_id,
        },
      },
      {
        resource: {
          resourceType: "Observation",
          status: "final",
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "105574-8",
                display: "Pharmacogenomic panel variant score",
              },
            ],
            text: `Pharmacogenomic profile for ${result.pharmacogenomic_profile.primary_gene}`,
          },
          subject: {
            reference: `Patient/${result.patient_id}`,
          },
          valueString: `${result.pharmacogenomic_profile.primary_gene} ${result.pharmacogenomic_profile.diplotype} (${result.pharmacogenomic_profile.phenotype})`,
          component: result.pharmacogenomic_profile.detected_variants.map((v) => ({
            code: {
              text: `Variant ${v.rsid}`,
            },
            valueString: `${v.star_allele} (${v.clinical_significance})`,
          })),
        },
      },
      {
        resource: {
          resourceType: "ClinicalImpression",
          status: "completed",
          subject: {
            reference: `Patient/${result.patient_id}`,
          },
          summary: `Risk Label: ${result.risk_assessment.risk_label} (Severity: ${result.risk_assessment.severity})`,
          investigation: [
            {
              code: {
                text: "Pharmacogenomic Risk Assessment",
              },
              item: [], // References to Observations could go here
            },
          ],
          finding: [
            {
              itemReference: {
                display: `Drug: ${result.drug}`,
              },
              basis: result.risk_assessment.clinical_recommendation,
            },
          ],
          note: [
            {
              text: result.risk_assessment.llm_generated_explanation,
            },
          ],
        },
      },
    ],
  };
}
