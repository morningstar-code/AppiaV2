# Changelog

All notable changes to the **Bolt** project will be documented in this file.

## [1.0.0] - 2025-04-25

### 🎉 Initial Release

- **Prompt-to-Code Generation**
    - Users can input prompts, and Gemini LLM generates full code snippets in response.
- **Live Preview using WebContainers**
    - Code is executed in-browser using StackBlitz WebContainers for instant live demo and testing.
- **Editor Features**
    - Integrated Monaco-based code editor for real-time editing.
    - Syntax highlighting and formatting for a smoother experience.
- **Download as ZIP**
    - Users can download the generated codebase as a `.zip` file.
- **UI & Experience**
    - Built using **React**, **TypeScript**, **TailwindCSS**, and **Framer Motion** for smooth animations and transitions.
    - Fully responsive and optimized for modern browsers.
- **Backend Services**
    - **Express.js** server that communicates securely with Gemini LLM API.
    - Handles prompt submission, response formatting, and error handling.
- **Environment**
    - `.env` includes only one required variable: your **Gemini LLM API Key**.
