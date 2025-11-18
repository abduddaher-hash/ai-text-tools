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
    if(!text) return res.status(400).json({ result: 'لا يوجد نص لمعالجته.' });

    let prompt = text;
    // Arabic services
    if(type === 'spell') prompt = `صحح النص العربي التالي إملائياً ونحوياً دون تغيير المعنى:\n\n${text}`;
    else if(type === 'tashkeel') prompt = `ضع التشكيل الكامل والمحافظ على المعنى للنص العربي التالي:\n\n${text}`;
    else if(type === 'summarize' || type === 'summarize_ar') prompt = `اختصر النص التالي إلى ملخص موجز باللغة ${type.includes('_ar') ? 'العربية' : 'English'}، احتفظ بالنقاط الأساسية:\n\n${text}`;
    else if(type === 'arabic_improve') prompt = `حسّن لغة النص العربي التالي واجعله أكثر سلاسة وبلاغة دون تغيير المضمون:\n\n${text}`;
    // English services
    else if(type === 'improve') prompt = `Improve the following English text for clarity, flow and style without changing the meaning:\n\n${text}`;
    else if(type === 'rewrite') prompt = `Paraphrase the following English text, keep the original meaning, make it fluent:\n\n${text}`;
    else if(type === 'humanize') prompt = `Rewrite the following English text to sound human, natural and conversational, avoid AI-sounding phrasing:\n\n${text}`;
    else if(type === 'summarize_en') prompt = `Summarize the following English text concisely, keep main points:\n\n${text}`;
    else {
      // fallback: send raw text
      prompt = text;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1200
    });

    const result = response.choices?.[0]?.message?.content ?? '';
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result: 'حدث خطأ أثناء الاتصال بـ OpenAI.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
