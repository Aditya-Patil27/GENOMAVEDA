/**
 * FHIR R4 Bundle Generator
 *
 * Converts PharmaGuard AnalysisResult into an HL7 FHIR R4 Bundle containing:
 *   - DiagnosticReport (pharmacogenomic risk assessment)
 *   - Observation per detected variant
 *   - Patient stub
 *
 * Spec: https://hl7.org/fhir/R4/diagnosticreport.html
 */

import { AnalysisResult } from "./types";

function fhirId(): string {
  // Simple UUID v4 generator — avoids dependency on crypto.randomUUID()
  const hex = "0123456789abcdef";
  let id = "urn:uuid:";
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      id += "-";
    } else if (i === 14) {
      id += "4";
    } else if (i === 19) {
      id += hex[(Math.random() * 4) | 8];
    } else {
      id += hex[(Math.random() * 16) | 0];
    }
  }
  return id;
}

interface FhirResource {
  resourceType: string;
  id: string;
  [key: string]: unknown;
}

interface FhirBundle {
  resourceType: "Bundle";
  id: string;
  type: "collection";
  timestamp: string;
  meta: { profile: string[] };
  entry: Array<{ fullUrl: string; resource: FhirResource }>;
}

function buildPatient(patientId: string): FhirResource {
  return {
    resourceType: "Patient",
    id: patientId,
    identifier: [
      {
        system: "urn:pharmaguard:patient",
        value: patientId,
      },
    ],
    active: true,
  };
}

function buildVariantObservation(
  variant: AnalysisResult["pharmacogenomic_profile"]["detected_variants"][0],
  patientRef: string
): FhirResource {
  return {
    resourceType: "Observation",
    id: fhirId(),
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "laboratory",
            display: "Laboratory",
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "69548-6",
          display: "Genetic variant assessment",
        },
      ],
      text: `${variant.gene} ${variant.rsid} — ${variant.star_allele}`,
    },
    subject: { reference: patientRef },
    valueCodeableConcept: {
      coding: [
        {
          system: "http://loinc.org",
          code: "LA6706-1",
          display: variant.zygosity,
        },
      ],
      text: `${variant.star_allele} (${variant.zygosity})`,
    },
    component: [
      {
        code: {
          coding: [{ system: "http://loinc.org", code: "48018-6", display: "Gene studied" }],
        },
        valueCodeableConcept: {
          coding: [{ system: "http://www.genenames.org", code: variant.gene, display: variant.gene }],
        },
      },
      {
        code: {
          coding: [{ system: "http://loinc.org", code: "81252-9", display: "Discrete genetic variant" }],
        },
        valueCodeableConcept: {
          text: `${variant.rsid} chr${variant.chromosome}:${variant.position} ${variant.ref_allele}>${variant.alt_allele}`,
        },
      },
    ],
  };
}

function buildDiagnosticReport(
  result: AnalysisResult,
  patientRef: string,
  observationRefs: string[]
): FhirResource {
  const riskDisplay: Record<string, string> = {
    Safe: "No pharmacogenomic risk detected",
    "Adjust Dosage": "Dosage adjustment recommended",
    Toxic: "High toxicity risk — avoid or use alternative",
    Ineffective: "Reduced efficacy expected",
    Unknown: "Insufficient data for assessment",
  };

  return {
    resourceType: "DiagnosticReport",
    id: fhirId(),
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v2-0074",
            code: "GE",
            display: "Genetics",
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "51969-4",
          display: "Genetic analysis summary report",
        },
      ],
      text: `PharmaGuard PGx Risk Report — ${result.drug}`,
    },
    subject: { reference: patientRef },
    effectiveDateTime: result.timestamp,
    issued: result.timestamp,
    result: observationRefs.map((ref) => ({ reference: ref })),
    conclusion:
      `Drug: ${result.drug} | Gene: ${result.pharmacogenomic_profile.primary_gene} | ` +
      `Diplotype: ${result.pharmacogenomic_profile.diplotype} | ` +
      `Phenotype: ${result.pharmacogenomic_profile.phenotype} | ` +
      `Risk: ${result.risk_assessment.risk_label} | ` +
      `Confidence: ${(result.risk_assessment.confidence_score * 100).toFixed(0)}%`,
    conclusionCode: [
      {
        coding: [
          {
            system: "urn:pharmaguard:risk",
            code: result.risk_assessment.risk_label.toLowerCase().replace(/\s+/g, "-"),
            display: riskDisplay[result.risk_assessment.risk_label] || "Assessment complete",
          },
        ],
      },
    ],
    extension: [
      {
        url: "urn:pharmaguard:clinical-recommendation",
        valueString: result.risk_assessment.clinical_recommendation,
      }
    ],
  };
}

export function buildFhirBundle(result: AnalysisResult): FhirBundle {
  const patientId = result.patient_id;
  const patientRef = `Patient/${patientId}`;

  const patient = buildPatient(patientId);

  const observations = result.pharmacogenomic_profile.detected_variants.map(
    (v) => buildVariantObservation(v, patientRef)
  );

  const observationRefs = observations.map((o) => `Observation/${o.id}`);

  const report = buildDiagnosticReport(result, patientRef, observationRefs);

  const entries = [
    { fullUrl: patientRef, resource: patient },
    { fullUrl: `DiagnosticReport/${report.id}`, resource: report },
    ...observations.map((o) => ({
      fullUrl: `Observation/${o.id}`,
      resource: o,
    })),
  ];

  return {
    resourceType: "Bundle",
    id: fhirId(),
    type: "collection",
    timestamp: result.timestamp,
    meta: {
      profile: ["http://hl7.org/fhir/StructureDefinition/Bundle"],
    },
    entry: entries,
  };
}
