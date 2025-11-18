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
    let wantsErrors = false;

    // ARABIC ---------------------------------------
    if (type === 'spell') {
      wantsErrors = true;
      prompt = `
صحّح النص العربي التالي إملائياً ونحوياً دون تغيير المعنى.
أخرج النتيجة بصيغة JSON وفق الشكل التالي فقط:

{
"result": "النص المصحح هنا",
"errors": ["الكلمة الخاطئة 1", "الكلمة الخاطئة 2"]
}

النص:
${text}
      `;
    }
    else if (type === 'tashkeel') {
      prompt = `ضع التشكيل الكامل والمحافظ على المعنى للنص العربي التالي:\n\n${text}`;
    }
    else if (type === 'summarize' || type === 'summarize_ar') {
      prompt = `اختصر النص التالي إلى ملخص موجز باللغة العربية مع الحفاظ على النقاط الأساسية:\n\n${text}`;
    }
    else if (type === 'arabic_improve') {
      prompt = `حسّن لغة النص العربي التالي واجعله أكثر سلاسة وبلاغة دون تغيير المضمون:\n\n${text}`;
    }

    // ENGLISH ---------------------------------------
    else if (type === 'grammar') {
      wantsErrors = true;
      prompt = `
Correct the following English text for grammar and spelling.
Do NOT change meaning.
Return ONLY a JSON response in this format:

{
"result": "corrected text here",
"errors": ["wrongWord1", "wrongWord2"]
}

Text:
${text}
      `;
    }
    else if (type === 'rewrite') {
      prompt = `Rewrite the following English text fluently while keeping same meaning:\n\n${text}`;
    }
    else if (type === 'humanize') {
      prompt = `Rewrite the following English text to sound natural and human:\n\n${text}`;
    }
    else if (type === 'summarize_en') {
      prompt = `Summarize concisely and keep key points:\n\n${text}`;
    }
    else {
      prompt = text;
    }

    // SEND TO OPENAI --------------------------------
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 1500
    });

    let raw = response.choices?.[0]?.message?.content || "";

    // إذا الخدمة تحتاج أخطاء، نقرأ JSON
    if (wantsErrors) {
      try {
        const parsed = JSON.parse(raw);
        return res.json({
          result: parsed.result || "",
          errors: parsed.errors || []
        });
      } catch {
        // fallback: إذا فشل الـ JSON لأي سبب
        return res.json({
          result: raw,
          errors: []
        });
      }
    }

    // الخدمات العادية
    res.json({ result: raw });

  } catch (err) {
    console.error(err);
    res.status(500).json({ result: 'حدث خطأ أثناء الاتصال بـ OpenAI.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
