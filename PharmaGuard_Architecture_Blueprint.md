**PHARMAGUARD-AI**

*Enterprise Pharmacogenomics Clinical Decision Support Platform*

**COMPLETE PRODUCTION-GRADE ARCHITECTURE BLUEPRINT**

  ----------------------------------- -----------------------------------
  **Version**                         v2.0 --- 2026 Edition

  **Document Type**                   Technical Architecture + Business
                                      Strategy

  **Classification**                  **CONFIDENTIAL --- INTERNAL USE
                                      ONLY**

  **Frameworks**                      RIFT 2026 Hackathon \| Ecothon 5.0
                                      Healthcare Track
  ----------------------------------- -----------------------------------

**1. PROBLEM DEFINITION**

**1.1 Real-World Problem**

Adverse Drug Reactions (ADRs) represent one of the most preventable yet
catastrophic failures of modern clinical medicine. The core failure is
prescribing blindness --- physicians have no automated mechanism to
cross-reference a patient\'s unique genetic metabolism profile against a
prescribed drug at the point of care.

  -------------------------------------------------------------------------
  **Metric**        **India**         **USA**           **Global**
  ----------------- ----------------- ----------------- -------------------
  Annual ADR Deaths \~58,000 est.     \>100,000         \>1.9 million

  Emergency         Up to 6.89%       \~6 per 1,000 pts 5--10% of all
  Admissions from                                       admissions
  ADRs                                                  

  Cost per ADR      ₹2,307--₹4,945    Up to \$12,129    \$5,000--\$12,000
  Hospitalization                                       avg

  Preventable ADRs  \~60%             \~50%             \~55%
  (%)                                                   

  EHR Integration   \<2% of hospitals \<15% of          \<8% globally
  of PGx Data                         hospitals         
  -------------------------------------------------------------------------

**1.2 Market Gap**

-   No vendor-agnostic, FHIR-native PGx-CDSS exists that works across
    Indian ERP systems (e.g., eHospital, Insta HMS), Epic, and Oracle
    Cerner without months of custom integration.

-   Existing tools (GeneSight, OneOme, 2bPrecise) are either lab-locked
    (tethered to proprietary testing kits) or legacy-architecture (HL7
    v2, no CDS Hooks, no real-time intercept).

-   Zero production solutions address the ABDM (Ayushman Bharat Digital
    Mission) compliance requirement, which is a mandatory gateway to
    scaling across India\'s 140,000+ public hospitals.

-   AI explainability is absent in all current CDSS tools --- alert
    fatigue (\>90% override rates) persists because alerts lack clinical
    rationale, causing physicians to habitually dismiss them.

**1.3 Why Current Solutions Fail**

  -----------------------------------------------------------------------
  **Competitor**    **Core Failure**        **Architectural Gap**
  ----------------- ----------------------- -----------------------------
  GeneSight         Psychiatry-only scope;  No FHIR; No CDS Hooks; No
  (Myriad)          external portal login;  real-time intercept
                    static PDF reports      

  OneOme (Mayo      Software is revenue     Partial FHIR R4; No ABDM; No
  Clinic)           vehicle for lab kits;   Indian ERP adapters
                    vendor lock-in          

  YouScript         Alert fatigue; no LLM   Legacy rule engine; no RAG;
  (Invitae)         explanations; HL7 v2    brittle integrations
                    only                    

  2bPrecise         \$500K+ implementation  No emerging market support;
                    cost; enterprise-only   no PPPM pricing tier
  -----------------------------------------------------------------------

**1.4 Technical Challenges**

-   VCF Parsing Complexity: Clinical VCF files can exceed 50GB.
    Real-time streaming parsers must extract pharmacogenomic variants
    (rsIDs, star alleles, diplotypes) within sub-500ms SLAs.

-   FHIR Genomics Operations: Implementing HL7 FHIR Genomics Reporting
    IG v4.0 requires mastery of MolecularSequence, Observation, and
    Diagnostic Report resource profiles.

-   Zero Hallucination Requirement: Medical-grade LLM deployment must
    guarantee deterministic risk outputs (Safe/Toxic/Adjust
    Dosage/Ineffective) --- RAG architecture with citation constraints
    is mandatory.

-   ABDM Integration: India\'s decentralized health architecture
    requires dual-role compliance as both HIP (Health Information
    Provider) and HIU (Health Information User) with consent manager
    handshake flows.

-   Multi-tenant EHR Isolation: HIPAA and DPDP Act require strict tenant
    data isolation, zero cross-contamination of genomic profiles, and
    cryptographic audit trails for every prescribing event.

**2. SOLUTION ARCHITECTURE (DETAILED)**

**2.1 High-Level Architecture --- Seven-Layer Model**

  -----------------------------------------------------------------------
  *ARCHITECTURE OVERVIEW: PharmaGuard-AI is a cloud-native,
  microservices-based SaaS platform organized into 7 distinct layers.
  Each layer is independently deployable, horizontally scalable, and
  communicates via well-defined contracts (FHIR R4 + REST/gRPC). The
  system achieves sub-500ms P99 intercept latency across all clinical
  prescription workflows.*

  -----------------------------------------------------------------------

  --------------------------------------------------------------------------------
  **Layer**   **Name**       **Primary               **Key Technologies**
                             Responsibility**        
  ----------- -------------- ----------------------- -----------------------------
  L1          Data Ingestion Accepts VCF files from  Node.js, Apache Kafka, AWS
              Layer          labs, FHIR bundles, HL7 S3, ABDM FHIR Gateway
                             v2 ADT feeds, ABDM HIU  
                             calls                   

  L2          Genomic        VCF parsing, variant    Python FastAPI, PyVCF, Hail,
              Processing     calling, diplotype      Biopython, Celery Workers
              Layer          matching, phenotype     
                             classification          

  L3          FHIR Archival  Translates raw genomic  HAPI FHIR Server (Java),
              Layer          data to HL7 FHIR        PostgreSQL, FHIR Genomics
                             Genomics Reporting IG   Operations API
                             profiles, stores        
                             structured genomic      
                             profiles in GACS        

  L4          Clinical       Deterministic CPIC rule Python FastAPI, SQLite (MVP)
              Decision       evaluation, drug-gene   / PostgreSQL (Prod), PharmGKB
              Engine         interaction lookup,     dataset
                             risk scoring            

  L5          AI Explanation RAG-based LLM generates Pinecone/Milvus, Llama-3-8B
              Layer          clinician-readable      (fine-tuned), LangChain, RAG
                             explanations with       pipeline
                             variant citations       

  L6          Integration    CDS Hooks server, SMART Node.js Express, CDS Hooks
              Layer          on FHIR app launcher,   2.0, SMART on FHIR 2.0,
                             HL7 v2 bridge, ABDM     Rhapsody
                             consent flows           

  L7          Presentation   Admin dashboards,       React.js + Next.js,
              Layer          analytics, pharmacy     TailwindCSS, Recharts, SMART
                             director portal,        on FHIR embedded UI
                             patient-facing reports  
  --------------------------------------------------------------------------------

**2.2 Complete Data Flow**

1.  Lab technician uploads patient VCF file (Variant Call Format v4.2,
    ≤5MB MVP / ≤500MB enterprise) via secure lab portal or automated
    SFTP push.

2.  L1 Ingestion Service (Node.js) receives file, validates format,
    publishes message to Apache Kafka topic: raw-vcf-ingested with
    metadata (patient_id, lab_id, timestamp, ABHA_ID).

3.  L2 Genomic Processing Worker (Python Celery) consumes Kafka message,
    streams VCF, extracts variants at 6 pharmacogenes (CYP2D6, CYP2C19,
    CYP2C9, SLCO1B1, TPMT, DPYD), computes star allele diplotypes,
    classifies phenotype (PM/IM/NM/RM/URM).

4.  L3 FHIR Archival Service translates computed phenotypes to FHIR
    MolecularSequence + Observation + DiagnosticReport resources. Stores
    in HAPI FHIR Server (PostgreSQL backend). Raw VCF archived to
    AES-256 encrypted S3 bucket.

5.  L6 CDS Hooks Server registers subscription webhook against hospital
    EHR. When physician triggers order-select or medication-prescribe
    event, EHR fires CDS Hooks JSON payload to PharmaGuard API endpoint.

6.  L4 Decision Engine receives drug + patient_id. Queries FHIR server
    for patient\'s genomic Observation resources. Cross-references
    against CPIC guidelines database. Returns deterministic risk JSON
    (Safe / Adjust Dosage / Toxic / Ineffective).

7.  L5 AI Layer receives risk JSON + variant details. RAG pipeline
    performs semantic search across Pinecone vector DB (embeddings of
    15,000+ CPIC/PharmGKB guidelines + FDA drug labels). LLM generates
    plain-language clinical explanation with cited variants.

8.  L6 Integration Layer returns CDS Hooks response card with risk
    label, color code, recommendation, and LLM explanation directly into
    physician\'s EHR workflow. Zero context switch required.

9.  Apache Kafka logs entire event chain to immutable audit log.
    Feedback captured when physician accepts, modifies, or overrides
    recommendation --- stored for ML feedback loop.

**2.3 API Interaction Flow --- CDS Hooks Sequence**

> EHR (Epic/Cerner) \--\> \[POST /cds-services/pharma-check\] \--\>
> PharmaGuard API Gateway
>
> API Gateway \--\> \[Auth: OAuth 2.0 + SMART on FHIR token validation\]
> \--\> Rate Limiter
>
> Rate Limiter \--\> \[Kafka Publish: prescription-event\] \--\> CDS
> Engine (L4)
>
> CDS Engine \--\> \[FHIR Query: GET /Patient/{id}/genomics\] \--\> HAPI
> FHIR Server (L3)
>
> HAPI FHIR Server \--\> \[Returns: FHIR Bundle\<Observation,
> MolecularSequence\>\]
>
> CDS Engine \--\> \[CPIC Lookup: drug x phenotype\] \--\> PostgreSQL
> Rules DB
>
> CDS Engine \--\> \[Risk JSON\] \--\> RAG LLM Service (L5)
>
> RAG LLM Service \--\> \[Pinecone:
> semantic_search(drug+variant+phenotype)\] \--\> Vector DB
>
> RAG LLM Service \--\> \[Llama-3 Inference\] \--\> Clinical Explanation
> Text
>
> API Gateway \--\> \[CDS Hooks Card Response: \<500ms P99\] \--\> EHR

**2.4 Authentication & Authorization Model**

  -----------------------------------------------------------------------
  **Actor**         **Auth Mechanism**      **Scope / Permissions**
  ----------------- ----------------------- -----------------------------
  Hospital EHR      SMART on FHIR 2.0       read:genomics,
  System            (OAuth 2.0 backend      cds:prescriptions,
                    service launch)         write:audit

  Clinical          SMART on FHIR           read:patient-profile,
  Pharmacist        (standalone app launch  read:alerts, write:overrides
                    via EHR)                

  Lab System        API Key + mTLS          write:vcf-upload,
                    certificate pinning     read:processing-status

  Admin / CMIO      SSO via SAML 2.0        admin:config, read:analytics,
                    (Okta/Azure AD)         manage:formulary

  ABDM Gateway      ABDM HIU consent        read:health-records,
  (India)           token + ABHA ID binding consent:patient-genomics

  Pharmacy Director JWT + RBAC roles        read:dashboards,
                                            read:population-analytics
  -----------------------------------------------------------------------

**2.5 Role-Based Access Control (RBAC) Matrix**

  ---------------------------------------------------------------------------------------------
  **Role**          **VCF      **View     **Override   **View        **Configure   **Export
                    Upload**   Alerts**   Alert**      Analytics**   Rules**       Data**
  ----------------- ---------- ---------- ------------ ------------- ------------- ------------
  System Admin      Yes        Yes        Yes          Yes           Yes           Yes

  CMIO              No         Yes        No           Yes           Yes           No

  Prescribing       No         Yes        Yes          No            No            No
  Physician                                                                        

  Clinical          No         Yes        No           Partial       No            No
  Pharmacist                                                                       

  Lab Technician    Yes        No         No           No            No            No

  Pharmacy Director No         Yes        No           Yes           Partial       Yes

  Insurance/TPA     No         No         No           Aggregate     No            Anonymized
  Analyst                                              only                        only
  ---------------------------------------------------------------------------------------------

**3. TECH STACK JUSTIFICATION**

**3.1 Frontend**

  --------------------------------------------------------------------------
  **Tool**      **Why Chosen**      **Alternatives**   **Trade-offs**
  ------------- ------------------- ------------------ ---------------------
  React.js +    Server-side         Angular (too       Next.js adds
  Next.js 14    rendering critical  opinionated),      complexity vs pure
                for dashboard SEO   Vue.js (smaller    React; SSR debugging
                and initial load;   healthcare         is harder
                App Router enables  component          
                streaming; large    ecosystem)         
                ecosystem for                          
                healthcare UI                          

  TailwindCSS   Utility-first; no   Material UI        Learning curve; HTML
                runtime CSS;        (heavier bundle),  becomes verbose; not
                consistent design   Chakra UI          ideal for complex
                tokens across SMART                    animation
                on FHIR embedded UI                    
                and standalone                         
                portal                                 

  Recharts +    Recharts for 80% of Chart.js (less     D3.js has steep
  D3.js         dashboard charts    customizable),     learning curve; heavy
                (ADR trends, risk   Highcharts         bundle if not
                heatmaps); D3.js    (licensing cost)   tree-shaken
                for custom genomic                     
                visualization                          
                (Manhattan plots)                      

  SMART on FHIR Required for        Custom OAuth       Tightly couples
  SDK           EHR-embedded app    implementation     frontend launch to
                launch; handles     (risky,            FHIR launch URLs;
                OAuth 2.0 PKCE flow non-standard)      debugging SMART flows
                natively;                              in dev requires EHR
                Epic/Cerner                            sandbox
                certified                              
  --------------------------------------------------------------------------

**3.2 Backend**

  --------------------------------------------------------------------------------
  **Tool**            **Why Chosen**      **Alternatives**   **Trade-offs**
  ------------------- ------------------- ------------------ ---------------------
  Node.js             High-concurrency    Go (better raw     Single-threaded;
  (Express/Fastify)   I/O for API         perf but smaller   CPU-bound tasks must
                      gateway, CDS Hooks  healthcare         be offloaded to
                      webhook server,     ecosystem); Java   Python workers via
                      Kafka producers;    Spring (heavier)   Kafka
                      non-blocking I/O                       
                      ideal for EHR event                    
                      streaming                              

  Python (FastAPI)    Native              Flask (no async),  Python GIL limits
                      bioinformatics      Django (too heavy  true multi-threading;
                      ecosystem (PyVCF,   for microservices) must use
                      Hail, Biopython);                      multiprocessing for
                      async support;                         CPU-bound VCF parsing
                      pydantic                               
                      validation;                            
                      mandatory for                          
                      ML/genomics                            
                      workloads                              

  HAPI FHIR Server    Gold standard       Azure FHIR Service Java JVM overhead;
  (Java)              open-source FHIR R4 (vendor lock-in),  requires dedicated
                      server; CPIC and    AWS HealthLake     pod with ≥4GB RAM;
                      NCPI certified;     (expensive)        complex FHIR resource
                      supports FHIR                          configuration
                      Genomics Operations                    
                      natively;                              
                      production-proven                      
                      at Mayo Clinic                         

  Apache Kafka        Persistent,         RabbitMQ (no       Operational
                      replayable event    replay, not        complexity; requires
                      log for all         durable by         ZooKeeper/KRaft;
                      prescription        default), AWS SQS  over-engineered for
                      events; guarantees  (vendor lock-in)   \<100 events/sec (use
                      exactly-once                           Redis Streams for
                      delivery for audit                     MVP)
                      compliance; enables                    
                      event sourcing for                     
                      ML feedback loop                       
  --------------------------------------------------------------------------------

**3.3 Database**

  -------------------------------------------------------------------------
  **Tool**       **Use Case**  **Why Chosen**           **Alternative**
  -------------- ------------- ------------------------ -------------------
  PostgreSQL 16  User auth,    ACID compliant; jsonb    MySQL (weaker JSON
                 CPIC rules,   for semi-structured FHIR support, no
                 billing,      snippets; row-level      row-level security)
                 audit logs,   security for             
                 formulary     multi-tenancy; pgAudit   
                 config        for HIPAA audit trails   

  Amazon S3 (or  Raw VCF file  Infinite scale; S3       Azure Blob (vendor
  MinIO on-prem) storage,      Object Lock for WORM     lock-in); local
                 encrypted     compliance (HIPAA);      disk (not scalable)
                 genomic       presigned URLs for       
                 archives      secure lab uploads;      
                               lifecycle policies for   
                               tiered archival          

  Pinecone (or   Vector        Pinecone: fully managed, pgvector (limited
  Milvus         embeddings    sub-10ms query latency;  to 2000 dims,
  self-hosted)   for RAG       Milvus: open-source,     slower at scale);
                 pipeline ---  self-hosted, GDPR        Weaviate (less
                 CPIC          compliant for Indian/EU  mature)
                 guidelines,   markets                  
                 FDA labels,                            
                 PubMed                                 
                 abstracts                              

  Redis 7        Session       Sub-millisecond latency; Memcached (no
  (Cluster Mode) caching, rate Redis Cluster for HA;    persistence, no
                 limiting      built-in TTL; pub/sub    data structures)
                 counters, CDS for real-time alert      
                 Hooks         notifications            
                 response                               
                 caching                                
                 (15-min TTL),                          
                 JWT blacklist                          

  SQLite (MVP    Local CPIC    Zero-ops, embedded,      MUST replace with
  only)          gene-drug     instant setup for demo;  PostgreSQL before
                 interaction   10 gene-drug pairs       any production
                 rules         hardcoded                workload
                 database for                           
                 hackathon                              
                 prototype                              
  -------------------------------------------------------------------------

**3.4 AI / ML Components**

  ------------------------------------------------------------------------------------
  **Component**   **Technology**           **Justification**          **Risk
                                                                      Mitigation**
  --------------- ------------------------ -------------------------- ----------------
  Deterministic   Python decision trees +  Zero hallucination;        Mandatory
  Rule Engine     PostgreSQL CPIC rules    CPIC-aligned; fully        primary risk
                  table                    auditable; required for    scorer --- LLM
                                           FDA SaMD Non-Device CDS    never overrides
                                           classification             this layer

  RAG Pipeline    LangChain + Pinecone +   Constrains LLM to only     Retrieval must
                  FAISS (local fallback)   synthesize from retrieved, score \>0.85
                                           peer-reviewed guidelines.  cosine
                                           Eliminates hallucinated    similarity
                                           dosing advice              before LLM
                                                                      generates text;
                                                                      fallback returns
                                                                      cached CPIC
                                                                      summary

  LLM for         Llama-3-8B (quantized,   Llama-3-8B: open-source,   PHI stripped
  Explanations    4-bit GGUF) or Med-PaLM  self-hostable,             before LLM
                  2 via Vertex AI          HIPAA-compliant (no PHI    inference; LLM
                                           sent to third party);      output flagged
                                           Med-PaLM 2: highest        as
                                           clinical accuracy but      \'AI-generated
                                           requires Vertex AI BAA     clinical summary
                                                                      --- verify with
                                                                      pharmacist\'

  Embedding Model BioBERT / PubMedBERT     Domain-specific biomedical Embeddings
                  (sentence-transformers   embeddings outperform      retrained
                  fine-tuned)              general embeddings         quarterly as
                                           (OpenAI) for               CPIC guidelines
                                           pharmacogenomics retrieval are updated
                                           tasks by \~28% on          
                                           recall@10                  

  Feedback Loop / Custom RLHF pipeline     Reward signal: physician   Human pharmacist
  RLHF            using physician          acceptance rate + 30-day   reviews all
                  accept/override signals  readmission correlation.   low-confidence
                  logged via Kafka         Builds proprietary dataset (\< 0.7 score)
                                           moat over time             LLM outputs
                                                                      weekly
  ------------------------------------------------------------------------------------

**3.5 DevOps, Cloud & Infrastructure**

  --------------------------------------------------------------------------------
  **Tool**          **Role**         **Why Chosen**           **Alternative**
  ----------------- ---------------- ------------------------ --------------------
  AWS (Primary) /   Cloud            AWS: HealthLake, EKS,    Azure (viable but
  GCP (DR)          infrastructure   Bedrock, HIPAA BAA       complex FHIR
                                     available; GCP: Vertex   pricing)
                                     AI, GKE for ML workloads 

  Kubernetes        Container        Auto-scaling, pod        Docker Swarm (less
  (EKS/GKE)         orchestration    isolation per tenant,    mature), Nomad (less
                                     health checks, rolling   ecosystem)
                                     deployments without      
                                     downtime                 

  Terraform + Helm  Infrastructure   Terraform: cloud infra   Pulumi (smaller
                    as Code          provisioning; Helm:      ecosystem), CDK
                                     Kubernetes chart         (AWS-only)
                                     management. GitOps-ready 

  GitHub Actions    CI/CD pipelines  Native to GitHub; free   GitLab CI
                                     for open-source; OIDC    (self-hosted
                                     auth to AWS/GCP;         option), Jenkins
                                     parallel matrix testing  (operational burden)

  Prometheus +      Metrics &        Open-source;             Datadog (expensive
  Grafana           alerting         Kubernetes-native via    at scale:
                                     kube-prometheus-stack;   \~\$15/host/month)
                                     pre-built dashboards for 
                                     healthcare SLAs          

  OpenTelemetry +   Distributed      Vendor-neutral trace     AWS X-Ray (vendor
  Jaeger            tracing          propagation across all   lock-in)
                                     microservices; critical  
                                     for debugging sub-500ms  
                                     SLA violations           
  --------------------------------------------------------------------------------

**4. DATABASE DESIGN**

**4.1 Core Entity Relationship Design**

  -----------------------------------------------------------------------
  *PostgreSQL multi-tenant schema with row-level security (RLS). Each row
  in patient/genomic tables contains tenant_id. RLS policies enforce that
  queries from tenant A can never access tenant B\'s rows --- enforced at
  DB engine level, not application level.*

  -----------------------------------------------------------------------

**Core Tables**

  ----------------------------------------------------------------------------------------
  **Table**             **Primary Key**  **Key Columns**             **Relationships**
  --------------------- ---------------- --------------------------- ---------------------
  tenants               tenant_id (UUID) name, domain,               Parent of all
                                         fhir_base_url, abdm_hfr_id, hospital-scoped data
                                         subscription_tier,          
                                         created_at                  

  patients              patient_id       tenant_id, abha_id          FK to tenants; FK to
                        (UUID)           (indexed), mrn,             genomic_profiles
                                         demographics_encrypted      
                                         (AES-256), created_at       

  genomic_profiles      profile_id       patient_id, tenant_id,      FK to patients;
                        (UUID)           vcf_s3_key,                 references S3 objects
                                         processing_status,          
                                         fhir_observation_ids        
                                         (jsonb), created_at,        
                                         expires_at                  

  phenotypes            phenotype_id     profile_id, gene_symbol,    FK to
                        (UUID)           diplotype, phenotype_class  genomic_profiles
                                         (PM/IM/NM/RM/URM),          
                                         confidence_score,           
                                         cpic_version                

  prescription_events   event_id (UUID)  tenant_id, patient_id,      FK to patients,
                                         drug_name, triggered_at,    tenants; indexed on
                                         risk_label,                 triggered_at
                                         physician_action            
                                         (accept/override/modify),   
                                         latency_ms,                 
                                         cds_hook_trigger            

  drug_gene_rules       rule_id (UUID)   drug_name, gene_symbol,     Replicated from CPIC;
                                         phenotype_class,            never modified
                                         risk_label,                 directly
                                         cpic_recommendation,        
                                         cpic_guideline_version,     
                                         last_updated                

  llm_explanations      explanation_id   event_id, model_version,    FK to
                        (UUID)           retrieved_chunk_ids (jsonb  prescription_events
                                         array), explanation_text,   
                                         generation_latency_ms,      
                                         physician_rating (1-5)      

  audit_logs            log_id (UUID)    tenant_id, actor_id,        Append-only; pgAudit
                                         actor_role, action,         triggers; partitioned
                                         resource_type, resource_id, by month
                                         ip_address, timestamp       

  users                 user_id (UUID)   tenant_id, email, role,     FK to tenants; RBAC
                                         hashed_password (bcrypt),   roles
                                         mfa_enabled, last_login,    
                                         is_active                   

  subscriptions         sub_id (UUID)    tenant_id, tier             FK to tenants;
                                         (enterprise/pppm/api), mrr, billing integration
                                         contract_start,             
                                         contract_end, api_key_hash  
  ----------------------------------------------------------------------------------------

**4.2 Indexing Strategy**

-   patients.abha_id --- B-tree index (unique); critical for ABDM-based
    patient lookups

-   patients.mrn + tenant_id --- Composite B-tree index (unique per
    tenant) for EHR cross-reference

-   prescription_events.triggered_at --- BRIN index (time-series
    partition alignment); covers analytics dashboard queries

-   prescription_events.(tenant_id, drug_name, risk_label) --- Composite
    index for aggregate reporting

-   phenotypes.(gene_symbol, phenotype_class) --- Covering index for
    CPIC rule engine lookups

-   drug_gene_rules.(drug_name, gene_symbol, phenotype_class) ---
    Composite primary lookup index

-   audit_logs.timestamp --- Partition key (monthly range partition);
    B-tree within partition

**4.3 Scaling Strategy**

  ----------------------------------------------------------------------------
  **Strategy**     **Tool**              **When Applied**  **Expected Impact**
  ---------------- --------------------- ----------------- -------------------
  Read Replicas    PostgreSQL streaming  From Day 1 in     \~3x read
                   replication (1        production; read  throughput; primary
                   primary + 2 read      replica for       protected from
                   replicas)             dashboard         analytics load
                                         analytics         

  Horizontal       Citus (PostgreSQL     When single-node  Linear scaling
  Partitioning     extension) --- shard  PostgreSQL        across shard nodes;
  (Sharding)       key: tenant_id        exceeds 500GB or  tenant data
                                         1,000 TPS         locality maintained

  Time-Series      PostgreSQL            From initial      Query planner
  Partitioning     declarative           schema creation   prunes irrelevant
                   partitioning on                         partitions; archive
                   audit_logs and                          old partitions to
                   prescription_events                     S3 via pg_partman
                   by month                                

  Connection       PgBouncer             From production   Reduces PostgreSQL
  Pooling          (transaction mode,    launch            connection
                   max 1,000                               overhead; handles
                   connections)                            connection spikes
                                                           from K8s pod
                                                           scaling

  FHIR Data Tier   HAPI FHIR Server +    From production   Prevents FHIR
                   dedicated PostgreSQL  launch            storage (large
                   cluster (separate                       JSONB blobs) from
                   from app DB)                            competing with OLTP
                                                           queries on app DB
  ----------------------------------------------------------------------------

**4.4 Data Lifecycle Policy**

-   Active Genomic Profiles: Retained in FHIR Server (hot storage) for 7
    years (HIPAA minimum for adult patients).

-   Raw VCF Files (S3): S3 Object Lock (WORM) for 7 years; transition to
    S3 Glacier after 1 year; auto-delete at 7 years unless renewed
    consent.

-   Prescription Events: Hot tier (PostgreSQL) for 2 years; archived to
    S3 Parquet (Athena-queryable) after 2 years; retained for 10 years
    total.

-   Audit Logs: Append-only, immutable, retained permanently for
    medico-legal compliance. Monthly partitions archived to S3
    Intelligent-Tiering.

-   LLM Explanation Cache: Redis TTL = 15 minutes (CDS Hooks requirement
    for freshness); PostgreSQL permanent record for audit trail.

**5. API DESIGN**

**5.1 API Architecture**

**Style:** RESTful JSON API (primary) + CDS Hooks 2.0 (prescribing
intercept) + FHIR R4 Genomics Operations (data access)

**Versioning:** URI-based: /api/v1/, /api/v2/ --- never deprecate
without 12-month sunset notice + deprecation headers

**Auth:** Bearer JWT (OAuth 2.0) for all endpoints; SMART on FHIR token
for EHR-launched contexts

**Content-Type:** application/json (REST); application/fhir+json (FHIR
operations)

**Rate Limiting:** Nginx Ingress + custom Redis-based rate limiter: 100
req/min per API key (standard); 1,000 req/min (enterprise tier)

**5.2 Core Endpoint Reference**

**Genomic Ingestion APIs**

> POST /api/v1/genomics/upload

Upload VCF file for processing. Multipart form data. Returns job_id for
polling. Triggers Kafka event.

> Request: { \"patient_id\": \"uuid\", \"lab_id\": \"uuid\",
> \"abha_id\": \"12-digit\" } + file: vcf_file
>
> Response 202: { \"job_id\": \"uuid\", \"status\": \"queued\",
> \"estimated_completion_ms\": 8000 }
>
> GET /api/v1/genomics/jobs/{job_id}

Poll processing status. Returns phenotype results when complete.

> Response 200: { \"status\": \"complete\", \"phenotypes\": \[{
> \"gene\": \"CYP2D6\", \"diplotype\": \"\*1/\*4\", \"phenotype\":
> \"IM\", \"confidence\": 0.97 }\] }

**CDS Hooks Intercept APIs**

> GET /cds-services

Returns list of available CDS services for EHR discovery (required by
CDS Hooks 2.0 spec).

> POST /cds-services/pharma-check

Primary intercept endpoint. Called by EHR on every medication-prescribe
event. Must respond in \<500ms P99.

> Request (CDS Hooks Payload):
>
> { \"hook\": \"medication-prescribe\", \"hookInstance\": \"uuid\",
> \"context\": { \"patientId\": \"EHR-patient-id\", \"medications\": \[{
> \"coding\": \[{ \"system\":
> \"http://www.nlm.nih.gov/research/umls/rxnorm\", \"code\":
> \"1049502\", \"display\": \"Clopidogrel 75mg\" }\] }\] },
> \"prefetch\": { \"patient\": \"FHIR Patient resource\" } }
>
> Response (CDS Hooks Cards):
>
> { \"cards\": \[{ \"summary\": \"HIGH RISK: Clopidogrel --- CYP2C19
> Poor Metabolizer\", \"indicator\": \"critical\", \"detail\": \"Patient
> has CYP2C19 \*2/\*3 diplotype (Poor Metabolizer). Clopidogrel will not
> be adequately activated. Risk: cardiovascular thrombosis. CPIC
> recommends Prasugrel or Ticagrelor.\", \"source\": { \"label\":
> \"PharmaGuard-AI v2\", \"url\": \"https://cpicpgx.org/guidelines/\" },
> \"suggestions\": \[{ \"label\": \"Switch to Prasugrel 10mg\",
> \"actions\": \[{ \"type\": \"update\", \"description\": \"Replace
> Clopidogrel with Prasugrel\" }\] }\] }\] }

**Clinical Decision APIs**

> POST /api/v1/decisions/check

Direct API endpoint for non-CDS-Hooks integrations (telehealth
platforms, pharmacy apps). Accepts drug + patient_id.

> Request: { \"patient_id\": \"uuid\", \"drugs\": \[\"CODEINE\",
> \"WARFARIN\"\], \"tenant_id\": \"uuid\" }
>
> Response: { \"patient_id\": \"uuid\", \"assessments\": \[{ \"drug\":
> \"CODEINE\", \"risk_label\": \"Toxic\", \"severity\": \"critical\",
> \"primary_gene\": \"CYP2D6\", \"diplotype\": \"\*1/\*1xN\",
> \"phenotype\": \"URM\", \"recommendation\": \"Avoid Codeine. Use
> non-opioid alternative.\", \"cpic_guideline\":
> \"https://cpicpgx.org/guidelines/cpic-guideline-codeine/\",
> \"confidence\": 0.99, \"llm_explanation\": \"Patient has multiple
> CYP2D6 gene copies (ultra-rapid metabolizer)\...\" }\] }

**Analytics APIs**

> GET /api/v1/analytics/adr-reduction?tenant_id=&from=&to=
>
> GET /api/v1/analytics/alert-override-rate?tenant_id=&drug=
>
> GET /api/v1/analytics/population-phenotypes?tenant_id=&gene=

**5.3 Rate Limiting Strategy**

  -----------------------------------------------------------------------------
  **Tier**          **Limit**     **Window**   **Burst       **Enforcement**
                                               Allowance**   
  ----------------- ------------- ------------ ------------- ------------------
  Free / Trial      10 req/min    60 seconds   None          Redis token
                                                             bucket; 429 with
                                                             Retry-After header

  PPPM (Mid-Market) 500 req/min   60 seconds   2x for 10     Redis sliding
                                               seconds       window per API key

  Enterprise SaaS   2,000 req/min 60 seconds   5x for 30     Dedicated rate
                                               seconds       limit key per
                                                             facility

  CDS Hooks         Unlimited\*   ---          ---           \*Subject to
  Endpoint                                                   circuit breaker:
                                                             auto-disable if
                                                             \>5,000 req/sec
                                                             from single tenant
                                                             (DDoS protection)
  -----------------------------------------------------------------------------

**6. SECURITY ARCHITECTURE**

  -----------------------------------------------------------------------
  *Security posture: Zero-Trust Architecture. No service is trusted by
  default --- all inter-service communication is authenticated, all data
  is encrypted, and all access is logged. Designed for HIPAA, GDPR, and
  India\'s Digital Personal Data Protection (DPDP) Act 2023 compliance.*

  -----------------------------------------------------------------------

**6.1 Authentication & Encryption**

  ----------------------------------------------------------------------------------
  **Layer**            **Mechanism**    **Standard**     **Implementation**
  -------------------- ---------------- ---------------- ---------------------------
  User Authentication  OAuth 2.0 +      SMART on FHIR    Auth0 or Keycloak
                       PKCE + TOTP MFA  2.0; RFC 6749    (self-hosted); JWT signed
                                                         with RS256; 15-min access
                                                         token TTL; 7-day refresh
                                                         token

  Service-to-Service   mTLS certificate RFC 5246 / TLS   Istio service mesh (mTLS
                       pinning          1.3              auto-injection);
                                                         certificate rotation every
                                                         90 days via cert-manager

  Data at Rest --- App AES-256-GCM      NIST SP 800-57   PostgreSQL pgcrypto;
  DB                   column                            encryption keys managed by
                       encryption for                    AWS KMS or HashiCorp Vault
                       PII fields                        

  Data at Rest ---     AES-256 + S3     HIPAA            AWS KMS CMK per tenant; S3
  Genomic VCFs         SSE-KMS          §164.312(a)(2)   Object Lock; CloudTrail
                                                         logging of all access

  Data in Transit      TLS 1.3          OWASP TLS Cheat  Nginx Ingress with TLS
                       everywhere       Sheet            termination; no HTTP
                                                         downgrade; HSTS headers;
                                                         certificate transparency

  Secrets Management   HashiCorp Vault  OWASP Secret     K8s pods inject secrets via
                       (or AWS Secrets  Management       Vault Agent Injector; no
                       Manager)                          secrets in environment
                                                         variables or config maps
  ----------------------------------------------------------------------------------

**6.2 OWASP Threat Model**

  -----------------------------------------------------------------------
  **Threat (OWASP      **Specific Attack **Mitigation**
  Category)**          Vector**          
  -------------------- ----------------- --------------------------------
  A01 --- Broken       Physician queries PostgreSQL row-level security;
  Access Control       genomic profile   tenant_id enforced at DB engine;
                       of patient from   API layer also validates tenant
                       another tenant    scope in JWT

  A02 ---              Raw VCF file      S3 bucket: private, no public
  Cryptographic        exposed in S3     ACL; SSE-KMS mandatory; S3 Block
  Failures             bucket without    Public Access enforced;
                       encryption        CloudTrail alerts on any
                                         GetObject from non-whitelisted
                                         IAM role

  A03 --- Injection    Malicious VCF     PyVCF strict schema validation
                       file with SQL     before DB insertion; all queries
                       injection in      use parameterized statements
                       sample metadata   (SQLAlchemy ORM); no raw SQL
                       fields            string concat

  A04 --- Insecure     LLM generates     Deterministic rule engine is
  Design               fabricated CPIC   sole source of risk_label; LLM
                       guideline         is restricted via RAG to only
                       reference in      generate text from retrieved
                       clinical          documents (no generation without
                       recommendation    retrieval); physician sees
                                         \'AI-Assisted Summary\'
                                         disclaimer

  A05 --- Security     Kubernetes pod    Non-root containers enforced via
  Misconfiguration     runs as root;     PodSecurityAdmission; Principle
                       default service   of Least Privilege on all K8s
                       account has       ServiceAccounts; Falco runtime
                       excessive         threat detection
                       permissions       

  A06 --- Vulnerable   HAPI FHIR Server  Dependabot + Snyk in CI
  Components           runs outdated     pipeline; automated PR for
                       Java version with dependency updates; SBOM
                       known CVE         (Software Bill of Materials)
                                         generated on every release

  A07 --- Auth         JWT token stolen  IP binding in JWT claims
  Failures             from physician\'s (optional per tenant policy);
                       browser, used     anomalous login detection via
                       from attacker IP  Sift/Persona; device
                                         fingerprinting for MFA bypass
                                         detection

  A09 --- Logging      CDS Hooks         Kafka mandatory intermediary ---
  Failures             override event    every CDS event logged before
                       not captured,     response returned; Kafka
                       preventing audit  retention 30 days; Elasticsearch
                       trail             long-term archive
  -----------------------------------------------------------------------

**6.3 DDoS & Input Validation**

-   DDoS Protection: AWS Shield Standard (free) + AWS WAF for all public
    endpoints; Rate limiting at Nginx Ingress level; Cloudflare
    (optional CDN layer) for L3/L4 protection.

-   VCF File Validation: Magic byte verification (VCF header must start
    with ##fileformat=VCFv4.x); file size hard cap enforced at Nginx
    (reject \>500MB); ClamAV virus scan on all uploads before S3 write;
    MIME type whitelist.

-   Input Sanitization: Drug names normalized to standard RxNorm codes
    before lookup; HTML/script injection prevented via express-validator
    and pydantic models; RSID format validation (rs\[0-9\]+ regex)
    before DB insert.

**7. SCALABILITY PLAN**

**7.1 Scaling Model**

  ------------------------------------------------------------------------
  **Service**     **Scaling    **Trigger        **Scale Configuration**
                  Type**       Metric**         
  --------------- ------------ ---------------- --------------------------
  Node.js API     Horizontal   CPU \> 70% or    Min: 3 pods; Max: 50 pods;
  Gateway         (HPA)        Request Queue \> 2 vCPU / 4GB RAM per pod
                               100              

  Python FastAPI  Horizontal   Celery queue     Min: 2 pods; Max: 30 pods;
  (VCF Parser)    (HPA)        depth \> 20 jobs 4 vCPU / 8GB RAM per pod
                                                (bioinformatics is
                                                CPU-heavy)

  HAPI FHIR       Vertical     Heap utilization Start: 1 pod (8GB); Scale
  Server          then         \> 80%           up to 32GB; then
                  Horizontal                    horizontal at 3+ pods
                                                behind NLB

  PostgreSQL      Read replica Read IOPS \>     Add read replicas via RDS
                  scaling      5,000 or replica Multi-AZ; promote to Citus
                               lag \> 1s        cluster at \>500GB

  Pinecone Vector Fully        Query latency    Upgrade index pod
  DB              managed /    P99 \> 50ms      configuration; Pinecone
                  auto-scale                    handles transparently

  Kafka           Partition    Consumer group   Add partitions to
                  scaling      lag \> 1,000     prescription-events topic;
                               messages         add Kafka broker nodes

  LLM Inference   GPU          Inference queue  vLLM serving on
  (Llama-3)       horizontal   \> 50 pending    g4dn.xlarge; min: 1 GPU;
                  scaling                       max: 10 GPUs; batching
                                                enabled
  ------------------------------------------------------------------------

**7.2 Multi-Region Strategy**

  ------------------------------------------------------------------------
  **Region**        **Cloud**    **Purpose**             **Compliance
                                                         Requirement**
  ----------------- ------------ ----------------------- -----------------
  ap-south-1        AWS Primary  India market; ABDM      DPDP Act 2023:
  (Mumbai)                       connectivity; primary   health data must
                                 data residency          reside within
                                                         India

  us-east-1 (N.     AWS          US market; HIPAA        HIPAA BAA with
  Virginia)         Secondary    primary region          AWS required

  eu-west-1         AWS DR       European market; GDPR   GDPR Art. 17
  (Ireland)                      compliance              right to erasure;
                                                         Standard
                                                         Contractual
                                                         Clauses

  GCP us-central1   GCP (ML      Vertex AI for Med-PaLM  GCP HIPAA BAA;
                    workloads)   2 inference; BigQuery   data processing
                                 for analytics           agreement
  ------------------------------------------------------------------------

Active-Active for API Gateway (Route 53 latency routing). Active-Passive
for FHIR Server + PostgreSQL (primary in patient\'s home region;
replicated to DR region with \<5 minute RPO). Cross-region replication
of S3 VCF archives for HIPAA business continuity requirement.

**7.3 Performance Optimization Targets**

  -------------------------------------------------------------------------
  **Metric**        **MVP       **Production   **Optimization Method**
                    Target**    Target**       
  ----------------- ----------- -------------- ----------------------------
  CDS Hooks P99     \<2,000ms   \<500ms        Redis caching of recent
  Latency                                      phenotype lookups (15-min
                                               TTL); pre-computed CPIC rule
                                               cache; async LLM
                                               (explanation delivered as
                                               follow-up card)

  VCF Processing    \<60        \<30 seconds   Celery parallel processing;
  Time              seconds     (50MB file)    PyVCF streaming parser; S3
                    (5MB file)                 Transfer Acceleration

  API Gateway       100 req/sec 10,000 req/sec Node.js cluster mode; nginx
  Throughput                                   upstream keepalive;
                                               connection pooling via
                                               PgBouncer

  Dashboard Load    \<3 seconds \<1.2 seconds  Next.js ISR (Incremental
  Time (FCP)                                   Static Regeneration) for
                                               analytics pages; CloudFront
                                               CDN; image optimization

  FHIR Query        \<500ms     \<100ms        HAPI FHIR search parameter
  Latency                                      indexing; PostgreSQL query
                                               plan caching; FHIR resource
                                               pre-fetching
  -------------------------------------------------------------------------

**8. CI/CD & DEVOPS PIPELINE**

**8.1 Git Branching Strategy --- GitHub Flow (Modified)**

  ---------------------------------------------------------------------------------------
  **Branch**                       **Purpose**        **Protection     **Deploy Target**
                                                      Rules**          
  -------------------------------- ------------------ ---------------- ------------------
  main                             Production-ready   Require 2        Production
                                   code               approvals;       (blue-green
                                                      passing CI; no   deploy)
                                                      force push       

  develop                          Integration branch Require 1        Staging
                                   for features       approval;        environment
                                                      passing CI tests 

  feature/\[ticket-id\]-\[name\]   Individual feature No restrictions; PR preview
                                   development        must pass        environment
                                                      linting          (Vercel/Netlify)

  hotfix/\[ticket-id\]             Critical           Require 2        Production via
                                   production patches approvals;       emergency deploy
                                                      fast-tracked CI  pipeline

  release/v\[semver\]              Release candidates Require QA       UAT environment →
                                                      sign-off + 2     Production
                                                      approvals        
  ---------------------------------------------------------------------------------------

**8.2 GitHub Actions Pipeline**

> Trigger: PR to develop/main
>
> Stage 1 --- Code Quality (parallel):
>
> \- ESLint + Prettier (Node.js services)
>
> \- Black + Ruff + mypy (Python services)
>
> \- SonarCloud SAST scan (security static analysis)
>
> \- Snyk dependency vulnerability scan
>
> Stage 2 --- Unit Tests (parallel):
>
> \- Jest (Node.js) --- coverage threshold: 80%
>
> \- pytest (Python) --- coverage threshold: 85%
>
> \- FHIR conformance validation (HAPI validator CLI)
>
> Stage 3 --- Integration Tests:
>
> \- Docker Compose spins up full stack (postgres, redis, kafka,
> hapi-fhir)
>
> \- API contract tests (Pact.io consumer-driven contract testing)
>
> \- CDS Hooks integration test suite
>
> Stage 4 --- Build & Push:
>
> \- Docker multi-stage builds (minimal production images)
>
> \- Trivy container vulnerability scan (block on CRITICAL CVEs)
>
> \- Push to Amazon ECR with SHA-tagged images
>
> Stage 5 --- Deploy (main branch only):
>
> \- Helm upgrade to EKS (blue-green via Argo Rollouts)
>
> \- Automated smoke tests against production endpoints
>
> \- Slack/PagerDuty notification on success/failure

**8.3 Kubernetes Architecture**

  -----------------------------------------------------------------------------------------
  **Namespace**       **Services Deployed** **Resource Limits**       **Notes**
  ------------------- --------------------- ------------------------- ---------------------
  pharma-prod         api-gateway,          Defined per service;      Production workloads;
                      genomics-processor,   LimitRange enforced       RBAC restricted
                      fhir-server,                                    
                      cds-engine,                                     
                      ai-service                                      

  pharma-staging      All services (reduced 50% of prod limits        Integration testing;
                      replicas)                                       auto-reset nightly

  pharma-infra        Kafka, PostgreSQL     High memory; priority     Infrastructure
                      operator, Redis       class:                    services;
                      cluster, Vault agent  system-cluster-critical   PodDisruptionBudget
                                                                      enforced

  pharma-monitoring   Prometheus, Grafana,  Medium resources          Monitoring stack;
                      Jaeger, Alert Manager                           scrapes all
                                                                      namespaces

  pharma-ingress      Nginx Ingress         Low CPU/RAM               Entry point for all
                      Controller,                                     external traffic; WAF
                      Cert-Manager,                                   rules here
                      External-DNS                                    
  -----------------------------------------------------------------------------------------

**8.4 Rollback Strategy**

-   Zero-downtime deployments via Argo Rollouts Blue-Green strategy ---
    new version receives 0% traffic until smoke tests pass.

-   Canary promotion: 5% → 25% → 100% traffic over 30 minutes with
    automated Prometheus metric analysis (error rate \< 1%, P99 \<
    500ms).

-   Automated rollback: If canary analysis fails, Argo Rollouts
    automatically rolls back to previous stable version within 60
    seconds.

-   Database rollback: Flyway migration versioning; every migration has
    a corresponding undo script; tested in staging before production.

-   Incident rollback SLA: P1 incidents must be resolved or rolled back
    within 30 minutes (on-call via PagerDuty).

**9. TESTING STRATEGY**

  -------------------------------------------------------------------------------------
  **Test Layer**     **Tool**         **Coverage    **What It Tests**    **Run
                                      Target**                           Frequency**
  ------------------ ---------------- ------------- -------------------- --------------
  Unit Tests         Jest (Node.js) + 80--85% line  CPIC rule evaluation Every commit
                     pytest (Python)  coverage      logic, VCF parsing   (PR gate)
                                                    functions, FHIR      
                                                    resource             
                                                    serialization, risk  
                                                    label mapping        

  Integration Tests  Pytest +         All API       CDS Hooks full flow, Every PR merge
                     Pact.io +        contracts     FHIR query-response  to develop
                     Testcontainers                 cycle, Kafka message 
                                                    delivery, PostgreSQL 
                                                    RLS enforcement      

  End-to-End Tests   Playwright +     Critical user Full prescribing     Daily (staging
                     custom EHR       journeys      flow: VCF upload →   environment)
                     sandbox                        phenotype → CDS      
                                                    alert → physician    
                                                    override; ABDM       
                                                    consent flow         

  Load Tests         k6 (Grafana) +   10,000        CDS Hooks endpoint   Weekly +
                     Locust           concurrent    P99 under load; VCF  pre-release
                                      users         processing queue     
                                      simulated     saturation;          
                                                    PostgreSQL           
                                                    connection pool      
                                                    exhaustion           

  Security Tests     OWASP ZAP        Zero CRITICAL SQL injection, XSS,  Every PR
                     (DAST) + Snyk    findings to   broken access        (SAST) +
                     SAST + Trivy     ship          control, exposed     weekly (DAST)
                                                    secrets, vulnerable  
                                                    container images     

  Pharmacogenomics   Custom pytest    100% accuracy Validates phenotype  Every
  Accuracy           suite with 50    on known      classification       deployment
                     known VCF test   cases         against              
                     cases                          gold-standard CPIC   
                                                    test cases (CYP2D6   
                                                    poor metabolizer,    
                                                    etc.)                

  FHIR Conformance   HAPI FHIR        Zero          Validates all FHIR   Every
                     Validator CLI +  conformance   resources against    deployment
                     HL7 Touchstone   errors        Genomics Reporting   
                                                    IG v4.0 profiles     

  Chaos Engineering  Chaos Monkey +   N/A ---       Pod failure          Monthly in
                     Litmus (K8s)     recovery      injection, network   staging
                                      metric        partition, database  
                                                    failover; validates  
                                                    SLA during           
                                                    infrastructure       
                                                    failures             
  -------------------------------------------------------------------------------------

**9.1 Observability Setup**

-   Metrics: Prometheus scrapes all services every 15s. Grafana
    dashboards: CDS Hooks latency P50/P99, VCF processing throughput,
    alert acceptance rate, LLM confidence distribution, tenant-level
    usage.

-   Logs: Structured JSON logging (Winston for Node.js, structlog for
    Python). Aggregated to Elasticsearch (ELK stack). 30-day hot
    retention; 1-year cold retention on S3 via S3 sync.

-   Traces: OpenTelemetry SDK in all services. Trace context propagated
    via W3C Trace Context headers. Jaeger UI for trace visualization.
    All traces sampled at 100% in staging, 5% in production (tail-based
    sampling for errors: 100%).

-   Alerts: PagerDuty integration. P1 (CDS Hooks down): page on-call
    immediately. P2 (error rate \>5%): page within 5 minutes. P3
    (performance degradation): Slack notification.

-   Business KPI Dashboard: Grafana dashboard tracking
    ADR_prevention_rate, physician_acceptance_rate, avg_alert_latency,
    monthly_active_prescribers, revenue_MRR --- refreshed every 5
    minutes.

**10. COST ESTIMATION**

**10.1 MVP Monthly Infrastructure Cost (Hackathon → Early Pilot)**

  -------------------------------------------------------------------------------
  **Service**          **Config**       **Monthly Cost       **Notes**
                                        (USD)**              
  -------------------- ---------------- -------------------- --------------------
  AWS EKS Cluster      3-node           \$73                 Single AZ; shared
                       (t3.medium)                           cluster for all
                                                             services

  EC2 Nodes (3x        2 vCPU / 4GB RAM \$90                 MVP workloads;
  t3.medium)           each                                  auto-scale to
                                                             t3.large if needed

  RDS PostgreSQL       20GB SSD; single \$28                 No Multi-AZ in MVP;
  (db.t3.medium)       AZ                                    backup daily

  Amazon S3            50GB VCF         \$6                  S3 Standard;
                       storage +                             lifecycle to Glacier
                       transfer                              after 30 days

  ElastiCache Redis    512MB; single    \$13                 No cluster mode in
  (cache.t3.micro)     node                                  MVP

  Pinecone (Starter    1 index; 5M      \$70                 Sufficient for
  Plan)                vectors                               10,000 CPIC
                                                             guidelines
                                                             embeddings

  OpenAI API / Llama-3 \~500 API        \$50--\$200          Ollama self-hosted
  (Ollama on EC2)      calls/day or                          eliminates API cost
                       self-hosted                           but adds GPU
                       g4dn.xlarge                           instance cost

  Domain + SSL (AWS    Hosted zone +    \$1                  ACM certs are free
  Route 53 + ACM)      cert                                  

  Misc (data transfer, Estimated        \$20                 
  CloudWatch logs)                                           

  TOTAL MVP                             \$351--\$501/month   Scales linearly with
                                                             usage; well within
                                                             MVP budget
  -------------------------------------------------------------------------------

**10.2 Production Monthly Cost (10 Enterprise Hospitals, 50K+
Prescriptions/Day)**

  ------------------------------------------------------------------------
  **Service**                    **Config**              **Monthly Cost
                                                         (USD)**
  ------------------------------ ----------------------- -----------------
  EKS Cluster + EC2 (20x         8 vCPU / 16GB each;     \$2,800
  c5.2xlarge)                    Multi-AZ                

  RDS PostgreSQL Multi-AZ        500GB SSD; read         \$1,800
  (db.r6g.2xlarge)               replicas                

  S3 + S3 Glacier (5TB VCF       Lifecycle tiering       \$120
  archive)                                               

  ElastiCache Redis Cluster (6   r6g.large; 13GB each    \$600
  nodes)                                                 

  Pinecone (Standard Plan)       50M vectors; 4 replicas \$700

  GPU instances for LLM (2x      vLLM serving            \$1,100
  g4dn.xlarge)                                           

  Kafka (MSK 3-broker cluster)   kafka.m5.large          \$450

  HAPI FHIR Server (2x           Dedicated FHIR tier     \$560
  c5.4xlarge)                                            

  CloudFront CDN + WAF           500GB transfer; WAF     \$280
                                 rules                   

  DataDog / Grafana Cloud        Infrastructure + APM    \$400
  Monitoring                                             

  AWS KMS + Secrets Manager      Key management          \$60

  Total Infrastructure                                   \~\$8,870/month

  Revenue at 10 Hospitals                                \$83,333/month
  (\$100K ACV avg)                                       

  Gross Margin at this scale                             \~89% gross
                                                         margin
  ------------------------------------------------------------------------

**10.3 Cost Optimization Strategy**

-   Reserved Instances: Purchase 1-year reserved instances for baseline
    EC2/RDS workloads. Saves 30--40% vs on-demand.

-   Spot Instances: Use EC2 Spot for Celery VCF processing workers
    (fault-tolerant with Kafka retry). Saves \~70% on compute.

-   S3 Intelligent Tiering: Automatically moves infrequently accessed
    VCF files to cheaper storage tiers. Estimated 50% savings on
    storage.

-   LLM Self-Hosting: Replace OpenAI API (\$0.002/1K tokens) with
    self-hosted Llama-3-8B-GGUF (one-time GPU cost amortized).
    Break-even at \~50K LLM calls/month.

-   Pinecone -\> pgvector migration: At 10M+ vectors, migrate to
    pgvector extension on existing PostgreSQL instance. Eliminates
    \$700/month Pinecone cost.

**11. PRODUCT ROADMAP**

  ---------------------------------------------------------------------------------
  **Phase**    **Duration**   **Milestone**      **Key Deliverables**
  ------------ -------------- ------------------ ----------------------------------
  Phase 0 ---  48 hours (RIFT Functional         VCF parser (6 genes),
  Hackathon    2026)          proof-of-concept   deterministic risk engine, LLM
  MVP                                            explanation (OpenAI API), React UI
                                                 with color-coded alerts, JSON
                                                 output schema compliance, deployed
                                                 to Render/Vercel

  Phase 1 ---  Months 1--3    First paying pilot FHIR R4 integration (SMART on
  Pilot MVP                   hospital           FHIR), CDS Hooks server,
                                                 PostgreSQL production DB, full
                                                 CPIC coverage (26 gene-drug
                                                 pairs), HIPAA compliance baseline,
                                                 2 hospital pilots signed (India or
                                                 US)

  Phase 2 ---  Months 4--9    5 enterprise       Complete ABDM HIU/HIP integration,
  Market Entry                hospitals; \$500K  Multi-tenant isolation (RLS +
                              ARR                tenant sharding), Enterprise SSO
                                                 (SAML 2.0 / Okta), Analytics
                                                 dashboard v1, SLA guarantee (99.9%
                                                 uptime), SOC 2 Type I audit

  Phase 3 ---  Months 10--18  50 hospitals; \$5M Payer (insurance/TPA) module,
  Scaling                     ARR                Population health analytics, API
                                                 marketplace for telehealth
                                                 integrations, PPPM self-serve
                                                 onboarding, Multi-region (US +
                                                 India + EU), Llama-3 fine-tuned on
                                                 proprietary override data

  Phase 4 ---  Months 19--30  500 hospitals;     Polygenic risk scores (beyond
  Enterprise                  \$50M ARR          single-gene PGx), Oncology & rare
  Moat                                           disease modules, AI model with
                                                 proprietary feedback loop (100M+
                                                 prescription events), CDSCO (India
                                                 FDA) SaMD certification, Series B
                                                 funding / strategic acquisition
                                                 readiness

  Phase 5 ---  Year 3+        \$100M+ ARR        Data licensing to pharma companies
  Platform                                       (RWE platform), Universal
  Play                                           molecular decision support (beyond
                                                 pharmacogenomics), Acquisition
                                                 target positioning (Epic, Roche,
                                                 Illumina, Siemens Healthineers)
  ---------------------------------------------------------------------------------

**12. BUSINESS MODEL**

**12.1 Revenue Architecture**

  ------------------------------------------------------------------------------------------
  **Revenue Stream**       **Target      **Pricing**         **Gross      **Year 3 Revenue
                           Segment**                         Margin**     Potential**
  ------------------------ ------------- ------------------- ------------ ------------------
  Enterprise SaaS License  Large         \$50K--\$150K       85--90%      500 hospitals ×
                           hospital      ACV/facility/year                \$100K avg = \$50M
                           networks                                       ARR
                           (\>500 beds),                                  
                           Academic                                       
                           Medical                                        
                           Centers                                        

  Per-Provider-Per-Month   Mid-market    \$100--\$300 per    80--85%      5,000 providers ×
  (PPPM)                   clinics,      prescribing                      \$200 avg = \$12M
                           Behavioral    provider/month                   ARR
                           health,                                        
                           Cardiology                                     
                           practices                                      

  API Transaction Fees     Telehealth    \$0.005--\$0.02 per 95%+         500M calls/year ×
                           platforms,    CDS Hook call       (near-zero   \$0.01 avg = \$5M
                           EMR vendors,                      marginal     ARR
                           Digital                           cost)        
                           health                                         
                           startups                                       

  Implementation & Setup   All           \$20K--\$50K per    40--50%      500 hospitals ×
                           enterprise    facility            (services    \$5K amortized =
                           clients                           labor)       \$2.5M
                           (one-time)                                     

  Payer Shared Savings     Insurance     15--25% of          90%+         \$10M ARR
                           companies,    documented                       (conservative at
                           TPAs          healthcare cost                  scale)
                                         savings                          

  Anonymized Data          Pharma R&D,   \$500K--\$2M per    95%+         10 agreements ×
  Licensing                Biotech, CROs licensing agreement              \$1M avg = \$10M
                                                                          ARR

  TOTAL (Year 3                                                           \$89.5M ARR (path
  Projection)                                                             to \$100M)
  ------------------------------------------------------------------------------------------

**12.2 Customer Acquisition Strategy**

-   Land-and-Expand: Sign 1 flagship hospital (e.g., Apollo Hospitals or
    AIIMS Delhi in India; Cedars-Sinai in US). Use as reference customer
    for all subsequent sales. Case study must show measurable ADR
    reduction and ROI within 90 days.

-   Clinical Society Endorsements: Partner with CPIC, American Society
    of Health-System Pharmacists (ASHP), and Pharmacy Council of India.
    Endorsement converts skeptical CMIO/CIO buyers.

-   Hackathon-to-Pilot Pipeline: RIFT 2026 and Ecothon 5.0
    demonstrations attract direct hospital buyer interest from event
    judges and sponsors --- convert to pilot conversations.

-   Payer-Driven Distribution (B2B2B): Partner with 2--3 large TPAs
    (e.g., Medi Assist, Bajaj Allianz Health in India; Cigna, Aetna in
    US) to mandate or subsidize deployment across their empanelled
    hospital networks. One payer agreement can unlock 50--200 facilities
    instantly.

-   Integration Marketplace: List on Epic App Orchard, Oracle Cerner
    Code, and AWS HealthLake Marketplace. Each listing exposes platform
    to thousands of hospital IT departments actively seeking solutions.

**12.3 Competitive Moat --- Five Layers of Defensibility**

  --------------------------------------------------------------------------
  **Moat Layer**  **Description**             **Time to     **Durability**
                                              Build**       
  --------------- --------------------------- ------------- ----------------
  Data Network    More hospitals = more       18--24 months Very High ---
  Effect          prescription override       to meaningful dataset cannot
                  events = better AI model =  scale         be replicated
                  more accurate explanations                without clinical
                  = higher physician trust.                 deployment at
                  Self-reinforcing flywheel                 scale
                  that compounds over time.                 

  FHIR Standards  Deep FHIR Genomics IG       6--12 months  High --- but
  Lock-In         implementation is complex   to implement  requires
                  (6--12 months to build                    continuous
                  correctly). Hospitals that                standards
                  integrate via SMART on FHIR               maintenance
                  have high switching costs                 
                  (EHR reconfiguration                      
                  required).                                

  CPIC Guideline  Dedicated team maintains    3--6 months   Medium ---
  Currency        real-time alignment with                  replicable but
                  CPIC guideline updates                    requires ongoing
                  (published quarterly).                    investment
                  Competitors must do same                  
                  --- first-mover advantage                 
                  in automated guideline                    
                  ingestion pipeline.                       

  ABDM            Government-certified        12--18 months Very High ---
  Certification   HIU/HIP status required to                regulatory
  (India)         access India\'s national                  barrier to entry
                  health records.                           
                  Certification process takes               
                  6--18 months. Provides                    
                  exclusive access to 1.4                   
                  billion patient records.                  

  Proprietary     Physician accept/override   24--36 months Extremely High
  RLHF Dataset    signals + 30-day            to meaningful --- cannot be
                  readmission correlation     dataset       purchased or
                  data. Grows with every                    replicated
                  prescription event. Used to               
                  fine-tune domain-specific                 
                  LLM that outperforms                      
                  generic models.                           
  --------------------------------------------------------------------------

**13. RISK ANALYSIS**

  ---------------------------------------------------------------------------------------------------------
  **Risk**             **Category**      **Likelihood**   **Impact**           **Mitigation Strategy**
  -------------------- ----------------- ---------------- -------------------- ----------------------------
  FDA classifies       Regulatory        Medium (30%)     Critical --- 2--3    Position strictly as
  platform as Software                                    year delay           Non-Device CDS per 21st
  as a Medical Device                                                          Century Cures Act criteria:
  (SaMD) requiring                                                             clinician can independently
  510(k) clearance                                                             review basis of
                                                                               recommendation;
                                                                               deterministic CPIC rules
                                                                               (not black-box AI) are sole
                                                                               risk scorer; LLM labeled
                                                                               \'AI-assisted summary ---
                                                                               not diagnostic\'.

  CDSCO (India)        Regulatory        Medium (25%)     High --- 12--18      Engage CDSCO consultation
  requires separate                                       month India delay    pre-launch; classify under
  medical device                                                               Software as Medical Device
  certification                                                                (SaMD) risk Class A (lowest
                                                                               risk) due to advisory-only
                                                                               function. Pursue ABDM
                                                                               certification in parallel.

  Alert override rate  Clinical Adoption Medium (35%)     High --- undermines  Embed pharmacogenomics
  remains \>80%                                           clinical value       champion program (train 1
  despite improved UX                                                          clinical pharmacist per
                                                                               hospital as internal
                                                                               champion); deploy A/B
                                                                               testing of alert card
                                                                               formats; measure acceptance
                                                                               rates and iterate weekly.

  Genomic data breach  Security          Low (5%)         Catastrophic ---     Zero-trust architecture;
  exposing patient                                        legal/reputational   genomic data encrypted at
  genetic profiles                                                             column level; ABHA ID
                                                                               de-identification before AI
                                                                               processing; bug bounty
                                                                               program (\$10K--\$50K
                                                                               rewards); annual penetration
                                                                               test by certified firm.

  HAPI FHIR Server     Technical         Medium (30%)     High --- SLA         Pre-scale testing at 10x
  performance                                             violation            expected load in staging;
  bottleneck under                                                             implement FHIR resource
  load                                                                         caching (Redis); pre-fetch
                                                                               patient genomic profiles 15
                                                                               minutes before scheduled
                                                                               rounds via EHR schedule API.

  Key pharmacogenomics Talent/Business   Medium (25%)     High --- product     Document all CPIC alignment
  scientist leaves                                        quality risk         decisions in Confluence;
  team                                                                         implement \'pharmacogenomics
                                                                               review board\' (3+ team
                                                                               members must approve any
                                                                               rule changes); hire second
                                                                               PGx scientist by Month 6.

  Large EHR vendor     Competitive       Low (15%)        High --- TAM         Deep FHIR API integrations
  (Epic/Cerner) builds                                    compression in US    and hospital workflow
  native PGx module                                       market               dependency make switching
                                                                               costly; focus on
                                                                               India/emerging markets where
                                                                               Epic penetration is low
                                                                               (\<5%); expand to polygenic
                                                                               risk scores (beyond EHR
                                                                               vendors\' scope).

  LLM generates        AI Safety         Low (5%)         Critical --- patient Deterministic rule engine is
  incorrect clinical                                      harm risk            sole source of risk_label
  recommendation                                                               (LLM cannot override
  despite RAG                                                                  Safe/Toxic/Adjust Dosage
                                                                               decision); LLM output
                                                                               labeled \'AI-generated
                                                                               summary\'; mandatory
                                                                               physician confirmation;
                                                                               monthly pharmacist review of
                                                                               LLM outputs; kill switch to
                                                                               disable LLM and fall back to
                                                                               static CPIC text.
  ---------------------------------------------------------------------------------------------------------

**14. PRODUCTION READINESS CHECKLIST**

  -----------------------------------------------------------------------
  *All items below must be VERIFIED before any production patient data is
  processed. This checklist serves as the pre-launch gate review for the
  engineering, security, legal, and clinical teams.*

  -----------------------------------------------------------------------

**14.1 Security Checklist**

  -----------------------------------------------------------------------------------------
  **Item**                     **Verification Method**            **Owner**    **Status**
  ---------------------------- ---------------------------------- ------------ ------------
  AES-256 encryption confirmed pgcrypto audit query + penetration Security     \[ \]
  on all PHI fields in         test                               Engineer     Pending
  PostgreSQL                                                                   

  S3 buckets: Block Public     AWS Config rule:                   DevOps       \[ \]
  Access enabled; SSE-KMS      s3-bucket-public-read-prohibited                Pending
  enforced; Object Lock active                                                 

  TLS 1.3 enforced on all      SSL Labs scan (must achieve A+)    DevOps       \[ \]
  endpoints; TLS 1.0/1.1                                                       Pending
  disabled; HSTS header                                                        
  present                                                                      

  OWASP ZAP DAST scan          ZAP scan report reviewed by        Security     \[ \]
  completed: zero CRITICAL     security lead                      Engineer     Pending
  findings                                                                     

  HashiCorp Vault deployed; no K8s audit: kubectl get configmaps  DevOps       \[ \]
  secrets in K8s ConfigMaps or -A \| grep secret                               Pending
  environment variables                                                        

  HIPAA BAA signed with AWS    Legal review of executed BAA       Legal /      \[ \]
  (and any other cloud         documents                          Compliance   Pending
  providers)                                                                   

  DPDP Act compliance          External legal counsel sign-off    Legal /      \[ \]
  assessment completed for                                        Compliance   Pending
  India market                                                                 

  Penetration test by          Pentest report with all            CISO         \[ \]
  CREST-certified firm         CRITICAL/HIGH findings remediated               Pending
  completed                                                                    

  Multi-factor authentication  Auth0/Keycloak policy verification Security     \[ \]
  enforced for all                                                Engineer     Pending
  admin/CMIO/physician roles                                                   
  -----------------------------------------------------------------------------------------

**14.2 Clinical Safety Checklist**

  ----------------------------------------------------------------------------
  **Item**                     **Verification     **Owner**       **Status**
                               Method**                           
  ---------------------------- ------------------ --------------- ------------
  Pharmacogenomics accuracy    Automated pytest   Clinical Lead + \[ \]
  validated against all 50     suite with known   Engineering     Pending
  CPIC gold-standard test      VCF test cases                     
  cases (100% pass rate                                           
  required)                                                       

  LLM explanation module       Pharmacist         Clinical        \[ \]
  reviewed by licensed         sign-off document  Pharmacist      Pending
  clinical pharmacist (5                                          
  sample outputs per drug)                                        

  FHIR Genomics Reporting IG   HAPI FHIR          FHIR Engineer   \[ \]
  v4.0 conformance validation: Validator CLI +                    Pending
  zero errors on all resource  HL7 Touchstone                     
  types                        test suite                         

  CDS Hooks response time P99  k6 load test       Backend         \[ \]
  \< 500ms under 100           report: p(99) \<   Engineer        Pending
  concurrent requests (load    500ms                              
  test)                                                           

  Alert fatigue kill-switch    Integration test:  Engineering     \[ \]
  tested: system correctly     \>100 alerts in 1                  Pending
  suppresses alerts when       hour triggers                      
  threshold exceeded           suppression mode                   

  Physician override workflow  QA sign-off;       QA + Clinical   \[ \]
  tested end-to-end in EHR     Epic/Cerner        Informatics     Pending
  sandbox                      sandbox test                       
                               results                            

  CPIC guideline version       UI review:         Engineering +   \[ \]
  documented and displayed in  guideline version  Clinical Lead   Pending
  every CDS alert card         visible in all                     
                               card variants                      
  ----------------------------------------------------------------------------

**14.3 Architecture & Infrastructure Checklist**

  -----------------------------------------------------------------------------
  **Item**                     **Verification        **Owner**     **Status**
                               Method**                            
  ---------------------------- --------------------- ------------- ------------
  All microservices have       kubectl describe pod  DevOps        \[ \]
  health checks (readiness +   for all production                  Pending
  liveness probes) configured  pods                                
  in K8s                                                           

  Database backups tested: RDS Quarterly DR drill:   DevOps / DBA  \[ \]
  automated backups verified   restore to staging                  Pending
  via point-in-time restore    from backup; verify                 
  test                         data integrity                      

  Horizontal Pod Autoscaler    k6 load test with HPA DevOps        \[ \]
  configured for all services; event log                           Pending
  load test confirms           verification                        
  auto-scaling triggers                                            

  Kafka retention policy set   kafka-topics.sh       DevOps        \[ \]
  to 30 days; topic            \--describe for all                 Pending
  replication factor \>= 3     topics                              

  PostgreSQL row-level         SQL test: SET         Backend / DBA \[ \]
  security policies tested:    app.tenant_id =                     Pending
  cross-tenant query returns   \'tenant_A\'; SELECT                
  zero rows                    \* FROM patients                    
                               WHERE tenant_id =                   
                               \'tenant_B\'                        

  PgBouncer connection pool    pgbouncer SHOW POOLS; DBA           \[ \]
  configured; max connections  verify no connection                Pending
  tuned for pod count          exhaustion under load               

  CI/CD pipeline: all stages   GitHub Actions        Engineering   \[ \]
  passing; coverage thresholds dashboard: all checks Lead          Pending
  enforced (80% unit, 85%      green on main branch                
  Python)                                                          

  Grafana dashboards live: CDS Dashboard review      DevOps        \[ \]
  latency, error rate, VCF     session with                        Pending
  processing queue depth,      product/engineering                 
  tenant usage                 team                                

  PagerDuty on-call rotation   Simulated incident    Engineering   \[ \]
  configured; P1 alert         drill; confirm        Lead          Pending
  response tested end-to-end   escalation path                     
                               working                             
  -----------------------------------------------------------------------------

**14.4 Business & Compliance Checklist**

  -----------------------------------------------------------------------------
  **Item**                     **Verification        **Owner**     **Status**
                               Method**                            
  ---------------------------- --------------------- ------------- ------------
  SOC 2 Type I readiness       External auditor      CISO /        \[ \]
  assessment completed         assessment report     Compliance    Pending

  Pilot hospital contracts     Legal contract review Legal / Sales \[ \]
  signed with defined SLAs                                         Pending
  (99.9% uptime, \<500ms P99)                                      

  ABDM HIU/HIP registration    ABDM sandbox          Business      \[ \]
  application submitted (India integration test      Development   Pending
  market)                      passing; application                
                               number received                     

  Data retention and deletion  DPDP Act compliance:  Engineering / \[ \]
  policy implemented;          deletion API tested;  Legal         Pending
  right-to-deletion tested     data fully purged                   
                               within 72 hours of                  
                               request                             

  Incident response plan       Tabletop exercise     CISO / Legal  \[ \]
  documented; breach           completed with legal,               Pending
  notification procedures      clinical, and                       
  defined                      engineering teams                   

  Insurance: Cyber liability + Insurance certificate CFO / Legal   \[ \]
  professional indemnity       reviewed by legal                   Pending
  (medical device) coverage                                        
  obtained                                                         
  -----------------------------------------------------------------------------

  -----------------------------------------------------------------------
  *FINAL GATE: All items in Sections 14.1--14.4 must be marked COMPLETE
  before processing any real patient data. A signed attestation from the
  CTO, CISO, and Chief Clinical Officer is required for production launch
  authorization.*

  -----------------------------------------------------------------------
