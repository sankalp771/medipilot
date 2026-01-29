# 🩺 MediPilot: GenAI Care Navigator
///////////////currently under maintainence , site got a lot of errors
**"Care doesn't stop at the prescription."**

MediPilot is an intelligent health companion designed to bridge the gap between receiving a medical report and actually following the care plan. It transforms complex, static medical documents into dynamic, actionable daily schedules.

<img width="1586" height="836" alt="image" src="https://github.com/user-attachments/assets/9f1bac6b-a969-4f09-9c00-1b9ba8cb03a8" />


## 🚀 The Problem
Patients often struggle to interpret lab reports or remember complex medication schedules. **Pre-adherence failure** occurs when patients don't fully understand *what* to do or *why* they are doing it before they even get home.

## 💡 The Solution
MediPilot uses advanced Multimodal AI to "read" your medical documents and generate a personalized health dashboard.
1.  **Upload & Decode**: Simply take a photo of a prescription or upload a PDF lab report.
2.  **Instant Care Plan**: The AI extracts medications, dosages, and critical findings.
3.  **Visual Timeline**: See exactly *when* to take your meds in a clear, linear day-view.
4.  **Adherence Simulation**: Tracks daily progress and generates "Doctor Summaries" for your next visit.

## ✨ Key Features

### 🧠 AI Intake Engine
- Powered by **Mistral Pixtral 12B** (Vision-Capable Model).
- Analyses handwritten prescriptions and complex tabular lab reports.
- Categorizes outputs into **Medications**, **Red Flags**, and **Wellness Tips**.

### 🩺 Always-On Health Companion
- **Global Chat**: Chat about your overall health history without needing to select a specific report.
- **Trend Analysis**: Automatically extracts and tracks specific health metrics (e.g., HbA1c, Weight, BP) over time to show you the big picture.
- **Living Medical Profile**: Auto-builds a persistent profile of your Conditions, Allergies, and Medications that the AI uses for context in every conversation.
- **Seamless History**: All chats, whether report-specific or global, are saved and organized for easy access.

### 📅 Smart Care Timeline
- Consolidates scattered instructions into a unified **Daily Schedule**.
- Differentiates between "Before Food", "After Food", and specific times (Morning/Noon/Night).

### 🛡️ Safety & Wellness
- **Red Flag Detection**: Highlights critical values (e.g., "High BP") or extensive drug warnings.
- **Micro-Habits**: Suggests dietary changes (e.g., "Add beetroot for BP control") based on the specific diagnosis.

### 📝 Doctor Handover (Simulation)
- **Daily Adherence Log**: Users check off meds they've taken.
- **Auto-Summarization**: Generates a clinical note summarizing adherence and symptoms for the doctor.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + "Medical Emerald" Theme
- **AI Model**: [Mistral AI](https://mistral.ai/) (Pixtral-12b-2409)
- **Authentication**: [Clerk](https://clerk.com/) (Sign Up/Log In)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL) + [Prisma](https://www.prisma.io/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **PDF Processing**: `pdfjs-dist`

## 🏁 Getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/sankalp771/medipilot.git
    cd medipilot
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment**
    Create a `.env.local` file and add your Mistral API key:
    ```env
    MISTRAL_API_KEY=your_api_key_here
    ```

4.  **Run the App**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📄 License
This project is open-source.
