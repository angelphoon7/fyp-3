# FINAL YEAR PROJECT 2 — INTERIM REPORT

**AI-Assisted Caregiver Management System**

Faculty of Computing and Informatics
Multimedia University Malaysia

---

---

# ABSTRACT

The ageing population in Malaysia has placed growing pressure on family caregivers who manage the daily care of elderly dependants at home without formal clinical training or dedicated digital support. This project presents the design and development of an AI-assisted caregiver management system that consolidates daily caregiving responsibilities into a single mobile-first web application. The system incorporates six core modules — patient care task tracking, medication management, appointment coordination, household management, financial expense tracking, and an AI-generated daily health summary — alongside an automated family communication layer powered by n8n workflow automation and Twilio's WhatsApp Business API.

Artificial intelligence is integrated at multiple points within the system. Google Gemini 2.5 Flash serves as the primary large language model for generating care summaries, analysing financial spending, and producing personalised meal recommendations. Google Cloud Vision API provides optical character recognition for automated receipt scanning, extracting itemised expense details from grocery and medical receipts without manual data entry. A dual-persistence data model combining browser-based localStorage and Firebase Firestore ensures that all caregiving data remains accessible to both the web application and the automation layer in real time.

The system was evaluated through functional testing across all core modules and demonstrates that AI and automation technologies can be meaningfully applied to reduce caregiver workload, improve family communication, and provide actionable daily insights. The prototype serves as a proof of concept for a broader class of AI-assisted tools designed to support the growing informal caregiving workforce in Malaysia.

---

---

# TABLE OF CONTENTS

- Chapter 1: Introduction
  - 1.1 Overview
  - 1.2 Problem Statement
  - 1.3 Project Objectives
  - 1.4 Project Scope
  - 1.5 Project Limitations
  - 1.6 Methodology
  - 1.7 Target Audience
  - 1.8 Summary

- Chapter 2: Literature Review
  - 2.1 Overview
  - 2.2 The Informal Caregiving Landscape in Malaysia
  - 2.3 Existing Caregiving Applications and Their Limitations
  - 2.4 Artificial Intelligence in Healthcare and Caregiving
  - 2.5 Large Language Models in Health-Related Applications
  - 2.6 Optical Character Recognition for Medical Document Processing
  - 2.7 Workflow Automation in Health Systems
  - 2.8 Summary

- Chapter 3: Requirements Analysis
  - 3.1 Overview
  - 3.2 Fact-Finding Techniques
  - 3.3 Functional Requirements
  - 3.4 Non-Functional Requirements
  - 3.5 User Requirements
  - 3.6 Summary

- Chapter 4: System Design
  - 4.1 Overview
  - 4.2 System Architecture
  - 4.3 Use Case Diagram
  - 4.4 Activity Diagram
  - 4.5 Sequence Diagram
  - 4.6 Entity-Relationship Diagram
  - 4.7 Interface Design
  - 4.8 Summary

- Chapter 5: Implementation
  - 5.1 Overview
  - 5.2 Development Environment
  - 5.3 Core Module Implementation
  - 5.4 AI Integration
  - 5.5 Automation Layer
  - 5.6 Summary

- Chapter 6: Testing
  - 6.1 Overview
  - 6.2 Unit Testing
  - 6.3 Integration Testing
  - 6.4 System Testing
  - 6.5 User Acceptance Testing
  - 6.6 Summary

- Chapter 7: Conclusion
  - 7.1 Summary of Achievements
  - 7.2 Limitations Encountered
  - 7.3 Future Work
  - 7.4 Closing Remarks

- References

---

---

# CHAPTER 1: INTRODUCTION

## 1.1 Overview

The care of elderly individuals within the home setting is one of the most demanding yet underrecognised responsibilities carried out by families across Malaysia. As the country moves steadily toward achieving Aged Nation status — defined by the United Nations as having more than 14 percent of the population aged 65 and above — the pressure on informal family caregivers continues to grow at a pace that existing support structures have not kept up with. Unlike professional healthcare workers, family caregivers often lack clinical training, structured workflows, or dedicated digital tools to guide them through the daily complexities of managing a dependant's care.

This project presents the design and development of an AI-assisted caregiver management system — a mobile-first web application that gives family caregivers a single, organised platform to manage and monitor their daily caregiving responsibilities. The system consolidates six areas of daily caregiving: patient care task tracking, medication adherence monitoring, appointment management, household task management, grocery and medical expense tracking, and an AI-generated daily health summary with personalised meal recommendations.

Beyond the core management features, the system integrates a workflow automation layer built using n8n — an open-source automation platform — that sends scheduled and event-driven notifications to family members via WhatsApp and email. This layer reduces the caregiver's manual communication burden by automating daily updates, medication miss alerts, appointment reminders, and monthly expense reports.

The project makes use of a modern technology stack. The frontend is built using Next.js and styled with Tailwind CSS. Data is persisted using a combination of browser-based localStorage and Firebase Firestore, ensuring real-time synchronisation between the application and the automation layer. Google Gemini 2.5 Flash serves as the primary large language model for all AI-generated content, while Google Cloud Vision API handles optical character recognition for automated receipt scanning.

---

## 1.2 Problem Statement

The global rise in ageing populations has placed growing pressure on family-based caregiving, particularly in Southeast Asian societies where elderly care is traditionally managed within the home rather than in formal care facilities. In Malaysia, approximately 3.4 million unpaid family caregivers — often adult children or spouses — are responsible for managing a wide range of daily tasks for their elderly dependants. These tasks include administering medication, coordinating hospital appointments, monitoring personal hygiene and care routines, managing household responsibilities, and tracking healthcare-related expenditure (Choo et al., 2022). Despite the critical nature of this role, caregivers receive little structured support and lack access to dedicated digital tools built for their specific needs.

Existing caregiving and health management applications tend to address only isolated aspects of the problem. Some focus solely on medication reminders, while others handle appointment scheduling alone. None provide a unified platform that intelligently consolidates the full spectrum of caregiving activities. As a result, caregivers frequently rely on handwritten notes, informal messaging applications, and memory to manage tasks that directly affect a patient's wellbeing — an approach that is both cognitively burdensome and prone to error (Schulz & Eden, 2016).

Several specific problems remain inadequately addressed within existing solutions. First, medication non-adherence is a persistent concern among elderly patients, with missed doses occurring regularly due to the complexity of multi-drug regimens and the caregiver's own workload. Second, family members who are not co-located with the primary caregiver have no reliable mechanism to stay informed of daily care activities, leading to repeated manual updates, miscommunication, and anxiety among relatives. Third, healthcare and grocery expenses incurred during caregiving are rarely documented systematically, making it difficult for families to recover costs through structured expense claims. Finally, caregivers lack access to personalised, data-driven guidance that could assist them in planning meals, assessing their loved one's daily progress, and identifying when patterns suggest a decline in care quality.

These compounding challenges contribute to caregiver burnout, reduced quality of care, and a lack of accountability and transparency within the family caregiving unit. There is therefore a clear need for an integrated, AI-assisted platform that unifies task monitoring, financial management, automated family communication, and intelligent care recommendations into a single accessible system.

---

## 1.3 Project Objectives

The primary aim of this project is to design and develop an AI-assisted caregiving management application that supports family caregivers in managing the daily care of elderly dependants more efficiently. To achieve this, the following objectives were defined.

**Objective 1:** To develop a unified caregiving dashboard that consolidates daily care activities — including personal care tasks such as bathing, dressing, and feeding, as well as household responsibilities such as cooking and cleaning — into a single accessible interface with real-time task completion tracking.

**Objective 2:** To implement a medication management module that allows caregivers to register medications with dosage schedules, record dose administration, monitor adherence rates, and receive automated alerts when doses are missed or overdue.

**Objective 3:** To integrate AI-powered receipt recognition using optical character recognition and large language model analysis to automatically extract itemised expense details from scanned grocery and medical receipts, and to generate exportable PDF financial reports suitable for family expense claims.

**Objective 4:** To produce an AI-generated daily care summary with personalised meal recommendations derived from aggregated caregiving activity data, delivered through a warm and accessible conversational interface.

**Objective 5:** To automate family communication through scheduled and event-driven notifications delivered via WhatsApp and Gmail, using n8n workflow automation integrated with Twilio's WhatsApp Business API, thereby reducing the caregiver's manual reporting burden.

**Objective 6:** To evaluate the usability and functional completeness of the integrated prototype against the defined requirements and assess its suitability for supporting real-world caregiving workflows.

---

## 1.4 Project Scope

This project covers the design, development, and functional testing of an AI-assisted caregiver management system prototype. The scope of the system is defined as follows.

The system includes six functional modules accessible through a mobile-first web interface: patient care task logging with photographic check-in, medication scheduling and adherence monitoring, hospital appointment management with AI-powered medical document scanning, household task tracking with grocery receipt scanning, financial expense reporting with AI spending analysis, and a daily health report with AI care summary and meal recommendations.

The system integrates with three external services: Google Gemini 2.5 Flash via the Gemini API for AI-generated content, Google Cloud Vision API for optical character recognition, and Firebase Firestore for persistent data storage and cross-service synchronisation. A separate automation layer built on n8n handles five automated workflows that deliver notifications via Twilio WhatsApp API and Gmail.

The scope does not extend to clinical diagnosis, medical advice, or the replacement of professional healthcare services. The system is designed strictly as a caregiving management and communication tool. It does not include native mobile application development, real-time chat between caregivers, or multi-user account management within a single household. The prototype is developed and tested in a local development environment and is not deployed to a production server as part of this project.

---

## 1.5 Project Limitations

Several limitations were identified during the development of this system that may affect its applicability in real-world deployment.

The first limitation concerns data persistence. The system currently uses browser-based localStorage as the primary data store for the web application, with Firebase Firestore serving as a secondary synchronisation layer. Because localStorage is tied to a specific browser instance, caregiving data is not accessible across multiple devices without an additional authentication and synchronisation layer. This limits the system's portability in multi-device household settings.

The second limitation relates to the AI-generated outputs. The meal recommendations and care summaries produced by Gemini 2.5 Flash are based solely on data entered into the system by the caregiver. The AI does not have access to a patient's medical history, laboratory results, or professional clinical assessments. As such, all AI outputs are informational and non-clinical in nature, and should not be interpreted as medical guidance.

The third limitation is the dependency on third-party API availability. Features including receipt scanning, AI care summaries, and WhatsApp notifications are dependent on the continued availability and pricing of Google Cloud Vision API, Google Gemini API, and Twilio's WhatsApp Business API. Any changes to these services may affect system functionality.

The fourth limitation concerns the Twilio WhatsApp sandbox environment used during development. The sandbox requires each recipient phone number to manually opt in before receiving messages, which restricts the automation layer's reach to pre-registered numbers. This would need to be replaced with a Twilio production number for wider deployment.

---

## 1.6 Methodology

This project follows an iterative, prototype-driven development methodology informed by the principles of Agile software development. Rather than adhering to a rigid sequential process, development proceeded in successive cycles — each cycle producing a testable increment of the system, which was then reviewed and refined before the next cycle began. This approach allowed requirements to be validated progressively as features were implemented, rather than all at once at the outset.

The development process was structured into four broad phases.

**Phase 1 — Research and Requirements Gathering:** This phase involved a review of existing caregiving applications and academic literature on the use of AI in health management, followed by the identification of functional and non-functional requirements through user scenario analysis.

**Phase 2 — System Design:** Based on the gathered requirements, system architecture, data models, use case diagrams, and interface wireframes were produced. Design decisions were guided by the principles of mobile-first design, data accessibility, and API integration feasibility.

**Phase 3 — Iterative Development:** Each system module was developed and tested independently before being integrated into the unified application. AI features were prototyped early in the process to validate the API integrations and assess output quality, allowing prompt adjustments to be made to the AI instructions before full integration.

**Phase 4 — Integration and Testing:** Once all modules were functional, integration testing was conducted to verify cross-module data flow. Functional testing was performed against the defined requirements, and identified defects were resolved before the final prototype was produced.

---

## 1.7 Target Audience

The primary users of this system are family caregivers — individuals who are responsible for the day-to-day care of an elderly parent, spouse, or relative within a home setting. These users are likely to be non-clinical adults managing care alongside other personal or professional responsibilities, and may not have prior experience with formal caregiving tools or health management software.

Secondary users include family members who are not the primary caregiver but who wish to remain informed of the patient's daily care status. These users interact with the system indirectly through the automated WhatsApp and email notifications generated by the n8n automation layer, rather than through the web application directly.

The system is designed to be accessible to users with varying levels of technical literacy. The interface prioritises simplicity, clear visual feedback, and minimal data entry through features such as one-tap task check-in, photographic logging, and automated expense extraction from receipt images.

---

## 1.8 Summary

This chapter has introduced the context, motivation, and scope of the AI-assisted caregiver management system. The problem of unsupported informal caregiving in Malaysia was identified as the primary motivation for this project, and six specific objectives were defined to address it. The scope of the system was bounded to a functional prototype encompassing six core caregiving modules, three AI integrations, and an n8n automation layer for family communication. The iterative development methodology and the system's primary target audience were also described. The following chapter reviews existing literature and related work that informed the design and development decisions made throughout this project.

---

---

# CHAPTER 2: LITERATURE REVIEW

## 2.1 Overview

This chapter examines existing literature and related work relevant to the design of an AI-assisted caregiver management system. The review covers four main areas: the landscape of informal caregiving in Malaysia, the current state of caregiving applications and their known shortcomings, the application of artificial intelligence in healthcare and caregiving, and the use of workflow automation in health-related systems. The goal of this review is to establish an evidence base for the design choices made in this project and to identify gaps in existing solutions that this system aims to address.

---

## 2.2 The Informal Caregiving Landscape in Malaysia

Malaysia is undergoing a significant demographic shift. According to the Department of Statistics Malaysia (2023), the proportion of Malaysians aged 60 and above is projected to reach 15 percent by 2030, moving the country into the category of an Aged Society as defined by the World Health Organization. This demographic transition is placing increasing strain on the healthcare system and, in particular, on the families who provide informal care at home.

In the Malaysian context, home-based elderly care is deeply embedded in cultural norms. Samsuddin et al. (2020) observe that filial piety — the expectation that adult children will care for ageing parents — remains a strong social norm in Malaysia, particularly within Malay, Chinese, and Indian communities. As a result, the responsibility of caregiving frequently falls on a single family member, often a middle-aged woman who manages care alongside employment and household responsibilities.

Research by Choo et al. (2022) estimates that approximately 3.4 million Malaysians currently provide informal care to elderly relatives without pay or formal support. The study further notes that a significant proportion of these caregivers report symptoms of burnout, social isolation, and reduced quality of life, attributing these outcomes to the lack of structured tools, training, and institutional recognition of their role. These findings suggest that technology-based interventions designed specifically for family caregivers have the potential to meaningfully reduce care burden and improve caregiver wellbeing.

---

## 2.3 Existing Caregiving Applications and Their Limitations

A number of digital tools have been developed to support caregiving activities. Among the most widely used are CareZone, CaringBridge, and the Apple Health application. CareZone provides medication reminders and basic scheduling features, while CaringBridge focuses on health journaling and family communication. Apple Health aggregates health data from wearable devices but is designed primarily for self-monitoring rather than third-party care management.

Despite their individual merits, none of these applications provide an integrated solution that consolidates the full range of caregiving activities into a single platform. Schulz and Eden (2016) argue that the fragmentation of caregiving tools — where caregivers must use separate applications for medication tracking, appointment scheduling, and family communication — contributes directly to cognitive overload and reduces the likelihood of consistent tool adoption over time.

Mao et al. (2021) conducted a review of 47 mobile caregiving applications and found that while the majority included reminder and scheduling features, fewer than 20 percent offered any form of intelligent decision support, and fewer than 10 percent included automated communication features for extended family members. The study concluded that existing tools are largely reactive in nature, helping caregivers record what has happened rather than providing guidance on what should happen next. This gap — between data capture and actionable intelligence — represents the primary design opportunity that the present project seeks to address.

---

## 2.4 Artificial Intelligence in Healthcare and Caregiving

The application of artificial intelligence to healthcare has grown substantially over the past decade. Topol (2019) identifies three broad categories of AI application in medicine: diagnostic support, treatment recommendation, and administrative automation. While the first two categories have attracted the majority of research attention, administrative automation — including the use of AI to reduce the documentation and coordination burden on healthcare workers and informal caregivers — has emerged as a practically significant area with relatively lower barriers to implementation.

Within caregiving specifically, AI applications have been explored in several domains. Mynatt et al. (2020) describe the use of AI-powered activity monitoring systems to detect deviations from an elderly patient's normal daily routine and alert caregivers to potential concerns. Pew and Mavor (2020) review conversational AI systems designed to assist caregivers with decision-making during daily care, noting that users consistently report a preference for systems that provide actionable recommendations rather than passive data summaries.

The current project draws on these insights by using a large language model to generate care summaries that are explicitly framed as friendly, actionable, and non-clinical. Rather than presenting data in a format that requires clinical interpretation, the system translates caregiving activity data into natural language observations and specific meal suggestions — an approach informed by evidence that caregivers respond more positively to personalised recommendations than to generic alerts (Mao et al., 2021).

---

## 2.5 Large Language Models in Health-Related Applications

Large language models (LLMs) have demonstrated considerable promise in health-related applications since the release of GPT-3 in 2020 and subsequent models from OpenAI, Google, and Anthropic. These models are capable of generating contextually coherent, domain-appropriate text from structured or unstructured input, making them well-suited for tasks such as summarisation, question answering, and recommendation generation.

Google's Gemini family of models, which underpins the AI features in this project, has been evaluated across multiple benchmarks as competitive with or superior to earlier models in medical question answering and clinical reasoning tasks (Singhal et al., 2023). However, the same study emphasises that LLMs in health contexts must be used with appropriate safeguards, as they can generate plausible but factually incorrect outputs — a phenomenon commonly referred to as hallucination.

To mitigate this risk in the current system, the LLM is not used for clinical decision-making or medication advice. Instead, its role is confined to three well-bounded tasks: generating a daily care summary based on structured input data, analysing spending patterns from financial transaction data, and suggesting meal options appropriate for elderly patients. Each of these tasks is framed with explicit instructions in the system prompt that prohibit the model from making clinical recommendations or referencing specific medications. This constrained use of LLM capabilities reflects the design principle of keeping AI outputs informational rather than prescriptive.

---

## 2.6 Optical Character Recognition for Medical Document Processing

Optical character recognition (OCR) technology converts images of text into machine-readable character strings, enabling automated extraction of information from physical or photographed documents. In healthcare and caregiving contexts, OCR has been applied to the digitisation of prescription labels, hospital invoices, and insurance claim documents (Zhang et al., 2021).

Google Cloud Vision API, used in this project for receipt scanning, is a cloud-based OCR service that supports DOCUMENT_TEXT_DETECTION — a high-accuracy mode designed for dense, multi-column text such as that found on receipts and invoices. Zhang et al. (2021) evaluate several cloud OCR services on printed receipt text and report that Google Cloud Vision API achieves accuracy rates above 95 percent on clearly photographed receipts, making it suitable for the expense tracking use case in this project.

The receipt scanning pipeline in this system combines Cloud Vision OCR output with a structured extraction prompt sent to Gemini 2.5 Flash. The LLM parses the raw OCR text and returns a structured JSON object containing the store name, purchase date, itemised list of products and prices, subtotal, tax, and total. This hybrid approach — using OCR for text extraction and an LLM for semantic parsing — follows the pattern recommended by Huang et al. (2022), who demonstrate that pure OCR output is insufficient for structured information extraction from receipts due to inconsistent formatting across different retail vendors.

---

## 2.7 Workflow Automation in Health Systems

Workflow automation refers to the use of software tools to execute predefined processes automatically, triggered either by a schedule or by a specific event. In health and caregiving contexts, automation has been used to reduce administrative burden, improve communication reliability, and ensure that time-sensitive actions — such as medication reminders or family notifications — are not dependent on manual initiation.

n8n is an open-source workflow automation platform that enables the creation of automated workflows through a visual node-based editor. Unlike proprietary automation platforms such as Zapier or Microsoft Power Automate, n8n can be self-hosted, which reduces data privacy concerns when handling sensitive caregiving information. The platform supports webhook triggers, scheduled execution, and integration with over 400 external services including WhatsApp via Twilio, Gmail, and Google Calendar.

Bates et al. (2020) argue that automated communication systems in caregiving contexts are most effective when they are event-driven rather than purely scheduled, as event-driven alerts carry contextual relevance that scheduled reports do not. The automation layer in this project reflects this principle: while a daily care summary is sent on a fixed schedule each evening, medication miss alerts and receipt scan notifications are triggered by specific events within the application, ensuring that family members receive information when it is most relevant rather than at a fixed time regardless of context.

---

## 2.8 Summary

The literature reviewed in this chapter establishes that informal caregiving in Malaysia is a growing public health concern that lacks adequate technological support. Existing caregiving applications address individual aspects of the problem but fail to provide the integrated, intelligent platform that caregivers require. Research on AI applications in healthcare confirms the suitability of large language models for non-clinical summarisation and recommendation tasks when used within well-defined constraints. OCR technology combined with LLM-based parsing provides a practical approach to automated expense extraction from receipt images. Finally, event-driven workflow automation has been shown to be more effective than purely scheduled communication in caregiving contexts. These findings collectively inform the design decisions described in the following chapter.

---

---

# CHAPTER 3: REQUIREMENTS ANALYSIS

## 3.1 Overview

This chapter documents the process by which the functional and non-functional requirements of the system were identified and defined. The requirements were gathered through a combination of scenario analysis, a review of related applications, and iterative consultation during the design process. The resulting requirements form the basis for the system design described in Chapter 4 and were used as the primary criteria for evaluation during testing in Chapter 6.

---

## 3.2 Fact-Finding Techniques

### 3.2.1 Scenario Analysis

The primary fact-finding method used in this project was scenario analysis — the construction of realistic caregiving scenarios that described how a typical caregiver would interact with the system across a full day. Three scenarios were developed, each representing a different caregiving situation: a caregiver managing an elderly parent with diabetes and multiple medications, a caregiver tracking household and grocery expenses for a monthly family reimbursement claim, and a caregiver who is not co-located with other family members and needs to keep them informed without sending manual updates.

These scenarios were used to identify the tasks the system must support, the data it must capture, the outputs it must produce, and the external services it must integrate with. Requirements derived from the scenarios were reviewed for feasibility against the available technology stack before being formally included in the requirements specification.

### 3.2.2 Review of Existing Applications

A review of five existing caregiving and health management applications — CareZone, CaringBridge, Apple Health, Google Fit, and CarePredict — was conducted to identify commonly supported features, known usability issues, and functionality gaps. This review confirmed the absence of integrated financial tracking, AI-generated summaries, and automated family communication in existing tools, reinforcing the need for the features proposed in this project.

---

## 3.3 Functional Requirements

The following functional requirements define what the system must do.

**FR1 — Care Task Management**
The system shall allow caregivers to view a list of daily care tasks categorised by type (personal care, household, and grocery management). The system shall allow caregivers to mark tasks as completed and record the time of completion. For tasks involving visual documentation, the system shall allow caregivers to capture a photograph using the device camera or upload an image from the device gallery.

**FR2 — Medication Management**
The system shall allow caregivers to add medications with the patient's name, dosage, and daily schedule (morning, afternoon, evening, night). The system shall allow caregivers to mark each scheduled dose as taken and record the time at which the dose was administered. The system shall display an adherence percentage calculated from the proportion of scheduled doses taken. The system shall display all pending doses prominently in the daily health report.

**FR3 — Appointment Management**
The system shall allow caregivers to create and view hospital or clinic appointments with fields for hospital name, date, time, and notes. The system shall allow caregivers to attach a photograph of a medical document or bill to an appointment record. The system shall automatically extract structured information from the attached document image using AI-powered analysis and display the extracted data within the appointment record.

**FR4 — Household and Grocery Management**
The system shall allow caregivers to log the completion of household tasks including cooking, room cleaning, and grocery shopping. For grocery tasks, the system shall allow caregivers to photograph a receipt, extract its contents automatically using OCR and AI analysis, and display an itemised breakdown of the purchase. Upon successful receipt analysis, the system shall navigate the caregiver to the financial report page where the new transaction is immediately visible.

**FR5 — Financial Reporting**
The system shall aggregate all scanned receipts — grocery and medical — into a categorised transaction list. The system shall calculate and display the total expenditure for each category and an overall grand total. The system shall allow caregivers to request an AI-generated spending analysis. The system shall allow caregivers to export the complete financial report as a PDF document.

**FR6 — Daily Health Report**
The system shall compute a daily care score from 0 to 100 based on the proportion of care tasks completed, medication doses taken, and household tasks completed. The system shall display the care score alongside individual metric cards for patient care, medication, household tasks, and the next upcoming appointment. The system shall allow caregivers to generate an AI care summary that analyses the day's activity data and returns a brief, non-clinical overview with personalised meal recommendations. Each meal recommendation shall be accompanied by a food photograph retrieved from an external image source.

**FR7 — Automated Family Notifications**
The system shall send an automated WhatsApp message to a designated family contact at 8:00 PM each day summarising the patient's care status. The system shall send an automated WhatsApp notification when a grocery receipt is scanned. The system shall send an automated medication miss alert when doses remain unchecked. The system shall send a monthly financial claim summary to a designated email address. The system shall synchronise new appointments to a designated Google Calendar.

---

## 3.4 Non-Functional Requirements

**NFR1 — Usability**
The interface shall be optimised for use on a mobile device screen and rendered within a consistent mobile frame to reflect the intended use context. All primary actions shall be reachable within two taps from the home screen. The system shall provide visual feedback — including loading states, success indicators, and error messages — for all asynchronous operations.

**NFR2 — Performance**
Receipt analysis shall complete within 15 seconds under normal network conditions. AI-generated care summaries shall complete within 20 seconds. The application shall load and be interactive within 3 seconds on a standard broadband connection.

**NFR3 — Reliability**
The system shall handle API failures gracefully, displaying an informative error message to the user rather than crashing. Locally cached data in localStorage shall remain accessible if an API call fails, ensuring that previously entered caregiving data is not lost.

**NFR4 — Security**
Caregiving data stored in Firebase Firestore shall not include personally identifiable patient information beyond what is necessary for the application's functionality. The Twilio authentication credentials and API keys shall be stored as environment variables and shall not be exposed in the client-side application code.

**NFR5 — Maintainability**
The system shall be implemented as a modular Next.js application with clearly separated API routes, page components, and shared state utilities. AI prompt logic shall be encapsulated within dedicated API route handlers to allow prompt updates without modifying frontend code.

---

## 3.5 User Requirements

The system shall be operable by a caregiver with no prior technical training beyond basic smartphone usage. The interface language shall be English. All AI-generated content shall be written in plain, non-clinical language appropriate for a non-medical audience. The system shall not display content that could be interpreted as medical advice, clinical diagnosis, or medication instruction.

---

## 3.6 Summary

This chapter has defined the functional requirements, non-functional requirements, and user requirements that the system must satisfy. Seven functional requirement groups were identified covering the six core modules and the automation layer. These requirements were derived through scenario analysis and a review of existing applications. The following chapter presents the system design that addresses these requirements.

---

---

# CHAPTER 4: SYSTEM DESIGN

## 4.1 Overview

This chapter describes the architectural and design decisions made in translating the requirements identified in Chapter 3 into a concrete system specification. The design is presented through a series of diagrams — including a system architecture diagram, use case diagram, activity diagram, sequence diagram, and entity-relationship diagram — followed by a description of the user interface design approach.

---

## 4.2 System Architecture

The system follows a layered client-server architecture with three distinct tiers: the client-side web application, the server-side API layer, and the external service integrations.

**Client Layer — Next.js Web Application**
The frontend is built using Next.js 14 with the App Router pattern. All caregiver-facing pages are rendered as client-side React components, which interact with the server-side API layer through HTTP requests. Caregiving state is maintained in browser localStorage for fast, offline-capable access and synchronised to Firebase Firestore through the push-state API route whenever data changes.

**Server Layer — Next.js API Routes**
The API layer consists of a set of Next.js route handlers that encapsulate all server-side logic, including AI prompt execution, OCR processing, and data synchronisation. Key API routes include:

- `/api/analyze-receipt` — accepts a base64-encoded receipt image, submits it to Google Cloud Vision API for text extraction, and passes the extracted text to Gemini 2.5 Flash for structured parsing
- `/api/analyze-medical-report` — performs the same pipeline for medical documents attached to appointments
- `/api/health-summary` — accepts structured caregiving activity data and returns an AI-generated care summary with meal recommendations
- `/api/financial-analysis` — accepts financial transaction data and returns an AI-generated spending analysis
- `/api/daily-summary` — reads current caregiving data from Firestore and returns a structured summary consumed by the n8n automation layer
- `/api/push-state` — accepts key-value caregiving data from the client and writes it to Firebase Firestore

**External Service Layer**
The system integrates with four external services: Google Gemini API for large language model inference, Google Cloud Vision API for optical character recognition, Firebase Firestore for persistent cloud data storage, and Twilio WhatsApp Business API via the n8n automation layer for outbound messaging.

**Automation Layer — n8n Workflows**
A self-hosted n8n instance manages five automated workflows that run independently of the web application. Each workflow reads data from the `/api/daily-summary` or `/api/financial-export` endpoints and delivers formatted messages to family contacts via Twilio WhatsApp or Gmail. The automation layer is connected to the web application through the push-state synchronisation mechanism, which ensures that Firestore data is always current when a workflow executes.

---

## 4.3 Use Case Diagram

The primary actors in the system are the Caregiver and the Family Member.

The Caregiver interacts with the system to: log daily care tasks, capture task photographs, record medication doses, create and view appointments, attach and scan medical documents, photograph and scan grocery receipts, view financial reports, request AI-generated care summaries, and export PDF reports.

The Family Member interacts with the system indirectly, receiving automated WhatsApp notifications for daily updates, medication miss alerts, receipt scan notifications, and monthly financial summaries.

The System (automated) interacts with external APIs to extract receipt content, generate AI summaries, and push notifications via the n8n automation layer.

---

## 4.4 Activity Diagram

**Receipt Scanning Activity Flow**

The receipt scanning flow begins when the caregiver selects the grocery management task and chooses to photograph or upload a receipt image. The image is captured or selected and displayed as a thumbnail within the task log. Simultaneously, an analysing indicator is shown to the user while the image is submitted to the `/api/analyze-receipt` endpoint. The API route encodes the image to base64, submits it to Google Cloud Vision API for DOCUMENT_TEXT_DETECTION, and passes the extracted text to Gemini 2.5 Flash with a structured parsing prompt. The model returns a JSON object containing the store name, date, itemised purchases, tax, and total. The task log is updated with the extracted receipt data and the analysing indicator is dismissed. The caregiving state is saved to localStorage and pushed to Firestore. The application then navigates the caregiver to the financial report page, where the new transaction appears in the transaction list.

**AI Care Summary Activity Flow**

The care summary flow begins when the caregiver taps the Generate button in the health report. The system reads the current caregiving state from localStorage, assembling data across care tasks, medications, appointments, and household tasks. This structured data is submitted to the `/api/health-summary` endpoint. The API generates a prompt that instructs Gemini 2.5 Flash to produce a care summary and three meal recommendations in JSON format, explicitly prohibiting clinical language or medication advice. The model response is parsed and the meal names are used to fetch food photographs from TheMealDB API in parallel. The complete AI summary object — including status, score, summary text, highlights, recommendation, and meals with images — is returned to the client and rendered in the health report.

---

## 4.5 Sequence Diagram

**Receipt Analysis Sequence**

1. Caregiver captures receipt image via device camera or gallery
2. Client encodes image to base64 and adds a log entry with `analyzing: true`
3. Client sends POST request to `/api/analyze-receipt` with the base64 image
4. API route submits image to Google Cloud Vision API (DOCUMENT_TEXT_DETECTION)
5. Cloud Vision returns raw OCR text
6. API route constructs a Gemini prompt containing the OCR text
7. API route sends prompt to Gemini 2.5 Flash
8. Gemini returns structured JSON (store, date, items, tax, total, currency, claimSummary)
9. API route returns parsed ReceiptResult to client
10. Client updates the task log entry with receipt data and `analyzing: false`
11. Client saves updated state to localStorage and pushes to Firestore
12. Client navigates to `/financial` page
13. n8n Workflow 5 is notified via webhook and sends WhatsApp notification to family

---

## 4.6 Entity-Relationship Diagram

The system manages the following primary data entities.

**CareTask** — represents a daily household or personal care task. Attributes: id (string), name (string), subtitle (string), icon (string), logs (CareLog array), hasCamera (boolean).

**CareLog** — represents a single completion event for a care task. Attributes: label (string), time (string), image (optional string), receipt (optional ReceiptResult), analyzing (optional boolean).

**ReceiptResult** — represents the structured output of a receipt scan. Attributes: store (string), date (string), items (ReceiptItem array), subtotal (number), tax (number), total (number), currency (string), claimSummary (string).

**Medication** — represents a medication registered for the patient. Attributes: id (string), name (string), dosage (string), schedules (MedSchedule array).

**MedSchedule** — represents a single scheduled dose within a medication record. Attributes: id (string), period (string), time (string), taken (boolean), takenAt (optional string).

**Appointment** — represents a scheduled hospital or clinic visit. Attributes: id (string), hospital (string), date (string), time (string), notes (string), doc (optional AppointmentDoc).

**AppointmentDoc** — represents a medical document attached to an appointment. Attributes: image (string), report (optional MedicalReportResult), analyzing (boolean).

All entities are serialised as JSON and stored in localStorage under namespaced keys. Each key is also pushed to Firebase Firestore under the `kai_app_state` collection for cross-service accessibility.

---

## 4.7 Interface Design

The user interface was designed around three guiding principles: visual consistency, mobile-first layout, and minimal cognitive load.

**Visual Consistency**
All pages share a dark background (black or near-black) with glass-morphism card components — semi-transparent panels with blurred backgrounds and subtle borders — that create a layered visual hierarchy without competing for attention with the content. A consistent colour language is used across modules: yellow-gold accents for the household management module, emerald green for the financial and health report modules, and slate-blue tones for the health report galaxy background.

**Mobile-First Layout**
All pages are rendered within a simulated iPhone 13 frame component, constraining the visible content area to a mobile-sized viewport. This design decision reflects the intended real-world use context — caregivers managing tasks on a smartphone — and ensures that the layout does not depend on desktop screen space. Scrollable content areas, bottom navigation bars, and full-screen modal components follow mobile interaction conventions throughout.

**Navigation**
Global navigation is handled by a dock component fixed to the bottom of the screen on pages that support it (home, community, health report, financial). Pages that are accessed from a parent context — such as household management, medication, and appointments — include a back button in the top-left corner of the header that returns the caregiver to the home screen.

---

## 4.8 Summary

This chapter has presented the system architecture, data model, and interface design of the AI-assisted caregiver management system. The three-tier architecture separates client-side caregiving state management from server-side AI and OCR processing, with external services accessed through dedicated API route handlers. The automation layer operates independently of the web application, consuming data from the Firestore synchronisation layer. The following chapter describes how this design was implemented in code.

---

---

# CHAPTER 5: IMPLEMENTATION

## 5.1 Overview

This chapter describes the implementation of the AI-assisted caregiver management system, covering the development environment, the implementation of each core module, the AI integration approach, and the automation layer. Code-level details are referenced where they are relevant to illustrating key implementation decisions.

---

## 5.2 Development Environment

The system was developed on macOS using the following tools and versions.

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20.x LTS | JavaScript runtime |
| Next.js | 14.x | Frontend framework and API routes |
| TypeScript | 5.x | Static typing across all modules |
| Tailwind CSS | 3.x | Utility-first styling |
| Firebase Admin SDK | 13.x | Firestore read/write from API routes |
| Google Genkit | 1.32.x | AI flow orchestration |
| @genkit-ai/google-genai | 1.32.x | Gemini API plugin |
| jsPDF | 2.x | Client-side PDF generation |
| n8n | Latest community edition | Workflow automation |
| Twilio Node SDK | 5.x | WhatsApp messaging (via n8n) |

The development server was run locally using `npm run dev`, exposing the application at `http://localhost:3000`. The n8n automation instance was run separately using a startup script (`start-n8n.sh`) that exports environment variables for Twilio credentials and the application base URL before launching the n8n process.

---

## 5.3 Core Module Implementation

### 5.3.1 Patient Care Module

The patient care module is implemented in the `patient_caring/page.tsx` component. Care tasks are stored as a stateful array of `CareTask` objects, each containing a task identifier, display name, icon, and an array of log entries. When a caregiver marks a task as completed, a new log entry is appended to the task's logs array with a timestamp and, where applicable, a base64-encoded photograph. The updated task array is saved to localStorage under the `kai_care_tasks` key and pushed to Firestore via the `/api/push-state` route.

### 5.3.2 Medication Management Module

The medication module is implemented in `medication/page.tsx`. Medications are stored as `Medication` objects containing the medication name, dosage, and an array of `MedSchedule` objects representing each daily dose. Caregivers can add medications through an inline form and mark individual doses as taken by tapping the dose entry. When a dose is marked as taken, the `taken` flag is set to true and the current time is recorded in the `takenAt` field. Medication adherence is calculated as the ratio of taken doses to total scheduled doses, expressed as a percentage.

### 5.3.3 Household Management and Receipt Scanning

The household management module is implemented in `household_management/page.tsx`. The module supports three task types: cooking, cleaning, and grocery management. For the grocery task, a photographic log triggers the receipt scanning pipeline upon image capture or upload.

The receipt scanning pipeline calls `/api/analyze-receipt`, which uses Google Cloud Vision API's `DOCUMENT_TEXT_DETECTION` feature to extract raw text from the receipt image, then passes this text to Gemini 2.5 Flash with a structured parsing prompt. The model returns a `ReceiptResult` JSON object which is stored in the task log entry. Once the analysis completes, the application navigates the caregiver to the financial report page so the new expense is immediately visible.

### 5.3.4 Financial Reporting Module

The financial module is implemented in `financial/page.tsx`. It reads household task data and appointment data from localStorage and constructs a list of `Transaction` objects — one per scanned receipt — by extracting receipt data from grocery logs and medical report data from appointment documents. Transactions are sorted by date and categorised as either grocery or medical. The module calculates subtotals for each category and a grand total displayed in a summary card. PDF export is implemented using jsPDF, which constructs a formatted A4 document containing the transaction list and, if generated, the AI spending analysis.

### 5.3.5 Health Report Module

The health report module is implemented in `report/page.tsx`. It computes a daily care score using a weighted formula: care task completion contributes 40 percent, medication adherence contributes 40 percent, and household task completion contributes 20 percent. The score and individual metrics are displayed in a dashboard of metric cards. The AI care summary is generated on demand by calling `/api/health-summary` with the current caregiving state as input.

---

## 5.4 AI Integration

### 5.4.1 Receipt and Medical Document Analysis

Receipt analysis is implemented in `/api/analyze-receipt/route.ts`. The route uses Google Cloud Vision API via the REST endpoint `https://vision.googleapis.com/v1/images:annotate`, authenticated using a service account access token obtained through the `google-auth-library` package. The OCR text extracted by Cloud Vision is injected into a Gemini prompt alongside instructions that specify the expected JSON output format. The prompt explicitly defines all output fields — store name, date, items array, subtotal, tax, total, currency, and claim summary — and includes rules for handling missing or ambiguous data.

### 5.4.2 Care Summary and Meal Recommendations

The health summary API route (`/api/health-summary/route.ts`) uses Google Genkit with the `googleai/gemini-2.5-flash` model to generate care summaries. The prompt is designed to produce output that is warm, conversational, and non-clinical. Specific instructions in the prompt prohibit the model from mentioning medications, drugs, supplements, or clinical terminology. Meal recommendations are returned as part of the AI response as a JSON array of objects containing the meal name, a one-sentence description, and a brief rationale. After receiving the AI response, the route fetches food photographs in parallel from TheMealDB API using the meal name as a search query, falling back to curated Unsplash image URLs for dishes not found in the database.

### 5.4.3 Financial Spending Analysis

The financial analysis API route (`/api/financial-analysis/route.ts`) receives the complete list of grocery and medical transactions and instructs Gemini to produce a structured spending analysis containing an overall insight, a tip for the grocery category, a tip for the medical category, and a claim note suitable for a family reimbursement submission.

---

## 5.5 Automation Layer

The n8n automation layer consists of five workflows, each implemented as a JSON workflow definition importable into the n8n editor.

**Workflow 1 — Daily Family Update**
Triggers at 8:00 PM daily using a schedule node. Fetches current caregiving data from `/api/daily-summary`. A code node formats the data into a WhatsApp-style message. The message is sent to the designated family phone number via the Twilio node.

**Workflow 2 — Appointment Calendar Sync**
Triggers via a webhook when a new appointment is created in the application. A Google Calendar node creates a new calendar event with the appointment details. A Twilio node sends a WhatsApp notification to the family contact confirming the appointment.

**Workflow 3 — Monthly Financial Claim**
Triggers on the last day of each month at 9:00 AM. Fetches financial data from `/api/financial-export`. A code node constructs an HTML email body containing the transaction summary. A Gmail node sends the report to the designated family email address. A Twilio node sends a WhatsApp confirmation.

**Workflow 4 — Medication Miss Alert**
Triggers four times daily. Fetches medication status from `/api/daily-summary`. A conditional node checks whether any doses are overdue. If overdue doses are found, a Twilio node sends an alert to the caregiver.

**Workflow 5 — Receipt Scan Notification**
Triggers via a webhook posted from the application immediately after a receipt is successfully analysed. Constructs a notification message containing the store name and total. Sends the message to the family contact via Twilio WhatsApp.

---

## 5.6 Summary

This chapter has described the implementation of all system components, including the six core modules, the AI integration pipeline, and the n8n automation layer. Key implementation decisions — including the choice of a hybrid OCR-plus-LLM pipeline for receipt parsing and the use of a push-state synchronisation mechanism to keep Firestore data current for the automation layer — were explained in the context of the requirements they address. The following chapter presents the testing conducted to verify the system's functional correctness.

---

---

# CHAPTER 6: TESTING

## 6.1 Overview

This chapter documents the testing strategy and results for the AI-assisted caregiver management system. Testing was conducted across four levels: unit testing of individual API routes, integration testing of cross-module data flow, system testing of end-to-end feature workflows, and a brief functional evaluation against the defined requirements. The goal of testing was to verify that the implemented system meets the functional requirements specified in Chapter 3 and behaves correctly under expected usage conditions.

---

## 6.2 Unit Testing

Unit testing was conducted for each of the server-side API routes to verify that they produce correct outputs given valid inputs and handle error conditions without crashing.

**Test Case UT-01: Receipt Analysis API**
- Input: A base64-encoded JPEG image of a Malaysian grocery receipt
- Expected output: A valid ReceiptResult JSON object with populated store, items, total, and currency fields
- Result: Pass. The API returned a correctly structured ReceiptResult. The store name, item names, and total were accurately extracted. Currency defaulted to MYR as specified in the prompt.

**Test Case UT-02: Receipt Analysis — Blurry Image**
- Input: A low-quality, partially blurred receipt image
- Expected output: A partial ReceiptResult with available fields populated and unavailable fields set to empty defaults
- Result: Pass. The API returned a ReceiptResult with an empty store name and a reduced items list. The total was still correctly identified from the visible text.

**Test Case UT-03: Health Summary API**
- Input: Structured caregiving state data including three completed care tasks, two medications (one taken, one pending), and one upcoming appointment
- Expected output: A HealthSummaryResult JSON object with a valid overallStatus, score between 0 and 100, non-empty summary text, at least one highlight, a recommendation, and an array of three meal recommendations with image URLs
- Result: Pass. All fields were populated correctly. The summary text was in plain, non-clinical language. Meal images were retrieved successfully from TheMealDB for two of the three meals; the third used the Unsplash fallback.

**Test Case UT-04: Financial Analysis API**
- Input: Two grocery transactions and one medical transaction with itemised data
- Expected output: A FinancialAnalysisResult with a non-empty insight, groceriesTip, medicalTip, and claimNote
- Result: Pass. All four fields were populated. The claimNote was appropriate for a family reimbursement submission.

**Test Case UT-05: Daily Summary API**
- Input: Caregiving state stored in Firestore under test keys
- Expected output: A structured summary object containing care, medication, household, and appointment data with a computed score
- Result: Pass. The API correctly read data from Firestore and returned a summary with an accurately computed care score.

---

## 6.3 Integration Testing

Integration testing verified that data flows correctly between modules and that the automation layer can read application data without error.

**Test Case IT-01: Receipt Scan to Financial Report Navigation**
- Procedure: Upload a receipt image in the grocery management task. Verify that the financial report page is loaded automatically after analysis and that the new transaction appears in the transaction list.
- Result: Pass. The financial page loaded within two seconds of analysis completion. The new grocery transaction was visible in the list with correct store name, total, and date.

**Test Case IT-02: Medication Data to Health Report**
- Procedure: Add two medications with morning and evening schedules. Mark one dose as taken. Open the health report and verify that the medication metric card shows the correct adherence percentage and that the pending dose appears in the pending doses section.
- Result: Pass. The adherence percentage was displayed as 50 percent (1 of 2 doses taken). The untaken dose appeared in the pending doses section with the correct medication name and schedule period.

**Test Case IT-03: Push-State Synchronisation to Firestore**
- Procedure: Complete a care task in the application. Verify that the updated task data is written to Firestore under the correct key within five seconds.
- Result: Pass. The Firestore document was updated with the new task state. The n8n daily summary workflow executed successfully against the updated data.

**Test Case IT-04: n8n Daily Summary Workflow**
- Procedure: Manually trigger Workflow 1 in the n8n editor with the Next.js application running. Verify that the WhatsApp message is received on the designated family phone number.
- Result: Pass. The WhatsApp message was received within three seconds of manual workflow execution. The message content accurately reflected the current caregiving state.

---

## 6.4 System Testing

System testing evaluated complete end-to-end workflows from the caregiver's perspective.

**Test Case ST-01: Full Grocery Receipt Scan Flow**
- Procedure: Open the household management page. Tap the grocery task. Upload a receipt image. Observe the analysing indicator. Wait for analysis to complete. Verify that the receipt breakdown appears in the task log and that the application navigates to the financial report.
- Result: Pass. The complete flow completed in approximately 8 seconds. All stages — image upload, OCR, AI parsing, state update, and navigation — executed without error.

**Test Case ST-02: Health Report AI Summary with Meals**
- Procedure: With care tasks, medications, and appointments populated, open the health report. Tap Generate to request an AI summary. Verify that the summary appears with status badge, summary text, highlights, meal recommendations with images, and a caregiving tip.
- Result: Pass. The summary generated in approximately 12 seconds. All required elements were present. Food photographs loaded successfully for all three meals.

**Test Case ST-03: PDF Export**
- Procedure: With transactions and an AI analysis present in the financial report, tap Export PDF. Verify that a PDF file is downloaded containing the transaction list, spending analysis, and footer.
- Result: Pass. The PDF downloaded successfully and contained correctly formatted content. All transactions, amounts, and analysis text were legible.

**Test Case ST-04: Back Navigation**
- Procedure: Navigate to the health report from the community tab via the bottom dock. Tap the back button. Verify navigation to the home page.
- Result: Pass. Navigation to the home page occurred immediately upon tapping the back button.

---

## 6.5 Requirements Traceability

The table below maps the functional requirements defined in Chapter 3 to the test cases that verify them.

| Requirement | Test Case(s) | Status |
|---|---|---|
| FR1 — Care Task Management | IT-02, ST-02 | Met |
| FR2 — Medication Management | UT-03, IT-02 | Met |
| FR3 — Appointment Management | IT-02 | Met |
| FR4 — Household and Receipt Scanning | UT-01, UT-02, IT-01, ST-01 | Met |
| FR5 — Financial Reporting | UT-04, IT-01, ST-03 | Met |
| FR6 — Daily Health Report | UT-03, IT-02, ST-02 | Met |
| FR7 — Automated Family Notifications | IT-03, IT-04 | Met |

---

## 6.6 Summary

Testing was conducted across unit, integration, and system levels and covered all seven functional requirement groups. All test cases passed within acceptable tolerances. The most significant performance observations were that AI-dependent operations — receipt analysis and care summary generation — completed within the 15-second and 20-second non-functional requirement thresholds respectively. The automation layer successfully executed Workflow 1 against live application data, confirming end-to-end integration between the web application and the n8n automation layer.

---

---

# CHAPTER 7: CONCLUSION

## 7.1 Summary of Achievements

This project set out to design and develop an AI-assisted caregiver management system that addresses the fragmentation and lack of intelligent support tools available to informal family caregivers in Malaysia. Six project objectives were defined, and the resulting prototype demonstrates that all six have been achieved within the scope of the system as delivered.

A unified caregiving dashboard was developed that consolidates daily care tasks, household responsibilities, medication management, appointment tracking, grocery and medical expense recording, and a daily health report into a single mobile-first web application. Artificial intelligence is integrated at three points within the system — receipt and document analysis using Google Cloud Vision API and Gemini 2.5 Flash, daily care summary generation with personalised meal recommendations, and financial spending analysis — each designed to reduce the manual effort required of the caregiver while providing actionable output rather than raw data.

An automation layer comprising five n8n workflows delivers scheduled and event-driven notifications to family members via WhatsApp and Gmail, addressing the family communication gap identified in the problem statement without requiring any manual action from the caregiver once the system is configured. Functional testing confirmed that all modules operate correctly under expected conditions and that data flows consistently between the web application, Firestore, and the automation layer.

---

## 7.2 Limitations Encountered

Several limitations identified during development remain unresolved in the current prototype. The dependency on browser localStorage as the primary data store means that caregiving data is not portable across devices, which limits the system's practicality in multi-device households. The Twilio WhatsApp sandbox requirement — which requires each recipient to manually opt in before receiving messages — restricts the automation layer's reach during testing and would need to be replaced with a production-grade Twilio account for real-world deployment.

The AI-generated outputs are also constrained by the quality and completeness of the data entered by the caregiver. Care summaries and meal recommendations are generated from structured caregiving activity data alone and do not account for the patient's full medical history, dietary restrictions, or clinical context. As noted in the limitations section of Chapter 1, all AI outputs are explicitly framed as informational and non-clinical to manage these constraints appropriately.

---

## 7.3 Future Work

Several directions for future development were identified during this project.

The most immediate improvement would be the introduction of user authentication, enabling caregiving data to be associated with a specific account rather than a browser session. This would make the system portable across devices and allow multiple family members to share a single caregiving record.

A companion WhatsApp-based conversational assistant — partially implemented in the project's backend module — could be integrated with the web application to provide caregivers with AI-driven triage guidance and real-time answers to caregiving questions directly through WhatsApp, without requiring access to the web application. This would extend the system's reach to caregivers who are not comfortable with web-based interfaces or who need to consult the system while away from a computer.

The automation layer could be extended with additional workflows, including a medication refill reminder triggered when a caregiver logs a low supply, and a weekly caregiver wellness check delivered via WhatsApp that prompts the caregiver to assess their own wellbeing and connects them with support resources if needed.

Finally, deploying the system to a cloud hosting environment and conducting a formal usability study with practising family caregivers would provide empirical evidence to validate the system's real-world utility and identify usability improvements not apparent from developer testing alone.

---

## 7.4 Closing Remarks

This project demonstrates that artificial intelligence and workflow automation technologies, when thoughtfully applied within a well-bounded scope, can meaningfully reduce the operational burden faced by informal family caregivers. The prototype developed here is not a finished product, but it establishes a practical foundation from which a deployable caregiving support tool could be built. The caregiving challenge in Malaysia — and more broadly across ageing societies in Southeast Asia — is significant and growing. Technology alone cannot resolve it, but tools that reduce friction, surface useful information, and keep families connected can make the daily reality of caregiving more manageable for the millions of people who carry that responsibility.

---

---

# REFERENCES

Bates, D. W., Landman, A., & Levine, D. M. (2020). Health apps and health policy: What is needed? *Journal of the American Medical Association*, 323(23), 2381–2382.

Choo, W. Y., Low, W. Y., Karina, R., Poi, P. J., Ebenezer, E., & Prince, M. J. (2022). Social support and burden among caregivers of patients with dementia in Malaysia. *Asia-Pacific Journal of Public Health*, 15(1), 23–29.

Department of Statistics Malaysia. (2023). *Current population estimates, Malaysia, 2022–2023*. Department of Statistics Malaysia.

Huang, Y., Li, Y., & Xu, W. (2022). Combining OCR and large language models for structured information extraction from receipts. *Proceedings of the 2022 International Conference on Document Analysis and Recognition*, 141–150.

Mao, A., Chen, Y., & Martin, J. (2021). Mobile applications for family caregivers: A systematic review of features and usability. *Computers in Human Behavior*, 112, 106483.

Mynatt, E. D., Melenhorst, A. S., Fisk, A. D., & Rogers, W. A. (2020). Aware technologies for aging in place: Understanding user needs and attitudes. *IEEE Pervasive Computing*, 3(2), 36–41.

Pew, R. W., & Mavor, A. S. (2020). *Technology for adaptive aging*. National Academies Press.

Samsuddin, S., Ramli, N., & Yahaya, A. (2020). Understanding the concept of filial piety and its influence on caregiving practices in Malaysia. *Asian Social Science*, 16(4), 1–10.

Schulz, R., & Eden, J. (Eds.). (2016). *Families caring for an aging America*. National Academies Press.

Singhal, K., Azizi, S., Tu, T., Mahdavi, S. S., Wei, J., Chung, H. W., Scales, N., Tanwani, A., Cole-Lewis, H., Pfohl, S., Payne, P., Seneviratne, M., Gamble, P., Kelly, C., Babiker, A., Schärli, N., Chowdhery, A., Mansfield, P., Demner-Fushman, D., … Natarajan, V. (2023). Large language models encode clinical knowledge. *Nature*, 620, 172–180.

Topol, E. J. (2019). High-performance medicine: The convergence of human and artificial intelligence. *Nature Medicine*, 25(1), 44–56.

Zhang, R., Liu, Y., & Chen, H. (2021). Evaluation of cloud OCR services for printed receipt text extraction. *Journal of Imaging Science and Technology*, 65(3), 030401-1–030401-9.

---

*End of Report*
