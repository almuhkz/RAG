// 1. Импорт необходимых модулей
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
// 2. Экспорт функции updatePinecone
export const updatePinecone = async (client, indexName, docs) => {
  console.log("Получение индекса Pinecone...");
  // 3. Получение индекса Pinecone
  const index = client.Index(indexName);
  // 4. Вывод имени полученного индекса
  console.log(`Индекс Pinecone получен: ${indexName}`);
  // 5. Обработка каждого документа в массиве docs
  for (const doc of docs) {
    console.log(`Обработка документа: ${doc.metadata.source}`);
    const txtPath = doc.metadata.source;
    const text = doc.pageContent;
    // 6. Создание экземпляра RecursiveCharacterTextSplitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
    });
    console.log("Разделение текста на части...");
    // 7. Разделение текста на части (документы)
    const chunks = await textSplitter.createDocuments([text]);
    console.log(`Текст разделен на ${chunks.length} частей`);
    console.log(
      `Вызов эмбеддингов OpenAI для документов с ${chunks.length} текстовыми частями ...`
    );
    // 8. Создание эмбеддингов OpenAI для документов
    const embeddingsArrays = await new OpenAIEmbeddings().embedDocuments(
      chunks.map((chunk) => chunk.pageContent.replace(/\n/g, " "))
    );
    console.log("Завершено создание эмбеддингов документов");
    console.log(
      `Создание ${chunks.length} массива векторов с id, значениями и метаданными...`
    );
    // 9. Создание и вставка векторов пакетами по 100
    const batchSize = 100;
    let batch = [];
    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx];
      const vector = {
        id: `${txtPath}_${idx}`,
        values: embeddingsArrays[idx],
        metadata: {
          ...chunk.metadata,
          loc: JSON.stringify(chunk.metadata.loc),
          pageContent: chunk.pageContent,
          txtPath: txtPath,
        },
      };
      batch.push(vector);
      // Когда пакет заполнен или это последний элемент, вставляем векторы
      if (batch.length === batchSize || idx === chunks.length - 1) {
        await index.upsert({
          upsertRequest: {
            vectors: batch,
          },
        });
        // Очистка пакета
        batch = [];
      }
    }
    // 10. Вывод количества обновленных векторов в индексе Pinecone
    console.log(`Индекс Pinecone обновлен с ${chunks.length} векторами`);
  }
};
