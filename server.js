require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// صفحة رئيسية افتراضية عند زيارة الرابط
app.get('/', (req, res) => {
  res.send('<h2>AI Text Tools Server يعمل بنجاح.</h2>');
});

// المسار الرئيسي للتعامل مع جميع الخدمات
app.post('/api', async (req, res) => {
  try {
    const { type, text } = req.body;

    if (!text) return res.status(400).json({ result: 'لا يوجد نص لمعالجته.' });

    // إعداد الـ prompt بناءً على نوع الخدمة
    let prompt;
    switch(type) {
      case 'spell':
        prompt = `صحح النص العربي التالي إملائياً ونحوياً:\n${text}`;
        break;
      case 'tashkeel':
        prompt = `ضع التشكيل الصحيح للنص العربي التالي:\n${text}`;
        break;
      case 'improve':
        prompt = `حسّن هذا النص الإنجليزي بدون تغييره جذرياً:\n${text}`;
        break;
      case 'rewrite':
        prompt = `أعد صياغة النص الإنجليزي التالي بطريقة أفضل:\n${text}`;
        break;
      default:
        prompt = text;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ result: 'حدث خطأ أثناء الاتصال بـ OpenAI.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
