import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import "dotenv/config";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION
});

console.log("Bedrock client loaded");
console.log("Region:", process.env.AWS_REGION);

try {
  const command = new InvokeModelCommand({
    modelId: "amazon.nova-lite-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: [
            {
              text: "Say hello from MangoAI V2"
            }
          ]
        }
      ],
      inferenceConfig: {
        maxTokens: 50
      }
    })
  });

  const response = await client.send(command);

  console.log("✅ Bedrock response received");
  console.log(
    new TextDecoder().decode(response.body)
  );

} catch (error) {
  console.error("❌ Bedrock error:");
  console.error(error.message);
}