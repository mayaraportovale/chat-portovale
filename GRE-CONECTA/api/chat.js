export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Recebe a mensagem, o histórico, a base de conhecimento e o nome do usuário do seu HTML
  const { message, history, kbContext, userName } = req.body;
  
  // A chave de API ficará escondida no painel do Vercel
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Chave de API não configurada no Vercel.' });
  }

  // Montamos as regras estritas para a IA
  const systemPrompt = `Você é "Val", assistente virtual inteligente do Portal Porto Vale.
${userName ? `O nome do usuário é "${userName}".` : ''}

GLOSSÁRIO: "GRE" é o DEPARTAMENTO de suporte (não é uma pessoa).

REGRAS:
1. Responda EXCLUSIVAMENTE com base na "BASE DE CONHECIMENTO" abaixo.
2. Se a resposta não estiver na base, responda APENAS a palavra: [ESCALAR]
3. Não invente informações. Formate usando negrito e listas quando necessário.

BASE DE CONHECIMENTO:
${kbContext}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Modelo rápido e excelente para suporte
        max_tokens: 1000,
        system: systemPrompt,
        messages: [...history, { role: 'user', content: message }]
      })
    });

    const data = await response.json();
    
    if (data.error) throw new Error(data.error.message);

    return res.status(200).json({ reply: data.content[0].text });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}