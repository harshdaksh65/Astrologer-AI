const { Pinecone } = require('@pinecone-database/pinecone');

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index('astrologerai');

async function createMemory({ vectors, metadata, messageId }) {
  await index.upsert({
    records: [
      {
        id: messageId.toString(),
        values: vectors,
        metadata: {
          chat: String(metadata.chat),
          user: String(metadata.user),
          text: String(metadata.text),
        },
      },
    ],
  });
}

async function queryMemory({ queryVector, limit = 5, metadata }) {
  const result = await index.query({
    vector: queryVector,
    topK: limit,
    filter: {
      user: String(metadata.user),
    },
    includeMetadata: true,
  });

  return result.matches;
}

module.exports = { createMemory, queryMemory };
