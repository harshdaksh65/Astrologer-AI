// Import the Pinecone library
const { Pinecone } = require('@pinecone-database/pinecone')

// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const astrologerAiIndex = pc.Index({ name: 'astrologerai' });

async function createMemory({ vectors, metadata, messageId }) {
    await astrologerAiIndex.upsert([ {
        id: messageId,
        values: vectors,
        metadata
    } ])
}


async function queryMemory({ queryVector, limit = 5, metadata }) {

    const data = await astrologerAiIndex.query({
        vector: queryVector,
        topK: limit,
        filter: metadata ? metadata : undefined,
        includeMetadata: true
    })

    return data.matches

}

module.exports = { createMemory, queryMemory }