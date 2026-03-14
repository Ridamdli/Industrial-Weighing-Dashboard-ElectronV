# Prompt — Project Context Report for AI Report Generator

You are an AI technical writer.  
Your task is to transform the following project context into a **clear, structured Markdown report** that explains the developer’s project, objectives, architecture, and learning experience.

The report must help another AI system fully understand the **project story, requirements, structure, and development process**.

Use professional English, clear headings, and well-structured lists.

---

# Project Report — Windows Desktop Application + Portfolio Website

**Owner / Author:** Rida  
**Goal:** Provide an AI Report Generator with all the **technical context, project story, and soft skills information** required to understand the project and generate a complete `.md` report.

---

# 1. Short Overview

The project consists of **two main components**:

- A **Windows desktop application built with Electron** that provides a specific tool or service (for example: a professional tool, measurement tool, or custom dashboard).
- A **portfolio website** that presents the application, including screenshots, documentation, and download or access links for users.

The purpose of this document is to give the AI system a **complete understanding of the project**, including:

- Technical stack
- Application features
- Project architecture
- Development workflow
- Soft skills learned during development
- Project requirements (cahier de charge)
- A potential development roadmap

The goal is to ensure that the AI can understand the project **even without directly reading the entire source code**.

---

# 2. Cahier de Charge (Project Requirements)

## 2.1 General Objective

The main objectives of the project are:

- To build a **stable Windows desktop application** that can be installed using an installer or `.exe` file and works as a standalone tool for end users.
- To build a **portfolio website** that presents the application, explains its features, provides download or purchase options, and includes links to the GitHub repository.

---

## 2.2 Functional Requirements (Les besoins fonctionnels)

The application must provide the following capabilities:

- A **graphical user interface** designed for desktop usage (windows, menus, notifications).
- Ability to **check for updates or perform automatic updates**.
- A **settings page** where user preferences can be stored.
- Ability to **export or import configurations or reports** (CSV or JSON).
- A **help or information page** inside the application.

The portfolio website should include:

- A **homepage presenting the application**.
- A **features page** describing the main capabilities.
- A **download or purchase page**.
- A **contact page**.
- A **documentation or FAQ page**.

---

## 2.3 Non-Functional Requirements (Les besoins non fonctionnels)

The project must also meet several quality and technical requirements:

- Good performance on **Windows 10 and Windows 11**.
- Proper **packaging and code signing** of the executable file to reduce Windows SmartScreen warnings.
- A **modular architecture** separating UI, backend logic, and communication layers.
- Compatibility with potential **distribution platforms or store policies**.
- Easy maintainability and **clear documentation in the README file**.

---

# 3. Deliverables

The expected deliverables of the project include:

- A compiled **Windows executable file (.exe)** or installation package.
- A **GitHub repository** containing the full source code with a clear structure, including:
  - README
  - LICENSE
  - CHANGELOG
- A **responsive portfolio website** that presents the application and can be hosted on GitHub Pages or another hosting platform.
- A **comprehensive Markdown documentation file (`report.md`)** that includes:
  - Project structure
  - Usage instructions
  - Screenshots
  - Links and references.

These deliverables allow the project to be presented in a **professional and understandable way**.

---

# 4. Project Architecture & Structure

## 4.1 Core Technical Components

The project architecture includes several technical components:

- **Desktop Interface:**  
  Built using Electron to connect a web-based interface with native operating system APIs.

- **Website Frontend:**  
  The portfolio website can be built using modern web frameworks such as **Next.js** and **Tailwind CSS**.

- **Data Storage:**  
  If needed, the application may store data locally using:
  - JSON files
  - SQLite databases  
  or external services such as **Supabase**.

- **Development Tools:**  
  The project may also include:
  - Build scripts
  - Packaging tools
  - Simple CI/CD pipelines using **GitHub Actions**.

**Note:**  
If the project integrates AI tools such as **LangChain**, they should be mentioned here.  
If they are not yet implemented, they may be proposed as future improvements in the roadmap.

---

## 4.2 Data Flow (Conceptual)

The data flow inside the application can be described as follows:

1. The user interacts with the **Electron user interface** (buttons, forms, menus).
2. The interface sends events to the **main process** responsible for system-level operations.
3. The main process performs tasks such as:
   - Reading or writing files
   - Opening new windows
   - Loading data
4. If synchronization or updates are required, the application may connect to:
   - External APIs
   - GitHub repositories
5. The results are then displayed in the interface or exported as files.

---

# 5. Application Features & User Flows

The application includes several features, such as:

- A **splash screen** and a main application window.
- A **user settings panel** for preferences.
- A **software update checking system** with notifications when new versions are available.
- **Report export functionality**.
- Potential **multilingual support (i18n)** for languages such as Arabic and English.
- Keyboard shortcuts and a smooth user experience.

### Typical User Workflow

A typical user interaction scenario is:

1. The user launches the application.
2. The application loads initial configuration or data.
3. The user performs a specific task using the interface.
4. The results are displayed or exported.
5. The user closes the application.

---

# 6. Soft Skills & Non-Technical Learnings

During the development of this project, the developer also gained several **non-technical skills**, including:

### Project Management

- Breaking the project into smaller tasks.
- Planning daily or weekly development goals.
- Prioritizing important features.

### Technical Documentation

- Writing clear README files.
- Creating installation instructions.
- Explaining application features in a way that others can easily understand.

### Communication

- Designing a portfolio website that explains the project in a simple way for users or employers.

### System Troubleshooting

- Handling Windows system issues such as **SmartScreen warnings**.
- Understanding code signing and packaging challenges.

### UI/UX Thinking

- Simplifying user interfaces.
- Reducing unnecessary complexity.
- Guiding users step by step through the application.

### Software Distribution

- Learning how to build installers.
- Publishing releases on GitHub.
- Maintaining a CHANGELOG and version history.

### Critical Thinking & Improvement

- Reviewing performance and usability.
- Learning from testing and improving the application accordingly.

---

# Output Instructions

Generate the report in **clean Markdown format** with:

- Proper headings
- Clear sections
- Bullet lists where necessary
- Concise and structured explanations

The final document must allow a reader or AI system to **fully understand the project context and development story**.
