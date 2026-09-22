import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import socket from "./socket";

function Chat() {
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const [searchParams] = useSearchParams();

  const messagesEndRef = useRef(null);

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // ==========================================
  // GET ALL CONVERSATIONS
  // ==========================================

  const fetchConversations = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/chat/conversations",
        authHeader
      );

      setConversations(res.data);

      return res.data;
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      setError(
        err.response?.data?.error ||
          "Failed to load conversations"
      );

      return [];
    }
  };

  // ==========================================
  // START CONVERSATION FROM CROP
  // ==========================================

  const startCropConversation = async (cropId) => {
    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/chat/start",
        {
          crop_id: cropId,
        },
        authHeader
      );

      const conversation = res.data;

      // Refresh conversation list
      const updatedConversations =
        await fetchConversations();

      // Find the conversation in the refreshed list
      const existingConversation =
        updatedConversations.find(
          (c) => c._id === conversation._id
        );

      setActiveConvo(
        existingConversation || conversation
      );

    } catch (err) {
      console.error(
        "Failed to start conversation:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Failed to start conversation"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    const initializeChat = async () => {
      const cropId = searchParams.get("crop");

      if (cropId) {
        await startCropConversation(cropId);
      } else {
        await fetchConversations();
      }
    };

    initializeChat();
  }, []);

  // ==========================================
  // GET MESSAGES
  // ==========================================

  const fetchMessages = async () => {
    if (!activeConvo) return;

    try {
      const res = await axios.get(
        `http://localhost:5000/api/chat/messages/${activeConvo._id}`,
        authHeader
      );

      setMessages(res.data);

    } catch (err) {
      console.error(
        "Failed to fetch messages:",
        err
      );
    }
  };

  // ==========================================
  // LOAD MESSAGES WHEN CHAT CHANGES
  // ==========================================

  useEffect(() => {
    if (!activeConvo) return;

    fetchMessages();

    // Refresh messages every 3 seconds
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [activeConvo]);

  // ==========================================
  // AUTO SCROLL
  // ==========================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const handleSend = async (e) => {
    e.preventDefault();

    if (!activeConvo) return;

    if (!text.trim()) return;

    try {
      setSending(true);

      await axios.post(
        "http://localhost:5000/api/chat/message",
        {
          conversation_id: activeConvo._id,
          text: text.trim(),
        },
        authHeader
      );

      setText("");

      await fetchMessages();
      await fetchConversations();

    } catch (err) {
      console.error(
        "Send message error:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  };

  // ==========================================
  // GET OTHER PERSON NAME
  // ==========================================

  const otherPersonName = (conversation) => {
    if (!user) return "User";

    const buyerId =
      conversation.buyer_user_id?._id;

    if (buyerId === user.user_id) {
      return (
        conversation.farmer_user_id?.name ||
        "Farmer"
      );
    }

    return (
      conversation.buyer_user_id?.name ||
      "Buyer"
    );
  };

  // ==========================================
  // GET OTHER PERSON ROLE
  // ==========================================

  const otherPersonRole = (conversation) => {
    if (!user) return "";

    const buyerId =
      conversation.buyer_user_id?._id;

    if (buyerId === user.user_id) {
      return "Farmer";
    }

    return "Buyer";
  };

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  return (
    <div className="max-w-5xl mx-auto mt-8">

      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <div className="mb-6">
        <p className="eyebrow mb-2">
          Communication
        </p>

        <h2
          className="text-3xl font-display"
          style={{
            color: "var(--mist)",
          }}
        >
          Messages
        </h2>

        <p
          className="text-sm mt-1"
          style={{
            color: "var(--mist-dim)",
          }}
        >
          Chat directly with farmers and buyers.
        </p>
      </div>

      {/* ==========================================
          ERROR
      ========================================== */}

      {error && (
        <div
          className="mb-4 p-3 rounded-lg text-sm"
          style={{
            background: "rgba(180, 70, 60, 0.1)",
            border: "1px solid var(--clay)",
            color: "var(--clay)",
          }}
        >
          {error}

          <button
            onClick={() => setError("")}
            className="ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* ==========================================
          CHAT LAYOUT
      ========================================== */}

      <div
        className="grid grid-cols-1 md:grid-cols-3 rounded-2xl overflow-hidden"
        style={{
          minHeight: "600px",
          background: "var(--soil-2)",
          border: "1px solid var(--line)",
        }}
      >

        {/* ==========================================
            LEFT — CONVERSATIONS
        ========================================== */}

        <div
          className="border-b md:border-b-0 md:border-r"
          style={{
            borderColor: "var(--line)",
          }}
        >
          <div
            className="p-5"
            style={{
              borderBottom:
                "1px solid var(--line)",
            }}
          >
            <h3
              className="text-lg font-display"
              style={{
                color: "var(--mist)",
              }}
            >
              Your Chats
            </h3>

            <p
              className="text-xs mt-1"
              style={{
                color: "var(--mist-dim)",
              }}
            >
              {conversations.length} conversation
              {conversations.length !== 1
                ? "s"
                : ""}
            </p>
          </div>

          <div
            className="overflow-y-auto"
            style={{
              maxHeight: "520px",
            }}
          >
            {conversations.length === 0 ? (
              <div className="p-5">
                <p
                  className="text-sm"
                  style={{
                    color: "var(--mist-dim)",
                  }}
                >
                  No conversations yet.
                </p>

                <p
                  className="text-xs mt-2"
                  style={{
                    color: "var(--mist-dim)",
                  }}
                >
                  Open a crop and click
                  "Chat with Farmer" to start
                  a conversation.
                </p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation._id}
                  onClick={() =>
                    setActiveConvo(conversation)
                  }
                  className="w-full text-left p-4 transition"
                  style={{
                    background:
                      activeConvo?._id ===
                      conversation._id
                        ? "var(--soil)"
                        : "transparent",

                    borderBottom:
                      "1px solid var(--line)",
                  }}
                >
                  <div className="flex items-center gap-3">

                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                      style={{
                        background:
                          "var(--gold)",
                        color:
                          "var(--ink)",
                      }}
                    >
                      {otherPersonName(
                        conversation
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">

                      <p
                        className="text-sm font-semibold truncate"
                        style={{
                          color:
                            "var(--mist)",
                        }}
                      >
                        {otherPersonName(
                          conversation
                        )}
                      </p>

                      <p
                        className="text-xs mt-1"
                        style={{
                          color:
                            "var(--mist-dim)",
                        }}
                      >
                        {otherPersonRole(
                          conversation
                        )}
                      </p>

                      {conversation.crop_id && (
                        <p
                          className="text-xs mt-1 truncate"
                          style={{
                            color:
                              "var(--mist-dim)",
                          }}
                        >
                          🌾{" "}
                          {
                            conversation
                              .crop_id
                              .crop_name
                          }
                        </p>
                      )}

                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ==========================================
            RIGHT — CHAT WINDOW
        ========================================== */}

        <div className="md:col-span-2 flex flex-col">

          {!activeConvo ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">

              <div
                className="text-5xl mb-4"
              >
                💬
              </div>

              <h3
                className="text-xl font-display"
                style={{
                  color: "var(--mist)",
                }}
              >
                Select a conversation
              </h3>

              <p
                className="text-sm mt-2 max-w-sm"
                style={{
                  color:
                    "var(--mist-dim)",
                }}
              >
                Choose a conversation from
                the left to view your messages.
              </p>

            </div>
          ) : (
            <>
              {/* ======================================
                  CHAT HEADER
              ====================================== */}

              <div
                className="p-5 flex items-center gap-3"
                style={{
                  borderBottom:
                    "1px solid var(--line)",
                }}
              >

                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-semibold"
                  style={{
                    background:
                      "var(--gold)",
                    color: "var(--ink)",
                  }}
                >
                  {otherPersonName(
                    activeConvo
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>

                  <h3
                    className="font-display text-lg"
                    style={{
                      color:
                        "var(--mist)",
                    }}
                  >
                    {otherPersonName(
                      activeConvo
                    )}
                  </h3>

                  <p
                    className="text-xs"
                    style={{
                      color:
                        "var(--mist-dim)",
                    }}
                  >
                    {otherPersonRole(
                      activeConvo
                    )}

                    {activeConvo.crop_id &&
                      ` • ${activeConvo.crop_id.crop_name}`}
                  </p>

                </div>

              </div>

              {/* ======================================
                  MESSAGES
              ====================================== */}

              <div
                className="flex-1 overflow-y-auto p-5 space-y-3"
                style={{
                  minHeight: "400px",
                  maxHeight: "430px",
                }}
              >

                {loading ? (
                  <p
                    className="text-sm text-center"
                    style={{
                      color:
                        "var(--mist-dim)",
                    }}
                  >
                    Opening chat...
                  </p>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p
                      className="text-sm"
                      style={{
                        color:
                          "var(--mist-dim)",
                      }}
                    >
                      No messages yet. Say
                      hello 👋
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {

                    const senderId =
                      message.sender_id?._id ||
                      message.sender_id;

                    const isMine =
                      senderId ===
                      user?.user_id;

                    return (
                      <div
                        key={message._id}
                        className={`flex ${
                          isMine
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >

                        <div
                          className="max-w-[75%]"
                        >

                          <div
                            className="px-4 py-2.5 rounded-2xl text-sm"
                            style={{
                              background:
                                isMine
                                  ? "var(--gold)"
                                  : "var(--soil)",

                              color:
                                isMine
                                  ? "var(--ink)"
                                  : "var(--mist)",

                              border:
                                isMine
                                  ? "none"
                                  : "1px solid var(--line)",

                              borderBottomRightRadius:
                                isMine
                                  ? "4px"
                                  : "16px",

                              borderBottomLeftRadius:
                                isMine
                                  ? "16px"
                                  : "4px",
                            }}
                          >
                            {message.text}
                          </div>

                          <p
                            className={`text-[10px] mt-1 ${
                              isMine
                                ? "text-right"
                                : "text-left"
                            }`}
                            style={{
                              color:
                                "var(--mist-dim)",
                            }}
                          >
                            {formatTime(
                              message.createdAt
                            )}
                          </p>

                        </div>

                      </div>
                    );
                  })
                )}

                <div ref={messagesEndRef} />

              </div>

              {/* ======================================
                  MESSAGE INPUT
              ====================================== */}

              <form
                onSubmit={handleSend}
                className="p-4 flex gap-2"
                style={{
                  borderTop:
                    "1px solid var(--line)",
                }}
              >

                <input
                  type="text"
                  value={text}
                  onChange={(e) =>
                    setText(e.target.value)
                  }
                  placeholder="Type a message..."
                  disabled={sending}
                  className="flex-1 p-3 rounded-xl text-sm outline-none"
                  style={{
                    background:
                      "var(--soil)",
                    border:
                      "1px solid var(--line)",
                    color:
                      "var(--mist)",
                  }}
                />

                <button
                  type="submit"
                  disabled={
                    sending ||
                    !text.trim()
                  }
                  className="px-5 rounded-xl text-sm font-semibold"
                  style={{
                    background:
                      sending ||
                      !text.trim()
                        ? "var(--mist-dim)"
                        : "var(--gold)",

                    color:
                      "var(--ink)",

                    cursor:
                      sending ||
                      !text.trim()
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {sending
                    ? "..."
                    : "Send"}
                </button>

              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;