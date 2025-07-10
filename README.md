<div id="top">

<!-- HEADER STYLE: CLASSIC -->
<div align="center">


# STAK.DEV

<em>Empowering Innovation Through Seamless Development Experiences</em>

<!-- BADGES -->
<img src="https://img.shields.io/github/last-commit/TheoSlater/stak.dev?style=flat&logo=git&logoColor=white&color=0080ff" alt="last-commit">
<img src="https://img.shields.io/github/languages/top/TheoSlater/stak.dev?style=flat&color=0080ff" alt="repo-top-language">
<img src="https://img.shields.io/github/languages/count/TheoSlater/stak.dev?style=flat&color=0080ff" alt="repo-language-count">

<em>Built with the tools and technologies:</em>

<img src="https://img.shields.io/badge/JSON-000000.svg?style=flat&logo=JSON&logoColor=white" alt="JSON">
<img src="https://img.shields.io/badge/Ollama-000000.svg?style=flat&logo=Ollama&logoColor=white" alt="Ollama">
<img src="https://img.shields.io/badge/npm-CB3837.svg?style=flat&logo=npm&logoColor=white" alt="npm">
<img src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat&logo=JavaScript&logoColor=black" alt="JavaScript">
<img src="https://img.shields.io/badge/React-61DAFB.svg?style=flat&logo=React&logoColor=black" alt="React">
<img src="https://img.shields.io/badge/TypeScript-3178C6.svg?style=flat&logo=TypeScript&logoColor=white" alt="TypeScript">
<img src="https://img.shields.io/badge/ESLint-4B32C3.svg?style=flat&logo=ESLint&logoColor=white" alt="ESLint">
<img src="https://img.shields.io/badge/Axios-5A29E4.svg?style=flat&logo=Axios&logoColor=white" alt="Axios">

</div>
<br>

---

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Usage](#usage)
    - [Testing](#testing)

---

## Overview

stak.dev is an all-in-one developer platform that simplifies building modern, responsive web applications with integrated AI capabilities. It offers a structured component architecture, streamlined styling workflows with Tailwind CSS, and robust TypeScript configurations to ensure code quality and consistency.

**Why stak.dev?**

This project aims to accelerate web development by combining a scalable architecture, real-time collaboration, and AI-driven features. The core benefits include:

- 🎨 **Standardized UI Components:** Establishes a consistent design system with flexible, reusable components.
- ⚙️ **Seamless Styling Workflow:** Integrates Tailwind CSS and PostCSS for efficient, utility-first styling.
- 🤖 **AI Integration:** Enables dynamic, AI-powered chat and code generation with Ollama models.
- 🖥️ **In-Browser Development:** Uses WebContainer to run and test projects directly in the browser.
- 🔧 **Modular Architecture:** Supports scalable, maintainable code with clear separation of concerns.
- 🚀 **Automated Project Setup:** Facilitates quick project initialization and development workflows.

---

## Getting Started

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher
- **Ollama** (for AI functionality)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/TheoSlater/stak.dev
   cd stak.dev
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Install and setup Ollama:**
   - Download from [https://ollama.com/download](https://ollama.com/download)
   - Install a code model:
     ```bash
     ollama pull codellama
     # Or use llama3.2-vision for image support
     ollama pull llama3.2-vision
     ```

### Usage

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking

### Features

✨ **Core Features:**
- 🎨 Beautiful, responsive UI with Material-UI components
- 🤖 AI-powered code generation and assistance
- 🖼️ Image upload and analysis (with vision models)
- 💻 In-browser code execution with WebContainer
- 🎨 Dark/light theme support
- 📱 Mobile-responsive design

🛠️ **Developer Experience:**
- ⚡ Fast development with Next.js 15
- 🔷 Full TypeScript support
- 🎯 Component-based architecture
- 🧪 Error boundaries for robust error handling
- 📦 Optimized build configuration
     


---

<div align="left"><a href="#top">⬆ Return</a></div>

---
