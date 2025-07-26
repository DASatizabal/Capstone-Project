import axios, { AxiosError } from "axios";

// OpenAI API types
interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenAIChoice {
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
  index: number;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: OpenAIUsage;
}

// Type guard to check if response has expected structure
function isOpenAIResponse(data: any): data is OpenAIResponse {
  return (
    data &&
    typeof data === "object" &&
    Array.isArray(data.choices) &&
    data.choices.length > 0 &&
    data.choices[0].message &&
    typeof data.choices[0].message.content === "string" &&
    data.usage
  );
}

// Use this if you want to make a call to OpenAI GPT-4 for instance. userId is used to identify the user on openAI side.
export const sendOpenAi = async (
  messages: OpenAIMessage[],
  userId: number,
  max = 100,
  temp = 1,
): Promise<string | null> => {
  const url = "https://api.openai.com/v1/chat/completions";

  console.log("Ask GPT >>>");
  messages.map((m) => console.log(` - ${m.role.toUpperCase()}: ${m.content}`));

  const body = JSON.stringify({
    model: "gpt-4",
    messages,
    max_tokens: max,
    temperature: temp,
    user: userId,
  });

  const options = {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
  };

  try {
    const res = await axios.post<OpenAIResponse>(url, body, options);

    // Type guard to ensure response structure
    if (!isOpenAIResponse(res.data)) {
      console.error("Invalid response structure from OpenAI API");
      return null;
    }

    const answer = res.data.choices[0].message.content;
    const usage = res.data.usage;

    console.log(`>>> ${answer}`);
    console.log(
      `TOKENS USED: ${usage.total_tokens} (prompt: ${
        usage.prompt_tokens
      } / response: ${usage.completion_tokens})`,
    );
    console.log("\n");

    return answer;
  } catch (e) {
    const error = e as AxiosError;
    console.error(
      `GPT Error: ${error?.response?.status}`,
      error?.response?.data,
    );
    return null;
  }
};
