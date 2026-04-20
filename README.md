# 🚀 QuickJournal

**Write Smart. Submit Faster.**

QuickJournal is an AI-powered web platform that helps students generate **high-quality reflective journals instantly** and download them as **structured, submission-ready PDFs**.

Built for speed, clarity, and academic standards — QuickJournal eliminates hours of manual writing and formatting.

---

## 🌐 Live Demo

👉 https://quickjournal.xyz *(update with your domain)*

---

## 🧠 Core Value

Most students struggle with:

* Writing structured reflective journals
* Maintaining academic tone
* Formatting documents properly
* Meeting deadlines

QuickJournal solves this by:

> Generating complete, human-like journals in seconds — ready to submit.

---

## ✨ Features

* ⚡ **Instant AI Generation**
  Generate complete journals within seconds using AI

* 📄 **Auto-Formatted PDF Output**
  Download clean, structured, professional PDFs

* 🎯 **Academic Structure Built-In**
  Includes Introduction, Experience, Learning, Conclusion

* 🧠 **Human-Like Writing Style**
  Designed to sound natural and student-authored

* ⏳ **Saves 2–3 Hours Per Assignment**
  Focus on learning, not formatting

---

## 🧱 Tech Stack

### Frontend

* HTML5 & CSS3
* Tailwind CSS
* Vanilla JavaScript (ES6+)

### Backend

* Node.js
* Express.js

### AI Integration

* Groq API (Llama-3.3-70b-versatile)

### PDF Generation

* jsPDF (Client-side)

### Deployment

* Render (Backend)
* GitHub (Version Control)

---

## ⚙️ How It Works

1. **Enter Details**
   Student inputs topic, subject, and preferences

2. **AI Generates Content**
   Backend sends structured prompt to AI

3. **Download PDF**
   Journal is formatted and exported instantly

---

## 🛠️ Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/KandadiCharanTej/QuickJournal.git
cd QuickJournal
```

---

### 2. Setup Backend

```bash
cd backend
npm install
```

Create `.env` file in your `backend` directory:

```env
GROQ_API_KEY=your_api_key_here
PORT=3000
```

Run backend:

```bash
node server.js
```

---

### 3. Open Frontend

The backend automatically serves the frontend static files. 
Just open your browser and navigate to:
`http://localhost:3000`

## 🔗 API Endpoint

### Generate Journal

```http
POST /api/generate
```

### Request Body:

```json
{
  "prompt": "Your full generated AI prompt string"
}
```

---

## 📄 PDF Output

Generated PDF includes:

* Title
* Structured sections
* Clean formatting
* Optional watermark: *Generated with QuickJournal*

---

## 🌍 Deployment Guide

### Frontend (Vercel)

* Connect GitHub repo
* Deploy automatically

### Backend (Render)

* Create Web Service
* Add environment variables
* Deploy

### Custom Domain

* Connect domain via Vercel DNS
* Example: `quickjournal.xyz`

---

## 🔄 Updating the Project

### Frontend

* Push changes → auto-deploy via Vercel

### Backend

* Push changes → auto-redeploy via Render

---

## 🚧 Future Improvements

* User login system
* Save journal history
* Edit before download
* Multiple export formats (DOCX, TXT)
* Plagiarism check integration
* Custom templates for different subjects

---

## ⚠️ Disclaimer

QuickJournal is designed to assist students in learning and productivity.
Users should review and personalize generated content before submission.

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 📬 Contact

* GitHub: https://github.com/your-username
* Email: [your-email@example.com](mailto:your-email@example.com)

---

## 📌 License

MIT License

---

## 💡 Vision

QuickJournal aims to become the **default academic writing assistant for students**, combining AI with structured academic workflows.

---

> Built for students who value time, clarity, and results.
