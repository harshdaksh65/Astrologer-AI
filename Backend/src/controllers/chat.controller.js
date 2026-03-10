const chatModel = require('../models/chat.model');
const messageModel = require('../models/message.model');
const aiService = require('../services/ai.service');
const { createMemory, queryMemory } = require('../services/vector.service');
const path = require('path');
const knowledgeBase = require(path.join(__dirname, '../../data/KnowledgeBase.json'));

function buildSystemPrompt(user) {
    return knowledgeBase.systemPrompt
        .replace('{{user_name}}', user.username || 'Unknown')
        .replace('{{user_birthplace}}', user.birthDetails?.place || 'Unknown')
        .replace('{{user_dob}}', user.birthDetails?.date ? new Date(user.birthDetails.date).toLocaleDateString('en-IN') : 'Unknown')
        .replace('{{user_time_of_birth}}', user.birthDetails?.time || 'Unknown');
}


async function createChat(req, res) {

    const { title } = req.body;
    const user = req.user;

    const chat = await chatModel.create({
        user: user._id,
        title
    });

    res.status(201).json({
        message: "Chat created successfully",
        chat: {
            _id: chat._id,
            title: chat.title,
            lastActivity: chat.lastActivity,
            user: chat.user
        }
    });

}

async function getChats(req, res) {
    const user = req.user;

    const chats = await chatModel.find({ user: user._id });

    res.status(200).json({
        message: "Chats retrieved successfully",
        chats: chats.map(chat => ({
            _id: chat._id,
            title: chat.title,
            lastActivity: chat.lastActivity,
            user: chat.user
        }))
    });
}

async function getMessages(req, res) {

    const chatId = req.params.id;

    const messages = await messageModel.find({ chat: chatId }).sort({ createdAt: 1 });

    res.status(200).json({
        message: "Messages retrieved successfully",
        messages: messages
    })

}

async function sendMessage(req, res) {

    const chatId = req.params.id;
    const { content } = req.body;
    const user = req.user;

    if (!content || !content.trim()) {
        return res.status(400).json({ message: 'Content is required' });
    }

    try {

        const [message, vectors] = await Promise.all([
            messageModel.create({
                chat: chatId,
                user: user._id,
                content,
                role: 'user'
            }),
            aiService.generateVector(content)
        ]);

        await createMemory({
            vectors,
            messageId: message._id,
            metadata: {
                chat: chatId,
                user: user._id,
                text: content
            }
        });

        const [memory, chatHistory] = await Promise.all([
            queryMemory({
                queryVector: vectors,
                limit: 3,
                metadata: {
                    user: user._id
                }
            }),
            messageModel
                .find({ chat: chatId })
                .sort({ createdAt: -1 })
                .limit(20)
                .lean()
                .then((messages) => messages.reverse())
        ]);

        const stm = chatHistory.map((item) => ({
            role: item.role,
            parts: [{ text: item.content }]
        }));

        const ltm = [
            {
                role: 'user',
                parts: [
                    {
                        text: `

                        these are some previous messages from the chat, use them to generate a response

                        ${memory.map((item) => item.metadata.text).join('\n')}
                        
                        `
                    }
                ]
            }
        ];

        const systemPrompt = buildSystemPrompt(user);
        const responseText = await aiService.generateResponse([...ltm, ...stm], systemPrompt);

        const [responseVectors, responseMessage] = await Promise.all([
            aiService.generateVector(responseText),
            messageModel.create({
                chat: chatId,
                user: user._id,
                content: responseText,
                role: 'model'
            })
        ]);

        await createMemory({
            vectors: responseVectors,
            messageId: responseMessage._id,
            metadata: {
                chat: chatId,
                user: user._id,
                text: responseText
            }
        });

        res.status(200).json({
            message: 'Message processed successfully',
            userMessage: {
                _id: message._id,
                content: message.content,
                role: message.role,
                chat: message.chat,
                createdAt: message.createdAt
            },
            aiMessage: {
                _id: responseMessage._id,
                content: responseMessage.content,
                role: responseMessage.role,
                chat: responseMessage.chat,
                createdAt: responseMessage.createdAt
            }
        });
    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({ message: 'Failed to process message' });
    }

}

module.exports = {
    createChat,
    getChats,
    getMessages,
    sendMessage
};