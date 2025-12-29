import { useState } from 'react';
import {
  SafeAreaView,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

// =============================================================================
// Types for SimpleCheckout Hosted Connect messages
// =============================================================================

type MessageType = 'SUCCESS' | 'ERROR';

interface SuccessPayload {
  id: string;
  customer_id: string;
  login_source_id: string;
  login_status: string;
}

interface ErrorPayload {
  code: 'CONFIGURATION_ERROR' | 'INVALID_CREDENTIALS' | 'CONNECTION_FAILED';
  message: string;
}

interface BridgeMessage {
  type: MessageType;
  payload: SuccessPayload | ErrorPayload;
}

// =============================================================================
// Log entry type for the debug panel
// =============================================================================

interface LogEntry {
  timestamp: string;
  data?: BridgeMessage;
  raw?: string;
  info?: string;
}

// =============================================================================
// Configuration
// =============================================================================

// Replace these with your actual values from the SimpleCheckout dashboard
const PUBLISHABLE_KEY = 'pk_sandbox_YOUR_KEY_HERE';
const CUSTOMER_ID = 'your-customer-uuid';
const LOGIN_SOURCE_ID = 'your-login-source-uuid';

// Build the hosted connect URL
const HOSTED_CONNECT_URL =
  `https://connect.simplecheckout.ai` +
  `?publishable_key=${PUBLISHABLE_KEY}` +
  `&customer_id=${CUSTOMER_ID}` +
  `&login_source_id=${LOGIN_SOURCE_ID}`;

// =============================================================================
// App Component
// =============================================================================

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [url, setUrl] = useState(HOSTED_CONNECT_URL);
  const [activeUrl, setActiveUrl] = useState(url);

  /**
   * Handle messages from the WebView (SimpleCheckout Hosted Connect)
   *
   * The hosted connect page sends messages via postMessage when:
   * - SUCCESS: User successfully connected their account
   * - ERROR: Something went wrong (invalid credentials, network error, etc.)
   */
  const handleMessage = (event: WebViewMessageEvent) => {
    const timestamp = new Date().toISOString();

    try {
      const data: BridgeMessage = JSON.parse(event.nativeEvent.data);
      setLogs((prev) => [...prev, { timestamp, data }]);

      // Example: Handle different message types in your app
      if (data.type === 'SUCCESS') {
        const payload = data.payload as SuccessPayload;
        console.log('Account connected!', payload.id);
        // TODO: Close the WebView, save the account ID, navigate back
      } else if (data.type === 'ERROR') {
        const payload = data.payload as ErrorPayload;
        console.log('Error:', payload.code, payload.message);

        switch (payload.code) {
          case 'INVALID_CREDENTIALS':
            // User entered wrong password - let them retry
            break;
          case 'CONNECTION_FAILED':
            // Network/server error - show "try again later"
            break;
          case 'CONFIGURATION_ERROR':
            // Missing URL params - check your integration
            break;
        }
      }
    } catch {
      // Non-JSON message (shouldn't happen with SimpleCheckout)
      setLogs((prev) => [...prev, { timestamp, raw: event.nativeEvent.data }]);
    }
  };

  const reload = () => {
    setActiveUrl(url);
    setLogs((prev) => [
      ...prev,
      { timestamp: new Date().toISOString(), info: `Reloaded: ${url}` },
    ]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>SimpleCheckout - React Native Example</Text>

      <WebView
        key={activeUrl}
        source={{ uri: activeUrl }}
        style={styles.webview}
        onMessage={handleMessage}
      />

      <View style={styles.logPanel}>
        <Text style={styles.logTitle}>Messages from WebView</Text>
        <TextInput
          style={styles.urlInput}
          value={url}
          onChangeText={setUrl}
          placeholder="Enter URL..."
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={reload}>
            <Text style={styles.buttonText}>Reload</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={clearLogs}
          >
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.logScroll}>
          {logs.map((log, i) => (
            <Text key={i} style={styles.logEntry}>
              [{log.timestamp.split('T')[1].split('.')[0]}]{' '}
              {log.info || JSON.stringify(log.data || log.raw, null, 2)}
            </Text>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  webview: {
    flex: 2,
    margin: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  logPanel: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    margin: 8,
    marginTop: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  logTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 14,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    padding: 8,
    fontSize: 12,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
  },
  logScroll: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    padding: 8,
  },
  logEntry: {
    fontFamily: 'monospace',
    fontSize: 10,
    marginBottom: 8,
  },
});
