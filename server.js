require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get('/', (req, res) => res.send('<h2>AI Text Tools Server يعمل بنجاح.</h2>'));

app.post('/api', async (req, res) => {
  try {
    const { type, text } = req.body;
    if (!text) return res.status(400).json({ result: 'لا يوجد نص لمعالجته.' });

    let prompt = text;

    // Arabic services
    if (type === 'spell') {
      prompt = `صحح النص العربي التالي إملائياً ونحوياً دون تغيير المعنى.
ارجع النص المصحح فقط في البداية، ثم أرسل قائمة الكلمات التي كانت خاطئة فقط كمصفوفة منفصلة:
${text}`;
    } 
    else if (type === 'tashkeel') {
      prompt = `ضع التشكيل الكامل والمحافظ على المعنى للنص العربي التالي:\n\n${text}`;
    }
    else if (type === 'summarize' || type === 'summarize_ar') {
      prompt = `اختصر النص التالي إلى ملخص موجز باللغة ${type.includes('_ar') ? 'العربية' : 'English'}، احتفظ بالنقاط الأساسية:\n\n${text}`;
    }
    else if (type === 'arabic_improve') {
      prompt = `حسّن لغة النص العربي التالي واجعله أكثر سلاسة وبلاغة دون تغيير المضمون:\n\n${text}`;
    }

    // English services
    else if (type === 'grammar') {
      prompt = `Correct the following English text for grammar and spelling errors.
Return only the corrected text first, and then provide a separate array of misspelled or incorrect words:
${text}`;
    }
    else if (type === 'rewrite') {
      prompt = `Paraphrase the following English text, keep the original meaning, make it fluent:\n\n${text}`;
    }
    else if (type === 'humanize') {
      prompt = `Rewrite the following English text to sound human, natural and conversational, avoid AI-sounding phrasing:\n\n${text}`;
    }
    else if (type === 'summarize_en') {
      prompt = `Summarize the following English text concisely, keep main points:\n\n${text}`;
    }

    // fallback
    else {
      prompt = text;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1200
    });

    let resultText = response.choices?.[0]?.message?.content ?? '';

    // معالجة الرد لتقسيم النص المصحح والكلمات الخاطئة
    let corrected = resultText;
    let errors = [];

    if (type === 'spell' || type === 'grammar') {
      // نفترض أن السيرفر يعيد النص المصحح في السطر الأول ثم الكلمات الخاطئة
      const lines = resultText.split('\n').filter(l => l.trim() !== '');
      corrected = lines[0]; // النص المصحح فقط
      // البحث عن الكلمات الخاطئة إن وجدت في أي سطر لاحق كمصفوفة
      const errorLine = lines.find(l => l.includes('[') && l.includes(']'));
      if (errorLine) {
        try {
          errors = JSON.parse(errorLine);
        } catch {
          errors = [];
        }
      }
    }

    res.json({ result: { original: text, corrected, errors } });

  } catch (err) {
    console.error(err);
    res.status(500).json({ result: 'حدث خطأ أثناء الاتصال بـ OpenAI.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
