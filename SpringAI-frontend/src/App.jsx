import { useRef, useState } from "react";

const API_URL = "http://localhost:8080/api/chat";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState("idle"); // idle | streaming | done | error
  const [errorMsg, setErrorMsg] = useState("");
  const abortRef = useRef(null);

  const isStreaming = status === "streaming";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!prompt.trim() || isStreaming) return;

    setResponse("");
    setErrorMsg("");
    setStatus("streaming");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Backend returned ${res.status} ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setResponse((prev) => prev + chunk);
      }

      setStatus("done");
    } catch (err) {
      if (err.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setErrorMsg(
        err.message ||
          "Couldn't reach the backend. Is Spring Boot running on localhost:8080?"
      );
      setStatus("error");
    } finally {
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>qwen2.5:3b — local chat</h1>
          <p style={styles.subtitle}>
            Talking to your Ollama model through your Spring Boot API
          </p>
        </header>

        <form onSubmit={handleSubmit} style={styles.form}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask something..."
            rows={4}
            style={styles.textarea}
            disabled={isStreaming}
          />
          <div style={styles.actions}>
            {isStreaming ? (
              <button type="button" onClick={handleStop} style={styles.stopButton}>
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!prompt.trim()}
                style={{
                  ...styles.submitButton,
                  opacity: !prompt.trim() ? 0.5 : 1,
                  cursor: !prompt.trim() ? "not-allowed" : "pointer",
                }}
              >
                Send
              </button>
            )}
          </div>
        </form>

        {status === "error" && (
          <div style={styles.errorBox}>{errorMsg}</div>
        )}

        {(response || isStreaming) && (
          <div style={styles.responseBox}>
            <div style={styles.responseLabel}>
              {isStreaming ? "Generating..." : "Response"}
            </div>
            <div style={styles.responseText}>
              {response}
              {isStreaming && <span style={styles.cursor}>▍</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f1115",
    color: "#e6e6e6",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "flex",
    justifyContent: "center",
    padding: "48px 20px",
  },
  container: {
    width: "100%",
    maxWidth: 720,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: "#9a9a9a",
    marginTop: 6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    background: "#1a1d24",
    border: "1px solid #2b2f3a",
    borderRadius: 10,
    padding: "14px 16px",
    color: "#f0f0f0",
    fontSize: 15,
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
  },
  submitButton: {
    background: "#4f7cff",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 22px",
    fontSize: 14,
    fontWeight: 600,
  },
  stopButton: {
    background: "#3a1f1f",
    color: "#ff8a8a",
    border: "1px solid #5a2b2b",
    borderRadius: 8,
    padding: "10px 22px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  errorBox: {
    marginTop: 20,
    background: "#2a1414",
    border: "1px solid #5a2b2b",
    color: "#ff9d9d",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 14,
  },
  responseBox: {
    marginTop: 24,
    background: "#161920",
    border: "1px solid #262b35",
    borderRadius: 10,
    padding: "16px 18px",
  },
  responseLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#7d8290",
    marginBottom: 10,
  },
  responseText: {
    fontSize: 15,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  cursor: {
    animation: "blink 1s step-start infinite",
  },
};
