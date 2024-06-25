export const createPineconeIndex = async (
  client,
  indexName,
  vectorDimension
) => {
  // 1. Начало проверки существования индекса
  console.log(`Проверка "${indexName}"...`);
  // 2. Получение списка существующих индексов
  const existingIndexes = await client.listIndexes();
  // 3. Если индекс не существует, создаем его
  if (!existingIndexes.includes(indexName)) {
    // 4. Логирование начала создания индекса
    console.log(`Создание "${indexName}"...`);
    // 5. Создание индекса
    const createClient = await client.createIndex({
      createRequest: {
        name: indexName,
        dimension: vectorDimension,
        metric: "cosine",
      },
    });
    // 6. Логирование успешного создания
    console.log(`Создан с клиентом:`, createClient);
    // 7. Ожидание 60 секунд для инициализации индекса
    await new Promise((resolve) => setTimeout(resolve, 60000));
  } else {
    // 8. Логирование, если индекс уже существует
    console.log(`"${indexName}" уже существует.`);
  }
};
