import React, { useState } from "react";
import axios from "axios";
import "./../css/Chatbot.css";
import Sidebar from "../components/Sidebar";

function Chatbot() {

    // =========================
    // API URL
    // =========================
    const API_URL = import.meta.env.VITE_API_URL;

    const [messages, setMessages] = useState([
        {
            sender: "bot",
            text: "Hello! I am your MediStock Assistant. Ask me anything about your MediStock system."
        }
    ]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);


    // =========================
    // SEND MESSAGE
    // =========================

    const sendMessage = async () => {

        const question = input.trim();

        if (!question || loading) {
            return;
        }

        // Get logged-in user ID
        const user_id = localStorage.getItem("user_id");

        console.log("Chatbot User ID:", user_id);
        console.log("Question:", question);

        // Check user ID
        if (!user_id) {

            setMessages(prev => [
                ...prev,
                {
                    sender: "bot",
                    text: "User session not found. Please logout and login again."
                }
            ]);

            return;
        }

        // Show user message
        setMessages(prev => [
            ...prev,
            {
                sender: "user",
                text: question
            }
        ]);

        setInput("");
        setLoading(true);

        try {

            const response = await axios.post(
                `${API_URL}/chatbot`,
                {
                    user_id: Number(user_id),
                    question: question
                }
            );

            console.log("Chatbot Response:", response.data);

            // Bot answer
            setMessages(prev => [
                ...prev,
                {
                    sender: "bot",
                    text:
                        response.data.answer ||
                        "Sorry, I could not find an answer."
                }
            ]);

        } catch (error) {

            console.error(
                "Chatbot Error:",
                error.response?.data || error.message
            );

            setMessages(prev => [
                ...prev,
                {
                    sender: "bot",
                    text: "Sorry, I could not process your question. Please try again."
                }
            ]);

        } finally {

            setLoading(false);

        }
    };


    // =========================
    // ENTER KEY
    // =========================

    const handleKeyDown = (e) => {

        if (e.key === "Enter") {
            sendMessage();
        }

    };


    // =========================
    // CLEAR CHAT
    // =========================

    const clearChat = () => {

        setMessages([
            {
                sender: "bot",
                text: "Hello! I am your MediStock Assistant. Ask me anything about your MediStock system."
            }
        ]);

    };


    return (

        <div className="chatbot-container">

            <Sidebar />

            {/* ================= HEADER ================= */}

            <div className="chatbot-header">

                <div className="chatbot-title">

                    <div className="chatbot-icon">
                        💊
                    </div>

                    <div>

                        <h1>MediStock Assistant</h1>

                        <p>
                            Your personalized inventory assistant
                        </p>

                    </div>

                </div>

                <button
                    className="clear-btn"
                    onClick={clearChat}
                >
                    Clear
                </button>

            </div>


            {/* ================= CHAT AREA ================= */}

            <div className="chatbot-messages">

                {messages.map((message, index) => (

                    <div
                        key={index}
                        className={
                            message.sender === "user"
                                ? "message-row user-row"
                                : "message-row bot-row"
                        }
                    >

                        {/* Bot Icon */}

                        {message.sender === "bot" && (

                            <div className="message-icon">
                                💊
                            </div>

                        )}

                        <div
                            className={
                                message.sender === "user"
                                    ? "message user-message"
                                    : "message bot-message"
                            }
                        >
                            {message.text}
                        </div>

                        {/* User Icon */}

                        {message.sender === "user" && (

                            <div className="message-icon user-icon">
                                👤
                            </div>

                        )}

                    </div>

                ))}


                {/* Loading */}

                {loading && (

                    <div className="message-row bot-row">

                        <div className="message-icon">
                            💊
                        </div>

                        <div className="message bot-message typing">
                            Thinking...
                        </div>

                    </div>

                )}

            </div>


            {/* ================= INPUT AREA ================= */}

            <div className="chatbot-input-area">

                <input
                    type="text"
                    placeholder="Ask anything about MediStock..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                />

                <button
                    className="send-btn"
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                >
                    {loading ? "..." : "➤"}
                </button>

            </div>


            {/* ================= FOOTER ================= */}

            <div className="chatbot-footer">

                MediStock AI Assistant • Personalized for your account

            </div>

        </div>

    );

}

export default Chatbot;