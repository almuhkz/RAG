// 1. ВНИМАНИЕ Алидар Панагуджиев
// 2. Установка зависимостей npm: pinecone dotenv langchain
// 3. Получение API-ключа от OpenAI (https://platform.openai.com/account/api-keys)
// 4. Получение API-ключа от Pinecone (https://app.pinecone.io/)
// 5. Ввод API-ключей в файл .env
// // Optional: if you want to use other file loaders (https://js.langchain.com/v0.1/docs/integrations/document_loaders/file_loaders/)
import { PineconeClient } from "@pinecone-database/pinecone";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import * as dotenv from "dotenv";
import { createPineconeIndex } from "./1-createPineconeIndex.js";
import { updatePinecone } from "./2-updatePinecone.js";
import { queryPineconeVectorStoreAndQueryLLM } from "./3-queryPineconeAndQueryGPT.js";
// 6. Загрузка env переменных
dotenv.config();
// 7. Настройка DirectoryLoader для загрузки документов из каталога ./documents
const loader = new DirectoryLoader("./documents", {
  ".txt": (path) => new TextLoader(path),
  //".pdf": (path) => new PDFLoader(path),
});
const docs = await loader.load();
// 8. Настройка переменных для имени файла, вопроса и настроек индекса
const question = "Who is mr Gatsby?";
const indexName = "your-pinecone-index-name";
const vectorDimension = 1536;
// 9. Инициализация клиента Pinecone с использованием API-ключа и окружения
const client = new PineconeClient();
await client.init({
  apiKey: process.env.PINECONE_API_KEY,
  environment: process.env.PINECONE_ENVIRONMENT,
});
// 10. Запуск основной асинхронной функции
(async () => {
  // 11. Проверка существования индекса Pinecone и создание его при необходимости
  await createPineconeIndex(client, indexName, vectorDimension);
  // 12. Обновление хранилища векторов Pinecone с вложениями документов
  await updatePinecone(client, indexName, docs);
  // 13. Запрос хранилища векторов Pinecone и модели GPT для получения ответа
  await queryPineconeVectorStoreAndQueryLLM(client, indexName, question);
})();
